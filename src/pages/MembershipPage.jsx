import { useEffect, useMemo, useRef, useState } from 'react'
import PageHero from '../components/PageHero'
import SafetyCheckboxSection from '../components/SafetyCheckboxSection'
import SafetyField from '../components/SafetyField'
import { EmailLink } from '../components/SiteMetaLinks'
import { membershipApplicationContent } from '../content/membershipApplicationContent'
import { officialLaunchContent } from '../content/officialLaunchContent'
import { logoSrc } from '../siteAssets'
import {
  formatMembershipApplicationSummary,
  submitMembershipApplication,
} from '../utils/membershipApplicationSubmit'
import { getMembershipSummary } from '../utils/socialHubApi'

function buildEmptyApplicationState(fields) {
  return fields.reduce((accumulator, field) => {
    accumulator[field.name] = ''
    return accumulator
  }, {})
}

function buildConsentState(items) {
  return items.map(() => false)
}

function normalizeValues(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
  )
}

function groupFields(view) {
  return view.groups.map((group) => ({
    ...group,
    items: group.fields.map((fieldName) => view.fields.find((field) => field.name === fieldName)).filter(Boolean),
  }))
}

function buildEmptySummary() {
  return {
    totalApplications: 0,
    statusCounts: {
      submitted: 0,
      'under-review': 0,
      approved: 0,
      'needs-info': 0,
      closed: 0,
    },
    lastSubmittedAt: '',
  }
}

function formatDateLabel(value, locale) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function buildMembershipFeedback(result, view, localeKey) {
  const notification = result.notification || result.application?.notification || {}
  const referenceText = `${view.referenceLabel}: ${result.reference}.`

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

  const warningTitle =
    localeKey === 'ka' ? 'განაცხადი შენახულია, მაგრამ იმეილი ვერ დადასტურდა' : 'Application Stored, Email Not Confirmed'
  const warningText =
    localeKey === 'ka'
      ? `განაცხადი შენახულია და მინიჭებულია ცოცხალი ნომერი. ${referenceText} თუმცა ფედერაციის სარეგისტრაციო დამუშავების არხზე ელფოსტით გაგზავნა ვერ დადასტურდა.`
      : `The application was stored and assigned a live reference. ${referenceText} However, email delivery through the federation registration processing channel could not be confirmed.`
  const fallbackHint =
    localeKey === 'ka'
      ? 'ჩანაწერი დაცულია წევრობის რეესტრში, ხოლო საჭიროების შემთხვევაში ჩამოსატვირთი ფორმაც ისევ ხელმისაწვდომია.'
      : 'The application record is safe in the membership register, and the downloadable membership form remains available if needed.'

  return {
    type: 'warning',
    title: warningTitle,
    text: `${warningText} ${fallbackHint}`,
  }
}

function buildMembershipErrorFeedback(error, view, localeKey) {
  const details = error && typeof error === 'object' ? error.details : null
  const application = details?.application || null

  if (!application) {
    return {
      type: 'error',
      title: view.submitErrorTitle,
      text: view.submitErrorText,
    }
  }

  const referenceText = application.reference ? `${view.referenceLabel}: ${application.reference}.` : ''
  const storedHint =
    localeKey === 'ka'
      ? 'განაცხადი უკვე შენახულია სისტემაში, ამიტომ თავიდან ნუ გააგზავნით. დაუკავშირდით ფედერაციას და მიუთითეთ ეს ნომერი.'
      : 'The application is already stored in the system, so please do not submit it again. Contact the federation and mention this reference.'

  return {
    type: 'error',
    title: localeKey === 'ka' ? 'განაცხადი შენახულია, მაგრამ იმეილი ვერ გაიგზავნა' : 'Application Stored, Email Delivery Failed',
    text: `${referenceText} ${storedHint}`.trim(),
  }
}

function buildNotificationLabel(notification, localeKey) {
  if (!notification) {
    return ''
  }

  if (notification.status === 'sent') {
    return localeKey === 'ka'
      ? 'ელფოსტა წარმატებით გაიგზავნა.'
      : 'Email delivered successfully.'
  }

  if (notification.status === 'not-configured') {
    return localeKey === 'ka' ? 'ელფოსტა ჯერ არ არის დაკონფიგურირებული სერვერზე.' : 'Email delivery is not configured on the server yet.'
  }

  return localeKey === 'ka'
    ? 'ჩანაწერი შენახულია, მაგრამ ელფოსტის გაგზავნა ვერ დადასტურდა.'
    : 'The application is stored, but email delivery could not be confirmed.'
}

