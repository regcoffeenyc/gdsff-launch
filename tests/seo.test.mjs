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
  const actual = [...read('dist/sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
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

test('trailing slash aliases keep the same canonical; unknown routes have no public metadata', () => {
  assert.equal(getRouteMetadata('/about/', 'en').url, `${SITE}/en/about`)
  assert.equal(getRouteMetadata('/', 'ka').url, `${SITE}/ka/`)
  assert.equal(getRouteMetadata('/missing-page', 'en'), null)
  assert.equal(getRouteMetadata('/about', 'fr'), null)
})
