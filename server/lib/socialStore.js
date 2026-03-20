import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDefaultState } from './defaultState.js'
import { needsFollowUp } from './emailWorkflow.js'
import { sortScheduledPosts } from './scheduleQueue.js'

const libDir = path.dirname(fileURLToPath(import.meta.url))
const serverDir = path.resolve(libDir, '..')
const dataDir = path.join(serverDir, 'data')
const statePath = path.join(dataDir, 'social-state.local.json')

function mergeValues(defaultValue, currentValue) {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(currentValue) ? currentValue : structuredClone(defaultValue)
  }

  if (defaultValue && typeof defaultValue === 'object') {
    const nextValue = currentValue && typeof currentValue === 'object' ? currentValue : {}
    const merged = {}

    for (const [key, value] of Object.entries(defaultValue)) {
      merged[key] = mergeValues(value, nextValue[key])
    }

    for (const [key, value] of Object.entries(nextValue)) {
      if (!(key in merged)) {
        merged[key] = value
      }
    }

    return merged
  }

  return currentValue === undefined ? defaultValue : currentValue
}

function normalizeState(state) {
  return mergeValues(createDefaultState(), state || {})
}

function ensureDataDir() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
}

function persistState(nextState, touchUpdatedAt = true) {
  ensureDataDir()

  const payload = touchUpdatedAt
    ? {
        ...nextState,
        updatedAt: new Date().toISOString(),
      }
    : nextState

  writeFileSync(statePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return payload
}

function ensureStateFile() {
  ensureDataDir()

  if (!existsSync(statePath)) {
    persistState(createDefaultState(), false)
    return
  }

  try {
    const current = JSON.parse(readFileSync(statePath, 'utf8'))
    const normalized = normalizeState(current)

    if (JSON.stringify(current) !== JSON.stringify(normalized)) {
      persistState(normalized, false)
    }
  } catch {
    persistState(createDefaultState(), false)
  }
}

function getPendingMessageStatuses() {
  return new Set(['new', 'pending', 'in progress', 'waiting'])
}

function enrichMessages(state) {
  const followUpDays = Number(state.settings?.automation?.followUpDays || 3)

  return (state.messages || []).map((message) => ({
    ...message,
    followUpNeeded: needsFollowUp(message, followUpDays),
  }))
}

export function buildDashboardSummary(state) {
  const pendingStatuses = getPendingMessageStatuses()
  const messages = enrichMessages(state)
  const socialPosts = state.socialPosts || []
  const membershipApplications = state.membershipApplications || []
  const queueItems = sortScheduledPosts(
    (state.scheduledPosts || []).filter((item) => item.status !== 'published' && item.status !== 'error'),
  )
  const followUpMessages = messages.filter((message) => message.followUpNeeded)
  const urgentMessages = messages.filter((message) => message.priority === 'urgent' || message.followUpNeeded)

  return {
    pendingEmails: messages.filter((message) => pendingStatuses.has(message.status)).length,
    urgentRequests: urgentMessages.length,
    followUpsNeeded: followUpMessages.length,
    pendingSocialDrafts: socialPosts.filter((post) => ['draft', 'approved'].includes(post.status)).length,
    approvedSocialPosts: socialPosts.filter((post) => post.status === 'approved').length,
    publishedSocialPosts: socialPosts.filter((post) => post.status === 'published').length,
    totalMemberApplications: membershipApplications.length,
    pendingMemberApplications: membershipApplications.filter((item) =>
      ['submitted', 'under-review', 'needs-info'].includes(item.status),
    ).length,
    nextScheduledPosts: queueItems.slice(0, 4),
    recentActivity: (state.activityLog || []).slice(0, 8),
    urgentMessages: urgentMessages.slice(0, 5),
    followUpMessages: followUpMessages.slice(0, 5),
  }
}

export function readState() {
  ensureStateFile()
  const state = JSON.parse(readFileSync(statePath, 'utf8'))
  return normalizeState(state)
}

export function writeState(nextState) {
  ensureStateFile()
  return persistState(normalizeState(nextState))
}

export function updateState(updater) {
  const current = readState()
  const draft = structuredClone(current)
  const nextState = updater(draft) ?? draft
  return writeState(nextState)
}

export function appendActivity(key, entry, maxItems = 20) {
  return updateState((state) => {
    const list = Array.isArray(state[key]) ? state[key] : []
    state[key] = [entry, ...list].slice(0, maxItems)
    return state
  })
}

export function logActivity(entry) {
  return updateState((state) => {
    const list = Array.isArray(state.activityLog) ? state.activityLog : []
    state.activityLog = [entry, ...list].slice(0, 80)
    return state
  })
}

export function getClientState() {
  const state = readState()
  const summary = buildDashboardSummary(state)
  const messages = enrichMessages(state)

  return {
    updatedAt: state.updatedAt,
    summary,
    state: {
      ...state,
      messages,
    },
  }
}
