/* Mutations on workspace state: the shapes a saved post, a queued item and a
   settings change take.
 *
 * These lived inside server/index.js, which is a local Node process and is not
 * deployed. The serverless functions under api/ need exactly the same
 * behaviour — a post approved on gdsff.com must come out identical to one
 * approved on a laptop — so the code moved here and both import it. Copying it
 * would have guaranteed the two drifted.
 */
import { randomUUID } from 'node:crypto'
import { socialHubLaunchPack } from '../../src/content/socialHubLaunchPack.js'

export function toArray(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

export function normalizeHashtags(value) {
  return unique(
    toArray(value)
      .flatMap((item) => `${item}`.split(/\s+/))
      .map((item) => item.trim())
      .filter(Boolean),
  )
}

export function normalizePlatforms(value) {
  const allowed = new Set(['facebook', 'instagram'])
  const items = unique(toArray(value).map((item) => item.toLowerCase()))
  const filtered = items.filter((item) => allowed.has(item))
  return filtered.length ? filtered : ['facebook']
}

export function buildCaptionVariants(title, captions) {
  const medium = `${captions?.medium || captions?.caption || ''}`.trim()
  const short = `${captions?.short || medium.split('\n\n')[0] || title || ''}`.trim()
  const long =
    `${captions?.long || medium}`.trim() ||
    `${title}\n\n${socialHubLaunchPack.brand.website}\n${socialHubLaunchPack.brand.email}`

  return {
    short,
    medium,
    long: long.includes(socialHubLaunchPack.brand.website)
      ? long
      : `${long}\n\n${socialHubLaunchPack.brand.website}\n${socialHubLaunchPack.brand.email}`,
  }
}

export function upsertSocialPost(state, input) {
  const now = new Date().toISOString()
  const existingIndex = (state.socialPosts || []).findIndex((post) => post.id === input.id)
  const current = existingIndex >= 0 ? state.socialPosts[existingIndex] : null
  const captions = buildCaptionVariants(input.title ?? current?.title ?? '', input.captions || current?.captions || input)
  const status = input.status ?? current?.status ?? 'draft'
  const approved = status === 'approved' || status === 'scheduled'

  const nextPost = {
    id: current?.id || randomUUID(),
    title: input.title ?? current?.title ?? 'Untitled social post',
    category: input.category ?? current?.category ?? 'announcement',
    platforms: normalizePlatforms(input.platforms ?? current?.platforms ?? ['facebook']),
    status,
    captions,
    englishCaption: input.englishCaption ?? current?.englishCaption ?? '',
    hashtags: normalizeHashtags(input.hashtags ?? current?.hashtags ?? socialHubLaunchPack.hashtags.slice(0, 5)),
    imagePlaceholder: input.imagePlaceholder ?? current?.imagePlaceholder ?? '',
    mediaAssetIds: unique(toArray(input.mediaAssetIds ?? current?.mediaAssetIds ?? [])),
    link: input.link ?? current?.link ?? socialHubLaunchPack.brand.website,
    approval: {
      approvedBy: approved ? input.approvedBy || current?.approval?.approvedBy || 'admin' : '',
      approvedAt: approved ? input.approvedAt || current?.approval?.approvedAt || now : '',
    },
    notes: input.notes ?? current?.notes ?? '',
    scheduledFor: input.scheduledFor ?? current?.scheduledFor ?? '',
    createdAt: current?.createdAt || now,
    updatedAt: now,
    publishedAt: input.publishedAt ?? current?.publishedAt ?? '',
  }

  if (existingIndex >= 0) {
    state.socialPosts[existingIndex] = nextPost
  } else {
    state.socialPosts = [nextPost, ...(state.socialPosts || [])]
  }

  return nextPost
}

export function schedulePostInQueue(state, postId, platforms, scheduledFor, dryRun = true, imageUrl = '') {
  const post = (state.socialPosts || []).find((item) => item.id === postId)
  if (!post) {
    throw new Error('Social post not found.')
  }

  const queuePlatforms = normalizePlatforms(platforms?.length ? platforms : post.platforms)
  const now = new Date().toISOString()

  post.status = 'scheduled'
  post.scheduledFor = scheduledFor
  post.updatedAt = now

  for (const platform of queuePlatforms) {
    const currentIndex = (state.scheduledPosts || []).findIndex((item) => item.postId === postId && item.platform === platform)
    const queueItem = {
      id: currentIndex >= 0 ? state.scheduledPosts[currentIndex].id : randomUUID(),
      postId,
      title: post.title,
      platform,
      scheduledFor,
      status: 'scheduled',
      dryRun: dryRun !== false,
      imageUrl: imageUrl || post.imagePlaceholder || '',
      lastProcessedAt: '',
      lastResult: null,
      createdAt: currentIndex >= 0 ? state.scheduledPosts[currentIndex].createdAt : now,
    }

    if (currentIndex >= 0) {
      state.scheduledPosts[currentIndex] = queueItem
    } else {
      state.scheduledPosts = [queueItem, ...(state.scheduledPosts || [])]
    }
  }

  return post
}

export function applySettingsUpdate(state, body) {
  if (body.meta) {
    state.settings.meta = {
      ...state.settings.meta,
      ...body.meta,
    }
  }

  if (body.email) {
    state.settings.email = {
      ...state.settings.email,
      ...body.email,
    }
  }

  if (body.automation) {
    state.settings.automation = {
      ...state.settings.automation,
      ...body.automation,
    }
  }

  return state.settings
}
