/* The scheduled path, which nobody watches run.
 *
 * processScheduledPosts called the publisher without the page ids, so every
 * real scheduled publish threw "Facebook Page ID is required before
 * publishing" — the queue was dead in exactly the mode where a failure is
 * silent and a scheduled announcement simply never appears.
 *
 *   node --test tests/scheduleQueue.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'

const { processScheduledPosts } = await import('../server/lib/scheduleQueue.js')
const { publishToMeta } = await import('../server/lib/metaGraph.js')

const PAGE_ID = '1081637585022289'
const IG_USER_ID = '17841442047686365'

function buildState({ dryRun = false, imageUrl = '' } = {}) {
  return {
    settings: { meta: { facebookPageId: PAGE_ID, instagramBusinessId: IG_USER_ID } },
    socialPosts: [
      {
        id: 'if3-membership-certificate',
        status: 'approved',
        captions: { medium: 'iF3 recognised GDSFF.' },
        imagePlaceholder: '/media/if3-certificate-square.jpg',
        link: 'https://gdsff.org',
      },
    ],
    scheduledPosts: [
      {
        id: 'queue-1',
        postId: 'if3-membership-certificate',
        platform: 'facebook',
        scheduledFor: new Date(Date.now() - 60_000).toISOString(),
        status: 'pending',
        dryRun,
        imageUrl,
      },
    ],
  }
}

test('a scheduled item is published with the page id from settings', async () => {
  const state = buildState({ dryRun: false })
  const seen = []

  const results = await processScheduledPosts({
    state,
    publishFn: async (args) => {
      seen.push(args)
      return { ok: true }
    },
  })

  assert.equal(results.length, 1)
  assert.equal(seen[0].facebookPageId, PAGE_ID, 'the page id must reach the publisher')
  assert.equal(seen[0].instagramBusinessId, IG_USER_ID)
  assert.equal(seen[0].dryRun, false)
})

/* The regression in its original form: the real publisher, with no ids passed
   through, refuses every item. */
test('the real publisher no longer refuses a scheduled item for a missing page id', async () => {
  const state = buildState({ dryRun: true })

  const results = await processScheduledPosts({ state, publishFn: publishToMeta })

  assert.equal(results[0].result.dryRun, true)
  assert.equal(results[0].result.request.facebookPageId, PAGE_ID)
})

test('the result carries what was sent, so history can record it', async () => {
  const state = buildState({ dryRun: true })
  const results = await processScheduledPosts({ state, publishFn: async () => ({ ok: true }) })

  assert.equal(results[0].message, 'iF3 recognised GDSFF.')
  assert.equal(results[0].imageUrl, '/media/if3-certificate-square.jpg')
})

test("an item's own image overrides the post's", async () => {
  const state = buildState({ dryRun: true, imageUrl: 'https://www.gdsff.com/media/other.jpg' })
  const results = await processScheduledPosts({ state, publishFn: async () => ({ ok: true }) })

  assert.equal(results[0].imageUrl, 'https://www.gdsff.com/media/other.jpg')
})

/* dryRun defaults to true per item, and the queue must not quietly publish
   because a flag was absent. */
test('an item with no dryRun flag is treated as a rehearsal', async () => {
  const state = buildState()
  delete state.scheduledPosts[0].dryRun
  const seen = []

  await processScheduledPosts({
    state,
    publishFn: async (args) => {
      seen.push(args)
      return { ok: true }
    },
  })

  assert.equal(seen[0].dryRun, true)
})
