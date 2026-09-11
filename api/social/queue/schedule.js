import { withAdmin } from '../../_lib/socialHandler.js'
import { schedulePostInQueue } from '../../../server/lib/socialPosts.js'
import { createActivityEntry, logActivity, updateSocialState } from '../../_lib/socialStore.js'

export default withAdmin('POST', async ({ response, body, sendJson }) => {
  if (!body.postId || !body.scheduledFor) {
    throw new Error('A post and a time are both required to schedule.')
  }

  const next = await updateSocialState((state) => {
    const post = schedulePostInQueue(
      state,
      body.postId,
      body.platforms || body.platform,
      body.scheduledFor,
      body.dryRun,
      body.imageUrl,
    )

    return logActivity(state, createActivityEntry({
      type: 'queue',
      entityType: 'scheduled-post',
      entityId: post.id,
      summary: `Scheduled "${post.title}" for ${body.scheduledFor}.`,
    }))
  })

  sendJson(response, 200, { ok: true, scheduledPosts: next.scheduledPosts })
})
