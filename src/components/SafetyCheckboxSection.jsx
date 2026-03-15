export default function SafetyCheckboxSection({ title, text, items, values, sectionKey, onToggle }) {
  return (
    <section className="feature-card safety-checklist-card">
      <div className="safety-section-copy">
        <span className="card-kicker">{title}</span>
        <p>{text}</p>
      </div>

      <div className="safety-checklist">
        {items.map((item, index) => {
          const checkboxId = `${sectionKey}-${index}`

          return (
            <label key={checkboxId} htmlFor={checkboxId} className="safety-check-item">
              <input
                id={checkboxId}
                type="checkbox"
                checked={values[index] ?? false}
                required
                onChange={() => onToggle(sectionKey, index)}
              />
              <span className="safety-check-mark" aria-hidden="true" />
              <span className="safety-check-copy">{item}</span>
            </label>
          )
        })}
      </div>
    </section>
  )
}
