function resolveApiBase() {
  const configuredBase = (import.meta.env.VITE_GDSFF_API_BASE || import.meta.env.VITE_SOCIAL_API_BASE || '').trim()
  if (configuredBase) {
    return configuredBase.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || ''
    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      return 'http://127.0.0.1:8787'
    }

    return window.location.origin.replace(/\/$/, '')
  }

  return 'http://127.0.0.1:8787'
}

const apiBase = resolveApiBase()
const AUTH_STORAGE_KEY = 'gdsff-media-bot-token'

function createRequestError(message, statusCode = 0, details = null) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.details = details
  return error
}

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

export function getSavedAuthToken() {
  if (!canUseStorage()) {
    return ''
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEY) || ''
}

export function setSavedAuthToken(token) {
  if (!canUseStorage()) {
    return
  }

  if (token) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, token)
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

export function clearSavedAuthToken() {
  setSavedAuthToken('')
}

async function request(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  const token = options.token ?? getSavedAuthToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers,
    })
  } catch (error) {
    throw createRequestError(`Online registration backend is unreachable at ${apiBase}.`, 0, {
      apiBase,
    })
  }

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    if (response.status === 401) {
      clearSavedAuthToken()
    }

    throw createRequestError(data?.error || 'Request failed.', response.status, data)
  }

  return data
}

async function requestBlob(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  }

  const token = options.token ?? getSavedAuthToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? await response.json() : {}
    if (response.status === 401) {
      clearSavedAuthToken()
    }
    throw new Error(data?.error || 'Request failed.')
  }

  return response.blob()
}

function post(path, payload) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  })
}

export function getAdminSession() {
  return request('/api/auth/session')
}

export async function loginAdmin(username, password) {
  const result = await post('/api/auth/login', { username, password })
  setSavedAuthToken(result.token)
  return result
}

export async function logoutAdmin() {
  const result = await post('/api/auth/logout')
  clearSavedAuthToken()
  return result
}

export function getAdminState() {
  return request('/api/admin/state')
}

export function getSocialHubState() {
  return getAdminState()
}

export function saveAdminSettings(payload) {
  return post('/api/admin/settings', payload)
}

export function saveSocialHubSettings(meta) {
  return saveAdminSettings({ meta })
}

export function getMembershipSummary() {
  return request('/api/membership/summary')
}

export function submitMembershipApplication(payload) {
  return post('/api/membership/applications', payload)
}

export function getMembershipApplications() {
  return request('/api/membership/applications')
}

export function updateMembershipApplicationStatus(id, status, reviewNote = '') {
  return post('/api/membership/applications/status', { id, status, reviewNote })
}

export function askSocialAssistant(messages) {
  return post('/api/ai/assistant', { messages })
}

export function generateSocialDraft(payload) {
  return post('/api/ai/draft', payload)
}

export function generateReplySuggestion(payload) {
  return post('/api/ai/reply', payload)
}

export function saveSocialPost(postData) {
  return post('/api/social/posts/save', { post: postData })
}

export function updateSocialPostStatus(id, status, approvedBy = '') {
  return post('/api/social/posts/status', { id, status, approvedBy })
}

export function scheduleSocialPost(payload) {
  return post('/api/social/queue/schedule', payload)
}

export function processSocialQueue(payload = {}) {
  return post('/api/social/queue/process', payload)
}

export function saveMediaAsset(asset) {
  return post('/api/social/assets/save', { asset })
}

export function saveEmailMessage(message) {
  return post('/api/email/messages/save', { message })
}

export function syncEmailInbox(payload = {}) {
  return post('/api/email/sync', payload)
}

export function classifyEmailMessage(id) {
  return post('/api/email/messages/classify', { id })
}

export function generateEmailReplyDraft(id) {
  return post('/api/email/messages/reply-draft', { id })
}

export function saveContact(contact) {
  return post('/api/contacts/save', { contact })
}

export function saveTemplate(scope, template) {
  return post('/api/templates/save', { scope, template })
}

export function getMetaAuthUrl() {
  return request('/api/meta/auth/url')
}

export function publishMetaContent(payload) {
  return post('/api/meta/publish', payload)
}

export async function exportContacts(format = 'json') {
  const blob = await requestBlob(`/api/contacts/export?format=${encodeURIComponent(format)}`)
  return blob
}
