import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import SafetyField from '../components/SafetyField'
import { EmailLink } from '../components/SiteMetaLinks'
import {
  BriefcaseIcon,
  DonationIcon,
  EquipmentIcon,
  EventFlagIcon,
  HandshakeIcon,
  InfrastructureIcon,
} from '../components/SiteIcons'
import { supportContent } from '../content/supportContent'
import { submitSupportInquiry } from '../utils/socialHubApi'

const supportAreaIcons = [
  BriefcaseIcon,
  EventFlagIcon,
  EquipmentIcon,
  InfrastructureIcon,
  DonationIcon,
  HandshakeIcon,
]

function buildEmptyFormState(fields) {
  return fields.reduce((accumulator, field) => {
    accumulator[field.name] = ''
    return accumulator
  }, {})
}

function normalizeValues(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
  )
}

function buildSupportPayload(values, localeKey) {
  return {
    locale: localeKey,
    source: 'website-support',
    inquiry: {
      fullName: values.fullName ?? '',
      organization: values.organization ?? '',
      email: values.email ?? '',
      phone: values.phone ?? '',
      supportType: values.supportType ?? '',
      budget: values.budget ?? '',
      message: values.message ?? '',
    },
  }
}

export default function SupportPage({ copy }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const view = supportContent[localeKey]
  const formRef = useRef(null)
  const [values, setValues] = useState(() => buildEmptyFormState(view.form.fields))
  const [feedback, setFeedback] = useState(null)
  const [isBusy, setIsBusy] = useState(false)

  const ctaLinks = useMemo(() => {
    const subjectForSponsor =
      localeKey === 'ka' ? 'GDSFF სპონსორობის მოთხოვნა' : 'GDSFF Sponsorship Inquiry'
    const subjectForDonation =
      localeKey === 'ka' ? 'GDSFF დონაციის მოთხოვნა' : 'GDSFF Donation Inquiry'
    const subjectForPartnership =
      localeKey === 'ka' ? 'GDSFF პარტნიორობის დეტალების მოთხოვნა' : 'GDSFF Partnership Details Request'

    return [
      {
        label: view.ctas[0],
        href: `mailto:${copy.meta.email}?subject=${encodeURIComponent(subjectForSponsor)}`,
        className: 'primary-button',
      },
      {
        label: view.ctas[1],
        href: `mailto:${copy.meta.email}?subject=${encodeURIComponent(subjectForDonation)}`,
        className: 'secondary-button',
      },
      {
        label: view.ctas[2],
        href: `mailto:${copy.meta.email}?subject=${encodeURIComponent(subjectForPartnership)}`,
        className: 'ghost-button',
      },
      {
        label: view.ctas[3],
        to: '/contact#contact-directory',
        className: 'download-action',
      },
    ]
  }, [copy.meta.email, localeKey, view.ctas])

  function handleChange(name, value) {
    setValues((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleReset() {
    setValues(buildEmptyFormState(view.form.fields))
    setFeedback(null)
  }

  function validateForm() {
    const isValid = formRef.current?.reportValidity() ?? true
    if (!isValid) {
      setFeedback({
        type: 'error',
        title: view.form.validationTitle,
        text: view.form.validationText,
      })
      return false
    }

    setFeedback(null)
    return true
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsBusy(true)

    try {
      const payload = buildSupportPayload(normalizeValues(values), localeKey)
      const result = await submitSupportInquiry(payload)
      const reference = result?.inquiry?.reference || ''
      const referenceText = reference ? `${view.form.referenceLabel}: ${reference}.` : ''

      setFeedback({
        type: 'success',
        title: view.form.successTitle,
        text: `${view.form.successText} ${referenceText}`.trim(),
      })
      setValues(buildEmptyFormState(view.form.fields))
    } catch (error) {
      const exactMessage =
        (error?.details && typeof error.details === 'object' && error.details.error) ||
        (error instanceof Error ? error.message : '')

      setFeedback({
        type: 'error',
        title: view.form.errorTitle,
        text: exactMessage ? `${view.form.errorText} ${exactMessage}` : view.form.errorText,
      })
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow={view.heroEyebrow}
        title={view.title}
        text={view.heroSubtitle}
        highlights={view.supportAreas.slice(0, 3).map((item) => item.title)}
        label={copy.header.highlightsLabel}
      />

      <section id="sponsorship-donations" className="container page-section anchor-section">
        <div className="support-page-active-marker" role="status" aria-live="polite">
          Support Page Active
        </div>

        {feedback ? (
          <div className={`status-banner is-${feedback.type}`}>
            <strong>{feedback.title}</strong>
            <p>{feedback.text}</p>
          </div>
        ) : null}

        <article className="feature-card support-intro-card">
          <span className="card-kicker">{view.title}</span>
          <div className="support-intro-copy">
            {view.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>
      </section>

      <section id="support-areas" className="container section-space anchor-section">
        <div className="support-section-head">
          <span className="card-kicker">{view.supportAreasTitle}</span>
          <h2>{view.title}</h2>
        </div>

        <div className="support-areas-grid">
          {view.supportAreas.map((area, index) => {
            const Icon = supportAreaIcons[index] || BriefcaseIcon
            return (
              <article key={area.title} className="feature-card support-area-card">
                <div className="support-area-head">
                  <span className="support-area-icon-shell">
                    <Icon className="support-area-icon" />
                  </span>
                  <h3>{area.title}</h3>
                </div>
                <p>{area.text}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section id="why-support" className="container section-space split-section anchor-section">
        <article className="feature-card support-why-card">
          <span className="card-kicker">{view.whyTitle}</span>
          <div className="detail-list">
            {view.whyItems.map((item) => (
              <div key={item} className="detail-list-item">
                <span className="dot" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="feature-card support-inquiry-copy-card">
          <span className="card-kicker">{view.inquiryTitle}</span>
          <p>{view.inquiryText}</p>
          <span className="card-kicker support-list-kicker">{view.discussionTitle}</span>
          <div className="detail-list">
            {view.discussionItems.map((item) => (
              <div key={item} className="detail-list-item">
                <span className="dot" />
                <p>{item}</p>
              </div>
            ))}
          </div>

          <div className="support-contact-chip">
            <EmailLink email={copy.meta.email} className="contact-directory-link" />
          </div>
        </article>
      </section>

      <section id="support-inquiry-form" className="container section-space anchor-section">
        <form ref={formRef} className="support-form-shell" onSubmit={handleSubmit}>
          <article className="feature-card support-form-card">
            <div className="support-form-head">
              <div>
                <span className="card-kicker">{view.form.title}</span>
                <h2>{view.inquiryTitle}</h2>
                <p>{view.form.text}</p>
              </div>

              <div className="support-form-destination">
                <span className="card-kicker">{view.ctas[3]}</span>
                <EmailLink email={copy.meta.email} className="contact-directory-link" />
              </div>
            </div>

            <div className="support-form-grid">
              {view.form.fields.map((field) => (
                <div
                  key={field.name}
                  className={
                    field.name === 'message'
                      ? 'support-form-field support-form-field-full'
                      : 'support-form-field'
                  }
                >
                  <SafetyField
                    {...field}
                    value={values[field.name]}
                    onChange={handleChange}
                  />
                </div>
              ))}
            </div>
          </article>

          <article className="feature-card support-actions-card">
            <p>{view.transparencyNote}</p>
            <div className="safety-actions">
              <button type="button" className="ghost-button" onClick={handleReset} disabled={isBusy}>
                {localeKey === 'ka' ? 'გასუფთავება' : 'Clear'}
              </button>
              <button type="submit" className="primary-button" disabled={isBusy}>
                {isBusy ? (localeKey === 'ka' ? 'იგზავნება...' : 'Submitting...') : view.form.submitLabel}
              </button>
            </div>
          </article>
        </form>
      </section>

      <section id="transparency-note" className="container section-space anchor-section">
        <article className="feature-card support-transparency-card">
          <span className="card-kicker">{view.transparencyTitle}</span>
          <p>{view.transparencyNote}</p>
        </article>
      </section>

      <section className="container section-space">
        <article className="feature-card support-cta-card">
          <div className="support-cta-grid">
            {ctaLinks.map((item) =>
              item.href ? (
                <a key={item.label} href={item.href} className={item.className}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} to={item.to} className={item.className}>
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </article>
      </section>
    </>
  )
}
