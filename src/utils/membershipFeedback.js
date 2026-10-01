// Only recognized outcomes select public copy. Server messages may contain
// internal details and are not suitable for display in either language.
const validationMessages = new Map([
  ['Please complete all required membership fields before submitting.', {
    en: 'Please complete all required fields before submitting.',
    ka: 'გთხოვთ, გაგზავნამდე შეავსოთ ყველა სავალდებულო ველი.',
  }],
  ['Please enter a valid email address before submitting.', {
    en: 'Please check your email address and try again.',
    ka: 'გთხოვთ, შეამოწმოთ ელფოსტის მისამართი და სცადოთ ხელახლა.',
  }],
  ['Membership type is not valid.', {
    en: 'Please choose a membership type from the list.',
    ka: 'გთხოვთ, სიიდან აირჩიოთ წევრობის ტიპი.',
  }],
  ['Sport interest is not valid.', {
    en: 'Please choose a sport from the list.',
    ka: 'გთხოვთ, სიიდან აირჩიოთ სპორტის სახეობა.',
  }],
  ['All required confirmations must be accepted before submitting.', {
    en: 'Please accept all required confirmations before submitting.',
    ka: 'გთხოვთ, გაგზავნამდე დაადასტუროთ ყველა სავალდებულო პუნქტი.',
  }],
])

function formatReference(reference, view) {
  return reference ? `${view.referenceLabel}: ${reference}.` : ''
}

function storedHint(localeKey) {
  return localeKey === 'ka'
    ? 'განაცხადი უკვე შენახულია სისტემაში, ამიტომ თავიდან ნუ გააგზავნით. დაუკავშირდით ფედერაციას და მიუთითეთ განაცხადის ნომერი.'
    : 'Your application is already stored, so please do not submit it again. Contact the federation and mention your application reference.'
}

export function buildMembershipFeedback(result, view, localeKey) {
  const notification = result.notification || result.application?.notification || {}
  const referenceText = formatReference(result.reference || result.application?.reference, view)

  if (notification.status === 'sent') {
    return {
      type: 'success',
      title: view.submitSuccessTitle,
      text:
        localeKey === 'ka'
          ? `${view.submitSuccessText} ${referenceText} განაცხადი წარმატებით გადაიგზავნა ფედერაციის სარეგისტრაციო დამუშავების არხზე. ${view.submitSuccessHint}`
          : `${view.submitSuccessText} ${referenceText} The completed application was also delivered through the federation registration processing channel. ${view.submitSuccessHint}`,
    }
  }

  return {
    type: 'warning',
    title: localeKey === 'ka'
      ? 'განაცხადი შენახულია, მაგრამ ელფოსტის გაგზავნა ვერ დადასტურდა'
      : 'Application Stored, Email Not Confirmed',
    text: `${referenceText} ${buildNotificationLabel(notification, localeKey)} ${storedHint(localeKey)}`.trim(),
  }
}

export function buildMembershipErrorFeedback(error, view, localeKey) {
  const application = error?.details?.application || null

  // A delivery failure can arrive as an HTTP error after successful storage.
  // Keep the reference and no-resubmission guidance ahead of generic failures.
  if (application) {
    const referenceText = formatReference(application.reference, view)
    return {
      type: 'error',
      title: localeKey === 'ka'
        ? 'განაცხადი შენახულია, მაგრამ ელფოსტა ვერ გაიგზავნა'
        : 'Application Stored, Email Delivery Failed',
      text: `${referenceText} ${storedHint(localeKey)}`.trim(),
    }
  }

  const validation = validationMessages.get(error?.message)
  if (validation || error?.statusCode === 400 || error?.statusCode === 422) {
    return {
      type: 'error',
      title: view.validationTitle,
      text: validation?.[localeKey === 'ka' ? 'ka' : 'en'] || view.validationText,
    }
  }

  return {
    type: 'error',
    title: view.submitErrorTitle,
    text: view.submitErrorText,
  }
}

export function buildNotificationLabel(notification, localeKey) {
  if (!notification) {
    return ''
  }

  const isGeorgian = localeKey === 'ka'
  if (notification.status === 'sent') {
    return isGeorgian ? 'ელფოსტა წარმატებით გაიგზავნა.' : 'Email delivered successfully.'
  }

  if (notification.status === 'not-configured') {
    return isGeorgian
      ? 'ელფოსტის გაგზავნა დროებით მიუწვდომელია. თქვენი განაცხადი შენახულია.'
      : 'Email delivery is temporarily unavailable. Your application is stored.'
  }

  if (notification.status === 'failed') {
    return isGeorgian
      ? 'თქვენი განაცხადი შენახულია, მაგრამ ელფოსტით შეტყობინება ვერ გაიგზავნა.'
      : 'Your application is stored, but the email notification could not be sent.'
  }

  return isGeorgian
    ? 'თქვენი განაცხადი შენახულია, მაგრამ ელფოსტის გაგზავნა ვერ დადასტურდა.'
    : 'Your application is stored, but email delivery could not be confirmed.'
}
