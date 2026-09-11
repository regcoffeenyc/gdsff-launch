/* The two Instagram numbers, and the Page that tells them apart.
 *
 * Business Suite shows the federation's Instagram account under an id that
 * looks like the one publishing needs and is not. Getting this wrong produces
 * a Graph error with no hint in it, on the federation's own page, at the
 * moment of the first real post. So the resolution is tested here instead.
 *
 *   node --test tests/metaConnection.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'

process.env.ADMIN_USERNAME = 'george'
process.env.ADMIN_PASSWORD = 'test-password'
process.env.ADMIN_SESSION_SECRET = 'test-secret'
delete process.env.VERCEL_ENV
delete process.env.VERCEL
delete process.env.BLOB_READ_WRITE_TOKEN

const { createDefaultState } = await import('../server/lib/defaultState.js')
const { normalizeState } = await import('../server/lib/socialStore.js')
const { describeMetaConnection, publishToMeta, resolveInstagramUserId } = await import('../server/lib/metaGraph.js')

/* The numbers read from Business Suite on 11 September 2026. The Page ID is
   asserted because an earlier note had a different number for the same page,
   and the wrong one would post to the wrong place. */
const PAGE_ID = '1081637585022289'
const PORTFOLIO_ASSET_ID = '1068919759631644'
const IG_USER_ID = '17841400000000000'

const realFetch = globalThis.fetch

function stubGraph(handler) {
  globalThis.fetch = async (url) => {
    const result = handler(String(url))
    return {
      ok: result.ok !== false,
      json: async () => result.body,
    }
  }
}

test.afterEach(() => {
  globalThis.fetch = realFetch
  delete process.env.META_PAGE_ACCESS_TOKEN
  delete process.env.META_INSTAGRAM_ACCESS_TOKEN
})

test('the seed state carries the federation ids read from Business Suite', () => {
  const meta = createDefaultState().settings.meta
  assert.equal(meta.facebookPageId, PAGE_ID)
  assert.equal(meta.instagramBusinessId, PORTFOLIO_ASSET_ID)
  assert.equal(meta.businessPortfolioId, '963423796338624')
})

test('the Page is asked for the Instagram user id, not the saved asset id', async () => {
  stubGraph((url) => {
    assert.ok(url.includes(`/${PAGE_ID}?`), 'it should read the Page')
    assert.ok(url.includes('instagram_business_account'), 'it should ask for the connected account')
    return { body: { id: PAGE_ID, instagram_business_account: { id: IG_USER_ID, username: 'gdsffofficial' } } }
  })

  const resolved = await resolveInstagramUserId({
    facebookPageId: PAGE_ID,
    instagramBusinessId: PORTFOLIO_ASSET_ID,
    accessToken: 'token',
  })

  assert.equal(resolved.id, IG_USER_ID)
  assert.equal(resolved.source, 'page')
  assert.equal(resolved.username, 'gdsffofficial')
})

test('with no token the saved id is used rather than a guess', async () => {
  globalThis.fetch = async () => assert.fail('no network call should be made without a token')
  const resolved = await resolveInstagramUserId({
    facebookPageId: PAGE_ID,
    instagramBusinessId: PORTFOLIO_ASSET_ID,
    accessToken: '',
  })
  assert.equal(resolved.id, PORTFOLIO_ASSET_ID)
  assert.equal(resolved.source, 'settings')
})

test('a Page that reports no connected account falls back to the saved id', async () => {
  stubGraph(() => ({ body: { id: PAGE_ID } }))
  const resolved = await resolveInstagramUserId({
    facebookPageId: PAGE_ID,
    instagramBusinessId: PORTFOLIO_ASSET_ID,
    accessToken: 'token',
  })
  assert.equal(resolved.id, PORTFOLIO_ASSET_ID)
  assert.equal(resolved.source, 'settings')
  assert.equal(resolved.reason, 'page-has-no-linked-account')
})

