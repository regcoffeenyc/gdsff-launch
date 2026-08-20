// Per-route, per-language metadata used by scripts/prerender.mjs.
// Indexable routes get sitemap entries; noindex routes are prerendered
// (so deep links work) but excluded from search.

export const SITE = 'https://www.gdsff.com'
export const OG_IMAGE = `${SITE}/gdsff-logo-approved.png`

export const routesMeta = {
  '/': {
    ka: {
      title: 'GDSFF | დინამიური სროლის ფედერაცია საქართველოში',
      description:
        'გაიგეთ GDSFF-ის შეჯიბრებების, ვარჯიშების, წევრობისა და უსაფრთხო დინამიური სროლის პროგრამების შესახებ საქართველოში.',
    },
    en: {
      title: 'GDSFF | Georgian Dynamic Shooting Federation',
      description:
        'Learn about GDSFF competitions, training, membership and safe dynamic shooting programs in Georgia.',
    },
  },
  '/about': {
    ka: {
      title: 'ჩვენ შესახებ | GDSFF',
      description:
        'გაეცანით საქართველოს დინამიური სროლისა და ფუნქციური ფიტნესის ფედერაციის მისიას, წესდებასა და ისტორიას.',
    },
    en: {
      title: 'About GDSFF | Georgian Shooting Federation',
      description:
        'The mission, charter and history of the Georgian Dynamic Shooting & Functional Fitness Federation.',
    },
  },
  '/sports': {
    ka: {
      title: 'სპორტული დისციპლინები | GDSFF',
      description:
        'დინამიური სროლა, ფუნქციური ფიტნესი და სხვა დისციპლინები GDSFF-ის ეგიდით საქართველოში.',
    },
    en: {
      title: 'Sports Disciplines | GDSFF',
      description:
        'Dynamic shooting, functional fitness and other disciplines governed by GDSFF in Georgia.',
    },
  },
  '/leadership': {
    ka: {
      title: 'ხელმძღვანელობა | GDSFF',
      description: 'GDSFF-ის ხელმძღვანელობა — პრეზიდენტი, დირექტორი და გუნდი.',
    },
    en: {
      title: 'Leadership | GDSFF',
      description: 'GDSFF leadership — president, director and the federation team.',
    },
  },
  '/membership': {
    ka: {
      title: 'გახდი წევრი | GDSFF',
      description:
        'შემოუერთდით GDSFF-ს — წევრობის ონლაინ განაცხადი სპორტსმენებისთვის, კლუბებისა და პარტნიორებისთვის.',
    },
    en: {
      title: 'Become a Member | GDSFF',
      description:
        'Join GDSFF — online membership application for athletes, clubs and partners in Georgia.',
    },
  },
  '/events': {
    ka: {
      title: 'შეჯიბრებები და ივენთები | GDSFF',
      description:
        'GDSFF-ის 2026 წლის კალენდარი — ეროვნული ჩემპიონატები, სავარჯიშო ბანაკები და საერთაშორისო ივენთები.',
    },
    en: {
      title: 'Shooting Events & Competitions in Georgia | GDSFF',
      description:
        'GDSFF 2026 calendar — national championships, training camps and international events in Georgia.',
    },
  },
  '/partners': {
    ka: {
      title: 'პარტნიორები | GDSFF',
      description: 'GDSFF-ის პარტნიორი ორგანიზაციები, სასროლეთები და მხარდამჭერები.',
    },
    en: {
      title: 'Partners | GDSFF',
      description: 'GDSFF partner organizations, shooting ranges and supporters.',
    },
  },
  '/support': {
    ka: {
      title: 'მხარდაჭერა და სპონსორობა | GDSFF',
      description:
        'დაუჭირეთ მხარი GDSFF-ს — სპონსორობა, შემოწირულობები და თანამშრომლობის შესაძლებლობები.',
    },
    en: {
      title: 'Support GDSFF | Sponsorship & Donations',
      description:
        'Support GDSFF — sponsorship, donations and partnership opportunities for shooting sports in Georgia.',
    },
  },
  '/gallery': {
    ka: {
      title: 'გალერეა | GDSFF',
      description: 'ფოტო და ვიდეო მასალა GDSFF-ის შეჯიბრებებიდან, ვარჯიშებიდან და ივენთებიდან.',
    },
    en: {
      title: 'Gallery | GDSFF',
      description: 'Photos and videos from GDSFF competitions, training sessions and events.',
    },
  },
  '/documents': {
    ka: {
      title: 'წესები და დოკუმენტები | GDSFF',
      description:
        'ოფიციალური დოკუმენტები — წესდება, წევრობის განაცხადი, უსაფრთხოების წესები და რეგლამენტები.',
    },
    en: {
      title: 'Rules, Forms & Official Documents | GDSFF',
      description:
        'Official documents — charter, membership application, safety rules and regulations.',
    },
  },
  '/glossary': {
    ka: {
      title: 'განმარტებითი ლექსიკონი | GDSFF',
      description: 'სასროლო სპორტის ტერმინების განმარტებითი ლექსიკონი ქართულად — ჩამოტვირთვადი PDF ვერსიით.',
    },
    en: {
      title: 'Shooting Sports Glossary | GDSFF',
      description: 'Glossary of shooting sports terminology with a downloadable PDF version.',
    },
  },
  '/safety-consent': {
    ka: {
      title: 'უსაფრთხოების თანხმობა | GDSFF',
      description: 'GDSFF-ის უსაფრთხოების წესებზე თანხმობის ფორმა სროლის ღონისძიებებში მონაწილეობისთვის.',
    },
    en: {
      title: 'Safety Consent | GDSFF',
      description: 'GDSFF safety rules consent form for participation in shooting events.',
    },
  },
  '/contact': {
    ka: {
      title: 'კონტაქტი | GDSFF',
      description:
        'დაუკავშირდით საქართველოს დინამიური სროლისა და ფუნქციური ფიტნესის ფედერაციას — ტელეფონი, ელფოსტა, მისამართი.',
    },
    en: {
      title: 'Contact GDSFF | Georgian Shooting Federation',
      description:
        'Get in touch with the Georgian Dynamic Shooting & Functional Fitness Federation — phone, email, address.',
    },
  },
  // Prerendered so deep links work, but excluded from search and sitemap.
  '/search': {
    noindex: true,
    ka: { title: 'ძიება | GDSFF', description: 'ძიება GDSFF-ის საიტზე.' },
    en: { title: 'Search | GDSFF', description: 'Search the GDSFF website.' },
  },
  '/membership-admin': {
    noindex: true,
    ka: { title: 'ადმინისტრირება | GDSFF', description: 'GDSFF წევრობის ადმინისტრირება.' },
    en: { title: 'Administration | GDSFF', description: 'GDSFF membership administration.' },
  },
}

export const indexableRoutes = Object.keys(routesMeta).filter((r) => !routesMeta[r].noindex)
export const allRoutes = Object.keys(routesMeta)
export const LANGS = ['ka', 'en']
