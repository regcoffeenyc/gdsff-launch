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
    if (!hasValue(instagramBusinessId)) {
      throw new Error('Instagram Business ID is required before publishing.')
    }

    if (!hasValue(instagramToken)) {
      throw new Error('META_INSTAGRAM_ACCESS_TOKEN or META_PAGE_ACCESS_TOKEN is not configured.')
    }

    if (!hasValue(imageUrl)) {
      throw new Error('Instagram publishing requires a public image URL for this MVP.')
    }

    const container = await callGraph(
      `/${instagramBusinessId}/media`,
      {
        image_url: imageUrl,
        caption: message,
      },
      instagramToken,
    )

    const publishResult = await callGraph(
      `/${instagramBusinessId}/media_publish`,
      {
        creation_id: container.id,
      },
      instagramToken,
    )

    return {
      containerId: container.id,
      publishedId: publishResult.id,
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
