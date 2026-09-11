import { getRuntimeConfig } from './platformRegistry.js'

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}

async function callGraph(endpoint, params, accessToken) {
  const runtime = getRuntimeConfig()
  const search = new URLSearchParams({
    ...params,
    access_token: accessToken,
  })

  const response = await fetch(`https://graph.facebook.com/${runtime.metaGraphVersion}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: search.toString(),
  })

  const data = await response.json()

  if (!response.ok) {
    const errorMessage = data?.error?.message || 'Meta Graph request failed.'
    throw new Error(errorMessage)
  }

  return data
}

async function readGraph(endpoint, params, accessToken) {
  const runtime = getRuntimeConfig()
  const search = new URLSearchParams({
    ...params,
    access_token: accessToken,
  })

  const response = await fetch(`https://graph.facebook.com/${runtime.metaGraphVersion}${endpoint}?${search.toString()}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Meta Graph request failed.')
  }

  return data
}

/* Business Suite shows an Instagram account under two different numbers, and
 * only one of them works here. The one on the account's Summary screen is the
 * business-portfolio asset id; publishing needs the IG User ID, which the
 * Graph API only hands out through the connected Page. They are not
 * interchangeable, and posting with the wrong one fails with an unhelpful
 * "Unsupported get request".
 *
 * So ask the Page. Whatever is saved in settings is the fallback, for the case
 * where someone has already put the correct IG User ID there by hand.
 */
export async function resolveInstagramUserId({ facebookPageId, instagramBusinessId, accessToken }) {
  if (!hasValue(facebookPageId) || !hasValue(accessToken)) {
    return { id: instagramBusinessId, source: 'settings', reason: 'no-page-or-token' }
  }

  try {
    /* Both fields, because Meta links an account through either one depending
       on how it was connected: instagram_business_account for an account linked
       from the Page, connected_instagram_account for one linked from the
       Instagram side. Asking for only the first reports a linked account as
       absent. */
    const page = await readGraph(
      `/${facebookPageId}`,
      { fields: 'instagram_business_account{id,username},connected_instagram_account{id,username}' },
      accessToken,
    )

    const linked = page?.instagram_business_account || page?.connected_instagram_account

    if (linked?.id) {
      return {
        id: linked.id,
        source: 'page',
        username: linked.username || '',
        field: page?.instagram_business_account?.id ? 'instagram_business_account' : 'connected_instagram_account',
      }
    }

    return { id: instagramBusinessId, source: 'settings', reason: 'page-has-no-linked-account' }
  } catch (error) {
    /* Swallowing this reported a permissions failure as "the Page has no
       connected account" — a different problem with a different fix, and one
       that sends someone to relink an account that was never unlinked. The
       Graph message names which it is. */
    return {
      id: instagramBusinessId,
      source: 'settings',
      reason: 'graph-error',
      graphError: error?.message || 'The Page could not be read.',
    }
  }
}

/* A read-only "does this actually work" check, so the first proof that a token
   is good does not have to be a real post on the federation's page. */
/* What is this token, actually?
 *
 * Graph returns instagram_business_account only when the token carries
 * instagram_basic, and it omits the field silently rather than erroring when it
 * does not. A User token pasted instead of a Page token reads the page's name
 * fine and returns no Instagram field either. Both look exactly like "the
 * account is not linked" — which sent a correctly linked, correctly typed
 * Business account to be re-linked in Business Suite.
 *
 * So ask the token what it is before blaming the account.
 */
async function describeToken(accessToken, facebookPageId) {
  const info = { type: 'unknown', id: '', name: '', scopes: [], scopesKnown: false, error: '' }

  try {
    const me = await readGraph('/me', { fields: 'id,name' }, accessToken)
    info.id = me?.id || ''
    info.name = me?.name || ''
    /* A Page token's /me is the Page itself; a User token's is the person. */
    info.type = info.id && String(info.id) === String(facebookPageId) ? 'page' : 'user'
  } catch (error) {
    info.error = error?.message || 'The token could not be read.'
    return info
  }

  try {
    const permissions = await readGraph('/me/permissions', {}, accessToken)
    if (Array.isArray(permissions?.data)) {
      info.scopes = permissions.data.filter((row) => row.status === 'granted').map((row) => row.permission)
      info.scopesKnown = true
    }
  } catch {
    /* Page tokens cannot read this edge. Not knowing the scopes is a normal
       outcome, not a failure — it just means we report less. */
  }

  return info
}

