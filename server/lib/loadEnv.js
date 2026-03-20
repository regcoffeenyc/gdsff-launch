import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let envLoaded = false

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function stripInlineComment(value) {
  let inSingle = false
  let inDouble = false

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]

    if (char === "'" && !inDouble) {
      inSingle = !inSingle
      continue
    }

    if (char === '"' && !inSingle) {
      inDouble = !inDouble
      continue
    }

    if (char === '#' && !inSingle && !inDouble) {
      return value.slice(0, index).trimEnd()
    }
  }

  return value
}

function normalizeValue(rawValue) {
  const value = stripInlineComment(rawValue.trim())

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    const quote = value[0]
    const inner = value.slice(1, -1)
    return quote === '"' ? inner.replace(/\\n/g, '\n').replace(/\\r/g, '\r') : inner
  }

  return value
}

function parseDotEnv(raw) {
  const entries = []

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const normalized = trimmed.startsWith('export ') ? trimmed.slice('export '.length) : trimmed
    const separatorIndex = normalized.indexOf('=')
    if (separatorIndex <= 0) {
      continue
    }

    const key = normalized.slice(0, separatorIndex).trim()
    const rawValue = normalized.slice(separatorIndex + 1)
    if (!hasValue(key)) {
      continue
    }

    entries.push([key, normalizeValue(rawValue)])
  }

  return entries
}

export function ensureEnvLoaded() {
  if (envLoaded) {
    return
  }

  const envFilePath = resolve(process.cwd(), '.env')
  envLoaded = true

  if (!existsSync(envFilePath)) {
    return
  }

  const raw = readFileSync(envFilePath, 'utf8')
  const entries = parseDotEnv(raw)

  for (const [key, value] of entries) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}
