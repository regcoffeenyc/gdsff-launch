import { getMembershipSummaryPayload } from '../_lib/membershipService.js'
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

  try {
    const result = await getMembershipSummaryPayload()
    sendJson(response, 200, { ok: true, summary: result.summary })
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Membership summary is unavailable.',
    })
  }
}
