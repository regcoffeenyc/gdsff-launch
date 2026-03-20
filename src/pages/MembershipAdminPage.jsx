import { useEffect, useMemo, useState } from 'react'
import PageHero from '../components/PageHero'
import { membershipApplicationContent } from '../content/membershipApplicationContent'
import {
  getAdminSession,
  getMembershipApplications,
  loginAdmin,
  logoutAdmin,
  updateMembershipApplicationStatus,
} from '../utils/socialHubApi'

const adminCopy = {
  en: {
    eyebrow: 'Membership Review',
    title: 'Protected membership application register',
    text: 'Review submitted applications, track live statuses, and manage the incoming membership queue.',
    highlights: ['Protected workspace', 'Live application register', 'Status-based review'],
    loginKicker: 'Admin Sign In',
    loginTitle: 'Open the protected membership register.',
    loginText: 'Use the federation admin credentials already configured for the communications workspace.',
    usernameLabel: 'Username',
    passwordLabel: 'Password',
    loginAction: 'Sign In',
    loginBusyLabel: 'Signing in...',
    logoutAction: 'Sign Out',
    logoutBusyLabel: 'Signing out...',
    loadingText: 'Loading membership register...',
    registerKicker: 'Review Dashboard',
    emptyTitle: 'No online applications stored yet.',
    emptyText: 'Once visitors submit the online membership form, applications will appear here with a status trail.',
    noteLabel: 'Review Note',
    saveLabel: 'Save Status',
    savingLabel: 'Saving...',
    submittedAtLabel: 'Submitted At',
    membershipTypeLabel: 'Membership Type',
    sportInterestLabel: 'Sport Interest',
    applicantLabel: 'Applicant',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    statusLabel: 'Status',
    additionalInfoLabel: 'Additional Information',
    syncErrorTitle: 'Admin Sync Unavailable',
    syncErrorText: 'The membership register could not be loaded right now.',
    loginErrorTitle: 'Login Failed',
    loginErrorText: 'The admin session could not be opened with the provided credentials.',
    updateSuccessTitle: 'Status Updated',
    updateSuccessText: 'The membership application record was updated successfully.',
    updateErrorTitle: 'Status Update Failed',
    updateErrorText: 'The membership application status could not be updated right now.',
  },
  ka: {
    eyebrow: 'წევრობის განხილვა',
    title: 'დაცული წევრობის განაცხადების რეესტრი',
    text: 'განიხილეთ მიღებული განაცხადები, აკონტროლეთ ცოცხალი სტატუსები და მართეთ შემოსული წევრობის რიგი.',
    highlights: ['დაცული სამუშაო სივრცე', 'ცოცხალი განაცხადების რეესტრი', 'სტატუსებზე დაფუძნებული განხილვა'],
    loginKicker: 'ადმინისტრატორის შესვლა',
    loginTitle: 'გახსენით დაცული წევრობის რეესტრი.',
    loginText: 'გამოიყენეთ იგივე ადმინისტრატორის მონაცემები, რომლებიც უკვე კონფიგურირებულია საკომუნიკაციო სამუშაო სივრცისთვის.',
    usernameLabel: 'მომხმარებელი',
    passwordLabel: 'პაროლი',
    loginAction: 'შესვლა',
    loginBusyLabel: 'მიმდინარეობს შესვლა...',
    logoutAction: 'გასვლა',
    logoutBusyLabel: 'მიმდინარეობს გამოსვლა...',
    loadingText: 'მიმდინარეობს წევრობის რეესტრის ჩატვირთვა...',
    registerKicker: 'განხილვის დაფა',
    emptyTitle: 'ონლაინ განაცხადები ჯერ არ არის შენახული.',
    emptyText: 'როგორც კი ვიზიტორები წევრობის ონლაინ ფორმას შეავსებენ, განაცხადები აქ გამოჩნდება სტატუსის ისტორიით.',
    noteLabel: 'განხილვის შენიშვნა',
    saveLabel: 'სტატუსის შენახვა',
    savingLabel: 'ინახება...',
    submittedAtLabel: 'გაგზავნის დრო',
    membershipTypeLabel: 'წევრობის ტიპი',
    sportInterestLabel: 'სპორტული მიმართულება',
    applicantLabel: 'აპლიკანტი',
    emailLabel: 'ელფოსტა',
    phoneLabel: 'ტელეფონი',
    statusLabel: 'სტატუსი',
    additionalInfoLabel: 'დამატებითი ინფორმაცია',
    syncErrorTitle: 'ადმინისტრატორის სინქრონი მიუწვდომელია',
    syncErrorText: 'წევრობის რეესტრის ჩატვირთვა ამ ეტაპზე ვერ მოხერხდა.',
    loginErrorTitle: 'შესვლა ვერ შესრულდა',
    loginErrorText: 'მითითებული მონაცემებით ადმინისტრატორის სესიის გახსნა ვერ მოხერხდა.',
    updateSuccessTitle: 'სტატუსი განახლდა',
    updateSuccessText: 'წევრობის განაცხადის ჩანაწერი წარმატებით განახლდა.',
    updateErrorTitle: 'სტატუსის განახლება ვერ შესრულდა',
    updateErrorText: 'წევრობის განაცხადის სტატუსი ამ ეტაპზე ვერ განახლდა.',
  },
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

function resolveOptionLabel(view, fieldName, value) {
  const field = view.fields.find((item) => item.name === fieldName)
  const option = field?.options?.find((item) => item.value === value)
  return option?.label ?? value
}

function seedDraftMap(applications, key) {
  return Object.fromEntries(applications.map((application) => [application.id, application[key] || '']))
}

export default function MembershipAdminPage({ copy }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const view = membershipApplicationContent[localeKey]
  const pageCopy = adminCopy[localeKey]
  const [authState, setAuthState] = useState({ loading: true, authenticated: false, user: null })
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [applications, setApplications] = useState([])
  const [summary, setSummary] = useState(() => buildEmptySummary())
  const [draftStatuses, setDraftStatuses] = useState({})
  const [reviewNotes, setReviewNotes] = useState({})
  const [busyId, setBusyId] = useState('')
  const [feedback, setFeedback] = useState(null)

  const statusOptions = useMemo(
    () => Object.entries(view.statusLabels).map(([value, label]) => ({ value, label })),
    [view.statusLabels],
  )

  async function loadApplications() {
    const result = await getMembershipApplications()
    const nextApplications = result.applications || []
    setApplications(nextApplications)
    setSummary({
      ...buildEmptySummary(),
      ...(result.summary || {}),
    })
    setDraftStatuses(seedDraftMap(nextApplications, 'status'))
    setReviewNotes(seedDraftMap(nextApplications, 'reviewNote'))
  }

  useEffect(() => {
    let cancelled = false

    async function initialize() {
      try {
        const session = await getAdminSession()
        if (cancelled) {
          return
        }

        if (session.auth?.authenticated) {
          await loadApplications()
          if (cancelled) {
            return
          }

          setAuthState({ loading: false, authenticated: true, user: session.auth.user || null })
          return
        }

        setAuthState({ loading: false, authenticated: false, user: null })
      } catch {
        if (cancelled) {
          return
        }

        setAuthState({ loading: false, authenticated: false, user: null })
        setFeedback({
          type: 'error',
          title: pageCopy.syncErrorTitle,
          text: pageCopy.syncErrorText,
        })
      }
    }

    initialize()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleLogin(event) {
    event.preventDefault()
    setBusyId('login')

    try {
      const result = await loginAdmin(credentials.username, credentials.password)
      await loadApplications()
      setAuthState({ loading: false, authenticated: true, user: result.user || null })
      setFeedback(null)
      setCredentials({ username: '', password: '' })
    } catch {
      setFeedback({
        type: 'error',
        title: pageCopy.loginErrorTitle,
        text: pageCopy.loginErrorText,
      })
    } finally {
      setBusyId('')
    }
  }

  async function handleLogout() {
    setBusyId('logout')

    try {
      await logoutAdmin()
      setAuthState({ loading: false, authenticated: false, user: null })
      setApplications([])
      setSummary(buildEmptySummary())
    } finally {
      setBusyId('')
    }
  }

  async function handleStatusSave(applicationId) {
    setBusyId(applicationId)

    try {
      const result = await updateMembershipApplicationStatus(
        applicationId,
        draftStatuses[applicationId],
        reviewNotes[applicationId],
      )

      setApplications((current) =>
        current.map((item) => (item.id === applicationId ? result.application || item : item)),
      )
      setSummary({
        ...buildEmptySummary(),
        ...(result.summary || {}),
      })
      setFeedback({
        type: 'success',
        title: pageCopy.updateSuccessTitle,
        text: pageCopy.updateSuccessText,
      })
    } catch {
      setFeedback({
        type: 'error',
        title: pageCopy.updateErrorTitle,
        text: pageCopy.updateErrorText,
      })
    } finally {
      setBusyId('')
    }
  }

  return (
    <>
      <PageHero
        eyebrow={pageCopy.eyebrow}
        title={pageCopy.title}
        text={pageCopy.text}
        highlights={pageCopy.highlights}
        label={copy.header.highlightsLabel}
      />

      <section className="container page-section">
        {feedback ? (
          <div className={`status-banner is-${feedback.type}`}>
            <strong>{feedback.title}</strong>
            <p>{feedback.text}</p>
          </div>
        ) : null}

        {authState.loading ? (
          <article className="feature-card membership-admin-shell">
            <span className="card-kicker">{pageCopy.loginKicker}</span>
            <p>{pageCopy.loadingText}</p>
          </article>
        ) : null}

        {!authState.loading && !authState.authenticated ? (
          <article className="feature-card membership-admin-shell">
            <div className="membership-admin-login-copy">
              <span className="card-kicker">{pageCopy.loginKicker}</span>
              <h2>{pageCopy.loginTitle}</h2>
              <p>{pageCopy.loginText}</p>
            </div>

            <form className="membership-admin-login-form" onSubmit={handleLogin}>
              <label className="safety-field">
                <span className="safety-field-label">{pageCopy.usernameLabel}</span>
                <input
                  className="safety-input"
                  type="text"
                  value={credentials.username}
                  onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
                  autoComplete="username"
                  required
                />
              </label>

              <label className="safety-field">
                <span className="safety-field-label">{pageCopy.passwordLabel}</span>
                <input
                  className="safety-input"
                  type="password"
                  value={credentials.password}
                  onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                  autoComplete="current-password"
                  required
                />
              </label>

              <button type="submit" className="primary-button" disabled={busyId === 'login'}>
                {busyId === 'login' ? pageCopy.loginBusyLabel : pageCopy.loginAction}
              </button>
            </form>
          </article>
        ) : null}

        {!authState.loading && authState.authenticated ? (
          <div className="membership-admin-stack">
            <article className="feature-card membership-admin-shell">
              <div className="membership-admin-head">
                <div>
                  <span className="card-kicker">{pageCopy.registerKicker}</span>
                  <h2>{pageCopy.title}</h2>
                  <p>{pageCopy.text}</p>
                </div>

                <button type="button" className="ghost-button" onClick={handleLogout} disabled={busyId === 'logout'}>
                  {busyId === 'logout' ? pageCopy.logoutBusyLabel : pageCopy.logoutAction}
                </button>
              </div>

              <div className="membership-status-grid membership-admin-summary-grid">
                <div className="membership-status-chip is-total">
                  <span>{view.totalApplicationsShortLabel}</span>
                  <strong>{String(summary.totalApplications || 0).padStart(2, '0')}</strong>
                </div>
                {statusOptions.map((item) => (
                  <div key={item.value} className="membership-status-chip">
                    <span>{item.label}</span>
                    <strong>{String(summary.statusCounts?.[item.value] || 0).padStart(2, '0')}</strong>
                  </div>
                ))}
              </div>
            </article>

            {applications.length === 0 ? (
              <article className="feature-card membership-admin-shell">
                <span className="card-kicker">{pageCopy.registerKicker}</span>
                <h3>{pageCopy.emptyTitle}</h3>
                <p>{pageCopy.emptyText}</p>
              </article>
            ) : (
              <div className="membership-admin-list">
                {applications.map((application) => (
                  <article key={application.id} className="feature-card membership-admin-item">
                    <div className="membership-admin-item-top">
                      <div>
                        <span className="card-kicker">{application.reference}</span>
                        <h3>{application.applicant?.fullName}</h3>
                      </div>
                      <span className="membership-admin-status">
                        {view.statusLabels[application.status] ?? application.status}
                      </span>
                    </div>

                    <div className="membership-admin-details">
                      <div className="membership-record-item">
                        <span>{pageCopy.submittedAtLabel}</span>
                        <strong>{formatDateLabel(application.submittedAt, copy.locale)}</strong>
                      </div>
                      <div className="membership-record-item">
                        <span>{pageCopy.emailLabel}</span>
                        <strong>{application.applicant?.email}</strong>
                      </div>
                      <div className="membership-record-item">
                        <span>{pageCopy.phoneLabel}</span>
                        <strong>{application.applicant?.phone}</strong>
                      </div>
                      <div className="membership-record-item">
                        <span>{pageCopy.membershipTypeLabel}</span>
                        <strong>{resolveOptionLabel(view, 'membershipType', application.applicant?.membershipType)}</strong>
                      </div>
                      <div className="membership-record-item">
                        <span>{pageCopy.sportInterestLabel}</span>
                        <strong>{resolveOptionLabel(view, 'sportInterest', application.applicant?.sportInterest)}</strong>
                      </div>
                      <div className="membership-record-item">
                        <span>{pageCopy.applicantLabel}</span>
                        <strong>{application.applicant?.citizenship}</strong>
                      </div>
                    </div>

                    <label className="safety-field">
                      <span className="safety-field-label">{pageCopy.statusLabel}</span>
                      <select
                        className="safety-input safety-select"
                        value={draftStatuses[application.id] || application.status}
                        onChange={(event) =>
                          setDraftStatuses((current) => ({
                            ...current,
                            [application.id]: event.target.value,
                          }))
                        }
                      >
                        {statusOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="safety-field">
                      <span className="safety-field-label">{pageCopy.noteLabel}</span>
                      <textarea
                        className="safety-input safety-textarea"
                        rows={4}
                        value={reviewNotes[application.id] || ''}
                        onChange={(event) =>
                          setReviewNotes((current) => ({
                            ...current,
                            [application.id]: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <div className="membership-admin-footer">
                      <p className="membership-admin-extra">
                        <strong>{pageCopy.additionalInfoLabel}:</strong> {application.applicant?.additionalInfo || '—'}
                      </p>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => handleStatusSave(application.id)}
                        disabled={busyId === application.id}
                      >
                        {busyId === application.id ? pageCopy.savingLabel : pageCopy.saveLabel}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>
    </>
  )
}
