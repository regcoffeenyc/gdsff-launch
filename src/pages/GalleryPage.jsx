import { useSearchParams } from 'react-router-dom'
import GalleryLightbox from '../components/GalleryLightbox'
import { PlayIcon } from '../components/SiteIcons'
import PageHero from '../components/PageHero'
import { normalizeLaunchValue } from '../content/launchNormalizer'
import {
  functionalFitnessCollageSrc,
  logoSrc,
  promoLoopPosterSrc,
  promoLoopSrc,
  rangeHeroSrc,
  ropeClimbCourseSrc,
  tacticalRifleLineSrc,
  weightedCarryLaneSrc,
} from '../siteAssets'

const galleryWallCopy = {
  en: {
    eyebrow: 'Photo Gallery',
    title: 'Competition, training, and federation visuals presented as an official media gallery.',
    text:
      'The gallery now combines the federation range image, emblem usage, and added action photography into one polished media archive for members, partners, and public presentation.',
    items: [
      {
        src: functionalFitnessCollageSrc,
        alt: 'Functional fitness athlete lifting a barbell and carrying a sandbag',
        eyebrow: 'Functional Fitness',
        title: 'Strength Under Pressure',
        text: 'Editorial-style competition imagery showing the intensity and discipline of functional fitness performance.',
      },
      {
        src: tacticalRifleLineSrc,
        alt: 'Tactical athlete with rifle at an outdoor training ground',
        eyebrow: 'Dynamic Shooting',
        title: 'Field Readiness',
        text: 'Range-focused visual material that reinforces the tactical character and discipline of the federation.',
      },
      {
        src: weightedCarryLaneSrc,
        alt: 'Athlete carrying weighted barbells during a tactical fitness event',
        eyebrow: 'Event Coverage',
        title: 'Competition Workload',
        text: 'Live-event photography suitable for bulletins, sponsor decks, and post-event highlights.',
      },
      {
        src: ropeClimbCourseSrc,
        alt: 'Athletes climbing ropes on an outdoor competition course',
        eyebrow: 'Course Design',
        title: 'Outdoor Competition Format',
        text: 'Wide-angle course imagery that broadens the gallery beyond portrait moments and identity shots.',
      },
    ],
  },
  ka: {
    eyebrow: 'ფოტო გალერეა',
    title: 'შეჯიბრების, ვარჯიშისა და ფედერაციის ვიზუალები წარმოდგენილია, როგორც ოფიციალური მედია გალერეა.',
    text:
      'გალერეა ახლა აერთიანებს ფედერაციის მთავარ რენჟის ფოტოს, ემბლემის გამოყენებას და დამატებულ მოქმედებით ფოტოებს ერთ მოწესრიგებულ მედია არქივში წევრებისთვის, პარტნიორებისთვის და საჯარო წარდგენისთვის.',
    items: [
      {
        src: functionalFitnessCollageSrc,
        alt: 'ფუნქციური ფიტნესის სპორტსმენი შტანგის აწევისა და ქვიშის ტომრის ტარების დროს',
        eyebrow: 'ფუნქციური ფიტნესი',
        title: 'ძალა წნეხის ქვეშ',
        text: 'რედაქციული ხასიათის ფოტო, რომელიც ფუნქციური ფიტნესის ინტენსივობასა და დისციპლინას აჩვენებს.',
      },
      {
        src: tacticalRifleLineSrc,
        alt: 'ტაქტიკური მსროლელი გარე სავარჯიშო სივრცეში',
        eyebrow: 'დინამიური სროლა',
        title: 'საველე მზადყოფნა',
        text: 'რენჟზე გადაღებული ვიზუალი, რომელიც ფედერაციის ტაქტიკურ ხასიათსა და დისციპლინას უსვამს ხაზს.',
      },
      {
        src: weightedCarryLaneSrc,
        alt: 'სპორტსმენი ტვირთით გადაადგილების სავარჯიშოზე ტაქტიკური ფიტნესის ღონისძიების დროს',
        eyebrow: 'ღონისძიების გაშუქება',
        title: 'შეჯიბრის დატვირთვა',
        text: 'ღონისძიების ამსახველი ფოტო, რომელიც გამოსადეგია ბიულეტენებისთვის, სპონსორული მასალებისთვის და მიმოხილვებისთვის.',
      },
      {
        src: ropeClimbCourseSrc,
        alt: 'სპორტსმენები ღია სივრცეში მოწყობილ საბაგირო კურსზე',
        eyebrow: 'კურსის დიზაინი',
        title: 'ღია სივრცის შეჯიბრის ფორმატი',
        text: 'ფართო კადრი, რომელიც გალერეას მატებს მასშტაბს და მრავალფეროვან სპორტულ გარემოს.',
      },
    ],
  },
}

