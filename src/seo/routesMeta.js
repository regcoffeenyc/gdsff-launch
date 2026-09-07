export const SITE = 'https://www.gdsff.com'
export const OG_IMAGE = `${SITE}/gdsff-logo-approved.png`
export const LANGS = ['ka', 'en']

const labels = {
  '/': ['საქართველოს დინამიური სროლისა და ფუნქციური ფიტნესის ფედერაცია', 'Georgian Dynamic Shooting & Functional Fitness Federation'],
  '/about': ['ფედერაციის შესახებ', 'About the Federation'],
  '/sports': ['სპორტული მიმართულებები', 'Sports'],
  '/leadership': ['ხელმძღვანელობა', 'Leadership'],
  '/membership': ['გაწევრიანება', 'Membership'],
  '/events': ['ღონისძიებები', 'Events'],
  '/partners': ['პარტნიორები', 'Partners'],
  '/support': ['მხარდაჭერა', 'Support'],
  '/gallery': ['მედია გალერეა', 'Media Gallery'],
  '/documents': ['დოკუმენტები', 'Documents'],
  '/glossary': ['ტერმინთა ლექსიკონი', 'Glossary'],
  '/safety-consent': ['უსაფრთხოება და თანხმობა', 'Safety and Consent'],
  '/contact': ['კონტაქტი', 'Contact'],
  '/membership-admin': ['წევრობის ადმინისტრირება', 'Membership Administration'],
  '/search': ['ძიება', 'Search'],
}

const descriptions = {
  ka: 'საქართველოს დინამიური სროლისა და ფუნქციური ფიტნესის ფედერაციის ოფიციალური ვებგვერდი.',
  en: 'Official website of the Georgian Dynamic Shooting & Functional Fitness Federation.',
}

export const routesMeta = Object.fromEntries(Object.entries(labels).map(([route, [ka, en]]) => [route, {
  ka: { title: route === '/' ? `${ka} | GDSFF` : `${ka} | GDSFF`, description: descriptions.ka },
  en: { title: route === '/' ? `${en} | GDSFF` : `${en} | GDSFF`, description: descriptions.en },
  ...(['/membership-admin', '/search'].includes(route) ? { noindex: true } : {}),
}]))

export const indexableRoutes = Object.keys(routesMeta).filter((route) => !routesMeta[route].noindex)
export const allRoutes = Object.keys(routesMeta)

// Shared by prerendering and client navigation. Router paths exclude /ka or /en.
export function getRouteMetadata(pathname, language) {
  const route = pathname.replace(/\/+$/, '') || '/'
  if (!LANGS.includes(language) || !Object.hasOwn(routesMeta, route)) return null
  const entry = routesMeta[route]
  const urlFor = (lang) => `${SITE}/${lang}${route}`
  return {
    ...entry[language], language, url: urlFor(language), noindex: Boolean(entry.noindex),
    alternates: [
      { language: 'ka', url: urlFor('ka') },
      { language: 'en', url: urlFor('en') },
      { language: 'x-default', url: urlFor('ka') },
    ],
    locale: language === 'ka' ? 'ka_GE' : 'en_US',
    alternateLocale: language === 'ka' ? 'en_US' : 'ka_GE',
  }
}
