// Build-time prerenderer.
// Runs after `vite build` (client) and `vite build --ssr` (server entry).
// For every route x language it renders real HTML and writes
// dist/<lang><route>/index.html with route-specific head tags, hreflang,
// share image and structured data. It also generates dist/sitemap.xml from
// routesMeta so the sitemap can never disagree with what was prerendered.

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { getRouteMetadata, allRoutes, indexableRoutes, LANGS, SITE } from '../src/seo/routesMeta.js'
import { faqContent } from '../src/content/faqContent.js'
import { enContent } from '../src/content/enContent.js'
import { kaContent } from '../src/content/kaContent.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')
const ssrDist = join(root, 'dist-ssr')

const { render } = await import(join(ssrDist, 'prerender-entry.js'))
const template = readFileSync(join(dist, 'index.html'), 'utf8')

const ORG_ID = `${SITE}/#organization`
const content = { en: enContent, ka: kaContent }

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function jsonld(payload) {
  return `<script type="application/ld+json">\n    ${JSON.stringify(payload)}\n    </script>`
}

// FAQPage mirrors the visible homepage FAQ, both languages.
function faqJsonld(lang) {
  return jsonld({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqContent[lang].map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  })
}

// The federation itself, inline, so performer and organizer resolve even where
// a validator does not follow the @id to the Organization node in the template.
const FEDERATION = {
  '@type': 'SportsOrganization',
  '@id': ORG_ID,
  name: 'Georgian Dynamic Shooting & Functional Fitness Federation',
  url: SITE,
}

// How to take part, as an Offer. Only facts the calendar holds go in: the
// entry route (the calendar entry, where the bulletin is published), the
// currency, and whether entries are open. A price is stated only when the
// calendar entry carries one (`entryFee`, in GEL); none is invented.
function eventOffer(event, url) {
  const membersOnly = /members only|მხოლოდ წევრ/i.test(event.status || '')
  const offer = {
    '@type': 'Offer',
    url,
    priceCurrency: 'GEL',
    availability: event.past
      ? 'https://schema.org/SoldOut'
      : membersOnly
        ? 'https://schema.org/LimitedAvailability'
        : 'https://schema.org/InStock',
    category: membersOnly ? 'Members' : 'Entry',
  }
  if (typeof event.entryFee === 'number') offer.price = event.entryFee
  if (event.registrationOpens) offer.validFrom = event.registrationOpens
  return offer
}

// One SportsEvent per calendar entry, built from the same data the page renders.
// Search Console, 7 November 2026: "Missing field 'offers'" and "Missing field
// 'performer'" on every entry. The performer of a federation event is the
// federation (its athletes compete under it; clinics and the assembly are run
// by it), and the offer is the entry route above.
// Search Console, 8-9 November 2026: "Missing field 'price'" and "Missing
// field 'validFrom'" (in 'offers'). Every flagged entry was an event that had
// already taken place, whose fee and registration date the calendar does not
// hold. Google shows only upcoming events, so past entries stay on the page for
// reference but are no longer marked up; an upcoming entry states its fee
// (`entryFee`, GEL) and the day entries open (`registrationOpens`, YYYY-MM-DD)
// in the calendar, and both go into its offer. Nothing is invented.
function eventsJsonld(lang, pageUrl, image) {
  const events = content[lang].events.calendar.events.filter((event) => !event.past)
  if (!events.length) return ''
  const url = `${pageUrl}#calendar-2026`
  return jsonld({
    '@context': 'https://schema.org',
    '@graph': events.map((event) => ({
      '@type': 'SportsEvent',
      name: event.title,
      description: event.description,
      startDate: event.date,
      endDate: event.endDate ?? event.date,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: event.location,
        address: { '@type': 'PostalAddress', addressLocality: event.location, addressCountry: 'GE' },
      },
      organizer: FEDERATION,
      performer: FEDERATION,
      offers: eventOffer(event, url),
      url,
      image,
      inLanguage: lang,
    })),
  })
}

