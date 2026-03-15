export default function PartnerLogoWall({ title, text, items }) {
  return (
    <section className="logo-wall-shell">
      <div className="section-intro">
        <h3>{title}</h3>
        <p className="section-copy">{text}</p>
      </div>

      <div className="logo-wall-grid">
        {items.map((item) => (
          <article key={`${item.short}-${item.name}`} className="logo-wall-card">
            <div className="logo-mark">{item.short}</div>
            <div>
              <div className="logo-name">{item.name}</div>
              <div className="logo-type">{item.type}</div>
              {item.note ? <div className="logo-note">{item.note}</div> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
