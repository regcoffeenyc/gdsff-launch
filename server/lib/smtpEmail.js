import net from 'node:net'
import { randomUUID } from 'node:crypto'
import tls from 'node:tls'
import { getRuntimeConfig } from './platformRegistry.js'

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function sanitizeHeaderValue(value) {
  return `${value ?? ''}`.replace(/[\r\n]+/g, ' ').trim()
}

function formatAddress(email, name = '') {
  const safeEmail = sanitizeHeaderValue(email)
  const safeName = sanitizeHeaderValue(name).replace(/"/g, '\\"')

  if (!safeName) {
    return safeEmail
  }

  return `"${safeName}" <${safeEmail}>`
}

function wrapBase64(value, width = 76) {
  const chunks = []

  for (let index = 0; index < value.length; index += width) {
    chunks.push(value.slice(index, index + width))
  }

  return chunks.join('\r\n')
}

function dotStuff(value) {
  return value
    .replace(/\r?\n/g, '\r\n')
    .split('\r\n')
    .map((line) => (line.startsWith('.') ? `.${line}` : line))
    .join('\r\n')
}

function parseSmtpResponse(raw) {
  const matches = [...raw.matchAll(/(?:^|\r\n)(\d{3})([ -])([^\r\n]*)/g)]
  if (!matches.length) {
    return null
  }

  const lastMatch = matches[matches.length - 1]
  if (lastMatch[2] !== ' ') {
    return null
  }

  return {
    code: Number(lastMatch[1]),
    message: matches.map((match) => match[3].trim()).filter(Boolean).join(' '),
  }
}

class SmtpConnection {
  constructor({ host, port, secure, startTls, timeoutMs = 15000, rejectUnauthorized = true }) {
    this.host = host
    this.port = port
    this.secure = secure
    this.startTls = startTls
    this.timeoutMs = timeoutMs
    this.rejectUnauthorized = rejectUnauthorized
    this.socket = null
    this.buffer = ''
    this.handleData = (chunk) => {
      this.buffer += chunk
    }
  }

  bindSocket(socket) {
    socket.setEncoding('utf8')
    socket.setTimeout(this.timeoutMs)
    socket.on('data', this.handleData)
  }

  unbindSocket(socket) {
    if (!socket) {
      return
    }

    socket.off('data', this.handleData)
  }

  async connect() {
    if (this.socket) {
      return
    }

    this.socket = await new Promise((resolve, reject) => {
      const socket = this.secure
        ? tls.connect({
            host: this.host,
            port: this.port,
            servername: this.host,
            rejectUnauthorized: this.rejectUnauthorized,
          })
        : net.connect({
            host: this.host,
            port: this.port,
          })

      this.bindSocket(socket)

      socket.once(this.secure ? 'secureConnect' : 'connect', () => resolve(socket))
      socket.once('error', reject)
      socket.once('timeout', () => reject(new Error('SMTP connection timed out.')))
    })

    await this.waitForResponse([220], 0)
  }

  waitForResponse(expectedCodes, startIndex, timeoutMs = this.timeoutMs) {
    return new Promise((resolve, reject) => {
      const socket = this.socket

      const tryResolve = () => {
        const parsed = parseSmtpResponse(this.buffer.slice(startIndex))
        if (!parsed) {
          return false
        }

        if (!expectedCodes.includes(parsed.code)) {
          reject(new Error(`SMTP command failed: ${parsed.message || `Unexpected response ${parsed.code}.`}`))
          return true
        }

        resolve(parsed)
        return true
      }

      if (tryResolve()) {
        return
      }

      const cleanup = () => {
        clearTimeout(timer)
        socket.off('data', onData)
        socket.off('error', onError)
        socket.off('close', onClose)
      }

      const onData = () => {
        if (tryResolve()) {
          cleanup()
        }
      }

      const onError = (error) => {
        cleanup()
        reject(error)
      }

      const onClose = () => {
        cleanup()
        reject(new Error('SMTP connection closed unexpectedly.'))
      }

      const timer = setTimeout(() => {
        cleanup()
        reject(new Error('SMTP command timed out.'))
      }, timeoutMs)

      socket.on('data', onData)
      socket.once('error', onError)
      socket.once('close', onClose)
    })
  }

  async command(statement, expectedCodes = [250]) {
    const startIndex = this.buffer.length
    this.socket.write(`${statement}\r\n`)
    return this.waitForResponse(expectedCodes, startIndex)
  }

  async upgradeToTls() {
    if (!this.startTls || this.secure) {
      return
    }

    await this.command('STARTTLS', [220])
    const previousSocket = this.socket
    this.unbindSocket(previousSocket)

    this.socket = await new Promise((resolve, reject) => {
      const secureSocket = tls.connect(
        {
          socket: previousSocket,
          servername: this.host,
          rejectUnauthorized: this.rejectUnauthorized,
        },
        () => resolve(secureSocket),
      )

      this.bindSocket(secureSocket)
      secureSocket.once('error', reject)
      secureSocket.once('timeout', () => reject(new Error('SMTP TLS upgrade timed out.')))
    })

    this.secure = true
  }

  async close() {
    if (!this.socket) {
      return
    }

    try {
      if (!this.socket.destroyed) {
        await this.command('QUIT', [221])
      }
    } catch {
      // Ignore quit failures during teardown.
    }

    this.unbindSocket(this.socket)
    this.socket.end()
    this.socket.destroy()
    this.socket = null
  }
}

function buildMessage({ fromName, fromEmail, to, replyTo, subject, text, headers = {} }) {
  const recipientList = toArray(to)
  const body = wrapBase64(Buffer.from(`${text || ''}`.replace(/\r?\n/g, '\r\n'), 'utf8').toString('base64'))
  const lines = [
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${randomUUID()}@gdsff.org>`,
    `From: ${formatAddress(fromEmail, fromName)}`,
    `To: ${recipientList.map((recipient) => formatAddress(recipient)).join(', ')}`,
    `Subject: ${sanitizeHeaderValue(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
  ]

  if (hasValue(replyTo)) {
    lines.push(`Reply-To: ${formatAddress(replyTo)}`)
  }

  for (const [key, value] of Object.entries(headers)) {
    if (hasValue(value)) {
      lines.push(`${sanitizeHeaderValue(key)}: ${sanitizeHeaderValue(value)}`)
    }
  }

  lines.push('', body)
  return dotStuff(lines.join('\r\n'))
}

export function getSmtpRuntime() {
  const runtime = getRuntimeConfig()

  return {
    provider: runtime.emailProvider,
    configured: runtime.smtpConfigured,
    host: runtime.smtpHost,
    port: runtime.smtpPort,
    secure: runtime.smtpSecure,
    startTls: runtime.smtpStartTls,
    usernameConfigured: runtime.smtpUsernameConfigured,
    passwordConfigured: runtime.smtpPasswordConfigured,
    senderAddress: runtime.emailOutboundAddress,
    membershipNotificationAddress: runtime.membershipNotificationAddress,
  }
}

export async function sendSmtpMail({
  to,
  subject,
  text,
  replyTo = '',
  senderName = 'GDSFF Website',
  headers = {},
}) {
  const runtime = getRuntimeConfig()
  const recipients = toArray(to)
  const username =
    process.env.TITAN_SMTP_USERNAME ||
    process.env.EMAIL_SMTP_USERNAME ||
    process.env.TITAN_IMAP_USERNAME ||
    process.env.EMAIL_IMAP_USERNAME ||
    process.env.TITAN_MAILBOX_ADDRESS ||
    process.env.EMAIL_INBOX_ADDRESS ||
    ''
  const password =
    process.env.TITAN_SMTP_PASSWORD ||
    process.env.EMAIL_SMTP_PASSWORD ||
    process.env.TITAN_IMAP_PASSWORD ||
    process.env.EMAIL_IMAP_PASSWORD ||
    ''

  if (!runtime.smtpConfigured || !hasValue(username) || !hasValue(password)) {
    throw new Error(
      'Outgoing email is not configured. Set EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_USERNAME, EMAIL_SMTP_PASSWORD, or provide Titan SMTP/IMAP credentials.',
    )
  }

  if (!recipients.length) {
    throw new Error('At least one email recipient is required.')
  }

  const connection = new SmtpConnection({
    host: runtime.smtpHost,
    port: runtime.smtpPort,
    secure: runtime.smtpSecure,
    startTls: runtime.smtpStartTls,
    rejectUnauthorized: runtime.smtpTlsRejectUnauthorized,
  })

  const senderAddress = runtime.emailOutboundAddress || runtime.emailInboxAddress || username

  try {
    await connection.connect()
    await connection.command(`EHLO gdsff.org`, [250])

    if (runtime.smtpStartTls && !runtime.smtpSecure) {
      await connection.upgradeToTls()
      await connection.command(`EHLO gdsff.org`, [250])
    }

    await connection.command('AUTH LOGIN', [334])
    await connection.command(Buffer.from(username, 'utf8').toString('base64'), [334])
    await connection.command(Buffer.from(password, 'utf8').toString('base64'), [235])
    await connection.command(`MAIL FROM:<${sanitizeHeaderValue(senderAddress)}>`, [250])

    for (const recipient of recipients) {
      await connection.command(`RCPT TO:<${sanitizeHeaderValue(recipient)}>`, [250, 251])
    }

    await connection.command('DATA', [354])
    const payload = buildMessage({
      fromName: senderName,
      fromEmail: senderAddress,
      to: recipients,
      replyTo,
      subject,
      text,
      headers,
    })
    const startIndex = connection.buffer.length
    connection.socket.write(`${payload}\r\n.\r\n`)
    await connection.waitForResponse([250], startIndex)

    return {
      ok: true,
      recipients,
      senderAddress,
    }
  } finally {
    await connection.close()
  }
}
