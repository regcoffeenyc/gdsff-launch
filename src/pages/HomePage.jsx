import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import GalleryLightbox from '../components/GalleryLightbox'
import { membershipApplicationContent } from '../content/membershipApplicationContent'
import { officialLaunchContent } from '../content/officialLaunchContent'
import { EmailLink, LocationLink, PhoneLink, SocialLinks } from '../components/SiteMetaLinks'
import { getMembershipSummary } from '../utils/socialHubApi'
import {
  federationBadgeArtSrc,
  functionalFitnessCollageSrc,
  logoSrc,
  rangeHeroSrc,
  ropeClimbCourseSrc,
  tacticalRifleLineSrc,
  weightedCarryLaneSrc,
} from '../siteAssets'

function formatPreviewDate(event, locale) {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  })

  const start = new Date(`${event.date}T00:00:00`)
  const end = new Date(`${event.endDate ?? event.date}T00:00:00`)

  if (event.endDate && event.endDate !== event.date) {
    return `${formatter.format(start)} - ${formatter.format(end)}`
  }

  return formatter.format(start)
}

const homePageCopy = {
  en: {
    hero: {
      eyebrow: 'Official Federation Platform',
      lead:
        'Building a national platform for dynamic shooting, functional fitness, athlete development, and international competition.',
      text:
        'GDSFF presents a disciplined public platform for governance, competition delivery, athlete progression, institutional visibility, and tactical sport development in Georgia.',
      primaryAction: { label: 'Explore Federation', to: '/about#federation-overview' },
      secondaryAction: { label: 'View Events', to: '/events#calendar-2026' },
      metrics: [
        { value: '2026', label: 'Official launch season' },
        { value: '2', label: 'Core disciplines' },
        { value: 'International', label: 'Public-facing standard' },
      ],
      briefTitle: 'Federation Brief',
      briefItems: [
        'Official governance, competition, and institutional identity presented in one disciplined digital platform.',
        'Dynamic shooting and functional fitness aligned under one disciplined federation standard.',
        'Built for athlete development, event readiness, and international cooperation.',
      ],
    },
    mission: {
      eyebrow: 'Mission / Identity',
      title: 'A modern federation platform built for discipline, performance, and public credibility.',
      text:
        'The launch website presents the federation through a strong institutional identity supported by development, safety culture, event structure, and international ambition.',
      items: [
        {
          title: 'Dynamic Shooting Development',
          text: 'Support the structured growth of dynamic shooting through standards, competition, and athlete progression.',
        },
        {
          title: 'Functional Fitness Promotion',
          text: 'Promote functional fitness through disciplined competitive formats and performance-focused programming.',
        },
        {
          title: 'Athlete Development',
          text: 'Create a visible framework for athletes, coaches, clubs, and development-oriented participation.',
        },
        {
          title: 'Institutional Strengthening',
          text: 'Present the federation with legal clarity, organizational structure, and credible public communication.',
        },
        {
          title: 'International Cooperation',
          text: 'Expand federation visibility and cooperation through partnerships, events, and cross-border engagement.',
        },
      ],
    },
    disciplines: {
      eyebrow: 'Disciplines',
      title: 'Two disciplines united under one official federation standard.',
      items: [
        {
          title: 'Dynamic Shooting',
          text:
            'Precision, controlled movement, stage-based competition, and safe execution define the dynamic shooting format.',
          src: tacticalRifleLineSrc,
          link: '/sports#dynamic-shooting',
        },
        {
          title: 'Functional Fitness',
          text:
            'Strength, endurance, resilience, and competitive work capacity come together in the functional fitness discipline.',
          src: functionalFitnessCollageSrc,
          link: '/sports#functional-fitness',
        },
      ],
    },
    events: {
      eyebrow: 'Events Preview',
      title: 'The 2026 federation season is presented through an official calendar view.',
      text:
        'The events section gives athletes, clubs, partners, and guests a professional view of the federation season and its publishing structure.',
      actionLabel: 'Open Full Calendar',
    },
    hub: {
      eyebrow: 'Georgia as a Sport Hub',
      title: 'Georgia positioned as a credible regional base for tactical sport, training, and event hosting.',
      text:
        'The federation vision places Georgia as a regional hub for dynamic shooting, functional fitness, international competitions, training programs, and sports tourism.',
      pillars: [
        'Regional accessibility for visiting athletes, partners, and event stakeholders',
        'Strong potential for camps, showcase competitions, and championship weekends',
        'Tourism value and host-destination appeal for outdoor sport presentation',
        'Institutional and operational potential for long-term federation-led growth',
      ],
    },
    media: {
      eyebrow: 'Media / Gallery Preview',
      title: 'Official visual identity supported by range presentation, emblem use, and event imagery.',
      text:
        'The media area is built for public bulletins, editorial storytelling, and sponsor-facing federation presentation.',
      actionLabel: 'View Full Gallery',
      items: [
        { title: 'Federation Emblem', src: federationBadgeArtSrc, alt: 'GDSFF emblem artwork', to: '/gallery#news-updates' },
        { title: 'Range Presentation', src: rangeHeroSrc, alt: 'Federation range', to: '/gallery#venue-presentation' },
        { title: 'Competition Coverage', src: ropeClimbCourseSrc, alt: 'Outdoor competition course', to: '/gallery#photo-gallery' },
      ],
    },
    closing: {
      eyebrow: 'Final Contact / CTA',
      title: 'Coordinate with GDSFF for federation communication, events, media, and institutional cooperation.',
      text:
        'Official federation channels are open for clubs, athletes, partners, host venues, and public or institutional communication.',
      actionLabel: 'Contact Federation',
      mapsLabel: 'Open Google Maps',
      coordinatesLabel: 'Coordinates',
      profileActionLabel: 'View Profile',
    },
  },
  ka: {
    hero: {
      eyebrow: 'ფედერაციის ოფიციალური პლატფორმა',
      lead:
        'ეროვნული პლატფორმა დინამიური სროლის, ფუნქციური ფიტნესის, სპორტსმენთა განვითარების და საერთაშორისო შეჯიბრებებისთვის.',
      text:
        'GDSFF წარმოადგენს დისციპლინირებულ საჯარო პლატფორმას მმართველობისთვის, შეჯიბრებების ორგანიზებისთვის, სპორტსმენთა წინსვლისთვის, ინსტიტუციური ხილვადობისთვის და ტაქტიკური სპორტის განვითარებისთვის საქართველოში.',
      primaryAction: { label: 'ფედერაციის გაცნობა', to: '/about#federation-overview' },
      secondaryAction: { label: 'ღონისძიებების ნახვა', to: '/events#calendar-2026' },
      metrics: [
        { value: '2026', label: 'ოფიციალური გაშვების სეზონი' },
        { value: '2', label: 'ძირითადი დისციპლინა' },
        { value: 'საერთაშორისო', label: 'საჯარო სტანდარტი' },
      ],
      briefTitle: 'ფედერაციის მოკლე მიმოხილვა',
      briefItems: [
        'ოფიციალური მმართველობა, შეჯიბრებები და ინსტიტუციური იდენტობა წარმოდგენილია ერთ გაშვებისთვის მზა პლატფორმაში.',
        'დინამიური სროლა და ფუნქციური ფიტნესი გაერთიანებულია ერთ დისციპლინირებულ ფედერაციულ სტანდარტში.',
        'პლატფორმა შექმნილია სპორტსმენთა განვითარებისთვის, ღონისძიებების მზადყოფნისთვის და საერთაშორისო თანამშრომლობისთვის.',
      ],
    },
    mission: {
      eyebrow: 'მისია / იდენტობა',
      title: 'თანამედროვე ფედერაციული პლატფორმა დისციპლინის, შედეგისა და საჯარო სანდოობისთვის.',
      text:
        'საიტი წარმოაჩენს ფედერაციას ძლიერი ინსტიტუციური იდენტობით, რომელსაც ამყარებს განვითარება, უსაფრთხოების კულტურა, ღონისძიებების სტრუქტურა და საერთაშორისო ხედვა.',
      items: [
        {
          title: 'დინამიური სროლის განვითარება',
          text: 'დინამიური სროლის სტრუქტურირებული განვითარება სტანდარტებით, შეჯიბრებებით და სპორტსმენთა წინსვლით.',
        },
        {
          title: 'ფუნქციური ფიტნესის გაძლიერება',
          text: 'ფუნქციური ფიტნესის ხელშეწყობა დისციპლინირებული კონკურენტული ფორმატებით და შედეგზე ორიენტირებული პროგრამებით.',
        },
        {
          title: 'სპორტსმენთა განვითარება',
          text: 'მკაფიო განვითარების ჩარჩო სპორტსმენებისთვის, მწვრთნელებისთვის, კლუბებისა და ჩართული პირებისთვის.',
        },
        {
          title: 'ინსტიტუციური გაძლიერება',
          text: 'ფედერაციის წარდგენა სამართლებრივი სიცხადით, ორგანიზაციული სტრუქტურით და სანდო საჯარო კომუნიკაციით.',
        },
        {
          title: 'საერთაშორისო თანამშრომლობა',
          text: 'ფედერაციის ხილვადობისა და თანამშრომლობის გაფართოება პარტნიორობებით, ღონისძიებებით და საერთაშორისო ჩართულობით.',
        },
      ],
    },
    disciplines: {
      eyebrow: 'დისციპლინები',
      title: 'ორი დისციპლინა გაერთიანებულია ერთ ოფიციალურ ფედერაციულ სტანდარტში.',
      items: [
        {
          title: 'დინამიური სროლა',
          text:
            'სიზუსტე, კონტროლირებული მოძრაობა, სტეიჯებზე დაფუძნებული შეჯიბრი და უსაფრთხო შესრულება განსაზღვრავს დინამიური სროლის ფორმატს.',
          src: tacticalRifleLineSrc,
          link: '/sports#dynamic-shooting',
        },
        {
          title: 'ფუნქციური ფიტნესი',
          text:
            'ძალა, გამძლეობა, მედეგობა და კონკურენტული სამუშაოუნარიანობა ერთიანდება ფუნქციური ფიტნესის დისციპლინაში.',
          src: functionalFitnessCollageSrc,
          link: '/sports#functional-fitness',
        },
      ],
    },
    events: {
      eyebrow: 'ღონისძიებების მიმოხილვა',
      title: '2026 წლის საწყისი ღონისძიებები უკვე წარმოდგენილია ოფიციალური კალენდრის ფორმატში.',
      text:
        'ღონისძიებების სექცია სპორტსმენებს, კლუბებს, პარტნიორებსა და სტუმრებს სთავაზობს მომავალი სეზონის პროფესიულ მიმოხილვას.',
      actionLabel: 'სრული კალენდარი',
    },
    hub: {
      eyebrow: 'საქართველო როგორც სპორტული ჰაბი',
      title: 'საქართველო, როგორც სანდო რეგიონული პლატფორმა ტაქტიკური სპორტის, მომზადებისა და მასპინძლობისთვის.',
      text:
        'ფედერაციის ხედვაა, რომ საქართველო ჩამოყალიბდეს რეგიონულ ჰაბად დინამიური სროლის, ფუნქციური ფიტნესის, საერთაშორისო შეჯიბრებების, საწვრთნელი პროგრამებისა და სპორტული ტურიზმის მიმართულებით.',
      pillars: [
        'რეგიონული ხელმისაწვდომობა სპორტსმენებისთვის, პარტნიორებისთვის და ღონისძიებების მონაწილეებისთვის',
        'ბანაკების, საჩვენებელი შეჯიბრებებისა და ჩემპიონატის შაბათ-კვირის მასპინძლობის ძლიერი პოტენციალი',
        'ტურისტული ღირებულება და მასპინძელი ქვეყნის მიმზიდველობა ღია სპორტული ფორმატებისთვის',
        'ინსტიტუციური და საოპერაციო პოტენციალი ფედერაციის გრძელვადიანი ზრდისთვის',
      ],
    },
    media: {
      eyebrow: 'მედია / გალერეის მიმოხილვა',
      title: 'ოფიციალური ვიზუალური იდენტობა გამყარებულია რენჟის პრეზენტაციით, ემბლემით და ღონისძიებების ფოტოებით.',
      text:
        'მედიის სივრცე შექმნილია საჯარო ბიულეტენებისთვის, სარედაქციო თხრობისთვის და პარტნიორებზე ორიენტირებული წარდგენისთვის.',
      actionLabel: 'სრული გალერეა',
      items: [
        { title: 'ფედერაციის ემბლემა', src: federationBadgeArtSrc, alt: 'GDSFF ემბლემა', to: '/gallery#news-updates' },
        { title: 'რენჟის პრეზენტაცია', src: rangeHeroSrc, alt: 'ფედერაციის რენჟი', to: '/gallery#venue-presentation' },
        { title: 'ღონისძიების გაშუქება', src: ropeClimbCourseSrc, alt: 'შეჯიბრების სივრცე', to: '/gallery#photo-gallery' },
      ],
    },
    closing: {
      eyebrow: 'საბოლოო კონტაქტი / CTA',
      title: 'დაუკავშირდით GDSFF-ს ფედერაციული კომუნიკაციის, ღონისძიებების, მედიისა და ინსტიტუციური თანამშრომლობისთვის.',
      text:
        'ფედერაციის ოფიციალური არხები ღიაა კლუბებისთვის, სპორტსმენებისთვის, პარტნიორებისთვის, მასპინძელი ლოკაციებისთვის და საჯარო თუ ინსტიტუციური კომუნიკაციისთვის.',
      actionLabel: 'კონტაქტი',
      mapsLabel: 'Google Maps-ის გახსნა',
      coordinatesLabel: 'კოორდინატები',
      profileActionLabel: 'პროფილის ნახვა',
    },
  },
}

