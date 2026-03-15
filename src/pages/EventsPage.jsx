import EventCalendar from '../components/EventCalendar'
import PageHero from '../components/PageHero'

export default function EventsPage({ copy }) {
  const eventAnchors = {
    'National Ranking Match I': 'national-championships',
    'Summer Tactical Performance Camp': 'training-camps',
    'Georgian Grand Prix': 'international-events',
  }

  return (
    <>
      <PageHero
        eyebrow={copy.events.eyebrow}
        title={copy.events.title}
        text={copy.events.text}
        highlights={copy.events.highlights}
        label={copy.header.highlightsLabel}
      />

      <section id="calendar-2026" className="container page-section anchor-section">
        <EventCalendar
          calendar={copy.events.calendar}
          locale={copy.locale}
          eyebrow={copy.events.eyebrow}
          eventAnchors={eventAnchors}
        />
      </section>

      <section className="container section-space">
        <div className="section-intro">
          <h2>{copy.events.operationsTitle}</h2>
        </div>
        <div className="card-grid three-col">
          {copy.events.operations.map((item) => (
            <article key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
