import { BlobNotFoundError, get, put } from '@vercel/blob'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const libDir = path.dirname(fileURLToPath(import.meta.url))
const apiDir = path.resolve(libDir, '..')
const projectRoot = path.resolve(apiDir, '..')
const dataDir = path.join(projectRoot, 'server', 'data')
const localPath = path.join(dataDir, 'membership-applications.local.json')
const blobPathname = 'gdsff/membership-applications.json'

function ensureDataDir() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
}

function createEmptyDocument() {
  return {
    updatedAt: '',
    applications: [],
  }
}

function normalizeDocument(document) {
  const input = document && typeof document === 'object' ? document : {}
  return {
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : '',
    applications: Array.isArray(input.applications) ? input.applications : [],
  }
}

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

function assertDurableStorageConfigured() {
  if (isVercelRuntime() && !isBlobConfigured()) {
    throw new Error(
      'Durable membership storage is not configured for Vercel. Set BLOB_READ_WRITE_TOKEN before using the live online registration form.',
    )
  }
}

async function readBlobDocument() {
  try {
    const result = await get(blobPathname, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      useCache: false,
    })

    if (!result || result.statusCode !== 200 || !result.stream) {
      return createEmptyDocument()
    }

    const raw = await new Response(result.stream).text()
    return normalizeDocument(raw ? JSON.parse(raw) : createEmptyDocument())
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return createEmptyDocument()
    }

    throw error
  }
}

async function writeBlobDocument(document) {
  const payload = normalizeDocument(document)
  const nextDocument = {
    ...payload,
    updatedAt: new Date().toISOString(),
  }

  await put(blobPathname, `${JSON.stringify(nextDocument, null, 2)}\n`, {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })

  return nextDocument
}

function readLocalDocument() {
  ensureDataDir()

  if (!existsSync(localPath)) {
    writeFileSync(localPath, `${JSON.stringify(createEmptyDocument(), null, 2)}\n`, 'utf8')
    return createEmptyDocument()
  }

  try {
    return normalizeDocument(JSON.parse(readFileSync(localPath, 'utf8')))
  } catch {
    const emptyDocument = createEmptyDocument()
    writeFileSync(localPath, `${JSON.stringify(emptyDocument, null, 2)}\n`, 'utf8')
    return emptyDocument
  }
}

function writeLocalDocument(document) {
  ensureDataDir()
  const nextDocument = {
    ...normalizeDocument(document),
    updatedAt: new Date().toISOString(),
  }
  writeFileSync(localPath, `${JSON.stringify(nextDocument, null, 2)}\n`, 'utf8')
  return nextDocument
}

export async function readMembershipDocument() {
  assertDurableStorageConfigured()

  if (isBlobConfigured()) {
    return readBlobDocument()
  }

  return readLocalDocument()
}

export async function writeMembershipDocument(document) {
  assertDurableStorageConfigured()

  if (isBlobConfigured()) {
    return writeBlobDocument(document)
  }

  return writeLocalDocument(document)
}

export async function readMembershipApplications() {
  const document = await readMembershipDocument()
  return normalizeDocument(document).applications
}

export async function updateMembershipApplications(updater) {
  const currentDocument = await readMembershipDocument()
  const currentApplications = [...currentDocument.applications]
  const nextApplications = updater(structuredClone(currentApplications)) ?? currentApplications
  const savedDocument = await writeMembershipDocument({
    ...currentDocument,
    applications: Array.isArray(nextApplications) ? nextApplications : currentApplications,
  })

  return normalizeDocument(savedDocument).applications
}
