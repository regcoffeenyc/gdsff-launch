import { getSafetyTeamName, safetyTeamContent, safetyTeamMembers } from '../content/safetyTeamContent'

export default function SafetyTeamSection({ localeKey }) {
  const view = safetyTeamContent[localeKey]

  return (
    <section
      id="safety-officers-instructors"
      className="container section-space anchor-section"
      aria-labelledby="safety-team-heading"
    >
      <div className="section-intro">
        <h2 id="safety-team-heading">{view.title}</h2>
        <p className="section-copy">{view.text}</p>
      </div>
      <div className="card-grid three-col">
        {safetyTeamMembers.map((member) => (
          <article
            key={member.id}
            id={`safety-team-${member.id}`}
            className="feature-card safety-team-card anchor-section"
            aria-labelledby={`safety-team-${member.id}-name`}
          >
            <h3 id={`safety-team-${member.id}-name`} lang={localeKey === 'ka' && !member.nameKa ? 'en' : undefined}>
              {getSafetyTeamName(member, localeKey)}
            </h3>
            <ul className="safety-team-roles">
              <li>{view.safetyOfficerRole}</li>
              <li>{view.instructorRole}</li>
            </ul>
            <div className="safety-team-certificate">
              <img
                className="safety-team-certificate-preview"
                src={member.certificatePreviewSrc}
                alt={`${view.certificatePreviewLabel}: ${getSafetyTeamName(member, localeKey)}`}
                width="1188"
                height="918"
                loading="lazy"
                decoding="async"
              />
              <a
                href={member.certificateHref}
                className="download-action"
                type="application/pdf"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${view.certificateLabel}: ${getSafetyTeamName(member, localeKey)} (${view.certificateNewTab})`}
              >
                {view.certificateLabel}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
