import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { allRoutes, getRouteMetadata, indexableRoutes, LANGS, SITE } from '../src/seo/routesMeta.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const escape = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

test('all 30 built pages have route-specific metadata and populated HTML', () => {
  for (const language of LANGS) {
    for (const route of allRoutes) {
      const meta = getRouteMetadata(route, language)
      const html = read(`dist/${language}${route === '/' ? '' : route}/index.html`)
      assert.ok(html.includes(`<html lang="${language}">`), meta.url)
      assert.ok(html.includes(`<title>${escape(meta.title)}</title>`), meta.url)
      assert.ok(html.includes(`<meta name="description" content="${escape(meta.description)}" />`), meta.url)
      assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1, meta.url)
      assert.ok(html.includes(`<link rel="canonical" href="${meta.url}" />`), meta.url)
      assert.ok(html.includes(`<meta property="og:url" content="${meta.url}" />`), meta.url)
      assert.ok(html.includes(`<meta property="og:image" content="${meta.ogImage}" />`), meta.url)
      assert.ok(html.includes(`<meta name="twitter:image" content="${meta.ogImage}" />`), meta.url)
      assert.ok(!html.includes('gdsff-logo-approved.png" />'), `${meta.url} still references the 2.5 MB logo in the head`)
      if (route === '/') {
        assert.match(html, /<link rel="preload" as="image" href="\/range-hero-1600\.webp"/, meta.url)
        assert.ok(html.includes('"@type":"FAQPage"'), meta.url)
      }
      if (route === '/events') {
        assert.ok(html.includes('"@type":"SportsEvent"'), meta.url)
        // Search Console, 7 Nov 2026: every event needs performer and offers.
        const events = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
          .map((m) => JSON.parse(m[1]))
          .flatMap((j) => j['@graph'] || [j])
          .filter((n) => n['@type'] === 'SportsEvent')
        assert.ok(events.length > 0, meta.url)
        for (const e of events) {
          assert.equal(e.performer?.name, 'Georgian Dynamic Shooting & Functional Fitness Federation', `${meta.url} ${e.name}`)
          assert.equal(e.offers?.['@type'], 'Offer', `${meta.url} ${e.name}`)
          assert.match(e.offers.availability, /^https:\/\/schema\.org\//, `${meta.url} ${e.name}`)
        }
      }
      if (route === '/leadership') assert.ok(html.includes('"@type":"Person"'), meta.url)
      assert.ok(html.includes(`<meta name="twitter:description" content="${escape(meta.description)}" />`), meta.url)
      assert.equal(html.includes('<meta name="robots" content="noindex" />'), meta.noindex, meta.url)
      assert.match(html, /<main[\s>]/, meta.url)
      assert.doesNotMatch(html, /<!--app-html-->/, meta.url)
      for (const alternate of meta.alternates) {
        assert.ok(html.includes(`hreflang="${alternate.language}" href="${alternate.url}"`), meta.url)
      }
    }
  }
})

test('sitemap includes exactly the 26 public canonical URLs', () => {
  const sitemap = read('dist/sitemap.xml')
  const actual = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
  assert.equal((sitemap.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) ?? []).length, 26)
  const expected = LANGS.flatMap((language) => indexableRoutes.map((route) => getRouteMetadata(route, language).url))
  assert.equal(actual.length, 26)
  assert.deepEqual(actual.sort(), expected.sort())
})

test('legacy redirects are permanent and every destination was prerendered', () => {
  const config = JSON.parse(read('vercel.json'))
  // Language-prefixed sources are the canonical-alias redirects tested below.
  const legacy = config.redirects.filter(({ source }) => !source.startsWith('/:lang'))
  assert.equal(legacy.length, allRoutes.length)
  assert.deepEqual(legacy.map(({ source }) => source).sort(), [...allRoutes].sort())
  for (const redirect of legacy) {
    assert.equal(redirect.permanent, true, redirect.source)
    assert.equal(`${SITE}${redirect.destination}`, getRouteMetadata(redirect.source, 'ka').url)
  }
  assert.equal(config.rewrites, undefined, 'Do not restore the SPA catch-all that hides real 404s')
  assert.match(read('dist/404.html'), /name="robots" content="noindex"/)
})

