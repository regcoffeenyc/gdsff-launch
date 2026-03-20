import { validateAdminSession } from '../../_lib/adminAuth.js'
import { readJson, sendEmpty, sendJson } from '../../_lib/http.js'
import { updateMembershipApplicationStatus } from '../../_lib/membershipService.js'

export const config = {
  runtime: 'nodejs',
}

export default async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    sendEmpty(response)
    return
  }

  if (request.method !== 'POST') {
    sendJson(response, 405, { ok: false, error: 'Method not allowed.' })
    return
  }

  const session = validateAdminSession(request)
  if (!session.authenticated) {
    sendJson(response, 401, { ok: false, error: 'Admin authentication is required.' })
    return
  }

  try {
    const body = await readJson(request)
    const result = await updateMembershipApplicationStatus({
      id: body.id,
      status: body.status,
      reviewNote: body.reviewNote,
    })

    sendJson(response, 200, {
      ok: true,
      application: result.application,
      summary: result.summary,
    })
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Membership status update failed.',
    })
  }
}
