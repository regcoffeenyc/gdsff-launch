import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { allRoutes, getRouteMetadata, indexableRoutes, LANGS, SITE } from '../src/seo/routesMeta.js'
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
test('all generated pages contain consistent route metadata', () => {
  for (const language of LANGS) for (const route of allRoutes) {
    const meta = getRouteMetadata(route, language); const html = read(`dist/${language}${route === '/' ? '' : route}/index.html`)
    assert.ok(html.includes(`<html lang="${language}">`)); assert.ok(html.includes(`href="${meta.url}"`)); assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1); assert.match(html, /<main[\s>]/)
    assert.equal(html.includes('name="robots" content="noindex"'), meta.noindex)
  }
})
test('sitemap includes only indexable canonical URLs', () => {
  const actual = [...read('dist/sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]); const expected = LANGS.flatMap((l) => indexableRoutes.map((r) => getRouteMetadata(r,l).url)); assert.deepEqual(actual.sort(), expected.sort())
})
test('redirects are permanent and point to Georgian canonical pages', () => {
  const config=JSON.parse(read('vercel.json')); assert.equal(config.redirects.length, allRoutes.length); assert.equal(config.rewrites, undefined); for(const redirect of config.redirects){ assert.equal(redirect.permanent,true); assert.equal(`${SITE}${redirect.destination}`,getRouteMetadata(redirect.source,'ka').url) }
})
test('route aliases normalize and unknown routes do not expose metadata', () => { assert.equal(getRouteMetadata('/about/','en').url,`${SITE}/en/about`); assert.equal(getRouteMetadata('/missing','en'),null); assert.equal(getRouteMetadata('/about','fr'),null) })
