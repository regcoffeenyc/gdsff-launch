import { NavLink } from 'react-router-dom'
import { logoSrc } from '../siteAssets'

export default function BrandLockup({ copy }) {
  const isGeorgian = copy.locale === 'ka-GE'
  const brandKicker = isGeorgian
    ? '\u10dd\u10e4\u10d8\u10ea\u10d8\u10d0\u10da\u10e3\u10e0\u10d8 \u10e4\u10d4\u10d3\u10d4\u10e0\u10d0\u10ea\u10d8\u10d0'
    : 'Official Federation'
  const subtitleLines = isGeorgian
    ? ['საქართველოს დინამიური სროლისა და', 'ფუნქციური ფიტნესის ფედერაცია']
    : ['Georgian Dynamic Shooting', '& Functional Fitness Federation']

  return (
    <NavLink to="/" className="brand-mark" aria-label={copy.brand.fullName} end>
      <img src={logoSrc} alt="GDSFF logo" className="brand-logo" />
      <div className="brand-copy">
        <div className="brand-kicker">{brandKicker}</div>
        <div className="brand-title">{copy.brand.shortName}</div>
        <div className="brand-subtitle">
          {subtitleLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <div className="brand-meta">{copy.brand.slogan}</div>
      </div>
    </NavLink>
  )
}
