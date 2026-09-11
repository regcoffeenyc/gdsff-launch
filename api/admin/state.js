/* The endpoint the workspace could not find. GET the whole state: drafts,
   media library, queue, settings, activity. */
import { withAdmin } from '../_lib/socialHandler.js'
import { buildStatePayload, readSocialState } from '../_lib/socialStore.js'

export default withAdmin('GET', async ({ response, session, sendJson }) => {
  const state = await readSocialState()
  sendJson(response, 200, buildStatePayload(state, session))
})
