/* Works the queue: anything due is handed to Meta. Every item carries its own
   dryRun flag and defaults to true, so a run publishes nothing unless the item
   was explicitly marked for real. */
import { randomUUID } from 'node:crypto'
import { withAdmin } from '../../_lib/socialHandler.js'
import { processScheduledPosts } from '../../../server/lib/scheduleQueue.js'
import { publishToMeta } from '../../../server/lib/metaGraph.js'
import { createActivityEntry, logActivity, readSocialState, writeSocialState } from '../../_lib/socialStore.js'

export default withAdmin('POST', async ({ response, body, sendJson }) => {
  const draft = await readSocialState()
  const results = await processScheduledPosts({
    state: draft,
    publishFn: publishToMeta,
    dryRunOverride: body.dryRun,
  })

  for (const item of results) {
    draft.publishHistory = [
      {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        platform: item.platform || 'unknown',
        dryRun: item.dryRun !== false,
        /* These were two empty strings, so a queue publish left no record of
           what actually went out. */
        message: item.message || '',
        imageUrl: item.imageUrl || '',
        result: item,
      },
      ...(draft.publishHistory || []),
    ].slice(0, 20)

    logActivity(draft, createActivityEntry({
      type: 'queue',
      entityType: 'scheduled-post',
      entityId: item.id,
      summary: item.status === 'error'
        ? `Queue processing failed: ${item.error}`
        : `Queue item processed for ${item.platform}.`,
    }))
  }

  await writeSocialState(draft)
  sendJson(response, 200, { ok: true, results })
})
