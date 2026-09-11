/* A direct publish, outside the queue. dryRun defaults to true: a caller has
   to ask for a real post, it is never the fallback. */
import { withAdmin } from '../_lib/socialHandler.js'
import { publishToMeta } from '../../server/lib/metaGraph.js'
import { createActivityEntry, logActivity, readSocialState, writeSocialState } from '../_lib/socialStore.js'

export default withAdmin('POST', async ({ response, body, sendJson }) => {
  const state = await readSocialState()
  const meta = state.settings?.meta || {}
  const dryRun = body.dryRun !== false

  const platform = body.platform === 'instagram' ? 'instagram' : 'facebook'
  const request = {
    platform,
    message: body.message || '',
    imageUrl: body.imageUrl || '',
    link: body.link || '',
    dryRun,
    facebookPageId: body.facebookPageId || meta.facebookPageId || '',
    instagramBusinessId: body.instagramBusinessId || meta.instagramBusinessId || '',
  }

  let result

  try {
    result = await publishToMeta(request)
  } catch (error) {
    /* A rejected publish used to leave no trace at all: no history row, no
       activity entry, nothing to look back at. The attempt happened and the
       record should say so, with Meta's reason. */
    const message = error?.message || 'The publish failed.'

    state.publishHistory = [
      {
        id: `publish-${Date.now()}`,
        createdAt: new Date().toISOString(),
        platform,
        dryRun,
        message: request.message,
        imageUrl: request.imageUrl,
        failed: true,
        error: message,
      },
      ...(state.publishHistory || []),
    ].slice(0, 20)

    logActivity(state, createActivityEntry({
      type: 'publish',
      entityType: 'publish',
      entityId: platform,
      summary: `Publish to ${platform} failed: ${message}`,
    }))

    await writeSocialState(state)
    throw error
  }

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
