import PageHero from '../components/PageHero'

export default function SportsPage({ copy }) {
  const disciplineIds = ['dynamic-shooting', 'functional-fitness', 'tactical-performance']

  return (
    <>
      <PageHero
        eyebrow={copy.sports.eyebrow}
        title={copy.sports.title}
        text={copy.sports.text}
        highlights={copy.sports.highlights}
        label={copy.header.highlightsLabel}
      />

      <section className="container page-section">
        <div className="card-grid three-col">
          {copy.sports.disciplines.map((sport, index) => (
            <article
              key={sport.title}
              id={disciplineIds[index]}
              className={index < 2 ? 'feature-card anchor-section' : 'feature-card'}
            >
              <h3>{sport.title}</h3>
              <p>{sport.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="athlete-development" className="container section-space anchor-section">
        <div id="competition-pathway" className="feature-card pathway-card anchor-section">
          <span className="card-kicker">{copy.sports.pathwayTitle}</span>
          <div className="pathway-list">
            {copy.sports.pathway.map((step, index) => (
              <article key={step} className="pathway-step">
                <div className="pathway-index">{String(index + 1).padStart(2, '0')}</div>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
