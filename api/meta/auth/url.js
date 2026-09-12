/* The Meta OAuth URL the workspace links to. Existed only on the local server,
   so the Connect button on gdsff.com pointed at a 404. Read-only: it builds a
   URL from configuration and touches nothing. */
import { withAdmin } from '../../_lib/socialHandler.js'
import { buildMetaAuthUrl, getRuntimeConfig, metaOAuthScopes } from '../../../server/lib/platformRegistry.js'

export default withAdmin('GET', async ({ response, sendJson }) => {
  const runtime = getRuntimeConfig()

  sendJson(response, 200, {
    ok: true,
    url: buildMetaAuthUrl(),
    scopes: metaOAuthScopes,
    redirectUri: runtime.metaRedirectUri,
    /* Without an app id the URL is unusable; say so rather than handing back a
       link that fails on Meta's side. */
    appConfigured: runtime.metaAppIdConfigured,
  })
})
