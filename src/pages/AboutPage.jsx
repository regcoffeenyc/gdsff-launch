import PageHero from '../components/PageHero'
import { officialLaunchContent } from '../content/officialLaunchContent'

export default function AboutPage({ copy }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const view = officialLaunchContent[localeKey].about

  return (
    <>
      <PageHero
        eyebrow={view.eyebrow}
        title={view.title}
        text={view.text}
        highlights={view.highlights}
        label={copy.header.highlightsLabel}
      />

      <section id="federation-overview" className="container page-section anchor-section">
        <div className="feature-card content-stack-card">
          <span className="card-kicker">{view.overviewTitle}</span>
          {view.overviewParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section id="mission-vision" className="container section-space anchor-section">
        <div className="card-grid three-col">
          <article className="feature-card">
            <span className="card-kicker">{view.missionTitle}</span>
            <p>{view.missionText}</p>
          </article>

          <article className="feature-card">
            <span className="card-kicker">{view.visionTitle}</span>
            <p>{view.visionText}</p>
          </article>

          <article className="feature-card">
            <span className="card-kicker">{view.legalTitle}</span>
            <p>{view.legalText}</p>
          </article>
        </div>
      </section>

      <section id="charter" className="container section-space anchor-section">
        <div className="feature-card content-stack-card">
          <span className="card-kicker">{view.charterTitle}</span>
          {view.charterParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <div className="document-actions">
            <a href="/downloads/01_GDSFF_Wesdebis_Web_Version_Registered.docx" className="download-action" download>
              {localeKey === 'ka' ? 'წესდების ჩამოტვირთვა' : 'Download Charter'}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
