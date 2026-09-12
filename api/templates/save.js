/* Save an email or social template. Existed only on the local server. */
import { withAdmin } from '../_lib/socialHandler.js'
import { saveTemplate } from '../../server/lib/workspaceRecords.js'
import { createActivityEntry, logActivity, updateSocialState } from '../_lib/socialStore.js'

export default withAdmin('POST', async ({ response, body, sendJson }) => {
  let saved = null

  const next = await updateSocialState((state) => {
    saved = saveTemplate(state, body.scope, body.template || {})
    logActivity(state, createActivityEntry({
      type: 'template',
      entityType: 'template',
      entityId: saved.id,
      summary: `Template "${saved.title || saved.id}" was saved in ${body.scope}.`,
    }))
    return state
  })

  sendJson(response, 200, { ok: true, template: saved, templates: next.templates })
})
