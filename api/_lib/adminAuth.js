import { createHmac, timingSafeEqual } from 'node:crypto'

const SESSION_TTL_MS = 12 * 60 * 60 * 1000

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function base64UrlEncode(value) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'gdsff-membership-session-secret'
}

function getTokenFromRequest(request) {
  const header = request.headers.authorization || ''
  if (!header.startsWith('Bearer ')) {
    return ''
  }

  return header.slice('Bearer '.length).trim()
}

function signPayload(payload) {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

export function isAuthConfigured() {
  return hasValue(process.env.ADMIN_USERNAME) && hasValue(process.env.ADMIN_PASSWORD)
}

export function createAdminSessionToken(username, setupMode = false) {
  const payload = {
    username,
    role: 'admin',
    setupMode,
    exp: Date.now() + SESSION_TTL_MS,
  }
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = signPayload(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export function validateAdminSession(request) {
  const token = getTokenFromRequest(request)
  const authConfigured = isAuthConfigured()

  if (!token) {
    return { authenticated: false, setupMode: !authConfigured, authConfigured, user: null }
  }

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) {
    return { authenticated: false, setupMode: !authConfigured, authConfigured, user: null }
  }

  const expectedSignature = signPayload(encodedPayload)
  const actual = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return { authenticated: false, setupMode: !authConfigured, authConfigured, user: null }
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload))
    if (!payload?.username || Number(payload?.exp) < Date.now()) {
      return { authenticated: false, setupMode: !authConfigured, authConfigured, user: null }
    }

    return {
      authenticated: true,
      setupMode: Boolean(payload.setupMode),
      authConfigured,
      token,
      user: {
        username: payload.username,
        role: 'admin',
        setupMode: Boolean(payload.setupMode),
      },
    }
  } catch {
    return { authenticated: false, setupMode: !authConfigured, authConfigured, user: null }
  }
}

export function loginAdmin(username, password) {
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

  return {
    token: createAdminSessionToken(username, setupMode),
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

export function logoutAdmin() {
  return { ok: true }
}
