import tls from 'node:tls'
import { getRuntimeConfig } from './platformRegistry.js'

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function quoteImap(value) {
  return `"${`${value || ''}`.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function parseSearchIds(raw) {
  const match = raw.match(/\* SEARCH([^\r\n]*)/i)
  if (!match) {
    return []
  }

  return match[1]
    .trim()
    .split(/\s+/)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0)
}

function parseHeaderValue(headers, key) {
  const pattern = new RegExp(`^${key}:\\s*(.+)$`, 'im')
  const match = headers.match(pattern)
  return match ? match[1].trim() : ''
}

function normalizeDate(value) {
  if (!hasValue(value)) {
    return new Date().toISOString()
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function extractEmailAddress(fromLine) {
  const directMatch = fromLine.match(/<([^>]+)>/)
  if (directMatch) {
    return {
      name: fromLine.replace(directMatch[0], '').replace(/"/g, '').trim(),
      email: directMatch[1].trim(),
    }
  }

  if (fromLine.includes('@')) {
    return {
      name: '',
      email: fromLine.trim(),
    }
  }

  return {
    name: fromLine.trim(),
    email: '',
  }
}

function parseFetchPayload(raw) {
  const headerMatch = raw.match(/BODY\[HEADER\.FIELDS[^\]]*\]\s+\{\d+\}\r\n([\s\S]*?)\r\n(?:\s+BODY\[TEXT\]|[A-Z]+\s|\))/i)
  const textMatch = raw.match(/BODY\[TEXT\](?:<[^>]+>)?\s+\{\d+\}\r\n([\s\S]*?)\r\n\)/i)
  const headers = headerMatch ? headerMatch[1] : ''
  const body = textMatch ? textMatch[1].trim() : ''

  const subject = parseHeaderValue(headers, 'Subject') || '(No subject)'
  const fromLine = parseHeaderValue(headers, 'From')
  const messageId = parseHeaderValue(headers, 'Message-ID')
  const dateLine = parseHeaderValue(headers, 'Date')
  const from = extractEmailAddress(fromLine)

  return {
    subject,
    body,
    fromName: from.name,
    fromEmail: from.email,
    receivedAt: normalizeDate(dateLine),
    internetMessageId: messageId,
  }
}

class ImapConnection {
  constructor({ host, port, tlsEnabled, timeoutMs = 15000 }) {
    this.host = host
    this.port = port
    this.tlsEnabled = tlsEnabled
    this.timeoutMs = timeoutMs
    this.socket = null
    this.tagCounter = 0
    this.buffer = ''
  }

  async connect() {
    if (this.socket) {
      return
    }

    this.socket = await new Promise((resolve, reject) => {
      const socket = tls.connect({
        host: this.host,
        port: this.port,
        servername: this.host,
        rejectUnauthorized: this.tlsEnabled !== false,
      })

      socket.setEncoding('utf8')
      socket.setTimeout(this.timeoutMs)
      socket.on('data', (chunk) => {
        this.buffer += chunk
      })

      socket.once('secureConnect', () => resolve(socket))
      socket.once('error', reject)
      socket.once('timeout', () => reject(new Error('IMAP connection timed out.')))
    })

    await this.waitForRaw((raw) => /\* OK/i.test(raw))
  }

  nextTag() {
    this.tagCounter += 1
    return `A${`${this.tagCounter}`.padStart(5, '0')}`
  }

  waitForRaw(predicate, timeoutMs = this.timeoutMs) {
    return new Promise((resolve, reject) => {
      const socket = this.socket
      if (predicate(this.buffer)) {
        resolve(this.buffer)
        return
      }

      const cleanup = () => {
        clearTimeout(timer)
        socket.off('data', onData)
        socket.off('error', onError)
        socket.off('close', onClose)
      }

      const onData = () => {
        if (predicate(this.buffer)) {
          cleanup()
          resolve(this.buffer)
        }
      }

      const onError = (error) => {
        cleanup()
        reject(error)
      }

      const onClose = () => {
        cleanup()
        reject(new Error('IMAP connection closed unexpectedly.'))
      }

      const timer = setTimeout(() => {
        cleanup()
        reject(new Error('IMAP command timed out.'))
      }, timeoutMs)

      socket.on('data', onData)
      socket.once('error', onError)
      socket.once('close', onClose)
    })
  }

  async command(statement) {
    const tag = this.nextTag()
    const startIndex = this.buffer.length
    const commandText = `${tag} ${statement}\r\n`
    this.socket.write(commandText)
    const raw = await this.waitForRaw((buffer) =>
      new RegExp(`(?:^|\\r\\n)${tag}\\s+(OK|NO|BAD)`, 'i').test(buffer.slice(startIndex)),
    )
    const segment = raw.slice(startIndex)
    const completion = segment.match(new RegExp(`(?:^|\\r\\n)${tag}\\s+(OK|NO|BAD)(?:\\s+([\\s\\S]*?))?(?:\\r\\n|$)`, 'i'))
    const status = completion?.[1]?.toUpperCase() || 'BAD'
    const detail = completion?.[2] || ''

    if (status !== 'OK') {
      const safeStatement = /^LOGIN\s+/i.test(statement) ? 'LOGIN <redacted>' : statement
      throw new Error(`IMAP command failed (${safeStatement}): ${detail || status}`)
    }

    return segment
  }

  async close() {
    if (!this.socket) {
      return
    }

    try {
      await this.command('LOGOUT')
    } catch {
      // Ignore logout failures during teardown.
    }

    this.socket.end()
    this.socket.destroy()
    this.socket = null
  }
}

export function getImapRuntime() {
  const runtime = getRuntimeConfig()
  const provider = runtime.emailProvider
  const mailboxAddress = process.env.TITAN_MAILBOX_ADDRESS || process.env.EMAIL_INBOX_ADDRESS || 'office@gdsff.org'

  return {
    provider,
    configured: runtime.titanConfigured,
    host: runtime.imapHost,
    port: runtime.imapPort,
    tls: runtime.imapTls,
    usernameConfigured: runtime.imapUsernameConfigured,
    passwordConfigured: runtime.imapPasswordConfigured,
    mailboxAddress,
  }
}

export async function fetchImapInboxMessages({ provider = 'titan', limit = 25 } = {}) {
  const runtime = getRuntimeConfig()
  const normalizedProvider = `${provider || runtime.emailProvider || 'titan'}`.toLowerCase()
  const host = runtime.imapHost
  const port = runtime.imapPort
  const tlsEnabled = runtime.imapTls
  const username =
    process.env.TITAN_IMAP_USERNAME ||
    process.env.EMAIL_IMAP_USERNAME ||
    process.env.TITAN_MAILBOX_ADDRESS ||
    process.env.EMAIL_INBOX_ADDRESS ||
    'office@gdsff.org'
  const password = process.env.TITAN_IMAP_PASSWORD || process.env.EMAIL_IMAP_PASSWORD || ''
  const mailboxAddress = process.env.TITAN_MAILBOX_ADDRESS || process.env.EMAIL_INBOX_ADDRESS || 'office@gdsff.org'
  const safeLimit = Math.max(1, Math.min(Number(limit) || 25, 100))

  if (!runtime.titanConfigured || !hasValue(username) || !hasValue(password)) {
    throw new Error(
      'Titan/IMAP inbox sync is not configured. Required env vars: EMAIL_PROVIDER=titan (or imap), EMAIL_IMAP_HOST, EMAIL_IMAP_USERNAME, EMAIL_IMAP_PASSWORD, and EMAIL_INBOX_ADDRESS.',
    )
  }

  const connection = new ImapConnection({
    host,
    port,
    tlsEnabled,
  })

  try {
    await connection.connect()
    await connection.command(`LOGIN ${quoteImap(username)} ${quoteImap(password)}`)
    await connection.command('SELECT INBOX')

    const searchRaw = await connection.command('SEARCH ALL')
    const ids = parseSearchIds(searchRaw)
    const selectedIds = ids.slice(Math.max(0, ids.length - safeLimit)).reverse()
    const messages = []

    for (const id of selectedIds) {
      const raw = await connection.command(
        `FETCH ${id} (BODY.PEEK[HEADER.FIELDS (SUBJECT FROM DATE MESSAGE-ID)] BODY.PEEK[TEXT]<0.5000>)`,
      )
      const parsed = parseFetchPayload(raw)
      messages.push({
        subject: parsed.subject,
        body: parsed.body,
        fromName: parsed.fromName,
        fromEmail: parsed.fromEmail,
        receivedAt: parsed.receivedAt,
        external: {
          provider: normalizedProvider,
          providerMessageId: `${id}`,
          internetMessageId: parsed.internetMessageId || '',
          threadId: '',
          webLink: '',
        },
        source: normalizedProvider,
      })
    }

    return {
      provider: normalizedProvider,
      mailboxAddress,
      syncedAt: new Date().toISOString(),
      fetchedCount: messages.length,
      messages,
      nextPageUrl: '',
    }
  } finally {
    await connection.close()
  }
}
