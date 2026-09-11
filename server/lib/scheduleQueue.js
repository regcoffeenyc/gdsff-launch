export function getQueueStatus(item, now = new Date()) {
  if (item.status === 'published' || item.status === 'error') {
    return item.status
  }

  const scheduledDate = new Date(item.scheduledFor)
  if (Number.isNaN(scheduledDate.getTime())) {
    return 'draft'
  }

  return scheduledDate.getTime() <= now.getTime() ? 'due' : 'scheduled'
}

export function sortScheduledPosts(items) {
  return [...items].sort((left, right) => {
    const leftValue = new Date(left.scheduledFor).getTime()
    const rightValue = new Date(right.scheduledFor).getTime()
    return leftValue - rightValue
  })
}

export async function processScheduledPosts({ state, publishFn, now = new Date(), dryRunOverride = null }) {
  const dueItems = state.scheduledPosts.filter((item) => getQueueStatus(item, now) === 'due')
  const results = []

  for (const item of dueItems) {
    const shouldDryRun = dryRunOverride ?? item.dryRun !== false
    const post = state.socialPosts.find((entry) => entry.id === item.postId)
    if (!post) {
      item.status = 'error'
      item.lastResult = { error: 'Linked social post not found.' }
      results.push({ id: item.id, status: 'error', error: 'Linked social post not found.' })
      continue
    }

    const message = post.captions.medium
    const imageUrl = item.imageUrl || post.imagePlaceholder || ''

    try {
      const result = await publishFn({
        platform: item.platform,
        message,
        imageUrl,
        link: post.link || '',
        dryRun: shouldDryRun,
        /* Without these the publisher throws "Facebook Page ID is required" on
           every scheduled item: the queue was dead in the one mode where nobody
           is watching it run, and a scheduled announcement would simply never
           appear. */
        facebookPageId: state.settings?.meta?.facebookPageId || '',
        instagramBusinessId: state.settings?.meta?.instagramBusinessId || '',
      })

      item.lastProcessedAt = now.toISOString()
      item.lastResult = result

      if (!shouldDryRun) {
        item.status = 'published'
        post.status = 'published'
        post.publishedAt = now.toISOString()
      }

      results.push({
        id: item.id,
        platform: item.platform,
        dryRun: shouldDryRun,
        /* Carried out so the history row can record what was actually sent
           rather than two empty strings. */
        message,
        imageUrl,
        result,
      })
    } catch (error) {
      item.status = 'error'
      item.lastProcessedAt = now.toISOString()
      item.lastResult = { error: error instanceof Error ? error.message : 'Queue processing failed.' }
      results.push({
        id: item.id,
        platform: item.platform,
        status: 'error',
        error: error instanceof Error ? error.message : 'Queue processing failed.',
      })
    }
  }

  return results
}
