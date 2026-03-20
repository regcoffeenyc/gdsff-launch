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

    try {
      const result = await publishFn({
        platform: item.platform,
        message: post.captions.medium,
        imageUrl: item.imageUrl || post.imagePlaceholder || '',
        link: post.link || '',
        dryRun: shouldDryRun,
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
