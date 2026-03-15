import SectionIntro from './SectionIntro'

export default function PageHero({ eyebrow, title, text, highlights = [], label = 'Highlights' }) {
  return (
    <section className="page-hero-section">
      <div className="container page-hero-grid">
        <SectionIntro eyebrow={eyebrow} title={title} text={text} />
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
      </div>
    </section>
  )
}
