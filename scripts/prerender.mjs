// Build-time prerenderer.
// Runs after `vite build` (client) and `vite build --ssr` (server entry).
// For every route x language it renders real HTML and writes
// dist/<lang><route>/index.html with route-specific head tags + hreflang.

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { routesMeta, allRoutes, LANGS, SITE, OG_IMAGE } from '../src/seo/routesMeta.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')
const ssrDist = join(root, 'dist-ssr')

const { render } = await import(join(ssrDist, 'prerender-entry.js'))
const template = readFileSync(join(dist, 'index.html'), 'utf8')

const FAQ_JSONLD = `<script type="application/ld+json">
    {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "რა არის GDSFF?", "acceptedAnswer": {"@type": "Answer", "text": "GDSFF — საქართველოს დინამიური სროლისა და ფუნქციური ფიტნესის ფედერაციაა: ეროვნული პლატფორმა, რომელიც აერთიანებს სპორტულ სროლას, სასროლეთებს, ფუნქციურ ფიტნესს, სპორტსმენების განვითარებასა და შეჯიბრებებს მთელი საქართველოს მასშტაბით."}}, {"@type": "Question", "name": "როგორ გავხდე ფედერაციის წევრი?", "acceptedAnswer": {"@type": "Answer", "text": "გახსენით გვერდი წევრობა და შეავსეთ განაცხადი. ფედერაცია განიხილავს განაცხადს და დაგიკავშირდებათ შემდეგი ნაბიჯებისთვის — სპორტსმენებს, კლუბებსა და პარტნიორებს."}}, {"@type": "Question", "name": "სად ტარდება ვარჯიშები და შეჯიბრებები?", "acceptedAnswer": {"@type": "Answer", "text": "ივენთები იმართება პარტნიორ სასროლეთებსა და პოლიგონებზე საქართველოში. მიმდინარე განრიგი ქვეყნდება ივენთების გვერდზე და სოციალურ არხებზე."}}, {"@type": "Question", "name": "მჭირდება თუ არა საკუთარი იარაღი მონაწილეობისთვის?", "acceptedAnswer": {"@type": "Answer", "text": "არა. დამწყებები ვარჯიშობენ სასროლეთის აღჭურვილობით, სერტიფიცირებული ინსტრუქტორების მეთვალყურეობით და უსაფრთხოების მკაცრი წესების დაცვით. გამოცდილ მსროლელებს შეუძლიათ საკუთარი რეგისტრირებული იარაღის გამოყენება."}}, {"@type": "Question", "name": "რა არის დინამიური სროლა?", "acceptedAnswer": {"@type": "Answer", "text": "დინამიური სროლა სპორტული დისციპლინაა, რომელიც აერთიანებს სიზუსტეს, სისწრაფესა და მოძრაობას პრაქტიკულ სავარჯიშო ტრასებზე — ერთ-ერთი ყველაზე სწრაფად მზარდი სასროლო სპორტი მსოფლიოში."}}]}
    </script>`

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildHead(route, lang) {
  const meta = routesMeta[route][lang]
  const suffix = route === '/' ? '/' : route
  const url = `${SITE}/${lang}${suffix === '/' ? '/' : suffix}`
  const hreflang = [
    `<link rel="alternate" hreflang="ka" href="${SITE}/ka${suffix === '/' ? '/' : suffix}" />`,
    `<link rel="alternate" hreflang="en" href="${SITE}/en${suffix === '/' ? '/' : suffix}" />`,
    `<link rel="alternate" hreflang="x-default" href="${SITE}/ka${suffix === '/' ? '/' : suffix}" />`,
  ].join('\n    ')
  const robots = routesMeta[route].noindex ? '\n    <meta name="robots" content="noindex" />' : ''
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
        `<meta property="og:locale" content="${lang === 'ka' ? 'ka_GE' : 'en_US'}" />\n    <meta property="og:locale:alternate" content="${lang === 'ka' ? 'en_US' : 'ka_GE'}" />`,
      )
      .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
      .replace(
        /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
        `<meta property="og:description" content="${esc(meta.description)}" />`,
      )
      .replace(
        /<meta name="twitter:title" content="[^"]*" \/>/,
        `<meta name="twitter:title" content="${esc(meta.title)}" />`,
      )
      .replace(
        /<meta name="twitter:description" content="[^"]*" \/>/,
        `<meta name="twitter:description" content="${esc(meta.description)}" />`,
      )
      .replace('<!--faq-jsonld-->', route === '/' && lang === 'ka' ? FAQ_JSONLD : '')
      .replace('<!--app-html-->', appHtml)

    const outDir = route === '/' ? join(dist, lang) : join(dist, lang, route.slice(1))
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), html)
    count++
  }
}

// Root index.html should never be served directly (server redirects / -> /ka/),
// but keep a safe fallback that client-redirects if someone gets it anyway.
// The template already contains the client-side language redirect via main.jsx.

// 404 page must exist in output for Vercel to serve real 404s.
if (existsSync(join(root, 'public', '404.html'))) {
  cpSync(join(root, 'public', '404.html'), join(dist, '404.html'))
}

console.log(`Prerendered ${count} pages (${LANGS.length} languages x ${allRoutes.length} routes).`)
