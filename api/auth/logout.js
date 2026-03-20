import { logoutAdmin } from '../_lib/adminAuth.js'
import { sendEmpty, sendJson } from '../_lib/http.js'

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

  sendJson(response, 200, logoutAdmin())
}
