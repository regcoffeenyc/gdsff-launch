/* Durable workspace state for the deployed media and communications workspace.
 *
 * The workspace was built against server/index.js, a long-running Node process
 * that keeps its state in a file. None of that is deployed: on Vercel every
 * request is a separate function with a read-only, empty filesystem, so the
 * page signed in and then had nothing to read — /api/admin/state was a 404.
 *
 * This is the same state, persisted the way membershipStore.js persists
 * applications: a Vercel Blob in a deployment, a local file on a laptop. The
 * shaping helpers (normalizeState, buildDashboardSummary, enrichMessages) are
 * imported from server/lib/socialStore.js rather than reimplemented, so the
 * two runtimes cannot drift apart in how they read the same document.
 */
import { BlobNotFoundError, get, put } from '@vercel/blob'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createDefaultState } from '../../server/lib/defaultState.js'
import { buildDashboardSummary, enrichMessages, normalizeState } from '../../server/lib/socialStore.js'
import { buildMetaAuthUrl, getPlatformCatalog, getRuntimeConfig, metaOAuthScopes } from '../../server/lib/platformRegistry.js'

const libDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(libDir, '..', '..')
const dataDir = path.join(projectRoot, 'server', 'data')
/* Overridable so a test run gets its own file instead of inheriting whatever
   a previous run — or the copy committed to the repository — left behind. */
const localPath = process.env.GDSFF_SOCIAL_STATE_PATH || path.join(dataDir, 'social-state.local.json')
const blobPathname = 'gdsff/social-state.json'

function isBlobConfigured() {
  return typeof process.env.BLOB_READ_WRITE_TOKEN === 'string' && process.env.BLOB_READ_WRITE_TOKEN.trim().length > 0
}

function isVercelRuntime() {
  return (
    process.env.VERCEL === '1' ||
    (typeof process.env.VERCEL_ENV === 'string' && process.env.VERCEL_ENV.trim().length > 0) ||
    (typeof process.env.VERCEL_URL === 'string' && process.env.VERCEL_URL.trim().length > 0)
  )
}

/* Without a blob token a deployment would appear to work and silently discard
   every approval, because the filesystem it wrote to is thrown away with the
   function. Say so instead. */
function assertDurableStorageConfigured() {
  if (isVercelRuntime() && !isBlobConfigured()) {
    throw new Error(
      'Durable workspace storage is not configured. Set BLOB_READ_WRITE_TOKEN on the deployment, then redeploy — without it every change to a draft would be lost when the request ends.',
    )
  }
}

async function readBlobState() {
  try {
    const result = await get(blobPathname, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      useCache: false,
    })

    if (!result || result.statusCode !== 200 || !result.stream) {
      return normalizeState(createDefaultState())
    }

    const raw = await new Response(result.stream).text()
    return normalizeState(raw ? JSON.parse(raw) : createDefaultState())
  } catch (error) {
    /* First read of a new deployment: nothing has been saved yet, so the seed
       state — which carries the drafts and the media library — is the answer. */
    if (error instanceof BlobNotFoundError) {
      return normalizeState(createDefaultState())
    }

    throw error
  }
}

async function writeBlobState(state) {
  const payload = { ...normalizeState(state), updatedAt: new Date().toISOString() }
  await put(blobPathname, `${JSON.stringify(payload, null, 2)}\n`, {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  return payload
}

function readLocalState() {
  if (!existsSync(localPath)) {
    return normalizeState(createDefaultState())
  }

  try {
    return normalizeState(JSON.parse(readFileSync(localPath, 'utf8')))
  } catch {
    return normalizeState(createDefaultState())
  }
}

function writeLocalState(state) {
  const dir = path.dirname(localPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const payload = { ...normalizeState(state), updatedAt: new Date().toISOString() }
  writeFileSync(localPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return payload
}

export async function readSocialState() {
  assertDurableStorageConfigured()
  return isBlobConfigured() ? readBlobState() : readLocalState()
}

export async function writeSocialState(state) {
  assertDurableStorageConfigured()
  return isBlobConfigured() ? writeBlobState(state) : writeLocalState(state)
}

/* Read, apply, write. Two approvals landing in the same second can still lose
   one — the blob has no compare-and-set — but one person approves posts here,
   and losing a race is a re-tap, not a bad publish. */
export async function updateSocialState(updater) {
  const current = await readSocialState()
  const draft = structuredClone(current)
  const next = updater(draft) ?? draft
  return writeSocialState(next)
}

export function createActivityEntry({ type, entityType, entityId, summary }) {
  return {
    id: `${entityType}-${entityId}-${Date.now()}`,
    type,
    entityType,
    entityId,
    summary,
    createdAt: new Date().toISOString(),
  }
}

export function logActivity(state, entry) {
  state.activityLog = [entry, ...(state.activityLog || [])].slice(0, 80)
  return state
}

/* The shape SocialHubPage expects: { ok, runtime, platforms, auth, updatedAt,
   summary, state }. The email and IMAP halves of runtime are reported as
   unconfigured because those endpoints are not deployed — that is the truth,
   and the page renders them as badges rather than failing. */
export function buildStatePayload(state, session) {
  const runtime = getRuntimeConfig()

  return {
    ok: true,
    runtime: {
      openAiConfigured: runtime.openAiConfigured,
      openaiModel: runtime.openaiModel,
      metaAppConfigured: runtime.metaAppIdConfigured && runtime.metaAppSecretConfigured,
      metaRedirectUri: runtime.metaRedirectUri,
      metaVerifyTokenConfigured: runtime.metaVerifyTokenConfigured,
      metaPageAccessTokenConfigured: runtime.metaPageAccessTokenConfigured,
      metaInstagramAccessTokenConfigured:
        runtime.metaInstagramAccessTokenConfigured || runtime.metaPageAccessTokenConfigured,
      emailInboxAddress: runtime.emailInboxAddress,
      emailProvider: process.env.EMAIL_PROVIDER || '',
      m365Configured: false,
      imapConfigured: false,
      smtpConfigured: runtime.smtpConfigured,
      durableStorageConfigured: isBlobConfigured(),
    },
    platforms: getPlatformCatalog(state),
    auth: {
      authenticated: Boolean(session?.authenticated),
      authConfigured: Boolean(session?.authConfigured),
      setupMode: Boolean(session?.setupMode),
      user: session?.user || null,
      metaAuthUrl: buildMetaAuthUrl(),
      scopes: metaOAuthScopes,
    },
    updatedAt: state.updatedAt,
    summary: buildDashboardSummary(state),
    state: {
      ...state,
      messages: enrichMessages(state),
    },
  }
}
