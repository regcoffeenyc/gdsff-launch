/* Settings, and in particular the Facebook page id and Instagram business
   account id. Publishing refuses until those two are filled in. */
import { withAdmin } from '../_lib/socialHandler.js'
import { applySettingsUpdate } from '../../server/lib/socialPosts.js'
import { createActivityEntry, logActivity, updateSocialState } from '../_lib/socialStore.js'

export default withAdmin('POST', async ({ response, body, sendJson }) => {
  const next = await updateSocialState((state) => {
    applySettingsUpdate(state, body)
    return logActivity(state, createActivityEntry({
      type: 'settings',
      entityType: 'settings',
      entityId: 'workspace',
      summary: 'Communications settings were updated.',
    }))
  })

  sendJson(response, 200, { ok: true, settings: next.settings })
})
