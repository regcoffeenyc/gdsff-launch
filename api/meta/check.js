/* Is the Meta connection real? A read-only answer.
 *
 * Without this, the only way to find out whether a token works is to attempt a
 * post on the federation's own page — which is exactly the thing that must not
 * happen by accident. This reads the Page and the Instagram account it is
 * connected to, and reports what it found. It publishes nothing and writes
 * nothing.
 */
import { withAdmin } from '../_lib/socialHandler.js'
import { describeMetaConnection } from '../../server/lib/metaGraph.js'
import { readSocialState } from '../_lib/socialStore.js'

export default withAdmin('GET', async ({ response, sendJson }) => {
  const state = await readSocialState()
  const meta = state.settings?.meta || {}

  const report = await describeMetaConnection({
    facebookPageId: meta.facebookPageId || '',
    instagramBusinessId: meta.instagramBusinessId || '',
  })

  sendJson(response, 200, { ok: true, checkedAt: new Date().toISOString(), meta: report })
})
