import { withAdmin } from '../../_lib/socialHandler.js'
import { upsertSocialPost } from '../../../server/lib/socialPosts.js'
import { createActivityEntry, logActivity, updateSocialState } from '../../_lib/socialStore.js'

export default withAdmin('POST', async ({ response, body, sendJson }) => {
  let saved = null
  const next = await updateSocialState((state) => {
    saved = upsertSocialPost(state, body.post || {})
    return logActivity(state, createActivityEntry({
      type: 'social',
      entityType: 'social-post',
      entityId: saved.id,
      summary: `Social post "${saved.title}" was saved with status ${saved.status}.`,
    }))
  })

  sendJson(response, 200, { ok: true, socialPosts: next.socialPosts })
})
