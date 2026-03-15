import PageHero from '../components/PageHero'
import { normalizeLaunchValue } from '../content/launchNormalizer'
import {
  functionalFitnessCollageSrc,
  logoSrc,
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

export default function GalleryPage({ copy }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const galleryWall = normalizeLaunchValue(galleryWallCopy[localeKey])

  return (
    <>
      <PageHero
        eyebrow={copy.gallery.eyebrow}
        title={copy.gallery.title}
        text={copy.gallery.text}
        highlights={copy.gallery.highlights}
        label={copy.header.highlightsLabel}
      />

      <section className="container page-section">
        <div className="gallery-layout">
          <article id="venue-presentation" className="gallery-panel large anchor-section">
            <img src={rangeHeroSrc} alt="Federation range" loading="lazy" />
          </article>
          <article className="gallery-panel">
            <img src={logoSrc} alt="Federation logo" className="gallery-logo" loading="lazy" />
          </article>
          <article id="news-updates" className="gallery-panel text-panel anchor-section">
            {copy.gallery.cards.map((item) => (
              <div key={item.title} className="gallery-copy-block">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </article>
        </div>
      </section>

      <section id="photo-gallery" className="container section-space anchor-section">
        <div className="section-intro gallery-section-intro">
          <p className="eyebrow">{galleryWall.eyebrow}</p>
          <h2>{galleryWall.title}</h2>
          <p className="section-copy">{galleryWall.text}</p>
        </div>

        <div className="gallery-photo-wall">
          {galleryWall.items.map((item, index) => (
            <article
              key={item.title}
              className={index === 0 ? 'gallery-photo-card is-featured' : 'gallery-photo-card'}
            >
              <img src={item.src} alt={item.alt} loading="lazy" />
              <div className="gallery-photo-overlay">
                <span className="overlay-kicker">{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
