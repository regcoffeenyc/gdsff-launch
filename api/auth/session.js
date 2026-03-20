import { validateAdminSession } from '../_lib/adminAuth.js'
import { sendEmpty, sendJson } from '../_lib/http.js'

export const config = {
  runtime: 'nodejs',
}

export default async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    sendEmpty(response)
    return
  }

  if (request.method !== 'GET') {
    sendJson(response, 405, { ok: false, error: 'Method not allowed.' })
    return
  }

  const session = validateAdminSession(request)
  sendJson(response, 200, {
    ok: true,
    auth: {
      authenticated: session.authenticated,
      authConfigured: session.authConfigured,
      setupMode: session.setupMode,
      user: session.user,
    },
  })
}
