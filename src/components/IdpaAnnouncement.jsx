import { Link } from 'react-router-dom'
import { idpaAnnouncement } from '../content/idpaAnnouncement'
import { getSafetyTeamName, safetyTeamMembers } from '../content/safetyTeamContent'
import './If3Announcement.css'

export default function IdpaAnnouncement({ locale, compact = false }) {
  const language = locale === 'ka-GE' ? 'ka' : 'en'
  const news = idpaAnnouncement[language]
  return (
    <section id={compact ? 'latest-idpa-news' : 'news-updates'} className="container section-space anchor-section">
      <article className={`if3-announcement${compact ? ' if3-announcement-compact' : ''}`} aria-labelledby="idpa-news-title">
        <div className="if3-news-mark" aria-hidden="true">
          <span>GDSFF</span>
          <span className="if3-news-mark-line" />
          <strong>IDPA</strong>
          <span>{idpaAnnouncement.clubId}</span>
        </div>
        <div className="if3-news-copy">
          <div className="if3-news-meta">
            <p className="eyebrow">{news.eyebrow}</p>
            <time dateTime={idpaAnnouncement.date}>{news.dateLabel}</time>
          </div>
          <h2 id="idpa-news-title">{news.title}</h2>
          <p>{compact ? news.summary : news.lead}</p>
          {!compact && <>
            <ul aria-label={news.rosterLabel}>
              {safetyTeamMembers.map((member) => (
                <li key={member.id}>
                  <Link className="if3-source-link" lang={language === 'ka' && !member.nameKa ? 'en' : undefined} to={`/leadership#safety-team-${member.id}`}>
                    {getSafetyTeamName(member, language)}
                  </Link>
                </li>
              ))}
            </ul>
            <p>{news.club}</p>
            <p>{news.text}</p>
          </>}
          <div className="if3-news-actions">
            <Link className="primary-button" to={compact ? '/gallery#news-updates' : '/leadership#safety-officers-instructors'}>
              {compact ? news.readMore : news.teamLabel}
            </Link>
            <a className="if3-source-link" href={idpaAnnouncement.source} target="_blank" rel="noopener noreferrer">
              {news.sourceLabel} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </article>
    </section>
  )
}
