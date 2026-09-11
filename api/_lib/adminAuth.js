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

/* Vercel sets VERCEL_ENV on every deployment — production, preview and its own
   "development". Anything without it is someone's own machine. */
function isDeployed() {
  return hasValue(process.env.VERCEL_ENV) || hasValue(process.env.VERCEL)
}

/* Setup mode exists so the workspace can be opened locally before any
   credentials are set: it accepts any non-empty username and password. That is
   a convenience on a laptop and a wide-open door on a deployment, and it opens
   itself — an ADMIN_USERNAME cleared during some future config change would
   unlock the workspace silently, with no error anywhere to notice. Deployments
   fail closed instead. */
export function setupModeAllowed() {
  return !isDeployed()
}

/* Signing key. The fallback literal that used to sit here is published in this
   repository, so anyone who read it could forge an admin session token. A
   deployment now signs with a real secret or refuses to sign at all. */
function getSecret() {
  const configured = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD
  if (hasValue(configured)) {
    return configured
  }

  return isDeployed() ? null : 'gdsff-local-development-only-secret'
}

function getTokenFromRequest(request) {
  const header = request.headers.authorization || ''
  if (!header.startsWith('Bearer ')) {
    return ''
  }

  return header.slice('Bearer '.length).trim()
}

function signPayload(payload) {
  const secret = getSecret()
  if (!secret) {
    return null
  }

  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function isAuthConfigured() {
  return hasValue(process.env.ADMIN_USERNAME) && hasValue(process.env.ADMIN_PASSWORD)
}

export function createAdminSessionToken(username, setupMode = false) {
  if (!getSecret()) {
    throw new Error('Admin sessions are not configured on this deployment.')
  }

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
    return { authenticated: false, setupMode: !authConfigured && setupModeAllowed(), authConfigured, user: null }
  }

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) {
    return { authenticated: false, setupMode: !authConfigured && setupModeAllowed(), authConfigured, user: null }
  }

  const expectedSignature = signPayload(encodedPayload)
  if (!expectedSignature) {
    return { authenticated: false, setupMode: false, authConfigured, user: null }
  }

  const actual = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return { authenticated: false, setupMode: !authConfigured && setupModeAllowed(), authConfigured, user: null }
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload))
    if (!payload?.username || Number(payload?.exp) < Date.now()) {
      return { authenticated: false, setupMode: !authConfigured && setupModeAllowed(), authConfigured, user: null }
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
    return { authenticated: false, setupMode: !authConfigured && setupModeAllowed(), authConfigured, user: null }
  }
}

export function loginAdmin(username, password) {
  if (!hasValue(username) || !hasValue(password)) {
    throw new Error('Username and password are required.')
  }

  const authConfigured = isAuthConfigured()

  if (!authConfigured && !setupModeAllowed()) {
    throw new Error('Admin sign-in is not configured on this deployment. Set ADMIN_USERNAME and ADMIN_PASSWORD, then redeploy.')
  }

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
