/* Save a media asset. Existed only on the local server, so editing the media
   library on gdsff.com returned 404 — which is also why the certificate's
   wrong image path could not be corrected from the workspace. */
import { withAdmin } from '../../_lib/socialHandler.js'
import { saveMediaAsset } from '../../../server/lib/workspaceRecords.js'
import { createActivityEntry, logActivity, updateSocialState } from '../../_lib/socialStore.js'

export default withAdmin('POST', async ({ response, body, sendJson }) => {
  let saved = null

  const next = await updateSocialState((state) => {
    saved = saveMediaAsset(state, body.asset || {})
    logActivity(state, createActivityEntry({
      type: 'media',
      entityType: 'media-asset',
      entityId: saved.id,
      summary: `Media asset "${saved.title}" was saved to the library.`,
    }))
    return state
  })

  sendJson(response, 200, { ok: true, asset: saved, mediaAssets: next.mediaAssets })
})
