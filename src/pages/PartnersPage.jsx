import PageHero from '../components/PageHero'
import PartnerLogoWall from '../components/PartnerLogoWall'

export default function PartnersPage({ copy }) {
  return (
    <>
      <PageHero
        eyebrow={copy.partners.eyebrow}
        title={copy.partners.title}
        text={copy.partners.text}
        highlights={copy.partners.highlights}
        label={copy.header.highlightsLabel}
      />

      <section id="partner-network" className="container page-section anchor-section">
        <PartnerLogoWall
          title={copy.partners.logoWallTitle}
          text={copy.partners.logoWallText}
          items={copy.partners.logoWall}
        />
      </section>

      <section className="container section-space split-section">
        <article id="sponsorship" className="feature-card anchor-section">
          <span className="card-kicker">{copy.partners.opportunitiesTitle}</span>
          <div className="detail-list">
            {copy.partners.opportunities.map((item) => (
              <div key={item} className="detail-list-item">
                <span className="dot" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </article>

        <article id="institutional-cooperation" className="feature-card anchor-section">
          <span className="card-kicker">{copy.partners.promiseTitle}</span>
          <div className="detail-list">
            {copy.partners.promise.map((item) => (
              <div key={item} className="detail-list-item">
                <span className="dot" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  )
}
