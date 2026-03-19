import SectionIntro from './SectionIntro'

export default function PageHero({ eyebrow, title, text, highlights = [], label = 'Highlights' }) {
  const hasHighlights = highlights.length > 0

  return (
    <section className="page-hero-section">
      <div className={hasHighlights ? 'container page-hero-grid' : 'container page-hero-grid is-single-column'}>
        <SectionIntro eyebrow={eyebrow} title={title} text={text} />
        {hasHighlights ? (
          <aside className="hero-side-panel">
            <div className="panel-kicker">{label}</div>
            <div className="hero-side-stack">
              {highlights.map((item) => (
                <div key={item} className="hero-side-chip">
                  {item}
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  )
}
