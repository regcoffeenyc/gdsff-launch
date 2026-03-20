import { randomUUID } from 'node:crypto'

const sessions = new Map()
const SESSION_TTL_MS = 12 * 60 * 60 * 1000

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function getTokenFromRequest(request) {
  const header = request.headers.authorization || ''
  if (!header.startsWith('Bearer ')) {
    return ''
  }

  return header.slice('Bearer '.length).trim()
}

export function isAuthConfigured() {
  return hasValue(process.env.ADMIN_USERNAME) && hasValue(process.env.ADMIN_PASSWORD)
}

export function validateSession(request) {
  const token = getTokenFromRequest(request)
  if (!token) {
    return { authenticated: false, setupMode: !isAuthConfigured(), authConfigured: isAuthConfigured(), user: null }
  }

  const session = sessions.get(token)
  if (!session) {
    return { authenticated: false, setupMode: !isAuthConfigured(), authConfigured: isAuthConfigured(), user: null }
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(token)
    return { authenticated: false, setupMode: !isAuthConfigured(), authConfigured: isAuthConfigured(), user: null }
  }

  return {
    authenticated: true,
    setupMode: session.setupMode,
    authConfigured: isAuthConfigured(),
    user: {
      username: session.username,
      role: 'admin',
      setupMode: session.setupMode,
    },
    token,
  }
}

export function login(username, password) {
  if (!hasValue(username) || !hasValue(password)) {
    throw new Error('Username and password are required.')
  }

  const authConfigured = isAuthConfigured()
  const setupMode = !authConfigured

  if (authConfigured) {
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      throw new Error('Invalid admin credentials.')
    }
  }

  const token = randomUUID()
  sessions.set(token, {
    token,
    username,
    setupMode,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  })

  return {
    token,
    authenticated: true,
    authConfigured,
    setupMode,
    user: {
      username,
      role: 'admin',
      setupMode,
    },
  }
}

export function logout(request) {
  const token = getTokenFromRequest(request)
  if (token) {
    sessions.delete(token)
  }

  return { ok: true }
}
