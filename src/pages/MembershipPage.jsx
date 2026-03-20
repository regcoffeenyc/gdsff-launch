import { useMemo, useRef, useState } from 'react'
import PageHero from '../components/PageHero'
import SafetyCheckboxSection from '../components/SafetyCheckboxSection'
import SafetyField from '../components/SafetyField'
import { EmailLink } from '../components/SiteMetaLinks'
import { membershipApplicationContent } from '../content/membershipApplicationContent'
import { officialLaunchContent } from '../content/officialLaunchContent'
import { logoSrc } from '../siteAssets'
import { submitMembershipApplication } from '../utils/membershipApplicationSubmit'

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

export default function MembershipPage({ copy }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const launchView = officialLaunchContent[localeKey].membership
  const view = membershipApplicationContent[localeKey]
  const groupedFields = useMemo(() => groupFields(view), [view])
  const formRef = useRef(null)
  const [values, setValues] = useState(() => buildEmptyApplicationState(view.fields))
  const [consents, setConsents] = useState(() => buildConsentState(view.consentItems))
  const [feedback, setFeedback] = useState(null)
  const [preparedSubmission, setPreparedSubmission] = useState(null)
  const [isBusy, setIsBusy] = useState(false)

  const busyLabel = localeKey === 'ka' ? '\u10db\u10dd\u10db\u10d6\u10d0\u10d3\u10d4\u10d1\u10d0...' : 'Preparing...'
  const referenceLabel = localeKey === 'ka' ? '\u10e0\u10d4\u10e4\u10d4\u10e0\u10d4\u10dc\u10e1\u10d8' : 'Reference'

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
    setPreparedSubmission(null)
    setFeedback(null)
  }

  async function handleCopySummary() {
    if (!preparedSubmission?.summary) {
      return
    }

    try {
      await navigator.clipboard.writeText(preparedSubmission.summary)
      setFeedback({
        type: 'info',
        title: view.copySuccessTitle,
        text: view.copySuccessText,
      })
    } catch {
      setFeedback({
        type: 'error',
        title: view.copyErrorTitle,
        text: view.copyErrorText,
      })
    }
  }

  function handleOpenDraftAgain() {
    if (!preparedSubmission?.mailtoHref) {
      return
    }

    window.location.href = preparedSubmission.mailtoHref
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
        destinationEmail: copy.meta.email,
      })

      setPreparedSubmission(result)
      setFeedback({
        type: 'success',
        title: view.submitSuccessTitle,
        text: `${view.submitSuccessText} ${referenceLabel}: ${result.reference}. ${view.submitSuccessHint}`,
      })

      window.setTimeout(() => {
        window.location.href = result.mailtoHref
      }, 160)
    } catch {
      setFeedback({
        type: 'error',
        title: view.submitErrorTitle,
        text: view.submitErrorText,
      })
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

        <div className="membership-intro-grid">
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
              <span className="card-kicker">{view.summaryKicker}</span>
              <p>{view.submissionNote}</p>
            </div>
          </article>

          <article id="application-form" className="feature-card safety-summary-card membership-support-card anchor-section">
            <span className="card-kicker">{view.processKicker}</span>
            <h2>{view.processTitle}</h2>
            <p>{view.processText}</p>

            <div className="detail-list">
              {view.processSteps.map((item) => (
                <div key={item} className="detail-list-item">
                  <span className="dot" />
                  <p>{item}</p>
                </div>
              ))}
            </div>

            <div className="membership-support-divider" />

            <span className="card-kicker">{view.supportKicker}</span>
            <p>{view.supportText}</p>
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
                <span className="card-kicker">{copy.nav.contact}</span>
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
              <span className="card-kicker">{view.summaryKicker}</span>
              <h3>{view.summaryTitle}</h3>
              <p>{view.summaryText}</p>

              {preparedSubmission ? (
                <div className="membership-reference-chip">
                  <span>{referenceLabel}</span>
                  <strong>{preparedSubmission.reference}</strong>
                </div>
              ) : null}

              <label className="safety-field">
                <span className="safety-field-label">{view.copyLabel}</span>
                <textarea
                  className="safety-input safety-textarea membership-summary-textarea"
                  value={preparedSubmission?.summary ?? ''}
                  readOnly
                  placeholder={view.submissionNote}
                />
              </label>

              <div className="membership-summary-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleCopySummary}
                  disabled={!preparedSubmission?.summary}
                >
                  {view.copyLabel}
                </button>

                <button
                  type="button"
                  className="ghost-button"
                  onClick={handleOpenDraftAgain}
                  disabled={!preparedSubmission?.mailtoHref}
                >
                  {view.reopenLabel}
                </button>
              </div>
            </article>
          </div>

          <div className="feature-card safety-actions-card membership-actions-card">
            <p>{view.submissionNote}</p>

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
