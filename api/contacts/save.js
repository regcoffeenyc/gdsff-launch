/* Save a contact or lead. Existed only on the local server. */
import { withAdmin } from '../_lib/socialHandler.js'
import { saveContact } from '../../server/lib/workspaceRecords.js'
import { createActivityEntry, logActivity, updateSocialState } from '../_lib/socialStore.js'

export default withAdmin('POST', async ({ response, body, sendJson }) => {
  let saved = null

  const next = await updateSocialState((state) => {
    saved = saveContact(state, body.contact || {})
    logActivity(state, createActivityEntry({
      type: 'contact',
      entityType: 'contact',
      entityId: saved.id,
      summary: `Contact "${saved.name || saved.email || saved.id}" was saved.`,
    }))
    return state
  })

  sendJson(response, 200, { ok: true, contact: saved, contacts: next.contacts })
})
