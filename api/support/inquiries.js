import { readJson, sendEmpty, sendJson } from '../_lib/http.js'
import { submitSupportInquiry } from '../_lib/supportService.js'

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
    const result = await submitSupportInquiry(body)

    if (!result.delivered) {
      sendJson(response, 502, {
        ok: false,
        error: result.failureMessage,
        inquiry: result.inquiry,
        notification: result.notification,
      })
      return
    }

    sendJson(response, 200, {
      ok: true,
      inquiry: result.inquiry,
      notification: result.notification,
    })
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Support inquiry request failed.',
    })
  }
}
