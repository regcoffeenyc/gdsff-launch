import { useState } from 'react'
import GalleryLightbox from '../components/GalleryLightbox'
import PageHero from '../components/PageHero'
import { officialLaunchContent } from '../content/officialLaunchContent'

export default function LeadershipPage({ copy }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const view = officialLaunchContent[localeKey].leadership
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null)
  const lightboxLabels =
    localeKey === 'ka'
      ? {
          view: 'პორტრეტის ნახვა',
          close: 'პორტრეტის დახურვა',
          previous: 'წინა ფოტო',
          next: 'შემდეგი ფოტო',
        }
      : {
          view: 'View portrait',
          close: 'Close portrait viewer',
          previous: 'Previous portrait',
          next: 'Next portrait',
        }
  const lightboxItems = view.profiles
    .filter((profile) => profile.imageSrc)
    .map((profile) => ({
      id: profile.id,
      src: profile.imageSrc,
      alt: profile.imageAlt ?? `${profile.name} portrait`,
      eyebrow: profile.role,
      title: profile.name,
      text: profile.text,
    }))

  return (
    <>
      <PageHero
        eyebrow={view.eyebrow}
        title={view.title}
        text={view.text}
        highlights={view.highlights}
        label={copy.header.highlightsLabel}
      />

      <section className="container page-section">
        <article className="feature-card content-stack-card">
          <span className="card-kicker">{view.introTitle}</span>
          <p>{view.introText}</p>
        </article>
      </section>

      <section id="leadership-profiles" className="container section-space anchor-section">
        <div className="card-grid two-col">
          {view.profiles.map((profile) => (
            <article key={profile.id} id={profile.id} className="feature-card profile-card anchor-section">
              {profile.imageSrc ? (
                <button
                  type="button"
                  className="profile-portrait-button"
                  aria-haspopup="dialog"
                  aria-label={`${lightboxLabels.view}: ${profile.name}`}
                  onClick={() => {
                    const profileIndex = lightboxItems.findIndex((item) => item.id === profile.id)

                    if (profileIndex >= 0) {
                      setActiveLightboxIndex(profileIndex)
                    }
                  }}
                >
                  <div className="profile-portrait">
                    <img src={profile.imageSrc} alt={profile.imageAlt ?? `${profile.name} portrait`} loading="lazy" />
                  </div>
                </button>
              ) : (
                <div className="profile-avatar">{profile.name.slice(0, 2).toUpperCase()}</div>
              )}
              <span className="card-kicker">{profile.role}</span>
              <h3>{profile.name}</h3>
              <p>{profile.text}</p>
              <div className="document-actions">
                <a href={profile.href} className="download-action" download>
                  {profile.actionLabel}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <GalleryLightbox
        items={lightboxItems}
        activeIndex={activeLightboxIndex}
        onClose={() => setActiveLightboxIndex(null)}
        onNavigate={setActiveLightboxIndex}
        labels={{
          close: lightboxLabels.close,
          previous: lightboxLabels.previous,
          next: lightboxLabels.next,
        }}
      />
    </>
  )
}
