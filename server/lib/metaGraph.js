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
    return { id: instagramBusinessId, source: 'settings' }
  }

  try {
    const page = await readGraph(`/${facebookPageId}`, { fields: 'instagram_business_account{id,username}' }, accessToken)
    const linked = page?.instagram_business_account

    if (linked?.id) {
      return { id: linked.id, source: 'page', username: linked.username || '' }
    }
  } catch {
    /* A revoked token or a missing permission should surface as the publish
       error it causes, not as a resolution error with less context. */
  }

  return { id: instagramBusinessId, source: 'settings' }
}

/* A read-only "does this actually work" check, so the first proof that a token
   is good does not have to be a real post on the federation's page. */
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
      error: '',
    },
  }

  if (!report.facebook.pageIdConfigured || !report.facebook.tokenConfigured) {
    report.facebook.error = 'Set the Page ID in the workspace and META_PAGE_ACCESS_TOKEN on the deployment.'
    return report
  }

  try {
    const page = await readGraph(`/${facebookPageId}`, { fields: 'id,name' }, facebookToken)
    report.facebook.reachable = page?.id === String(facebookPageId)
    report.facebook.name = page?.name || ''
  } catch (error) {
    report.facebook.error = error?.message || 'Could not read the Page.'
    return report
  }

  const resolved = await resolveInstagramUserId({ facebookPageId, instagramBusinessId, accessToken: instagramToken })
  report.instagram.resolvedId = resolved.id || ''
  report.instagram.resolvedFrom = resolved.source
  report.instagram.username = resolved.username || ''
  report.instagram.matchesConfigured = Boolean(resolved.id) && resolved.id === instagramBusinessId

  if (resolved.source === 'settings') {
    report.instagram.error =
      'The Page reports no connected Instagram business account. Connect the account to the Page in Business Suite, or the saved id will be used as-is.'
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