/* Disallow and noindex cancel each other out. A page that is never crawled is
   a page whose noindex is never read, so Google may index the URL from a link
   anyway and report "Indexed, though blocked by robots.txt" — the block makes
   the page harder to remove, not easier. Every route we want out of the index
   carries noindex, so none of them may be blocked here. */
test('no noindex route is also blocked in robots.txt', () => {
  const robots = read('public/robots.txt')
  const disallowed = [...robots.matchAll(/^\s*Disallow:\s*(\S+)/gim)].map((match) => match[1])

  for (const route of allRoutes) {
    for (const language of LANGS) {
      if (!getRouteMetadata(route, language).noindex) {
        continue
      }

      const path = `/${language}${route === '/' ? '' : route}`
      assert.ok(
        !disallowed.some((rule) => path === rule || path.startsWith(rule.replace(/\*$/, ''))),
        `${path} is noindex and must stay crawlable, but robots.txt blocks it`,
      )
    }
  }
})

test('robots.txt still points at the sitemap', () => {
  assert.match(read('public/robots.txt'), new RegExp(`^Sitemap: ${SITE}/sitemap\\.xml$`, 'm'))
})

test('trailing slash aliases keep the same canonical; unknown routes have no public metadata', () => {
  assert.equal(getRouteMetadata('/about/', 'en').url, `${SITE}/en/about`)
  assert.equal(getRouteMetadata('/', 'ka').url, `${SITE}/ka/`)
  assert.equal(getRouteMetadata('/missing-page', 'en'), null)
  assert.equal(getRouteMetadata('/about', 'fr'), null)
})

/* Search Console, October 2026: "Blocked due to other 4xx issue". Googlebot
   reads /api/ paths out of the bundle, fetches them with GET and gets 405 from
   the POST-only endpoints. /api/ is kept out of the crawl, except the two GET
   endpoints the public pages call while rendering. */
test('robots.txt keeps /api/ out of the crawl but allows the render endpoints', () => {
  const robots = read('public/robots.txt')
  assert.match(robots, /^Disallow: \/api\/$/m)
  for (const path of ['/api/auth/session', '/api/membership/summary']) {
    assert.match(robots, new RegExp(`^Allow: ${path}$`, 'm'), `${path} must stay crawlable for rendering`)
  }
  const headers = JSON.parse(read('vercel.json')).headers
  const api = headers.find((rule) => rule.source === '/api/(.*)')
  assert.ok(api?.headers.some((h) => h.key === 'X-Robots-Tag' && h.value === 'noindex'), 'API responses must carry X-Robots-Tag: noindex')
})

/* Every image path exported by siteAssets.js must exist in public/: a missing
   file is a broken image for visitors and a 404 for Google. */
test('every image in siteAssets.js exists in public/', async () => {
  const source = read('src/siteAssets.js')
  const files = [...source.matchAll(/BASE_URL\}([^`'"]+)/g)].map((match) => match[1])
  assert.ok(files.length > 0)
  for (const file of files) {
    assert.doesNotThrow(() => readFileSync(new URL(`../public/${file}`, import.meta.url)), `public/${file} is missing`)
  }
})

/* Search Console, 9 Nov 2026: "Alternative page with proper canonical tag".
   /en/about/ and /ka/index.html served the same page as /en/about and /ka/
   with 200, so Google crawled both and reported the duplicates. Each alias
   now redirects permanently to the URL its canonical names. */
test('trailing-slash and index.html aliases redirect to the canonical URL', () => {
  const redirects = JSON.parse(read('vercel.json')).redirects
  const find = (source) => redirects.find((r) => r.source === source)
  for (const source of ['/:lang(ka|en)/index.html', '/:lang(ka|en)/:page/index.html', '/:lang(ka|en)/:page/']) {
    assert.equal(find(source)?.permanent, true, source)
  }
  assert.equal(find('/:lang(ka|en)/:page/').destination, '/:lang/:page')
  for (const language of LANGS) {
    assert.equal(getRouteMetadata('/', language).url, `${SITE}/${language}/`)
    assert.equal(getRouteMetadata('/about/', language).url, `${SITE}/${language}/about`)
  }
})
