import {
  buildSupportInquiryFailureMessage,
  buildSupportInquiryNotificationRecord,
  createSupportInquiryRecord,
  sendSupportInquiryNotification,
  supportInquiryNotificationWasDelivered,
} from '../../server/lib/supportInquiry.js'

export async function submitSupportInquiry(payload) {
  const inquiry = createSupportInquiryRecord(payload)
  const notification = await sendSupportInquiryNotification(inquiry)
  const notificationRecord = buildSupportInquiryNotificationRecord(notification)

  return {
    inquiry,
    notification: notificationRecord,
    delivered: supportInquiryNotificationWasDelivered(notificationRecord),
    failureMessage: buildSupportInquiryFailureMessage(inquiry, notificationRecord),
  }
}
