import { loginAdmin } from '../_lib/adminAuth.js'
import { readJson, sendEmpty, sendJson } from '../_lib/http.js'

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

  try {
    const body = await readJson(request)
    const result = loginAdmin(body.username, body.password)
    sendJson(response, 200, { ok: true, ...result })
  } catch (error) {
    sendJson(response, 401, {
      ok: false,
      error: error instanceof Error ? error.message : 'Login failed.',
    })
  }
}
