import { useMemo, useRef, useState } from 'react'
import PageHero from '../components/PageHero'
import SafetyCheckboxSection from '../components/SafetyCheckboxSection'
import SafetyField from '../components/SafetyField'
import SignaturePadField from '../components/SignaturePadField'
import { safetyConsentContent } from '../content/safetyConsentContent'
import { logoSrc } from '../siteAssets'
import { createSafetyConsentPayload, submitSafetyConsentForm } from '../utils/safetyConsentSubmit'

function buildEmptyParticipantState(fields) {
  return fields.reduce((accumulator, field) => {
    accumulator[field.name] = ''
    return accumulator
  }, {})
}

function buildChecks(items) {
  return items.map(() => false)
}

function mapChecks(items, values) {
  return items.map((label, index) => ({
    label,
    accepted: Boolean(values[index]),
  }))
}

function selectAccepted(items, values) {
  return items.filter((_, index) => values[index])
}

export default function SafetyConsentPage({ copy }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const view = safetyConsentContent[localeKey]
  const safetyFileHref = `${import.meta.env.BASE_URL}downloads/07_GDSFF_Safety_Rules_And_Informed_Consent.html`
  const safetyFileLabel = localeKey === 'ka' ? 'უსაფრთხოების ფაილის ჩამოტვირთვა' : 'Download Safety File'
  const safetyFileNote =
    localeKey === 'ka'
      ? 'თუ ოფლაინ ვერსია გჭირდება, შეგიძლია იგივე დოკუმენტის დასაბეჭდი ფაილი პირდაპირ გადმოწერო.'
      : 'If you need an offline version, you can download a printable source file of the same document.'
  const downloadSuccessText =
    localeKey === 'ka'
      ? 'PDF ფაილი წარმატებით მომზადდა და ჩამოტვირთვა დაიწყო.'
      : 'The PDF file was prepared successfully and the download has started.'
  const submitErrorText =
    localeKey === 'ka'
      ? 'ფორმის ელექტრონული გაგზავნა ამ ეტაპზე ვერ შესრულდა. სცადეთ თავიდან.'
      : 'The electronic form submission could not be completed right now. Please try again.'
  const participantFields = view.participantFields
  const [participant, setParticipant] = useState(() => buildEmptyParticipantState(participantFields))
  const [guardian, setGuardian] = useState({ name: '', phone: '' })
  const [safetyChecks, setSafetyChecks] = useState(() => buildChecks(view.safetyItems))
  const [consentChecks, setConsentChecks] = useState(() => buildChecks(view.consentItems))
  const [isMinor, setIsMinor] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [signatureDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [participantSignature, setParticipantSignature] = useState('')
  const [guardianSignature, setGuardianSignature] = useState('')
  const [signatureErrors, setSignatureErrors] = useState({ participant: '', guardian: '' })
  const [feedback, setFeedback] = useState(null)
  const [busyAction, setBusyAction] = useState('')
  const formRef = useRef(null)
  const participantSignatureRef = useRef(null)
  const guardianSignatureRef = useRef(null)

  const sectionList = useMemo(
    () => [
      view.participantSectionTitle,
      view.safetySectionTitle,
      view.consentSectionTitle,
      view.signatureSectionTitle,
      view.declarationSectionTitle,
    ],
    [view],
  )

  function handleParticipantChange(name, value) {
    setParticipant((current) => {
      const next = { ...current, [name]: value }

      if (name === 'fullName') {
        setSignerName((typed) => (typed === '' || typed === current.fullName ? value : typed))
      }

      return next
    })
  }

  function handleGuardianChange(name, value) {
    setGuardian((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleCheckToggle(sectionKey, index) {
    const setter = sectionKey === 'safety' ? setSafetyChecks : setConsentChecks

    setter((current) => current.map((item, itemIndex) => (itemIndex === index ? !item : item)))
  }

  function resetForm() {
    setParticipant(buildEmptyParticipantState(participantFields))
    setGuardian({ name: '', phone: '' })
    setSafetyChecks(buildChecks(view.safetyItems))
    setConsentChecks(buildChecks(view.consentItems))
    setIsMinor(false)
    setSignerName('')
    setParticipantSignature('')
    setGuardianSignature('')
    setSignatureErrors({ participant: '', guardian: '' })
    participantSignatureRef.current?.clear()
    guardianSignatureRef.current?.clear()
    setFeedback({
      type: 'info',
      title: view.actionReset,
      text: view.resetConfirmation,
    })
  }

  function validateForm() {
    const nativeValid = formRef.current?.reportValidity() ?? true
    const nextSignatureErrors = { participant: '', guardian: '' }

    if (!safetyChecks.every(Boolean) || !consentChecks.every(Boolean)) {
      setFeedback({
        type: 'error',
        title: view.declarationSectionTitle,
        text: view.validationSubmit,
      })
      return false
    }

    if (participantSignatureRef.current?.isEmpty()) {
      nextSignatureErrors.participant = view.validationSignature
    }

    if (isMinor && guardianSignatureRef.current?.isEmpty()) {
      nextSignatureErrors.guardian = view.validationGuardianSignature
    }

    setSignatureErrors(nextSignatureErrors)

    if (!nativeValid || nextSignatureErrors.participant || nextSignatureErrors.guardian) {
      setFeedback({
        type: 'error',
        title: view.declarationSectionTitle,
        text: view.validationSubmit,
      })
      return false
    }

    setFeedback(null)
    return true
  }

  async function handleDownload() {
    if (!validateForm()) {
      return
    }

    setBusyAction('download')

    try {
      const { downloadSafetyConsentPdf } = await import('../utils/safetyConsentPdf')

      await downloadSafetyConsentPdf({
        view,
        participant,
        participantFields,
        safetyItems: selectAccepted(view.safetyItems, safetyChecks),
        consentItems: selectAccepted(view.consentItems, consentChecks),
        signatureDate,
        isMinor,
        signerName,
        participantSignature,
        guardian,
        guardianSignature,
        logoSrc,
      })

      setFeedback({
        type: 'success',
        title: view.actionDownload,
        text: downloadSuccessText,
      })
    } catch {
      setFeedback({
        type: 'error',
        title: view.actionDownload,
        text: view.validationSubmit,
      })
    } finally {
      setBusyAction('')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setBusyAction('submit')

    try {
      const payload = createSafetyConsentPayload({
        participant,
        signerName,
        safetyChecks: mapChecks(view.safetyItems, safetyChecks),
        consentChecks: mapChecks(view.consentItems, consentChecks),
        isMinor,
        guardian,
        signatureDate,
        participantSignature,
        guardianSignature,
        declarationText: view.declarationText,
      })

      const result = await submitSafetyConsentForm(payload)

      setFeedback({
        type: 'success',
        title: view.submitSuccessTitle,
        text: `${view.submitSuccessText} ${result.reference}`,
      })
    } catch {
      setFeedback({
        type: 'error',
        title: view.actionSubmit,
        text: submitErrorText,
      })
    } finally {
      setBusyAction('')
    }
  }

  return (
    <>
      <PageHero eyebrow={view.eyebrow} title={view.title} text={view.introText} highlights={view.highlights} label={copy.header.highlightsLabel} />

      <section className="container page-section">
        {feedback ? (
          <div className={`status-banner is-${feedback.type}`}>
            <strong>{feedback.title}</strong>
            <p>{feedback.text}</p>
          </div>
        ) : null}

        <div className="safety-intro-grid">
          <article className="feature-card safety-brand-card">
            <div className="safety-brand-lockup">
              <img src={logoSrc} alt="GDSFF logo" className="safety-brand-logo" />
              <div>
                <span className="card-kicker">{copy.brand.shortName}</span>
                <h2>{view.title}</h2>
                <p>{view.optionalTitle}</p>
              </div>
            </div>

            <div className="safety-note-callout">
              <span className="card-kicker">{view.note}</span>
              <p>{view.introCardText}</p>
            </div>
          </article>

          <article className="feature-card safety-summary-card">
            <span className="card-kicker">{view.introCardTitle}</span>
            <p>{view.submitReadyText}</p>
            <div className="detail-list">
              {sectionList.map((item) => (
                <div key={item} className="detail-list-item">
                  <span className="dot" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
            <p>{safetyFileNote}</p>
            <div className="document-actions">
              <a href={safetyFileHref} className="download-action" download>
                {safetyFileLabel}
              </a>
            </div>
          </article>
        </div>
      </section>

      <section className="container section-space">
        <form ref={formRef} className="safety-consent-form" onSubmit={handleSubmit}>
          <div className="feature-card safety-panel">
            <div className="safety-panel-header">
              <div>
                <span className="card-kicker">{view.participantSectionTitle}</span>
                <p>{view.participantSectionText}</p>
              </div>
            </div>

            <div className="safety-fields-grid">
              {participantFields.map((field) => (
                <SafetyField
                  key={field.name}
                  {...field}
                  value={participant[field.name]}
                  onChange={handleParticipantChange}
                  placeholder={field.type === 'select' ? '...' : undefined}
                />
              ))}
            </div>
          </div>

          <div className="safety-columns">
            <SafetyCheckboxSection
              title={view.safetySectionTitle}
              text={view.safetySectionText}
              items={view.safetyItems}
              values={safetyChecks}
              sectionKey="safety"
              onToggle={handleCheckToggle}
            />

            <SafetyCheckboxSection
              title={view.consentSectionTitle}
              text={view.consentSectionText}
              items={view.consentItems}
              values={consentChecks}
              sectionKey="consent"
              onToggle={handleCheckToggle}
            />
          </div>

          <div className="feature-card safety-panel">
            <div className="safety-panel-header">
              <div>
                <span className="card-kicker">{view.signatureSectionTitle}</span>
                <p>{view.signatureSectionText}</p>
              </div>

              <label className="minor-toggle">
                <input type="checkbox" checked={isMinor} onChange={() => setIsMinor((current) => !current)} />
                <span className="minor-toggle-mark" aria-hidden="true" />
                <span>{view.minorToggleLabel}</span>
              </label>
            </div>

            <div className="safety-signature-grid">
              <div className="signature-stack">
                <SafetyField
                  label={view.signerNameLabel}
                  name="signerName"
                  value={signerName}
                  onChange={(_, value) => setSignerName(value)}
                />

                <label className="safety-field">
                  <span className="safety-field-label">
                    {view.signatureDateLabel}
                    <strong>*</strong>
                  </span>
                  <input className="safety-input" type="date" value={signatureDate} readOnly />
                </label>
              </div>

              <SignaturePadField
                ref={participantSignatureRef}
                label={view.signatureLabel}
                note={view.signatureHint}
                clearLabel={view.signatureClearLabel}
                error={signatureErrors.participant}
                signedLabel={view.signatureSignedLabel}
                pendingLabel={view.signaturePendingLabel}
                onChange={(value) => {
                  setParticipantSignature(value)
                  setSignatureErrors((current) => ({
                    ...current,
                    participant: value ? '' : current.participant,
                  }))
                }}
              />
            </div>

            {isMinor ? (
              <div className="safety-guardian-card">
                <div className="safety-section-copy">
                  <span className="card-kicker">{view.guardianSectionTitle}</span>
                  <p>{view.guardianSectionText}</p>
                </div>

                <div className="safety-guardian-grid">
                  <SafetyField label={view.guardianNameLabel} name="name" value={guardian.name} onChange={handleGuardianChange} />
                  <SafetyField label={view.guardianPhoneLabel} name="phone" type="tel" value={guardian.phone} onChange={handleGuardianChange} />
                </div>

                <SignaturePadField
                  ref={guardianSignatureRef}
                  label={view.guardianSignatureLabel}
                  note={view.signatureHint}
                  clearLabel={view.signatureClearLabel}
                  error={signatureErrors.guardian}
                  signedLabel={view.signatureSignedLabel}
                  pendingLabel={view.signaturePendingLabel}
                  onChange={(value) => {
                    setGuardianSignature(value)
                    setSignatureErrors((current) => ({
                      ...current,
                      guardian: value ? '' : current.guardian,
                    }))
                  }}
                />
              </div>
            ) : null}
          </div>

          <div className="feature-card safety-panel">
            <span className="card-kicker">{view.declarationSectionTitle}</span>
            <p className="safety-declaration">{view.declarationText}</p>
            <p className="safety-footer-note">{view.footerNote}</p>
          </div>

          <div className="feature-card safety-actions-card">
            <div>
              <span className="card-kicker">{copy.brand.shortName}</span>
              <p>{view.submitReadyText}</p>
            </div>

            <div className="safety-actions">
              <a href={safetyFileHref} className="download-action" download>
                {safetyFileLabel}
              </a>
              <button type="button" className="secondary-button inline-button" onClick={handleDownload} disabled={busyAction !== ''}>
                {busyAction === 'download' ? `${view.actionDownload}...` : view.actionDownload}
              </button>
              <button type="submit" className="primary-button" disabled={busyAction !== ''}>
                {busyAction === 'submit' ? `${view.actionSubmit}...` : view.actionSubmit}
              </button>
              <button type="button" className="ghost-button" onClick={resetForm} disabled={busyAction !== ''}>
                {view.actionReset}
              </button>
            </div>
          </div>
        </form>
      </section>
    </>
  )
}
