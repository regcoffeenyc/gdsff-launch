import { randomUUID } from 'node:crypto'
import { getRuntimeConfig } from './platformRegistry.js'
import { getSmtpConfigurationIssue, sendSmtpMail } from './smtpEmail.js'

const supportTypeCatalog = new Set([
  'corporate-sponsorship',
  'event-sponsorship',
  'equipment-support',
  'infrastructure-support',
  'individual-donation',
  'strategic-partnership',
  'other',
])

const supportTypeLabels = {
  'corporate-sponsorship': {
    en: 'Corporate Sponsorship',
    ka: 'კორპორაციული სპონსორობა',
  },
  'event-sponsorship': {
    en: 'Event Sponsorship',
    ka: 'ღონისძიების სპონსორობა',
  },
  'equipment-support': {
    en: 'Equipment Support',
    ka: 'ინვენტარით მხარდაჭერა',
  },
  'infrastructure-support': {
    en: 'Infrastructure Support',
    ka: 'ინფრასტრუქტურული მხარდაჭერა',
  },
  'individual-donation': {
    en: 'Individual Donation',
    ka: 'ინდივიდუალური დონაცია',
  },
  'strategic-partnership': {
    en: 'Strategic Partnership',
    ka: 'სტრატეგიული პარტნიორობა',
  },
  other: {
    en: 'Other',
    ka: 'სხვა',
  },
}

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeValue(value) {
  return `${value ?? ''}`.trim()
}

