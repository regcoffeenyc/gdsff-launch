/* The endpoints the workspace calls but the deployment did not have.
 *
 * The client calls 26 API paths; 15 existed as deployed functions. The rest
 * were 404 on gdsff.com and their buttons failed — including the one that
 * edits the media library, which is where the certificate's wrong image path
 * would have been corrected.
 *
 *   node --test tests/workspaceEndpoints.test.mjs
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

const scratch = mkdtempSync(join(tmpdir(), 'gdsff-endpoints-'))
process.env.GDSFF_SOCIAL_STATE_PATH = join(scratch, 'social-state.json')

const { loginAdmin } = await import('../api/_lib/adminAuth.js')
const saveAsset = (await import('../api/social/assets/save.js')).default
const saveTemplate = (await import('../api/templates/save.js')).default
const saveContact = (await import('../api/contacts/save.js')).default
const metaAuthUrl = (await import('../api/meta/auth/url.js')).default

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

test.beforeEach(() => rmSync(process.env.GDSFF_SOCIAL_STATE_PATH, { force: true }))
test.after(() => rmSync(scratch, { recursive: true, force: true }))

test('every new endpoint refuses an unauthenticated caller', async () => {
  for (const [name, handler, method] of [
    ['assets/save', saveAsset, 'POST'],
    ['templates/save', saveTemplate, 'POST'],
    ['contacts/save', saveContact, 'POST'],
    ['meta/auth/url', metaAuthUrl, 'GET'],
  ]) {
    const out = await call(handler, { method, token: '' })
    assert.equal(out.code, 401, `${name} should require a session`)
  }
})

/* The case that mattered: correcting the certificate's image path from the
   workspace instead of retyping it into the publish form every time. */
test('a media asset can be corrected and comes back changed', async () => {
  const out = await call(saveAsset, {
    body: { asset: { id: 'if3-certificate', source: '/media/if3-certificate-square.jpg' } },
  })

  assert.equal(out.code, 200)
  const asset = out.payload.mediaAssets.find((item) => item.id === 'if3-certificate')
  assert.equal(asset.source, '/media/if3-certificate-square.jpg')
  assert.ok(asset.title, 'the existing title survives a partial update')
})

test('a new asset gets an id rather than overwriting another', async () => {
  const out = await call(saveAsset, { body: { asset: { title: 'Range photo', source: '/media/range.jpg' } } })
  const created = out.payload.asset
  assert.ok(created.id)
  assert.equal(created.title, 'Range photo')
  assert.ok(out.payload.mediaAssets.length > 1)
})

test('a template scope outside email or social is refused', async () => {
  const out = await call(saveTemplate, { body: { scope: 'telegram', template: { title: 'x' } } })
  assert.equal(out.code, 400)
  assert.match(out.payload.error, /email.*social/i)
})

test('a template is saved into its scope', async () => {
  const out = await call(saveTemplate, {
    body: { scope: 'social', template: { id: 'welcome', title: 'Welcome post', body: 'hello' } },
  })
  assert.equal(out.code, 200)
  assert.ok(out.payload.templates.social.some((item) => item.id === 'welcome'))
})

/* Saving the same person twice must not create a second row. */
test('a contact matched by email is updated, not duplicated', async () => {
  const first = await call(saveContact, { body: { contact: { name: 'Gretchen', email: 'g@if3.example' } } })
  const before = first.payload.contacts.length

  const second = await call(saveContact, {
    body: { contact: { email: 'g@if3.example', organization: 'iF3' } },
  })

  assert.equal(second.payload.contacts.length, before)
  const row = second.payload.contacts.find((item) => item.email === 'g@if3.example')
  assert.equal(row.organization, 'iF3')
  assert.equal(row.name, 'Gretchen', 'a field not sent is not blanked')
})

/* With no META_APP_ID the builder returns null rather than a URL that would
   fail on Meta's side. appConfigured is what tells the two apart. */
test('the Meta auth URL reports whether the app is configured at all', async () => {
  const out = await call(metaAuthUrl, { method: 'GET' })
  assert.equal(out.code, 200)
  assert.ok(Array.isArray(out.payload.scopes))
  assert.equal(out.payload.appConfigured, false, 'no META_APP_ID is set in this run')
  assert.equal(out.payload.url, null, 'an unusable URL is not invented')
})

test('with an app id configured a real URL is built', async () => {
  process.env.META_APP_ID = '1234567890'
  try {
    const out = await call(metaAuthUrl, { method: 'GET' })
    assert.equal(out.payload.appConfigured, true)
    assert.match(out.payload.url, /^https:\/\/www\.facebook\.com\/.*dialog\/oauth\?/)
    assert.match(out.payload.url, /client_id=1234567890/)
  } finally {
    delete process.env.META_APP_ID
  }
})
