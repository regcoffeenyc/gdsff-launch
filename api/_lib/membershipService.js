import { randomUUID } from 'node:crypto'
import {
  buildMembershipReference,
  buildMembershipSummaryFromApplications,
  membershipStatusCatalog,
  sanitizeMembershipApplicationInput,
} from '../../server/lib/membershipApplication.js'
import { buildMembershipNotificationRecord, sendMembershipNotification } from '../../server/lib/membershipNotification.js'
import { readMembershipApplications, updateMembershipApplications } from './membershipStore.js'

export async function getMembershipSummaryPayload() {
  const applications = await readMembershipApplications()
  return {
    applications,
    summary: buildMembershipSummaryFromApplications(applications),
  }
}

export async function createMembershipApplication(payload) {
  const sanitized = sanitizeMembershipApplicationInput(payload)
  const now = new Date().toISOString()
  const baseRecipients = process.env.EMAIL_MEMBERSHIP_NOTIFICATION_ADDRESS || process.env.MEMBERSHIP_NOTIFICATION_ADDRESS || 'office@gdsff.org'
  const savedApplication = {
    id: randomUUID(),
    reference: buildMembershipReference(),
    locale: sanitized.locale,
    source: sanitized.source,
    status: 'submitted',
    submittedAt: now,
    updatedAt: now,
    applicant: sanitized.applicant,
    confirmations: sanitized.confirmations,
    reviewNote: '',
    notification: {
      status: 'pending',
      recipients: `${baseRecipients}`.split(/[\n,]/).map((item) => item.trim()).filter(Boolean),
      recipientLabel: `${baseRecipients}`.trim(),
      sentAt: '',
      updatedAt: now,
      message: 'Membership application saved. Waiting for email delivery.',
    },
    history: [
      {
        id: randomUUID(),
        type: 'submitted',
        summary: 'Membership application submitted through the website registration form.',
        createdAt: now,
      },
    ],
  }

  let applications = await updateMembershipApplications((current) => [savedApplication, ...current])

  const notification = await sendMembershipNotification(savedApplication)
  const notificationRecord = buildMembershipNotificationRecord(notification)

  applications = await updateMembershipApplications((current) =>
    current.map((item) => {
      if (item.id !== savedApplication.id) {
        return item
      }

      return {
        ...item,
        notification: notificationRecord,
        updatedAt: notificationRecord.updatedAt,
        history: [
          {
            id: randomUUID(),
            type: notification.status === 'sent' ? 'notification-sent' : 'notification-warning',
            summary:
              notification.status === 'sent'
                ? `Application notification emailed to ${notificationRecord.recipientLabel}.`
                : `Application stored, but email delivery was not confirmed. ${notificationRecord.message}`,
            createdAt: notificationRecord.updatedAt,
          },
          ...(Array.isArray(item.history) ? item.history : []),
        ].slice(0, 12),
      }
    }),
  )

  const application = applications.find((item) => item.id === savedApplication.id) || savedApplication
  return {
    application,
    notification: notificationRecord,
    summary: buildMembershipSummaryFromApplications(applications),
  }
}

export async function listMembershipApplications() {
  const applications = await readMembershipApplications()
  const sortedApplications = [...applications].sort(
    (left, right) => new Date(right.submittedAt || 0).getTime() - new Date(left.submittedAt || 0).getTime(),
  )

  return {
    applications: sortedApplications,
    summary: buildMembershipSummaryFromApplications(sortedApplications),
  }
}

export async function updateMembershipApplicationStatus({ id, status, reviewNote = '' }) {
  if (!id) {
    throw new Error('Application id is required.')
  }

  if (!membershipStatusCatalog.has(status)) {
    throw new Error('Membership status is not valid.')
  }

  const applications = await updateMembershipApplications((current) =>
    current.map((item) => {
      if (item.id !== id) {
        return item
      }

      const updatedAt = new Date().toISOString()
      return {
        ...item,
        status,
        reviewNote: `${reviewNote ?? ''}`.trim(),
        updatedAt,
        history: [
          {
            id: randomUUID(),
            type: 'status-update',
            summary: `Membership application moved to ${status}.`,
            createdAt: updatedAt,
          },
          ...(Array.isArray(item.history) ? item.history : []),
        ].slice(0, 12),
      }
    }),
  )

  const application = applications.find((item) => item.id === id)
  if (!application) {
    throw new Error('Membership application was not found.')
  }

  return {
    application,
    summary: buildMembershipSummaryFromApplications(applications),
  }
}
