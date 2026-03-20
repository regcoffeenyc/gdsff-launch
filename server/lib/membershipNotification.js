import { getRuntimeConfig } from './platformRegistry.js'
import { humanizeMembershipValue } from './membershipApplication.js'
import { sendSmtpMail } from './smtpEmail.js'

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
    runtime.emailInboxAddress ||
    'office@gdsff.org'

  return unique(toArray(configuredRecipients))
}

export function buildMembershipNotificationSubject(application) {
  return `GDSFF Membership Application ${application.reference}`
}

export function buildMembershipNotificationText(application) {
  const applicant = application.applicant || {}
  const confirmations = Array.isArray(application.confirmations) ? application.confirmations : []
  const details = [
    'Georgian Dynamic Shooting & Functional Fitness Federation',
    'New membership application received from the website.',
    '',
    `Reference: ${application.reference}`,
    `Submitted At: ${application.submittedAt}`,
    `Status: ${application.status}`,
    `Locale: ${application.locale}`,
    `Source: ${application.source}`,
    '',
    'Applicant Details',
    `Full Name / სახელი და გვარი: ${applicant.fullName || ''}`,
    `Date of Birth / დაბადების თარიღი: ${applicant.birthDate || ''}`,
    `Personal ID Number / პირადი ნომერი: ${applicant.personalId || ''}`,
    `Citizenship / მოქალაქეობა: ${applicant.citizenship || ''}`,
    `Address / მისამართი: ${applicant.address || ''}`,
    `Phone Number / ტელეფონის ნომერი: ${applicant.phone || ''}`,
    `Email / ელფოსტა: ${applicant.email || ''}`,
    `Membership Type / წევრობის ტიპი: ${humanizeMembershipValue(applicant.membershipType)}`,
    `Sport Interest / სპორტული მიმართულება: ${humanizeMembershipValue(applicant.sportInterest)}`,
    `Additional Information / დამატებითი ინფორმაცია: ${applicant.additionalInfo || '-'}`,
    '',
    'Required Confirmations / სავალდებულო დადასტურებები',
    ...confirmations.map((item) => `- ${item.accepted ? 'Accepted' : 'Not accepted'}: ${item.label}`),
    '',
    'This application is already stored in the GDSFF online membership register.',
  ]

  return details.join('\n')
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

export async function sendMembershipNotification(application) {
  const runtime = getRuntimeConfig()
  const recipients = buildMembershipNotificationRecipients()

  if (!recipients.length) {
    return {
      status: 'not-configured',
      recipients: [],
      updatedAt: new Date().toISOString(),
      message: 'No membership notification recipient is configured for outgoing email.',
    }
  }

  if (!runtime.smtpConfigured) {
    return {
      status: 'not-configured',
      recipients,
      updatedAt: new Date().toISOString(),
      message:
        'Outgoing membership email is not configured on the server yet. Set SMTP credentials to deliver each application to the federation inbox.',
    }
  }

  try {
    await sendSmtpMail({
      to: recipients,
      replyTo: application.applicant?.email || '',
      subject: buildMembershipNotificationSubject(application),
      text: buildMembershipNotificationText(application),
      headers: {
        'X-GDSFF-Application-Reference': application.reference,
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
    return {
      status: 'failed',
      recipients,
      updatedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? error.message
          : 'Outgoing membership email could not be delivered from the server.',
    }
  }
}