/* Meta links the account through either field depending on which side it was
   connected from. Asking for only the first reports a linked account as
   absent. */
test('an account linked from the Instagram side is still found', async () => {
  stubGraph((url) => {
    assert.ok(url.includes('connected_instagram_account'), 'both fields must be requested')
    return { body: { id: PAGE_ID, connected_instagram_account: { id: IG_USER_ID, username: 'gdsffofficial' } } }
  })

  const resolved = await resolveInstagramUserId({
    facebookPageId: PAGE_ID,
    instagramBusinessId: PORTFOLIO_ASSET_ID,
    accessToken: 'token',
  })

  assert.equal(resolved.id, IG_USER_ID)
  assert.equal(resolved.source, 'page')
  assert.equal(resolved.field, 'connected_instagram_account')
})

/* A missing scope reported as "no connected account" sends someone to re-link
   an account that was never unlinked. */
test('a permissions failure is reported as itself, not as a missing link', async () => {
  process.env.META_PAGE_ACCESS_TOKEN = 'token'
  stubGraph(() => ({
    ok: false,
    body: { error: { message: '(#278) Requires instagram_basic permission' } },
  }))

  const resolved = await resolveInstagramUserId({
    facebookPageId: PAGE_ID,
    instagramBusinessId: PORTFOLIO_ASSET_ID,
    accessToken: 'token',
  })
  assert.equal(resolved.reason, 'graph-error')
  assert.match(resolved.graphError, /instagram_basic/)
})

test('the check tells a permissions failure apart from an unlinked account', async () => {
  process.env.META_PAGE_ACCESS_TOKEN = 'token'

  stubGraph((url) =>
    url.includes('instagram_business_account')
      ? { ok: false, body: { error: { message: '(#278) Requires instagram_basic permission' } } }
      : { body: { id: PAGE_ID, name: 'GDSFF' } },
  )

  const withScopeProblem = await describeMetaConnection({ facebookPageId: PAGE_ID, instagramBusinessId: PORTFOLIO_ASSET_ID })
  assert.equal(withScopeProblem.instagram.reason, 'graph-error')
  assert.match(withScopeProblem.instagram.error, /instagram_basic/)
  assert.doesNotMatch(withScopeProblem.instagram.error, /no linked Instagram account/)

  stubGraph((url) =>
    url.includes('instagram_business_account') ? { body: { id: PAGE_ID } } : { body: { id: PAGE_ID, name: 'GDSFF' } },
  )

  const withNoLink = await describeMetaConnection({ facebookPageId: PAGE_ID, instagramBusinessId: PORTFOLIO_ASSET_ID })
  assert.equal(withNoLink.instagram.reason, 'page-has-no-linked-account')
  assert.match(withNoLink.instagram.error, /no linked Instagram account/)
})

test('publishing to Instagram posts to the resolved id, not the saved one', async () => {
  process.env.META_PAGE_ACCESS_TOKEN = 'token'
  const calls = []

  stubGraph((url) => {
    calls.push(url)
    if (url.includes('instagram_business_account')) {
      return { body: { id: PAGE_ID, instagram_business_account: { id: IG_USER_ID, username: 'gdsffofficial' } } }
    }
    if (url.includes('/media_publish')) return { body: { id: 'published-1' } }
    return { body: { id: 'container-1' } }
  })

  const result = await publishToMeta({
    platform: 'instagram',
    message: 'test',
    imageUrl: 'https://www.gdsff.com/if3-certificate.jpg',
    dryRun: false,
    facebookPageId: PAGE_ID,
    instagramBusinessId: PORTFOLIO_ASSET_ID,
  })

  assert.equal(result.publishedId, 'published-1')
  assert.equal(result.instagramUserId, IG_USER_ID)
  assert.ok(calls.some((url) => url.includes(`/${IG_USER_ID}/media?`) || url.includes(`/${IG_USER_ID}/media`)))
  assert.ok(!calls.some((url) => url.includes(`/${PORTFOLIO_ASSET_ID}/media`)), 'the asset id must never be posted to')
})

