/* One shape for every workspace endpoint: CORS preflight, method check, admin
   session, then the body. Written once here so seven functions cannot each
   forget the session check in their own way. */
import { readJson, sendEmpty, sendJson } from './http.js'
import { validateAdminSession } from './adminAuth.js'

export function withAdmin(method, run) {
  return async function handler(request, response) {
    if (request.method === 'OPTIONS') {
      sendEmpty(response)
      return
    }

    if (request.method !== method) {
      sendJson(response, 405, { ok: false, error: `Use ${method}.` })
      return
    }

    const session = validateAdminSession(request)
    if (!session.authenticated) {
      sendJson(response, 401, { ok: false, error: 'Admin sign-in required.' })
      return
    }

    try {
      const body = method === 'POST' ? await readJson(request) : {}
      await run({ request, response, session, body, sendJson })
    } catch (error) {
      /* The message is written for the person reading it in the workspace —
         an unconfigured blob token, a post id that no longer exists — so pass
         it through rather than flattening it to "something went wrong". */
      sendJson(response, 400, { ok: false, error: error?.message || 'Request failed.' })
    }
  }
}