const galleryUiCopy = {
  en: {
    viewImage: 'View image',
    viewVideo: 'Watch video',
    close: 'Close image viewer',
    previous: 'Previous image',
    next: 'Next image',
    venueItem: {
      src: rangeHeroSrc,
      alt: 'Federation range prepared for training and competition',
      eyebrow: 'Venue Presentation',
      title: 'Federation Range Environment',
      text:
        'A wide visual of the federation venue presented as part of the official media archive and event-hosting identity.',
    },
  },
  ka: {
    viewImage: '\u10e4\u10dd\u10e2\u10dd\u10e1 \u10dc\u10d0\u10ee\u10d5\u10d0',
    viewVideo: '\u10d5\u10d8\u10d3\u10d4\u10dd\u10e1 \u10e7\u10e3\u10e0\u10d4\u10d1\u10d0',
    close: '\u10e4\u10dd\u10e2\u10dd\u10e1 \u10d3\u10d0\u10ee\u10e3\u10e0\u10d5\u10d0',
    previous: '\u10ec\u10d8\u10dc\u10d0 \u10e4\u10dd\u10e2\u10dd',
    next: '\u10e8\u10d4\u10db\u10d3\u10d4\u10d2\u10d8 \u10e4\u10dd\u10e2\u10dd',
    venueItem: {
      src: rangeHeroSrc,
      alt: '\u10e4\u10d4\u10d3\u10d4\u10e0\u10d0\u10ea\u10d8\u10d8\u10e1 \u10e0\u10d4\u10dc\u10ef\u10d8 \u10d5\u10d0\u10e0\u10ef\u10d8\u10e8\u10d8\u10e1\u10d0 \u10d3\u10d0 \u10e8\u10d4\u10ef\u10d8\u10d1\u10e0\u10d4\u10d1\u10d8\u10e1\u10d7\u10d5\u10d8\u10e1',
      eyebrow: '\u10da\u10dd\u10d9\u10d0\u10ea\u10d8\u10d8\u10e1 \u10de\u10e0\u10d4\u10d6\u10d4\u10dc\u10e2\u10d0\u10ea\u10d8\u10d0',
      title: '\u10e4\u10d4\u10d3\u10d4\u10e0\u10d0\u10ea\u10d8\u10d8\u10e1 \u10e1\u10d0\u10e1\u10d0\u10e0\u10dd\u10da\u10d4 \u10d2\u10d0\u10e0\u10d4\u10db\u10dd',
      text:
        '\u10e4\u10d4\u10d3\u10d4\u10e0\u10d0\u10ea\u10d8\u10d8\u10e1 \u10e1\u10d0\u10e1\u10d0\u10e0\u10dd\u10da\u10d4 \u10e1\u10d8\u10d5\u10e0\u10ea\u10d8\u10e1 \u10e4\u10d0\u10e0\u10d7\u10dd \u10d5\u10d8\u10d6\u10e3\u10d0\u10da\u10d8, \u10e0\u10dd\u10db\u10d4\u10da\u10d8\u10ea \u10ec\u10d0\u10e0\u10db\u10dd\u10d3\u10d2\u10d4\u10dc\u10d8\u10da\u10d8\u10d0 \u10dd\u10e4\u10d8\u10ea\u10d8\u10d0\u10da\u10e3\u10e0 \u10db\u10d4\u10d3\u10d8\u10d0 \u10d0\u10e0\u10e5\u10d8\u10d5\u10e8\u10d8 \u10d3\u10d0 \u10e6\u10dd\u10dc\u10d8\u10e1\u10eb\u10d8\u10d4\u10d1\u10d4\u10d1\u10d8\u10e1 \u10db\u10d0\u10e1\u10de\u10d8\u10dc\u10eb\u10da\u10dd\u10d1\u10d8\u10e1 \u10d8\u10d3\u10d4\u10dc\u10e2\u10dd\u10d1\u10d8\u10e1 \u10dc\u10d0\u10ec\u10d8\u10da\u10d0\u10d3.',
    },
  },
}

