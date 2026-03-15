export default function SectionIntro({ eyebrow, title, text }) {
  return (
    <div className="section-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {text ? <p className="section-copy">{text}</p> : null}
    </div>
  )
}