export async function describeMetaConnection({ facebookPageId, instagramBusinessId }) {
  const facebookToken = process.env.META_PAGE_ACCESS_TOKEN || ''
  const instagramToken = process.env.META_INSTAGRAM_ACCESS_TOKEN || facebookToken

  const report = {
    facebook: {
      pageIdConfigured: hasValue(facebookPageId),
      tokenConfigured: hasValue(facebookToken),
      reachable: false,
      name: '',
      error: '',
    },
    instagram: {
      tokenConfigured: hasValue(instagramToken),
      configuredId: instagramBusinessId || '',
      resolvedId: '',
      resolvedFrom: '',
      username: '',
      matchesConfigured: false,
      /* Distinguishes "we asked the Page and it has none" from "we never got
         far enough to ask". Reporting the first when the second happened sent
         someone hunting through Business Suite for a problem that was a missing
         token one line above. */
      checked: false,
      error: '',
    },
  }

  /* Name the one that is actually missing. One message covering both causes
     reads as "do these two things" when only one of them is wrong. */
  if (!report.facebook.pageIdConfigured) {
    report.facebook.error = 'No Page ID is saved in the workspace. Enter it under Integration Settings and save.'
    report.instagram.error = 'Not checked — the Facebook Page ID is missing, and the Instagram id is read from the Page.'
    return report
  }

  if (!report.facebook.tokenConfigured) {
    report.facebook.error =
      'META_PAGE_ACCESS_TOKEN is not set on this deployment. Add it in Vercel and redeploy — an added variable only reaches builds made after it.'
    report.instagram.error = 'Not checked — there is no access token to read the Page with.'
    return report
  }

  try {
    const page = await readGraph(`/${facebookPageId}`, { fields: 'id,name' }, facebookToken)
    report.facebook.reachable = page?.id === String(facebookPageId)
    report.facebook.name = page?.name || ''
  } catch (error) {
    const message = error?.message || 'Could not read the Page.'
    report.facebook.error = message

    /* Graph names the expiry precisely and says nothing about the fix, which is
       not "generate another one" — that expires too. A Page token derived from
       a long-lived user token does not expire at all, and that derivation is
       the step people skip. */
    if (/session has expired|expired.*token|token is invalid|malformed/i.test(message)) {
      report.facebook.expired = true
      report.facebook.error = `${message} — This was a short-lived token. Generate one in the Graph API Explorer, extend it in the Access Token Debugger, then call /me/accounts with the extended token and use the Page's own access_token from that response. Only a Page token derived from a long-lived user token never expires.`
    }

    return report
  }

  const resolved = await resolveInstagramUserId({ facebookPageId, instagramBusinessId, accessToken: instagramToken })
  report.instagram.checked = true
  report.instagram.resolvedId = resolved.id || ''
  report.instagram.resolvedFrom = resolved.source
  report.instagram.username = resolved.username || ''
  report.instagram.matchesConfigured = Boolean(resolved.id) && resolved.id === instagramBusinessId

  /* Three different failures used to read as one. They need different fixes:
     re-link the account, re-generate the token with the right scopes, or read
     the Graph error and decide. */
  if (resolved.source === 'settings') {
    report.instagram.reason = resolved.reason || ''

    if (resolved.reason === 'graph-error') {
      report.instagram.graphError = resolved.graphError || ''
      report.instagram.error = `The Page could not be read for Instagram: ${resolved.graphError}. If it mentions permissions, the token needs instagram_basic and instagram_content_publish — re-generate it with those scopes rather than changing anything in Business Suite.`
    } else {
      /* The Page not reporting a link does not mean the account is
         unreachable. If an IG User ID is configured, read it directly: if the
         token can see the account, publishing works regardless of what the
         Page's link fields say. This is the question that actually matters, so
         ask it before diagnosing anything. */
      if (hasValue(instagramBusinessId)) {
        try {
          const account = await readGraph(
            `/${instagramBusinessId}`,
            { fields: 'id,username' },
            instagramToken,
          )

          if (account?.id) {
            report.instagram.checked = true
            report.instagram.resolvedId = account.id
            report.instagram.resolvedFrom = 'direct'
            report.instagram.username = account.username || ''
            report.instagram.matchesConfigured = true
            report.instagram.note =
              'The Page does not report the link, but the saved IG User ID reads back with this token, which is what publishing needs.'
            return report
          }
        } catch (error) {
          report.instagram.directError = error?.message || ''
        }
      }

      /* Before blaming the link, rule out the two things that produce an
         identical silent absence: a token that is not a Page token, and a token
         without instagram_basic. */
      const token = await describeToken(instagramToken, facebookPageId)
      report.token = token

      if (token.type === 'user') {
        report.instagram.reason = 'user-token'
        report.instagram.error = `This is a User token${token.name ? ` for ${token.name}` : ''}, not a Page token. Instagram is only reported to a Page token. In the Graph API Explorer, switch the dropdown from "User Token" to "Page Token", pick GDSFF, and use that value.`
      } else if (token.scopesKnown && !token.scopes.includes('instagram_basic')) {
        report.instagram.reason = 'missing-scope'
        report.instagram.error = `The token does not carry instagram_basic, so Meta omits the Instagram link rather than reporting it. Granted: ${token.scopes.join(', ') || 'none'}. Re-generate the token with instagram_basic and instagram_content_publish.`
      } else {
        report.instagram.reason = 'page-has-no-linked-account'

        /* Report what was observed before what it might mean. The direct read's
           own error is the most specific fact available and was being dropped;
           and a Page token cannot read /me/permissions, so claiming it "carries
           instagram_basic" when the scopes came back unknown asserts something
           never checked — the same habit that produced the last four wrong
           diagnoses. */
        const scopeNote = token.scopesKnown
          ? `The token carries: ${token.scopes.join(', ') || 'none'}.`
          : 'Its granted scopes could not be read — a Page token cannot read /me/permissions — so instagram_basic is unconfirmed here.'

        const directNote = report.instagram.directError
          ? ` Reading the saved IG User ID directly also failed: "${report.instagram.directError}".`
          : ''

        report.instagram.error =
          `The Page is reachable with a Page token, and reports no linked Instagram account under either field Meta uses.${directNote} ${scopeNote} ` +
          'Two causes fit: the app the token came from has not been granted instagram_basic and instagram_content_publish (an app that has not passed App Review grants them only to people with a role on it), or the Instagram account is not attached to that app\'s business portfolio. Both are settings on the app, not on the account.'
      }
    }
  }

  return report
}

