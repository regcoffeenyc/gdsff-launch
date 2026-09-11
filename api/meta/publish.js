/* A direct publish, outside the queue. dryRun defaults to true: a caller has
   to ask for a real post, it is never the fallback. */
import { withAdmin } from '../_lib/socialHandler.js'
import { publishToMeta } from '../../server/lib/metaGraph.js'
import { createActivityEntry, logActivity, readSocialState, writeSocialState } from '../_lib/socialStore.js'

export default withAdmin('POST', async ({ response, body, sendJson }) => {
  const state = await readSocialState()
  const meta = state.settings?.meta || {}
  const dryRun = body.dryRun !== false

  const result = await publishToMeta({
    platform: body.platform === 'instagram' ? 'instagram' : 'facebook',
    message: body.message || '',
    imageUrl: body.imageUrl || '',
    link: body.link || '',
    dryRun,
    facebookPageId: body.facebookPageId || meta.facebookPageId || '',
    instagramBusinessId: body.instagramBusinessId || meta.instagramBusinessId || '',
  })

  state.publishHistory = [
    {
      id: `publish-${Date.now()}`,
      createdAt: new Date().toISOString(),
      platform: body.platform || 'facebook',
      dryRun,
      message: body.message || '',
      imageUrl: body.imageUrl || '',
      result,
    },
    ...(state.publishHistory || []),
  ].slice(0, 20)

  logActivity(state, createActivityEntry({
    type: 'publish',
    entityType: 'publish',
    entityId: body.platform || 'facebook',
    summary: dryRun
      ? `Dry run against ${body.platform || 'facebook'}.`
      : `Published to ${body.platform || 'facebook'}.`,
  }))

  await writeSocialState(state)
  sendJson(response, 200, { ok: true, dryRun, result })
})
