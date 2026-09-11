import { Link } from 'react-router-dom'
import { if3Membership } from '../content/if3Membership'
import './If3Announcement.css'

export default function If3Announcement({ locale, compact = false }) {
  const news = if3Membership[locale === 'ka-GE' ? 'ka' : 'en']
  return (
    <section id={compact ? 'latest-news' : 'news-updates'} className="container section-space anchor-section">
      <article className={`if3-announcement${compact ? ' if3-announcement-compact' : ''}`} aria-labelledby="if3-news-title">
        <div className="if3-news-mark" aria-hidden="true">
          <span>GDSFF</span>
          <span className="if3-news-mark-line" />
          <strong>iF3</strong>
          <span>GEORGIA</span>
        </div>
        <div className="if3-news-copy">
          <div className="if3-news-meta">
            <p className="eyebrow">{news.eyebrow}</p>
            <time dateTime={if3Membership.date}>{news.dateLabel}</time>
          </div>
          <h2 id="if3-news-title">{news.title}</h2>
          <p>{compact ? news.summary : news.lead}</p>
          {!compact && <p>{news.text}</p>}
          {!compact && (
            <figure className="if3-certificate">
              <h3>{news.certificateHeading}</h3>
              <a href={if3Membership.certificate.pdf} target="_blank" rel="noopener noreferrer">
                <img
                  src={if3Membership.certificate.image}
                  alt={news.certificateAlt}
                  width="1600"
                  height="1238"
                  loading="lazy"
                />
              </a>
              <figcaption>{news.certificateCaption}</figcaption>
              <a className="if3-source-link" href={if3Membership.certificate.pdf} download>
                {news.certificateDownload}
              </a>
            </figure>
          )}
          <div className="if3-news-actions">
            {compact ? (
              <Link className="primary-button" to="/gallery#news-updates">{news.readMore}</Link>
            ) : (
              <Link className="primary-button" to="/membership#online-application">{news.membershipLabel}</Link>
            )}
            <a className="if3-source-link" href={if3Membership.source} target="_blank" rel="noopener noreferrer">
              {news.sourceLabel} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </article>
    </section>
  )
}