export default function MembershipPage({ copy, language = 'en', setLanguage }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const launchView = officialLaunchContent[localeKey].membership
  const view = membershipApplicationContent[localeKey]
  const groupedFields = useMemo(() => groupFields(view), [view])
  const formRef = useRef(null)
  const [values, setValues] = useState(() => buildEmptyApplicationState(view.fields))
  const [consents, setConsents] = useState(() => buildConsentState(view.consentItems))
  const [feedback, setFeedback] = useState(null)
  const [submissionRecord, setSubmissionRecord] = useState(null)
  const [summary, setSummary] = useState(() => buildEmptySummary())
  const [summaryState, setSummaryState] = useState({ loading: true, error: false })
  const [isBusy, setIsBusy] = useState(false)

  const busyLabel = localeKey === 'ka' ? 'იგზავნება...' : 'Submitting...'
  const languageTitle = localeKey === 'ka' ? 'ფორმის ენა' : 'Form Language'
  const languageText =
    localeKey === 'ka'
      ? 'აირჩიეთ ქართული ან ინგლისური ვერსია პირდაპირ ამავე გვერდზე.'
      : 'Switch between Georgian and English directly on this page.'

  const summaryText = useMemo(() => {
    if (!submissionRecord) {
      return ''
    }

    return formatMembershipApplicationSummary(submissionRecord, view, localeKey)
  }, [localeKey, submissionRecord, view])

  const statusMetrics = Object.entries(view.statusLabels).map(([key, label]) => ({
    key,
    label,
    value: summary.statusCounts?.[key] ?? 0,
  }))

  useEffect(() => {
    let cancelled = false

    async function loadSummary() {
      try {
        const result = await getMembershipSummary()
        if (cancelled) {
          return
        }

        setSummary({
          ...buildEmptySummary(),
          ...(result.summary || {}),
        })
        setSummaryState({ loading: false, error: false })
      } catch {
        if (cancelled) {
          return
        }

        setSummaryState({ loading: false, error: true })
      }
    }

    setSummaryState({ loading: true, error: false })
    loadSummary()

    return () => {
      cancelled = true
    }
  }, [])

  function handleChange(name, value) {
    setValues((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleConsentToggle(_sectionKey, index) {
    setConsents((current) => current.map((item, itemIndex) => (itemIndex === index ? !item : item)))
  }

  function validateForm() {
    const nativeValid = formRef.current?.reportValidity() ?? true
    const consentValid = consents.every(Boolean)

    if (!nativeValid || !consentValid) {
      setFeedback({
        type: 'error',
        title: view.validationTitle,
        text: view.validationText,
      })
      return false
    }

    setFeedback(null)
    return true
  }

  function handleReset() {
    setValues(buildEmptyApplicationState(view.fields))
    setConsents(buildConsentState(view.consentItems))
    setFeedback(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsBusy(true)

    try {
      const result = await submitMembershipApplication({
        values: normalizeValues(values),
        consents,
        view,
        localeKey,
      })

      setSubmissionRecord(result.application)
      setSummary({
        ...buildEmptySummary(),
        ...(result.summary || {}),
      })
      setSummaryState({ loading: false, error: false })
      setFeedback(buildMembershipFeedback(result, view, localeKey))
      setValues(buildEmptyApplicationState(view.fields))
      setConsents(buildConsentState(view.consentItems))
    } catch (error) {
      const storedApplication = error?.details?.application || null
      const storedSummary = error?.details?.summary || null

      if (storedApplication) {
        setSubmissionRecord(storedApplication)
        setSummary({
          ...buildEmptySummary(),
          ...(storedSummary || {}),
        })
        setSummaryState({ loading: false, error: false })
        setValues(buildEmptyApplicationState(view.fields))
        setConsents(buildConsentState(view.consentItems))
      }

      setFeedback(buildMembershipErrorFeedback(error, view, localeKey))
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow={launchView.eyebrow}
        title={launchView.title}
        text={launchView.text}
        highlights={view.heroHighlights}
        label={copy.header.highlightsLabel}
      />

      <section id="join-federation" className="container page-section anchor-section">
        {feedback ? (
          <div className={`status-banner is-${feedback.type}`}>
            <strong>{feedback.title}</strong>
            <p>{feedback.text}</p>
          </div>
        ) : null}

        {typeof setLanguage === 'function' ? (
          <article className="feature-card membership-language-card">
            <div className="membership-language-copy">
              <span className="card-kicker">{languageTitle}</span>
              <p>{languageText}</p>
            </div>

            <div className="language-toggle membership-page-toggle" aria-label={copy.header.languageLabel}>
              <button
                type="button"
                className={language === 'en' ? 'language-button active' : 'language-button'}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={language === 'ka' ? 'language-button active' : 'language-button'}
                onClick={() => setLanguage('ka')}
              >
                KA
              </button>
            </div>
          </article>
        ) : null}

        <div className="membership-intro-grid membership-intro-grid-wide">
          <article className="feature-card safety-brand-card membership-intro-card">
            <div className="safety-brand-lockup">
              <img src={logoSrc} alt="GDSFF logo" className="safety-brand-logo" />
              <div>
                <span className="card-kicker">{view.introKicker}</span>
                <h2>{view.introTitle}</h2>
                <p>{view.introText}</p>
              </div>
            </div>

            <div className="safety-note-callout membership-submission-note">
              <span className="card-kicker">{view.processKicker}</span>
              <p>{view.processText}</p>
            </div>
          </article>

          <article className="feature-card membership-stats-card">
            <span className="card-kicker">{view.statsKicker}</span>
            <h2>{view.statsTitle}</h2>
            <p>{view.statsText}</p>

            <div className="membership-stat-total">
              <span>{view.totalApplicationsLabel}</span>
              <strong>{String(summary.totalApplications ?? 0).padStart(2, '0')}</strong>
            </div>

            <div className="membership-status-grid">
              {statusMetrics.map((item) => (
                <div key={item.key} className="membership-status-chip">
                  <span>{item.label}</span>
                  <strong>{String(item.value).padStart(2, '0')}</strong>
                </div>
              ))}
            </div>

            <div className="membership-stats-footer">
              <span className="card-kicker">{view.lastSubmittedLabel}</span>
              <p>
                {summaryState.loading
                  ? view.statsLoadingText
                  : summaryState.error
                    ? view.statsOfflineText
                    : formatDateLabel(summary.lastSubmittedAt, copy.locale)}
              </p>
            </div>
          </article>

          <article id="application-form" className="feature-card safety-summary-card membership-support-card anchor-section">
            <span className="card-kicker">{view.supportKicker}</span>
            <h2>{view.supportTitle}</h2>
            <p>{view.supportText}</p>

            <div className="detail-list">
              {view.processSteps.map((item) => (
                <div key={item} className="detail-list-item">
                  <span className="dot" />
                  <p>{item}</p>
                </div>
              ))}
            </div>

            <div className="membership-support-divider" />

            <p className="membership-support-note">{view.supportNote}</p>
            <div className="membership-support-actions">
              <a href={launchView.applicationHref} className="download-action" download>
                {launchView.actionLabel}
              </a>
              <EmailLink email={copy.meta.email} className="contact-directory-link" />
            </div>
          </article>
        </div>
      </section>

      <section id="online-application" className="container section-space anchor-section">
        <form ref={formRef} className="membership-form-shell" onSubmit={handleSubmit}>
          <div className="feature-card safety-panel membership-form-panel">
            <div className="safety-panel-header membership-form-header">
              <div>
                <span className="card-kicker">{view.formKicker}</span>
                <h2>{view.formTitle}</h2>
                <p>{view.formText}</p>
              </div>

              <div className="membership-destination-chip">
                <span className="card-kicker">{view.onlineOptionLabel}</span>
                <EmailLink email={copy.meta.email} className="contact-directory-link" />
              </div>
            </div>

            <div className="membership-form-groups">
              {groupedFields.map((group) => (
                <section key={group.id} className="membership-field-group">
                  <div className="membership-group-copy">
                    <span className="card-kicker">{group.title}</span>
                    <p>{group.text}</p>
                  </div>

                  <div className="safety-fields-grid membership-fields-grid">
                    {group.items.map((field) => (
                      <SafetyField
                        key={field.name}
                        {...field}
                        value={values[field.name]}
                        onChange={handleChange}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <div className="membership-form-secondary">
            <SafetyCheckboxSection
              title={view.consentTitle}
              text={view.consentText}
              items={view.consentItems}
              values={consents}
              sectionKey="membership-consent"
              onToggle={handleConsentToggle}
            />

            <article className="feature-card membership-summary-card">
              <span className="card-kicker">{view.recordKicker}</span>
              <h3>{view.recordTitle}</h3>
              <p>{view.recordText}</p>

              {submissionRecord ? (
                <>
                  <div className="membership-reference-chip">
                    <span>{view.referenceLabel}</span>
                    <strong>{submissionRecord.reference}</strong>
                  </div>

                  <div className="membership-record-meta">
                    <div className="membership-record-item">
                      <span>{view.storedAtLabel}</span>
                      <strong>{formatDateLabel(submissionRecord.submittedAt, copy.locale)}</strong>
                    </div>
                    <div className="membership-record-item">
                      <span>{view.statusLabels[submissionRecord.status] ?? submissionRecord.status}</span>
                      <strong>{submissionRecord.applicant?.email}</strong>
                    </div>
                  </div>

                  <p className="membership-notification-status">
                    {buildNotificationLabel(submissionRecord.notification, localeKey)}
                  </p>

                  <label className="safety-field">
                    <span className="safety-field-label">{view.summaryLabel}</span>
                    <textarea
                      className="safety-input safety-textarea membership-summary-textarea"
                      value={summaryText}
                      readOnly
                    />
                  </label>
                </>
              ) : (
                <p className="membership-record-empty">{view.recordEmptyText}</p>
              )}

              <div className="membership-review-note">
                <span className="card-kicker">{view.reviewNoteTitle}</span>
                <p>{view.reviewNoteText}</p>
              </div>
            </article>
          </div>

          <div className="feature-card safety-actions-card membership-actions-card">
            <p>{view.supportNote}</p>

            <div className="safety-actions">
              <button type="button" className="ghost-button" onClick={handleReset} disabled={isBusy}>
                {view.resetLabel}
              </button>
              <button type="submit" className="primary-button" disabled={isBusy}>
                {isBusy ? busyLabel : view.submitLabel}
              </button>
            </div>
          </div>
        </form>
      </section>
    </>
  )
}