export default function HomePage({ copy }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const showLocation = copy.meta.showLocation !== false
  const view = homePageCopy[localeKey]
  const launch = officialLaunchContent[localeKey]
  const membershipFormView = membershipApplicationContent[localeKey]
  const [membershipSummary, setMembershipSummary] = useState({ totalApplications: 0 })
  const [leadershipLightboxIndex, setLeadershipLightboxIndex] = useState(null)
  const featuredEvents = copy.events.calendar.events.slice(0, 4)
  const facebookLink =
    copy.meta.socials.find((item) => item.id === 'facebook')?.href ??
    'https://www.facebook.com/profile.php?id=61578666412435'
  const instagramLink =
    copy.meta.socials.find((item) => item.id === 'instagram')?.href ??
    'https://www.instagram.com/gdsffofficial/?hl=en'
  const leadershipLightboxLabels =
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
  const leadershipLightboxItems = launch.leadership.profiles
    .filter((profile) => profile.imageSrc)
    .map((profile) => ({
      id: profile.id,
      src: profile.imageSrc,
      alt: profile.imageAlt ?? `${profile.name} portrait`,
      eyebrow: profile.role,
      title: profile.name,
      text: profile.text,
    }))

  useEffect(() => {
    let cancelled = false

    async function loadMembershipSummary() {
      try {
        const result = await getMembershipSummary()
        if (cancelled) {
          return
        }

        setMembershipSummary(result.summary || { totalApplications: 0 })
      } catch {
        if (cancelled) {
          return
        }

        setMembershipSummary({ totalApplications: 0 })
      }
    }

    loadMembershipSummary()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <section className="home-hero">
        <div
          className="home-hero-media"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(6, 8, 10, 0.88) 0%, rgba(6, 8, 10, 0.72) 42%, rgba(6, 8, 10, 0.55) 100%), url(${rangeHeroSrc})`,
          }}
        />
        <div className="home-hero-tint" />

        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <div className="hero-kicker-row">
              <span className="hero-badge">{view.hero.eyebrow}</span>
              <span className="hero-badge muted-badge">{copy.brand.shortName}</span>
            </div>

            <div className="home-hero-brand">
              <img src={logoSrc} alt="GDSFF federation emblem" className="home-hero-logo" />
              <div>
                <p className="hero-slogan">{copy.brand.slogan}</p>
                <h1>{copy.brand.fullName}</h1>
              </div>
            </div>

            <p className="home-hero-lead">{view.hero.lead}</p>
            <p className="home-hero-text">{view.hero.text}</p>

            <div className="hero-actions">
              <Link className="primary-button" to={view.hero.primaryAction.to}>
                {view.hero.primaryAction.label}
              </Link>
              <Link className="secondary-button" to={view.hero.secondaryAction.to}>
                {view.hero.secondaryAction.label}
              </Link>
            </div>

            <div className="home-hero-metrics">
              {view.hero.metrics.map((item) => (
                <article key={item.label} className="hero-metric-card">
                  <span className="hero-metric-value">{item.value}</span>
                  <span className="hero-metric-label">{item.label}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="home-hero-aside">
            <article className="hero-aside-card">
              <span className="panel-kicker">{view.hero.briefTitle}</span>
              <div className="hero-command-list">
                {view.hero.briefItems.map((item) => (
                  <div key={item} className="hero-command-item">
                    <span className="dot" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="container section-space">
        <div className="section-intro">
          <p className="eyebrow">{view.mission.eyebrow}</p>
          <h2>{view.mission.title}</h2>
          <p className="section-copy">{view.mission.text}</p>
        </div>

        <div className="mission-grid">
          {view.mission.items.map((item) => (
            <article key={item.title} className="feature-card mission-card">
              <span className="mission-index">{item.title.slice(0, 2).toUpperCase()}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container section-space">
        <div className="section-intro">
          <p className="eyebrow">{view.disciplines.eyebrow}</p>
          <h2>{view.disciplines.title}</h2>
        </div>

        <div className="discipline-grid">
          {view.disciplines.items.map((item) => (
            <article key={item.title} className="discipline-card">
              <img src={item.src} alt={item.title} className="discipline-image" loading="lazy" />
              <div className="discipline-overlay">
                <span className="overlay-kicker">{view.disciplines.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Link className="discipline-link" to={item.link}>
                  {item.title}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container section-space split-showcase">
        <div>
          <div className="section-intro compact-intro">
            <p className="eyebrow">{view.events.eyebrow}</p>
            <h2>{view.events.title}</h2>
            <p className="section-copy">{view.events.text}</p>
          </div>

          <Link className="secondary-button inline-button" to="/events#calendar-2026">
            {view.events.actionLabel}
          </Link>
        </div>

        <div className="events-preview-grid">
          {featuredEvents.map((event) => (
            <article key={`${event.date}-${event.title}`} className="event-preview-card premium-event-card">
              <div className="event-card-top">
                <span className="card-kicker">{event.type}</span>
                <span className="event-status">{event.status}</span>
              </div>
              <h3>{event.title}</h3>
              <p className="event-date">{formatPreviewDate(event, copy.locale)}</p>
              <p className="event-location">{event.location}</p>
              <p>{event.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container section-space">
        <div className="geo-hub-panel">
          <div className="geo-hub-copy">
            <p className="eyebrow">{view.hub.eyebrow}</p>
            <h2>{view.hub.title}</h2>
            <p className="section-copy">{view.hub.text}</p>

            <div className="detail-list">
              {view.hub.pillars.map((item) => (
                <div key={item} className="detail-list-item">
                  <span className="dot" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="geo-hub-visual">
            <img src={weightedCarryLaneSrc} alt="Weighted carry competition lane" loading="lazy" />
            {showLocation ? (
              <div className="geo-hub-badge">
                <span className="panel-kicker">{view.closing.coordinatesLabel}</span>
                <strong>{copy.meta.locationLabel}</strong>
                <LocationLink href={copy.meta.locationHref} label={view.closing.mapsLabel} className="geo-hub-link" />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="container section-space">
        <div className="section-intro compact-intro">
          <p className="eyebrow">{launch.home.leadershipEyebrow}</p>
          <h2>{launch.home.leadershipTitle}</h2>
          <p className="section-copy">{launch.home.leadershipText}</p>
        </div>

        <div className="card-grid two-col">
          {launch.leadership.profiles.map((profile) => (
            <article key={profile.id} className="feature-card leadership-preview-card">
              {profile.imageSrc ? (
                <button
                  type="button"
                  className="leadership-preview-media-button"
                  aria-haspopup="dialog"
                  aria-label={`${leadershipLightboxLabels.view}: ${profile.name}`}
                  onClick={() => {
                    const profileIndex = leadershipLightboxItems.findIndex((item) => item.id === profile.id)

                    if (profileIndex >= 0) {
                      setLeadershipLightboxIndex(profileIndex)
                    }
                  }}
                >
                  <div className="leadership-preview-media">
                    <img src={profile.imageSrc} alt={profile.imageAlt ?? `${profile.name} portrait`} loading="lazy" />
                  </div>
                </button>
              ) : (
                <div className="profile-avatar leadership-preview-avatar">{profile.name.slice(0, 2).toUpperCase()}</div>
              )}

              <div className="leadership-preview-copy">
                <span className="card-kicker">{profile.role}</span>
                <h3>{profile.name}</h3>
                <p>{profile.text}</p>
                <div className="document-actions">
                  <Link className="download-action" to={`/leadership#${profile.id}`}>
                    {view.closing.profileActionLabel}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container section-space split-section">
        <article className="feature-card content-stack-card">
          <span className="card-kicker">{launch.home.membershipEyebrow}</span>
          <h3>{launch.home.membershipTitle}</h3>
          <p>{membershipFormView.introText}</p>
          <div className="home-membership-live-stat">
            <span>{membershipFormView.totalApplicationsLabel}</span>
            <strong>{String(membershipSummary.totalApplications || 0).padStart(2, '0')}</strong>
          </div>
          {[membershipFormView.processText, membershipFormView.supportText].map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <div className="document-actions">
            <Link className="download-action" to="/membership#online-application">
              {launch.home.membershipActionLabel}
            </Link>
          </div>
        </article>

        <article className="feature-card content-stack-card">
          <span className="card-kicker">{launch.home.documentsEyebrow}</span>
          <h3>{launch.home.documentsTitle}</h3>
          <p>{launch.home.documentsText}</p>
          <div className="detail-list">
            {launch.documents.items.slice(0, 3).map((item) => (
              <div key={item.fileName} className="detail-list-item">
                <span className="dot" />
                <p>{item.title}</p>
              </div>
            ))}
          </div>
          <div className="document-actions">
            <Link className="download-action" to="/documents#downloads">
              {launch.home.documentsActionLabel}
            </Link>
          </div>
        </article>
      </section>

      <section className="container section-space">
        <div className="media-preview-shell">
          <div className="section-intro compact-intro">
            <p className="eyebrow">{view.media.eyebrow}</p>
            <h2>{view.media.title}</h2>
            <p className="section-copy">{view.media.text}</p>
          </div>

          <div className="media-preview-grid">
            {view.media.items.map((item) => (
              <Link key={item.title} to={item.to} className="media-preview-card">
                <img src={item.src} alt={item.alt} loading="lazy" />
                <div className="media-preview-overlay">
                  <span className="overlay-kicker">{view.media.eyebrow}</span>
                  <h3>{item.title}</h3>
                </div>
              </Link>
            ))}
          </div>

          <div className="section-actions">
            <Link className="secondary-button inline-button" to="/gallery#photo-gallery">
              {view.media.actionLabel}
            </Link>
          </div>
        </div>
      </section>

      <section className="container section-space">
        <div className="federation-cta-panel">
          <div className="federation-cta-copy">
            <p className="eyebrow">{view.closing.eyebrow}</p>
            <h2>{view.closing.title}</h2>
            <p className="section-copy">{view.closing.text}</p>
          </div>

          <div className="federation-contact-grid">
            <EmailLink email={copy.meta.email} className="contact-directory-link" />
            <PhoneLink phone={copy.meta.phone} className="contact-directory-link" />
            {showLocation ? (
              <LocationLink href={copy.meta.locationHref} label={copy.meta.locationLabel} className="contact-directory-link" />
            ) : null}
            <a href={facebookLink} className="contact-directory-link" target="_blank" rel="noreferrer">
              <span>{copy.meta.facebookPageName}</span>
            </a>
            <a href={instagramLink} className="contact-directory-link" target="_blank" rel="noreferrer">
              <span>{copy.meta.instagramHandle}</span>
            </a>
          </div>

          <div className="federation-cta-actions">
            <SocialLinks items={copy.meta.socials} className="footer-socials" />
            <Link className="primary-button" to="/contact#contact-directory">
              {view.closing.actionLabel}
            </Link>
          </div>
        </div>
      </section>

      <GalleryLightbox
        items={leadershipLightboxItems}
        activeIndex={leadershipLightboxIndex}
        onClose={() => setLeadershipLightboxIndex(null)}
        onNavigate={setLeadershipLightboxIndex}
        labels={{
          close: leadershipLightboxLabels.close,
          previous: leadershipLightboxLabels.previous,
          next: leadershipLightboxLabels.next,
        }}
      />
    </>
  )
}
