/* The workspace endpoints, exercised as the deployed functions.
 *
 * The workspace was built against server/index.js, a long-running Node process
 * that is not deployed. On gdsff.com /api/admin/state returned 404 and the
 * page signed in to an empty shell — drafts existed in the repository and
 * nowhere a person could reach them.
 *
 * These run the actual handler functions with a fake request and response, so
 * a rename or a broken import fails here rather than on the live site.
 *
 *   node --test tests/socialApi.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

process.env.ADMIN_USERNAME = 'george'
process.env.ADMIN_PASSWORD = 'test-password'
process.env.ADMIN_SESSION_SECRET = 'test-secret'
delete process.env.VERCEL_ENV
delete process.env.VERCEL
delete process.env.BLOB_READ_WRITE_TOKEN

/* Each run gets its own state file. The copy committed at
   server/data/social-state.local.json holds an older seed whose socialPosts
   shadow the defaults, which is exactly the sort of thing that makes a test
   pass on one machine and fail on another. */
const scratch = mkdtempSync(join(tmpdir(), 'gdsff-state-'))
process.env.GDSFF_SOCIAL_STATE_PATH = join(scratch, 'social-state.json')

const { loginAdmin } = await import('../api/_lib/adminAuth.js')
const state = (await import('../api/admin/state.js')).default
const saveSettings = (await import('../api/admin/settings.js')).default
const savePost = (await import('../api/social/posts/save.js')).default
const setStatus = (await import('../api/social/posts/status.js')).default
const schedule = (await import('../api/social/queue/schedule.js')).default
const publish = (await import('../api/meta/publish.js')).default
const metaCheck = (await import('../api/meta/check.js')).default

const TOKEN = loginAdmin('george', 'test-password').token

function call(handler, { method = 'POST', token = TOKEN, body = {} } = {}) {
  const request = { method, headers: token ? { authorization: `Bearer ${token}` } : {}, body }
  let captured = null
  const response = {
    setHeader() {},
    status(code) {
      this._code = code
      return this
    },
    json(payload) {
      captured = { code: this._code, payload }
    },
    end() {
      captured = { code: this._code, payload: null }
    },
  }
  return handler(request, response).then(() => captured)
}

/* Every test starts from the seed state, so an ordering change cannot quietly
   make one of them pass on a value another test wrote. */
test.beforeEach(() => {
  rmSync(process.env.GDSFF_SOCIAL_STATE_PATH, { force: true })
})
test.after(() => {
  rmSync(scratch, { recursive: true, force: true })
})

test('an unauthenticated request is refused', async () => {
  const out = await call(state, { method: 'GET', token: '' })
  assert.equal(out.code, 401)
  assert.equal(out.payload.ok, false)
})

test('the wrong method is refused', async () => {
  const out = await call(state, { method: 'DELETE' })
  assert.equal(out.code, 405)
})

test('state carries the drafts, the media library and the settings', async () => {
  const out = await call(state, { method: 'GET' })
  assert.equal(out.code, 200)
  assert.equal(out.payload.ok, true)
  const body = out.payload.state
  assert.ok(Array.isArray(body.socialPosts) && body.socialPosts.length > 0)
  assert.ok(Array.isArray(body.mediaAssets) && body.mediaAssets.length > 0)
  assert.ok(out.payload.summary)
  assert.ok(out.payload.auth.authenticated)
})

test('the iF3 certificate draft is the one waiting for approval', async () => {
  const out = await call(state, { method: 'GET' })
  const post = out.payload.state.socialPosts.find((p) => p.id === 'if3-membership-certificate')
  assert.ok(post, 'the certificate draft should be in the workspace')
  assert.equal(post.status, 'draft')
  assert.deepEqual(post.platforms, ['facebook', 'instagram'])
  assert.equal(post.approval.approvedBy, '')
  assert.match(post.englishCaption, /National Federation for Georgia/)
})

test('approving a post records who approved it and when', async () => {
  const before = await call(state, { method: 'GET' })
  const id = before.payload.state.socialPosts[0].id

  const out = await call(setStatus, { body: { id, status: 'approved' } })
  assert.equal(out.code, 200)
  const post = out.payload.socialPosts.find((p) => p.id === id)
  assert.equal(post.status, 'approved')
  assert.equal(post.approval.approvedBy, 'george')
  assert.ok(post.approval.approvedAt)
})

test('approving a post that does not exist says so plainly', async () => {
  const out = await call(setStatus, { body: { id: 'no-such-post', status: 'approved' } })
  assert.equal(out.code, 400)
  assert.match(out.payload.error, /no longer exists/)
})

test('a saved post keeps its id and comes back in the list', async () => {
  const out = await call(savePost, {
    body: { post: { id: 'if3-membership-certificate', title: 'iF3 Certificate of Membership', notes: 'edited' } },
  })
  assert.equal(out.code, 200)
  const post = out.payload.socialPosts.find((p) => p.id === 'if3-membership-certificate')
  assert.equal(post.notes, 'edited')
  assert.equal(post.title, 'iF3 Certificate of Membership')
})

test('scheduling without a time is refused', async () => {
  const out = await call(schedule, { body: { postId: 'if3-membership-certificate' } })
  assert.equal(out.code, 400)
  assert.match(out.payload.error, /post and a time/)
})

test('settings accept the page ids that publishing needs', async () => {
  const out = await call(saveSettings, {
    body: { meta: { facebookPageId: '1234567890', instagramBusinessId: '0987654321' } },
  })
  assert.equal(out.code, 200)
  assert.equal(out.payload.settings.meta.facebookPageId, '1234567890')
  assert.equal(out.payload.settings.meta.instagramBusinessId, '0987654321')
})

/* The rule that matters most: a publish call that does not explicitly ask to
   be real is a dry run. Nothing reaches Meta by omission. */
test('publish is a dry run unless dryRun is explicitly false', async () => {
  const out = await call(publish, { body: { platform: 'facebook', message: 'test' } })
  assert.equal(out.code, 200)
  assert.equal(out.payload.dryRun, true)
  assert.equal(out.payload.result.dryRun, true)
})

/* Checking a token and configuring durable storage are two different jobs.
   Making the check wait on the blob store meant the only way to test a fresh
   token was to post with it — the one thing the approval rule forbids. */
test('the connection check still answers when durable storage is unconfigured', async () => {
  process.env.VERCEL = '1'
  try {
    const out = await call(metaCheck, { method: 'GET' })
    assert.equal(out.code, 200)
    assert.equal(out.payload.identifiersFrom, 'defaults')
    assert.match(out.payload.storageNote, /BLOB_READ_WRITE_TOKEN/)
    assert.equal(out.payload.meta.facebook.pageIdConfigured, true)
  } finally {
    delete process.env.VERCEL
  }
})

test('the connection check reads the workspace when storage is available', async () => {
  const out = await call(metaCheck, { method: 'GET' })
  assert.equal(out.code, 200)
  assert.equal(out.payload.identifiersFrom, 'workspace')
})

test('a real publish without a configured page id refuses rather than guesses', async () => {
  const out = await call(publish, {
    body: { platform: 'facebook', message: 'test', dryRun: false, facebookPageId: '' },
  })
  assert.equal(out.code, 400)
  assert.match(out.payload.error, /Page ID is required|ACCESS_TOKEN is not configured/i)
})
