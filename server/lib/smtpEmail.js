import nodemailer from 'nodemailer'
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

function createTransporter(runtime, username, password) {
  return nodemailer.createTransport({
    host: runtime.smtpHost,
    port: runtime.smtpPort,
    secure: runtime.smtpSecure,
    requireTLS: runtime.smtpStartTls && !runtime.smtpSecure,
    auth: {
      user: username,
      pass: password,
    },
    name: 'gdsff.org',
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    tls: {
      servername: runtime.smtpHost,
      rejectUnauthorized: runtime.smtpTlsRejectUnauthorized,
    },
  })
}

function normalizeErrorMessage(error) {
  if (!error || typeof error !== 'object') {
    return 'Outgoing membership email could not be delivered from the server.'
  }

  const code = typeof error.code === 'string' ? error.code : ''
  const responseCode =
    typeof error.responseCode === 'number' && Number.isFinite(error.responseCode)
      ? `SMTP ${error.responseCode}`
      : ''
  const command = typeof error.command === 'string' ? error.command : ''
  const message = error instanceof Error ? error.message : ''

  return [responseCode, code, command, message].filter(Boolean).join(' | ') || 'Outgoing membership email could not be delivered from the server.'
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

  const senderAddress = runtime.emailOutboundAddress || runtime.emailInboxAddress || username
  const transporter = createTransporter(runtime, username, password)

  try {
    const result = await transporter.sendMail({
      from: hasValue(senderName) ? `"${senderName.replace(/"/g, '\\"')}" <${senderAddress}>` : senderAddress,
      to: recipients,
      replyTo: hasValue(replyTo) ? replyTo : undefined,
      subject,
      text,
      headers,
    })

    return {
      ok: true,
      recipients,
      senderAddress,
      messageId: result.messageId || '',
      accepted: Array.isArray(result.accepted) ? result.accepted : [],
      rejected: Array.isArray(result.rejected) ? result.rejected : [],
      response: typeof result.response === 'string' ? result.response : '',
    }
  } catch (error) {
    throw new Error(normalizeErrorMessage(error))
  }
}