export async function publishToMeta({ platform, message, imageUrl, link, dryRun, facebookPageId, instagramBusinessId }) {
  const facebookToken = process.env.META_PAGE_ACCESS_TOKEN || ''
  const instagramToken = process.env.META_INSTAGRAM_ACCESS_TOKEN || facebookToken

  if (dryRun) {
    return {
      dryRun: true,
      platform,
      request: {
        facebookPageId,
        instagramBusinessId,
        message,
        imageUrl,
        link,
      },
    }
  }

  if (platform === 'facebook') {
    if (!hasValue(facebookPageId)) {
      throw new Error('Facebook Page ID is required before publishing.')
    }

    if (!hasValue(facebookToken)) {
      throw new Error('META_PAGE_ACCESS_TOKEN is not configured.')
    }

    if (hasValue(imageUrl)) {
      return callGraph(`/${facebookPageId}/photos`, { url: imageUrl, caption: message }, facebookToken)
    }

    return callGraph(`/${facebookPageId}/feed`, { message, ...(hasValue(link) ? { link } : {}) }, facebookToken)
  }

  if (platform === 'instagram') {
    if (!hasValue(instagramToken)) {
      throw new Error('META_INSTAGRAM_ACCESS_TOKEN or META_PAGE_ACCESS_TOKEN is not configured.')
    }

    /* The saved id may be the business-portfolio asset id, which Graph will
       not publish to. Ask the Page for the IG User ID first. */
    const resolved = await resolveInstagramUserId({ facebookPageId, instagramBusinessId, accessToken: instagramToken })
    const instagramUserId = resolved.id

    if (!hasValue(instagramUserId)) {
      throw new Error('Instagram Business ID is required before publishing.')
    }

    if (!hasValue(imageUrl)) {
      throw new Error('Instagram publishing requires a public image URL for this MVP.')
    }

    const container = await callGraph(
      `/${instagramUserId}/media`,
      {
        image_url: imageUrl,
        caption: message,
      },
      instagramToken,
    )

    const publishResult = await callGraph(
      `/${instagramUserId}/media_publish`,
      {
        creation_id: container.id,
      },
      instagramToken,
    )

    return {
      containerId: container.id,
      publishedId: publishResult.id,
      instagramUserId,
      instagramUserIdSource: resolved.source,
    }
  }

  throw new Error(`Unsupported platform "${platform}" for Meta publishing.`)
}

export function summarizeWebhookPayload(payload) {
  const entry = Array.isArray(payload.entry) ? payload.entry[0] : null
  const changes = entry?.changes ?? []
  const messaging = entry?.messaging ?? []
  const field = changes[0]?.field || payload.object || 'unknown'

  return {
    object: payload.object || 'unknown',
    field,
    entryId: entry?.id || '',
    receivedAt: new Date().toISOString(),
    summary:
      messaging.length > 0
        ? `Received ${messaging.length} messaging event(s).`
        : changes.length > 0
          ? `Received ${changes.length} change event(s) for ${field}.`
          : 'Received webhook event.',
    payload,
  }
}
