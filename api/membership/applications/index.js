import { validateAdminSession } from '../../_lib/adminAuth.js'
import { readJson, sendEmpty, sendJson } from '../../_lib/http.js'
import { createMembershipApplication, listMembershipApplications } from '../../_lib/membershipService.js'
import {
  buildMembershipNotificationFailureMessage,
  membershipNotificationWasDelivered,
} from '../../../server/lib/membershipNotification.js'

export const config = {
  runtime: 'nodejs',
}

export default async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    sendEmpty(response)
    return
  }

  try {
    if (request.method === 'POST') {
      const body = await readJson(request)
      const result = await createMembershipApplication(body)

      if (!membershipNotificationWasDelivered(result.notification)) {
        sendJson(response, 502, {
          ok: false,
          error: buildMembershipNotificationFailureMessage(result.application, result.notification),
          stored: true,
          application: result.application,
          summary: result.summary,
          notification: result.notification,
        })
        return
      }

      sendJson(response, 200, {
        ok: true,
        application: result.application,
        summary: result.summary,
        notification: result.notification,
      })
      return
    }

    if (request.method === 'GET') {
      const session = validateAdminSession(request)
      if (!session.authenticated) {
        sendJson(response, 401, { ok: false, error: 'Admin authentication is required.' })
        return
      }

      const result = await listMembershipApplications()
      sendJson(response, 200, {
        ok: true,
        applications: result.applications,
        summary: result.summary,
      })
      return
    }

    sendJson(response, 405, { ok: false, error: 'Method not allowed.' })
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Membership request failed.',
    })
  }
}
