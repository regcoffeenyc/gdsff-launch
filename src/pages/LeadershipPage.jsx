import PageHero from '../components/PageHero'
import { officialLaunchContent } from '../content/officialLaunchContent'

export default function LeadershipPage({ copy }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const view = officialLaunchContent[localeKey].leadership

  return (
    <>
      <PageHero
        eyebrow={view.eyebrow}
        title={view.title}
        text={view.text}
        highlights={view.highlights}
        label={copy.header.highlightsLabel}
      />

      <section className="container page-section">
        <article className="feature-card content-stack-card">
          <span className="card-kicker">{view.introTitle}</span>
          <p>{view.introText}</p>
        </article>
      </section>

      <section id="leadership-profiles" className="container section-space anchor-section">
        <div className="card-grid two-col">
          {view.profiles.map((profile) => (
            <article key={profile.id} id={profile.id} className="feature-card profile-card anchor-section">
              <div className="profile-avatar">{profile.name.slice(0, 2).toUpperCase()}</div>
              <span className="card-kicker">{profile.role}</span>
              <h3>{profile.name}</h3>
              <p>{profile.text}</p>
              <div className="document-actions">
                <a href={profile.href} className="download-action" download>
                  {profile.actionLabel}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
