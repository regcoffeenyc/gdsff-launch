import { humanizeMembershipValue } from './membershipApplication.js'
import { buildMembershipApplicationPdfAttachment } from './membershipApplicationPdf.js'
import { getRuntimeConfig } from './platformRegistry.js'
import { getSmtpConfigurationIssue, getSmtpRuntime, sendSmtpMail } from './smtpEmail.js'

function toArray(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

export function buildMembershipNotificationRecipients() {
  const runtime = getRuntimeConfig()
  const configuredRecipients =
    process.env.EMAIL_MEMBERSHIP_NOTIFICATION_ADDRESS ||
    process.env.MEMBERSHIP_NOTIFICATION_ADDRESS ||
    runtime.membershipNotificationAddress ||
    'metreveligod@gmail.com'

  return unique(toArray(configuredRecipients))
}

export function buildMembershipNotificationSubject(application) {
  return `GDSFF Membership Application ${application.reference}`
}

export function buildMembershipNotificationText(application) {
  const applicant = application.applicant || {}
  const lines = [
    'Georgian Dynamic Shooting & Functional Fitness Federation',
    'A new membership application was submitted through the GDSFF website.',
    '',
    `Applicant: ${applicant.fullName || '-'}`,
    `Membership Type: ${humanizeMembershipValue(applicant.membershipType) || '-'}`,
    `Sport Interest: ${humanizeMembershipValue(applicant.sportInterest) || '-'}`,
    `Reference: ${application.reference || '-'}`,
    `Submitted At: ${application.submittedAt || '-'}`,
    '',
    'The full submitted application is attached as a PDF document.',
  ]

  return lines.join('\n')
}

export async function buildMembershipNotificationAttachments(application) {
  return [await buildMembershipApplicationPdfAttachment(application)]
}

export function buildMembershipNotificationRecord(notification) {
  const recipients = Array.isArray(notification.recipients) ? notification.recipients : []

  return {
    status: notification.status,
    recipients,
    recipientLabel: recipients.join(', '),
    sentAt: notification.sentAt || '',
    updatedAt: notification.updatedAt,
    message: notification.message || '',
  }
}

export function membershipNotificationWasDelivered(notification) {
  return notification?.status === 'sent'
}

export function buildMembershipNotificationFailureMessage(application, notification) {
  const reference = application?.reference ? `Reference ${application.reference}. ` : ''
  const baseMessage =
    notification?.status === 'not-configured'
      ? 'The application was stored, but email delivery is not configured on the server.'
      : 'The application was stored, but email delivery failed.'
  const detail = notification?.message ? ` ${notification.message}` : ''

  return `${baseMessage} ${reference}Please do not submit the form again. Contact the federation and mention this reference if needed.${detail}`.trim()
}

function logMembershipNotificationIssue(level, application, notification) {
  const runtime = getSmtpRuntime()
  const logger = level === 'warn' ? console.warn : console.error

  logger('[membership-email] delivery issue', {
    reference: application?.reference || '',
    status: notification?.status || '',
    recipients: notification?.recipients || [],
    message: notification?.message || '',
    smtp: runtime,
  })
}

export async function sendMembershipNotification(application) {
  const runtime = getRuntimeConfig()
  const recipients = buildMembershipNotificationRecipients()

  if (!recipients.length) {
    const notification = {
      status: 'not-configured',
      recipients: [],
      updatedAt: new Date().toISOString(),
      message: 'No membership notification recipient is configured for outgoing email.',
    }

    logMembershipNotificationIssue('error', application, notification)
    return notification
  }

  if (!runtime.smtpConfigured) {
    const notification = {
      status: 'not-configured',
      recipients,
      updatedAt: new Date().toISOString(),
      message: getSmtpConfigurationIssue(),
    }

    logMembershipNotificationIssue('error', application, notification)
    return notification
  }

  try {
    const attachments = await buildMembershipNotificationAttachments(application)

    await sendSmtpMail({
      to: recipients,
      replyTo: application.applicant?.email || '',
      subject: buildMembershipNotificationSubject(application),
      text: buildMembershipNotificationText(application),
      attachments,
      headers: {
        'X-GDSFF-Application-Reference': application.reference,
      },
    })

    return {
      status: 'sent',
      recipients,
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      message: `Delivered to ${recipients.join(', ')} with PDF attachment ${attachments.map((item) => item.filename).join(', ')}.`,
    }
  } catch (error) {
    const notification = {
      status: 'failed',
      recipients,
      updatedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? error.message
          : 'Outgoing membership email could not be delivered from the server.',
    }

    logMembershipNotificationIssue('error', application, notification)
    return notification
  }
}
