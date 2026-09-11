/* draft -> approved is the tap that matters. Nothing publishes here; it only
   records who approved what and when. The queue does the publishing. */
import { withAdmin } from '../../_lib/socialHandler.js'
import { createActivityEntry, logActivity, updateSocialState } from '../../_lib/socialStore.js'

export default withAdmin('POST', async ({ response, body, session, sendJson }) => {
  const next = await updateSocialState((state) => {
    const post = (state.socialPosts || []).find((item) => item.id === body.id)
    if (!post) {
      throw new Error('That post no longer exists in the workspace.')
    }

    post.status = body.status || post.status
    post.updatedAt = new Date().toISOString()

    if (post.status === 'approved' || post.status === 'scheduled') {
      post.approval = {
        approvedBy: body.approvedBy || post.approval?.approvedBy || session.user?.username || 'admin',
        approvedAt: post.approval?.approvedAt || new Date().toISOString(),
      }
    }

    return logActivity(state, createActivityEntry({
      type: 'social',
      entityType: 'social-post',
      entityId: post.id,
      summary: `Social post "${post.title}" moved to ${post.status}.`,
    }))
  })

  sendJson(response, 200, { ok: true, socialPosts: next.socialPosts })
})
