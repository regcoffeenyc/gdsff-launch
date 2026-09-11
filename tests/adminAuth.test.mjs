/* Admin sign-in must fail closed on a deployment.
 *
 * Setup mode accepts any non-empty username and password. That is a
 * convenience on a laptop and a wide-open door on a deployment — and it opens
 * itself: an ADMIN_USERNAME cleared during some future config change would
 * unlock the whole workspace with no error anywhere to notice.
 *
 * The second half guards the signing key. The literal that used to back it is
 * published in this repository, so on a deployment without a real secret
 * anyone who read the repo could forge an admin session token.
 *
 *   node --test tests/adminAuth.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'

const KEYS = ['VERCEL_ENV', 'VERCEL', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET']

/* Each case needs a module whose env was read fresh, so import with a unique
   query string rather than letting the loader hand back a cached one. */
let n = 0
async function withEnv(env, run) {
  const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]))
  for (const k of KEYS) delete process.env[k]
  Object.assign(process.env, env)
  try {
    return await run(await import(`../api/_lib/adminAuth.js?case=${n++}`))
  } finally {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  }
}

const req = (token) => ({ headers: token ? { authorization: `Bearer ${token}` } : {} })

test('a laptop with no credentials still gets setup mode', async () => {
  await withEnv({}, (auth) => {
    assert.equal(auth.setupModeAllowed(), true)
    const session = auth.loginAdmin('anyone', 'anything')
    assert.equal(session.authenticated, true)
    assert.equal(session.setupMode, true)
  })
})

test('a deployment with no credentials refuses sign-in', async () => {
  for (const env of [{ VERCEL_ENV: 'production' }, { VERCEL_ENV: 'preview' }, { VERCEL: '1' }]) {
    await withEnv(env, (auth) => {
      assert.equal(auth.setupModeAllowed(), false, JSON.stringify(env))
      assert.throws(() => auth.loginAdmin('anyone', 'anything'), /not configured on this deployment/)
    })
  }
})

test('a deployment never reports setupMode, so no banner invites a guess', async () => {
  await withEnv({ VERCEL_ENV: 'production' }, (auth) => {
    const state = auth.validateAdminSession(req(''))
    assert.equal(state.authenticated, false)
    assert.equal(state.setupMode, false)
    assert.equal(state.authConfigured, false)
  })
})

test('a deployment with credentials works, and rejects a wrong password', async () => {
  await withEnv(
    { VERCEL_ENV: 'production', ADMIN_USERNAME: 'george', ADMIN_PASSWORD: 'correct-horse', ADMIN_SESSION_SECRET: 's3cr3t' },
    (auth) => {
      assert.throws(() => auth.loginAdmin('george', 'wrong'), /Invalid admin credentials/)
      const session = auth.loginAdmin('george', 'correct-horse')
      assert.equal(session.authenticated, true)
      assert.equal(session.setupMode, false)
      assert.equal(auth.validateAdminSession(req(session.token)).authenticated, true)
    },
  )
})

test('a session signed on a laptop is not accepted by a deployment', async () => {
  /* The published literal made every laptop and every unconfigured deployment
     share one signing key. They must not. */
  const token = await withEnv({}, (auth) => auth.loginAdmin('anyone', 'anything').token)
  await withEnv({ VERCEL_ENV: 'production', ADMIN_USERNAME: 'george', ADMIN_PASSWORD: 'correct-horse' }, (auth) => {
    assert.equal(auth.validateAdminSession(req(token)).authenticated, false)
  })
})

test('a deployment with no signing secret cannot mint or accept a token', async () => {
  await withEnv({ VERCEL_ENV: 'production' }, (auth) => {
    assert.throws(() => auth.createAdminSessionToken('george'), /Admin sessions are not configured/)
    assert.equal(auth.validateAdminSession(req('forged.signature')).authenticated, false)
  })
})

test('ADMIN_PASSWORD alone is enough to sign, so an existing deployment keeps working', async () => {
  await withEnv({ VERCEL_ENV: 'production', ADMIN_USERNAME: 'george', ADMIN_PASSWORD: 'correct-horse' }, (auth) => {
    const session = auth.loginAdmin('george', 'correct-horse')
    assert.equal(auth.validateAdminSession(req(session.token)).authenticated, true)
  })
})