function normalizeEmail(value) {
  return normalizeValue(value).toLowerCase()
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

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

function buildSupportReference() {
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `SUP-${dateStamp}-${randomUUID().split('-')[0].toUpperCase()}`
}

export function sanitizeSupportInquiryInput(input) {
  const inquiryInput = input?.inquiry && typeof input.inquiry === 'object' ? input.inquiry : {}
  const inquiry = {
    fullName: normalizeValue(inquiryInput.fullName),
    organization: normalizeValue(inquiryInput.organization),
    email: normalizeEmail(inquiryInput.email),
    phone: normalizeValue(inquiryInput.phone),
    supportType: normalizeValue(inquiryInput.supportType),
    budget: normalizeValue(inquiryInput.budget),
    message: normalizeValue(inquiryInput.message),
  }

  const requiredFields = ['fullName', 'email', 'supportType', 'message']
  const missingField = requiredFields.find((fieldName) => !hasValue(inquiry[fieldName]))

  if (missingField) {
    throw new Error('Please complete all required support inquiry fields before submitting.')
  }

  if (!isValidEmail(inquiry.email)) {
    throw new Error('Please enter a valid email address before submitting.')
  }

  if (!supportTypeCatalog.has(inquiry.supportType)) {
    throw new Error('Support type is not valid.')
  }

  return {
    locale: normalizeValue(input?.locale) === 'ka' ? 'ka' : 'en',
    source: normalizeValue(input?.source) || 'website-support',
    inquiry,
  }
}

export function buildSupportInquiryRecipients() {
  const runtime = getRuntimeConfig()
  const configuredRecipients =
    process.env.EMAIL_SUPPORT_NOTIFICATION_ADDRESS ||
    process.env.SUPPORT_NOTIFICATION_ADDRESS ||
    runtime.emailInboxAddress ||
    'office@gdsff.org'

  return unique(toArray(configuredRecipients))
}

function humanizeSupportType(value, locale) {
  const entry = supportTypeLabels[value]
  if (!entry) {
    return value
  }

  return locale === 'ka' ? entry.ka : entry.en
}

export function buildSupportInquirySubject(inquiry) {
  return `GDSFF Sponsorship & Donation Inquiry ${inquiry.reference}`
}

export function buildSupportInquiryText(inquiry) {
  const supportTypeEn = humanizeSupportType(inquiry.supportType, 'en')
  const supportTypeKa = humanizeSupportType(inquiry.supportType, 'ka')

  return [
    'Georgian Dynamic Shooting & Functional Fitness Federation',
    'New sponsorship / donation inquiry received from the website.',
    '',
    `Reference: ${inquiry.reference}`,
    `Submitted At: ${inquiry.submittedAt}`,
    `Locale: ${inquiry.locale}`,
    `Source: ${inquiry.source}`,
    '',
    'Inquiry Details',
    `Full Name / სახელი და გვარი: ${inquiry.fullName || ''}`,
    `Company / Organization / კომპანია / ორგანიზაცია: ${inquiry.organization || '-'}`,
    `Email / ელფოსტა: ${inquiry.email || ''}`,
    `Phone Number / ტელეფონის ნომერი: ${inquiry.phone || '-'}`,
    `Type of Support / მხარდაჭერის ტიპი: ${supportTypeEn} / ${supportTypeKa}`,
    `Estimated Budget / Contribution / სავარაუდო ბიუჯეტი / შენატანი: ${inquiry.budget || '-'}`,
    `Message / შეტყობინება: ${inquiry.message || '-'}`,
  ].join('\n')
}

export function buildSupportInquiryNotificationRecord(notification) {
  const recipients = Array.isArray(notification.recipients) ? notification.recipients : []

  return {
    status: notification.status || 'failed',
    recipients,
    recipientLabel: recipients.join(', '),
    sentAt: notification.sentAt || '',
    updatedAt: notification.updatedAt || new Date().toISOString(),
    message: notification.message || '',
  }
}

export function supportInquiryNotificationWasDelivered(notification) {
  return notification?.status === 'sent'
}

export function buildSupportInquiryFailureMessage(inquiry, notification) {
  const reference = inquiry?.reference ? `Reference ${inquiry.reference}. ` : ''
  const baseMessage =
    notification?.status === 'not-configured'
      ? 'The inquiry was recorded, but email delivery is not configured on the server.'
      : 'The inquiry was recorded, but email delivery failed.'
  const detail = notification?.message ? ` ${notification.message}` : ''

  return `${baseMessage} ${reference}Please contact the federation and mention this reference if needed.${detail}`.trim()
}

function logSupportInquiryIssue(inquiry, notification) {
  console.error('[support-email] delivery issue', {
    reference: inquiry?.reference || '',
    status: notification?.status || '',
    recipients: notification?.recipients || [],
    message: notification?.message || '',
  })
}

export async function sendSupportInquiryNotification(inquiry) {
  const runtime = getRuntimeConfig()
  const recipients = buildSupportInquiryRecipients()

  if (!recipients.length) {
    const notification = {
      status: 'not-configured',
      recipients: [],
      updatedAt: new Date().toISOString(),
      message: 'No support inquiry recipient is configured for outgoing email.',
    }

    logSupportInquiryIssue(inquiry, notification)
    return notification
  }

  if (!runtime.smtpConfigured) {
    const notification = {
      status: 'not-configured',
      recipients,
      updatedAt: new Date().toISOString(),
      message: getSmtpConfigurationIssue(),
    }

    logSupportInquiryIssue(inquiry, notification)
    return notification
  }

  try {
    await sendSmtpMail({
      to: recipients,
      replyTo: inquiry.email || '',
      subject: buildSupportInquirySubject(inquiry),
      text: buildSupportInquiryText(inquiry),
      headers: {
        'X-GDSFF-Support-Reference': inquiry.reference,
      },
    })

    return {
      status: 'sent',
      recipients,
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      message: `Delivered to ${recipients.join(', ')}.`,
    }
  } catch (error) {
    const notification = {
      status: 'failed',
      recipients,
      updatedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? error.message
          : 'Outgoing support inquiry email could not be delivered from the server.',
    }

    logSupportInquiryIssue(inquiry, notification)
    return notification
  }
}

export function createSupportInquiryRecord(payload) {
  const sanitized = sanitizeSupportInquiryInput(payload)
  const now = new Date().toISOString()

  return {
    id: randomUUID(),
    reference: buildSupportReference(),
    locale: sanitized.locale,
    source: sanitized.source,
    submittedAt: now,
    fullName: sanitized.inquiry.fullName,
    organization: sanitized.inquiry.organization,
    email: sanitized.inquiry.email,
    phone: sanitized.inquiry.phone,
    supportType: sanitized.inquiry.supportType,
    budget: sanitized.inquiry.budget,
    message: sanitized.inquiry.message,
  }
}