export default function GalleryPage({ copy }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const galleryWall = normalizeLaunchValue(galleryWallCopy[localeKey])
  const galleryUi = galleryUiCopy[localeKey]
  const galleryHighlights = []
  const galleryCards = []
  const promoGalleryItem =
    localeKey === 'ka'
      ? {
          mediaType: 'video',
          src: promoLoopSrc,
          posterSrc: promoLoopPosterSrc,
          alt: '\u10dd\u10e4\u10d8\u10ea\u10d8\u10d0\u10da\u10e3\u10e0\u10d8 GDSFF \u10e1\u10d0\u10de\u10e0\u10dd\u10db\u10dd \u10d5\u10d8\u10d3\u10d4\u10dd',
          eyebrow: '\u10dd\u10e4\u10d8\u10ea\u10d8\u10d0\u10da\u10e3\u10e0\u10d8 \u10d5\u10d8\u10d3\u10d4\u10dd',
          title: 'GDSFF Promo Loop',
          text:
            '\u10db\u10dd\u10d9\u10da\u10d4 \u10dd\u10e4\u10d8\u10ea\u10d8\u10d0\u10da\u10e3\u10e0\u10d8 \u10e1\u10d0\u10e4\u10d4\u10d3\u10d4\u10e0\u10d0\u10ea\u10d8\u10dd \u10de\u10e0\u10dd\u10db\u10dd \u10e0\u10dd\u10db\u10d4\u10da\u10d8\u10ea \u10db\u10dd\u10db\u10d6\u10d0\u10d3\u10d4\u10d1\u10e3\u10da\u10d8\u10d0 \u10d2\u10d0\u10da\u10d4\u10e0\u10d4\u10d8\u10e1, \u10db\u10d7\u10d0\u10d5\u10d0\u10e0\u10d8 \u10d2\u10d5\u10d4\u10e0\u10d3\u10d8\u10e1 \u10d3\u10d0 \u10e1\u10d0\u10ef\u10d0\u10e0\u10dd \u10db\u10d4\u10d3\u10d8\u10d0 \u10ec\u10d0\u10e0\u10db\u10dd\u10d3\u10d2\u10d4\u10dc\u10d8\u10e1\u10d7\u10d5\u10d8\u10e1.',
        }
      : {
          mediaType: 'video',
          src: promoLoopSrc,
          posterSrc: promoLoopPosterSrc,
          alt: 'GDSFF official promotional video',
          eyebrow: 'Official Video',
          title: 'GDSFF Promo Loop',
          text:
            'Short-form official federation promo prepared for gallery presentation, homepage hero placement, and launch-ready media use.',
        }
  const galleryWallItems = [promoGalleryItem, ...galleryWall.items]
  const [searchParams, setSearchParams] = useSearchParams()
  const rawLightboxIndex = Number.parseInt(searchParams.get('lightbox') ?? '', 10)
  const lightboxItems = [galleryUi.venueItem, ...galleryWallItems]
  const activeLightboxIndex =
    Number.isInteger(rawLightboxIndex) && rawLightboxIndex >= 0 && rawLightboxIndex < lightboxItems.length
      ? rawLightboxIndex
      : null

  const openLightbox = (index) => {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('lightbox', String(index))
    setSearchParams(nextSearchParams, { replace: true })
  }

  const closeLightbox = () => {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('lightbox')
    setSearchParams(nextSearchParams, { replace: true })
  }

  const renderGalleryMedia = (item) => {
    if (item.mediaType === 'video') {
      return (
        <video
          src={item.src}
          poster={item.posterSrc}
          className="gallery-photo-video"
          muted
          playsInline
          preload="none"
          aria-hidden="true"
        />
      )
    }

    return <img src={item.src} alt={item.alt} loading="lazy" />
  }

  return (
    <>
      <PageHero
        eyebrow={copy.gallery.eyebrow}
        title={copy.gallery.title}
        text={copy.gallery.text}
        highlights={galleryHighlights}
        label={copy.header.highlightsLabel}
      />

      <section className="container page-section">
        <div className="gallery-layout">
          <button
            type="button"
            id="venue-presentation"
            className="gallery-panel gallery-media-button large anchor-section"
            onClick={() => openLightbox(0)}
            aria-haspopup="dialog"
            aria-label={`${galleryUi.viewImage}: ${galleryUi.venueItem.title}`}
          >
            <img src={rangeHeroSrc} alt="Federation range" loading="lazy" />
            <span className="gallery-panel-hint">{galleryUi.viewImage}</span>
          </button>
          <article className="gallery-panel">
            <img src={logoSrc} alt="Federation logo" className="gallery-logo" loading="lazy" />
          </article>
          {galleryCards.length > 0 ? (
            <article id="news-updates" className="gallery-panel text-panel anchor-section">
              {galleryCards.map((item) => (
                <div key={item.title} className="gallery-copy-block">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </article>
          ) : null}
        </div>
      </section>

      <section id="photo-gallery" className="container section-space anchor-section">
        <div className="section-intro gallery-section-intro">
          <p className="eyebrow">{galleryWall.eyebrow}</p>
          <h2>{galleryWall.title}</h2>
          <p className="section-copy">{galleryWall.text}</p>
        </div>

        <div className="gallery-photo-wall">
          {galleryWallItems.map((item, index) => (
            <button
              type="button"
              key={item.title}
              className={index === 0 ? 'gallery-photo-card is-featured' : 'gallery-photo-card'}
              onClick={() => openLightbox(index + 1)}
              aria-haspopup="dialog"
              aria-label={`${item.mediaType === 'video' ? galleryUi.viewVideo : galleryUi.viewImage}: ${item.title}`}
            >
              {renderGalleryMedia(item)}
              <div className="gallery-photo-overlay">
                <span className="overlay-kicker">{item.eyebrow}</span>
                <span className="gallery-view-hint">
                  {item.mediaType === 'video' ? (
                    <>
                      <PlayIcon className="gallery-view-icon" />
                      {galleryUi.viewVideo}
                    </>
                  ) : (
                    galleryUi.viewImage
                  )}
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <GalleryLightbox
        items={lightboxItems}
        activeIndex={activeLightboxIndex}
        onClose={closeLightbox}
        onNavigate={openLightbox}
        labels={{
          close: galleryUi.close,
          previous: galleryUi.previous,
          next: galleryUi.next,
        }}
      />
    </>
  )
}
