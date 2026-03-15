import PageHero from '../components/PageHero'
import { EmailLink } from '../components/SiteMetaLinks'
import { officialLaunchContent } from '../content/officialLaunchContent'

export default function MembershipPage({ copy }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const view = officialLaunchContent[localeKey].membership

  return (
    <>
      <PageHero
        eyebrow={view.eyebrow}
        title={view.title}
        text={view.text}
        highlights={view.highlights}
        label={copy.header.highlightsLabel}
      />

      <section id="join-federation" className="container page-section anchor-section">
        <div className="card-grid two-col">
          {view.paragraphs.map((paragraph, index) => (
            <article key={paragraph} className="feature-card">
              <span className="card-kicker">{index === 0 ? view.eyebrow : copy.brand.shortName}</span>
              <p>{paragraph}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="application-form" className="container section-space anchor-section">
        <div className="feature-card membership-application-card">
          <div className="membership-application-copy">
            <span className="card-kicker">{view.applicationTitle}</span>
            <p>{view.applicationText}</p>
            <EmailLink email={copy.meta.email} className="contact-directory-link" />
          </div>

          <a href={view.applicationHref} className="download-action" download>
            {view.actionLabel}
          </a>
        </div>
      </section>
    </>
  )
}
