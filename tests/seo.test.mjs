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
      if (route === '/events') assert.ok(html.includes('"@type":"SportsEvent"'), meta.url)
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
  assert.equal(config.redirects.length, allRoutes.length)
  assert.deepEqual(config.redirects.map(({ source }) => source).sort(), [...allRoutes].sort())
  for (const redirect of config.redirects) {
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
