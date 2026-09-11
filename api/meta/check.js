/* Is the Meta connection real? A read-only answer.
 *
 * Without this, the only way to find out whether a token works is to attempt a
 * post on the federation's own page — which is exactly the thing that must not
 * happen by accident. This reads the Page and the Instagram account it is
 * connected to, and reports what it found. It publishes nothing and writes
 * nothing.
 *
 * It deliberately survives an unconfigured blob store. Checking a token and
 * setting up durable storage are two different jobs, and making the first wait
 * on the second meant the only way to test a fresh token was still to post
 * with it. The identifiers are seeded in defaultState.js, so when stored state
 * is unreachable the check falls back to those and says so.
 */
import { withAdmin } from '../_lib/socialHandler.js'
import { describeMetaConnection } from '../../server/lib/metaGraph.js'
import { createDefaultState } from '../../server/lib/defaultState.js'
import { readSocialState } from '../_lib/socialStore.js'

async function readMetaSettings() {
  try {
    const state = await readSocialState()
    return { meta: state.settings?.meta || {}, source: 'workspace' }
  } catch (error) {
    return {
      meta: createDefaultState().settings?.meta || {},
      source: 'defaults',
      note: error?.message || 'Stored workspace state could not be read.',
    }
  }
}

export default withAdmin('GET', async ({ response, sendJson }) => {
  const { meta, source, note } = await readMetaSettings()

  const report = await describeMetaConnection({
    facebookPageId: meta.facebookPageId || '',
    instagramBusinessId: meta.instagramBusinessId || '',
  })

  sendJson(response, 200, {
    ok: true,
    checkedAt: new Date().toISOString(),
    identifiersFrom: source,
    ...(note ? { storageNote: note } : {}),
    meta: report,
  })
})