// Person nodes for the named leadership, bound to the organization.
function leadershipJsonld(lang, pageUrl) {
  const people =
    lang === 'ka'
      ? [
          { name: 'გიორგი გაგნიძე', jobTitle: 'პრეზიდენტი', id: 'president' },
          { name: 'ანა ფანჩულიძე', jobTitle: 'დირექტორი', id: 'director' },
        ]
      : [
          { name: 'George Gagnidze', jobTitle: 'President', id: 'president' },
          { name: 'Ana Panchulidze', jobTitle: 'Director', id: 'director' },
        ]
  return jsonld({
    '@context': 'https://schema.org',
    '@graph': people.map((person) => ({
      '@type': 'Person',
      '@id': `${SITE}/#${person.id}`,
      name: person.name,
      jobTitle: person.jobTitle,
      worksFor: { '@id': ORG_ID },
      url: `${pageUrl}#${person.id}`,
    })),
  })
}

function routeHead(route, lang, meta) {
  const parts = []
  if (route === '/') {
    // The hero photo is the LCP element on the homepage: fetch it before CSS is parsed.
    parts.push(
      `<link rel="preload" as="image" href="/range-hero-1600.webp" imagesrcset="/range-hero-960.webp 960w, /range-hero-1600.webp 1600w" imagesizes="100vw" fetchpriority="high" />`,
    )
    parts.push(faqJsonld(lang))
  }
  if (route === '/events') parts.push(eventsJsonld(lang, meta.url, meta.ogImage))
  if (route === '/leadership') parts.push(leadershipJsonld(lang, meta.url))
  return parts.join('\n    ')
}

function buildHead(route, lang) {
  const meta = getRouteMetadata(route, lang)
  const { url } = meta
  const hreflang = meta.alternates.map(({ language, url }) =>
    `<link rel="alternate" hreflang="${language}" href="${url}" />`,
  ).join('\n    ')
  const robots = meta.noindex ? '\n    <meta name="robots" content="noindex" />' : ''
  return { meta, url, hreflang, robots }
}

let count = 0
for (const lang of LANGS) {
  for (const route of allRoutes) {
    const { meta, url, hreflang, robots } = buildHead(route, lang)
    const appHtml = render(route === '/' ? '/' + lang + '/' : '/' + lang + route, lang)

    let html = template
      .replace('<html lang="ka">', `<html lang="${lang}">`)
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
      .replace(
        /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
        `<meta name="description" content="${esc(meta.description)}" />`,
      )
      .replace(
        /<link rel="canonical" href="[^"]*" \/>/,
        `<link rel="canonical" href="${url}" />\n    ${hreflang}${robots}`,
      )
      .replace(
        /<meta property="og:title" content="[^"]*" \/>/,
        `<meta property="og:title" content="${esc(meta.title)}" />`,
      )
      .replace(
        /<meta property="og:locale" content="[^"]*" \/>/,
        `<meta property="og:locale" content="${meta.locale}" />\n    <meta property="og:locale:alternate" content="${meta.alternateLocale}" />`,
      )
      .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
      .replace(
        /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
        `<meta property="og:description" content="${esc(meta.description)}" />`,
      )
      .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${meta.ogImage}" />`)
      .replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${meta.ogImage}" />`)
      .replace(
        /<meta name="twitter:title" content="[^"]*" \/>/,
        `<meta name="twitter:title" content="${esc(meta.title)}" />`,
      )
      .replace(
        /<meta name="twitter:description" content="[^"]*" \/>/,
        `<meta name="twitter:description" content="${esc(meta.description)}" />`,
      )
      .replace('<!--route-head-->', routeHead(route, lang, meta))
      .replace('<!--faq-jsonld-->', '')
      .replace('<!--app-html-->', appHtml)

    const outDir = route === '/' ? join(dist, lang) : join(dist, lang, route.slice(1))
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), html)
    count++
  }
}

// Sitemap: exactly the indexable, canonical URLs, with reciprocal hreflang.
const urlEntries = []
for (const route of indexableRoutes) {
  for (const lang of LANGS) {
    const meta = getRouteMetadata(route, lang)
    const alternates = meta.alternates
      .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.language}" href="${a.url}"/>`)
      .join('\n')
    urlEntries.push(`  <url>\n    <loc>${meta.url}</loc>\n    <lastmod>${meta.lastmod}</lastmod>\n${alternates}\n  </url>`)
  }
}
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlEntries.join('\n')}\n</urlset>\n`,
)

// 404 page must exist in output for Vercel to serve real 404s.
if (existsSync(join(root, 'public', '404.html'))) {
  cpSync(join(root, 'public', '404.html'), join(dist, '404.html'))
}

console.log(`Prerendered ${count} pages (${LANGS.length} languages x ${allRoutes.length} routes) and sitemap.xml with ${urlEntries.length} URLs.`)