/* The rule the whole workspace rests on, restated at the lowest level: an
   Instagram publish that was not explicitly asked to be real touches nothing. */
test('a dry run reaches no network at all', async () => {
  process.env.META_PAGE_ACCESS_TOKEN = 'token'
  globalThis.fetch = async () => assert.fail('a dry run must not call Meta')

  const result = await publishToMeta({
    platform: 'instagram',
    message: 'test',
    imageUrl: 'https://www.gdsff.com/if3-certificate.jpg',
    dryRun: true,
    facebookPageId: PAGE_ID,
    instagramBusinessId: PORTFOLIO_ASSET_ID,
  })

  assert.equal(result.dryRun, true)
})

test('the connection check says what is missing instead of calling Meta', async () => {
  globalThis.fetch = async () => assert.fail('nothing to call without a token')
  const report = await describeMetaConnection({ facebookPageId: PAGE_ID, instagramBusinessId: PORTFOLIO_ASSET_ID })
  assert.equal(report.facebook.pageIdConfigured, true)
  assert.equal(report.facebook.tokenConfigured, false)
  assert.match(report.facebook.error, /META_PAGE_ACCESS_TOKEN/)
})

/* A workspace saved before the ids were seeded holds "" for each, and
   mergeValues only substitutes a default for undefined — so the live site
   reported "Set the Page ID in the workspace" while the correct id sat in the
   code it was running. */
test('a workspace saved with blank identifiers picks up the seeded ones', () => {
  const stale = {
    settings: { meta: { facebookPageId: '', instagramBusinessId: '', facebookPageName: 'GDSFF' } },
  }

  const meta = normalizeState(stale).settings.meta
  assert.equal(meta.facebookPageId, PAGE_ID)
  assert.equal(meta.instagramBusinessId, PORTFOLIO_ASSET_ID)
  assert.equal(meta.facebookPageName, 'GDSFF', 'a value that was actually set stays put')
})

test('an identifier someone has set is never overwritten by the seed', () => {
  const edited = { settings: { meta: { facebookPageId: '999', instagramBusinessId: '888' } } }
  const meta = normalizeState(edited).settings.meta
  assert.equal(meta.facebookPageId, '999')
  assert.equal(meta.instagramBusinessId, '888')
})

/* Two different causes had one message, which read as "do both of these" when
   only one was wrong. */
test('a missing token and a missing page id are reported separately', async () => {
  globalThis.fetch = async () => assert.fail('nothing to call')

  const noToken = await describeMetaConnection({ facebookPageId: PAGE_ID, instagramBusinessId: '' })
  assert.match(noToken.facebook.error, /META_PAGE_ACCESS_TOKEN is not set/)
  assert.doesNotMatch(noToken.facebook.error, /Enter it under Integration Settings/)

  const noPageId = await describeMetaConnection({ facebookPageId: '', instagramBusinessId: '' })
  assert.match(noPageId.facebook.error, /No Page ID is saved/)
  assert.doesNotMatch(noPageId.facebook.error, /META_PAGE_ACCESS_TOKEN/)
})

/* Saying "the Page reports no connected Instagram account" when the Page was
   never asked sends someone hunting through Business Suite for a problem that
   is a missing token one line above. */
test('Instagram reports "not checked" when the check never reached the Page', async () => {
  globalThis.fetch = async () => assert.fail('nothing to call')
  const report = await describeMetaConnection({ facebookPageId: PAGE_ID, instagramBusinessId: PORTFOLIO_ASSET_ID })
  assert.equal(report.instagram.checked, false)
  assert.match(report.instagram.error, /Not checked/)
  assert.doesNotMatch(report.instagram.error, /no connected Instagram account/)
})

test('the connection check reports the page name and the resolved account', async () => {
  process.env.META_PAGE_ACCESS_TOKEN = 'token'
  stubGraph((url) =>
    url.includes('instagram_business_account')
      ? { body: { id: PAGE_ID, instagram_business_account: { id: IG_USER_ID, username: 'gdsffofficial' } } }
      : { body: { id: PAGE_ID, name: 'GDSFF' } },
  )

  const report = await describeMetaConnection({ facebookPageId: PAGE_ID, instagramBusinessId: PORTFOLIO_ASSET_ID })
  assert.equal(report.facebook.reachable, true)
  assert.equal(report.facebook.name, 'GDSFF')
  assert.equal(report.instagram.resolvedId, IG_USER_ID)
  assert.equal(report.instagram.resolvedFrom, 'page')
  assert.equal(report.instagram.matchesConfigured, false)
})

/* A User token and a token without instagram_basic both produce a silently
   absent Instagram field — identical to an unlinked account. Blaming the link
   sent a correctly linked Business account to be re-linked. */
test('a User token is named as the cause rather than the account', async () => {
  process.env.META_PAGE_ACCESS_TOKEN = 'token'
  stubGraph((url) => {
    if (url.includes('/me/permissions')) return { body: { data: [{ permission: 'instagram_basic', status: 'granted' }] } }
    if (url.includes('/me?')) return { body: { id: '777000777', name: 'George Gagnidze' } }
    if (url.includes('instagram_business_account')) return { body: { id: PAGE_ID } }
    return { body: { id: PAGE_ID, name: 'GDSFF' } }
  })

  const report = await describeMetaConnection({ facebookPageId: PAGE_ID, instagramBusinessId: PORTFOLIO_ASSET_ID })
  assert.equal(report.instagram.reason, 'user-token')
  assert.match(report.instagram.error, /User token/)
  assert.match(report.instagram.error, /Page Token/)
})

test('a Page token missing instagram_basic is named as the cause', async () => {
  process.env.META_PAGE_ACCESS_TOKEN = 'token'
  stubGraph((url) => {
    if (url.includes('/me/permissions')) {
      return { body: { data: [{ permission: 'pages_manage_posts', status: 'granted' }] } }
    }
    if (url.includes('/me?')) return { body: { id: PAGE_ID, name: 'GDSFF' } }
    if (url.includes('instagram_business_account')) return { body: { id: PAGE_ID } }
    return { body: { id: PAGE_ID, name: 'GDSFF' } }
  })

  const report = await describeMetaConnection({ facebookPageId: PAGE_ID, instagramBusinessId: PORTFOLIO_ASSET_ID })
  assert.equal(report.instagram.reason, 'missing-scope')
  assert.match(report.instagram.error, /instagram_basic/)
  assert.match(report.instagram.error, /pages_manage_posts/, 'it should say what the token does have')
})

test('a Page token with the scope still reports the link as the remaining cause', async () => {
  process.env.META_PAGE_ACCESS_TOKEN = 'token'
  stubGraph((url) => {
    if (url.includes('/me/permissions')) return { body: { data: [{ permission: 'instagram_basic', status: 'granted' }] } }
    if (url.includes('/me?')) return { body: { id: PAGE_ID, name: 'GDSFF' } }
    if (url.includes('instagram_business_account')) return { body: { id: PAGE_ID } }
    return { body: { id: PAGE_ID, name: 'GDSFF' } }
  })

  const report = await describeMetaConnection({ facebookPageId: PAGE_ID, instagramBusinessId: PORTFOLIO_ASSET_ID })
  assert.equal(report.instagram.reason, 'page-has-no-linked-account')
  assert.match(report.instagram.error, /App Review/)
})

test('a bad token is reported, not swallowed', async () => {
  process.env.META_PAGE_ACCESS_TOKEN = 'token'
  stubGraph(() => ({ ok: false, body: { error: { message: 'Error validating access token' } } }))

  const report = await describeMetaConnection({ facebookPageId: PAGE_ID, instagramBusinessId: PORTFOLIO_ASSET_ID })
  assert.equal(report.facebook.reachable, false)
  assert.match(report.facebook.error, /validating access token/)
})
