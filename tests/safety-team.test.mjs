import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { JSDOM } from 'jsdom'
import { build } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server.js'
import { getSafetyTeamName, safetyTeamContent, safetyTeamMembers } from '../src/content/safetyTeamContent.js'
import { getRouteMetadata } from '../src/seo/routesMeta.js'

const expectedNames = [
  'Giorgi Gagnidze', 'Ana Panchulidze', 'Davit Kavtaradze', 'Natia Chikhladze', 'Luka Bekauri',
]
const expectedKaNames = [
  'გიორგი გაგნიძე', 'ანა ფანჩულიძე', 'Davit Kavtaradze', 'ნათია ჩიხლაძე', 'Luka Bekauri',
]

const entry = 'virtual:safety-team-tests'
await build({
  logLevel: 'silent',
  plugins: [{
    name: 'safety-team-test-entry',
    resolveId(id) { if (id === entry) return `\0${entry}` },
    load(id) {
      if (id === `\0${entry}`) return `
        export { buildFederationNav, DesktopFederationNav, MobileFederationNav } from '/src/components/FederationNavigation.jsx';
        export { siteContent } from '/src/siteContent.js';
        export { searchSite } from '/src/utils/siteSearch.js';
      `
    },
  }],
  build: {
    ssr: true,
    outDir: 'node_modules/.cache/safety-team-tests',
    emptyOutDir: true,
    rollupOptions: { input: entry, output: { entryFileNames: 'entry.js' } },
  },
})
const { buildFederationNav, DesktopFederationNav, MobileFederationNav, siteContent, searchSite } =
  await import('../node_modules/.cache/safety-team-tests/entry.js')

test('public roster contains exactly the five approved names, with no private record fields', () => {
  assert.deepEqual(safetyTeamMembers.map(({ name }) => name), expectedNames)
  assert.equal(new Set(safetyTeamMembers.map(({ id }) => id)).size, 5)
  for (const member of safetyTeamMembers) {
    assert.ok(Object.keys(member).every((key) => ['id', 'name', 'nameKa', 'certificateHref', 'certificatePreviewSrc'].includes(key)))
  }
  assert.deepEqual(safetyTeamMembers.map((member) => getSafetyTeamName(member, 'ka')), expectedKaNames)
  assert.doesNotMatch(JSON.stringify(safetyTeamMembers), /Goderdzi|Metreveli|გოდერძი|მეტრეველი/i)
})

test('exactly five full-page certificate previews retain their intrinsic dimensions in the static build', () => {
  const expectedFiles = safetyTeamMembers.map(({ id }) => `${id}-idpa-so-2026.png`).sort()
  for (const root of ['public', 'dist']) {
    assert.deepEqual(readdirSync(new URL(`../${root}/images/safety-officers/`, import.meta.url)).sort(), expectedFiles)
    for (const member of safetyTeamMembers) {
      assert.equal(member.certificatePreviewSrc, `/images/safety-officers/${member.id}-idpa-so-2026.png`)
      const png = readFileSync(new URL(`../${root}${member.certificatePreviewSrc}`, import.meta.url))
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
      assert.equal(png.readUInt32BE(16), 1188)
      assert.equal(png.readUInt32BE(20), 918)
      assert.ok(png.length < 300_000, 'preview stays lightweight')
      assert.deepEqual(png, readFileSync(new URL(`../public${member.certificatePreviewSrc}`, import.meta.url)))
    }
  }
})

test('exactly five certificate PDFs are preserved and copied into the static build', () => {
  const expectedHashes = {
    'giorgi-gagnidze': 'fe42056e82db5a0e412e2b9f21efc6c445ce268bd6dcf113b1601f9555ddec2a',
    'ana-panchulidze': '8b875d760a0d0e85d14414a19e2f2106d9d4ac3bfa41a9fcc9cd8987cba05768',
    'davit-kavtaradze': 'e2b6389991732b5401cabeb9fc8ca05466a302b72a0229898e33585ed0c3c289',
    'natia-chikhladze': '552b65b26428e173a4afecfb32f7733571aec39afaa5a7421cad10641369ef76',
    'luka-bekauri': 'a7138fe8fb36a27419fc2ae428bb3cbac20d4b17eb153e7c83c176023bef1346',
  }
  const expectedFiles = safetyTeamMembers.map(({ id }) => `${id}-idpa-so-2026.pdf`).sort()
  for (const root of ['public', 'dist']) {
    assert.deepEqual(readdirSync(new URL(`../${root}/documents/safety-officers/`, import.meta.url)).sort(), expectedFiles)
    for (const member of safetyTeamMembers) {
      assert.equal(member.certificateHref, `/documents/safety-officers/${member.id}-idpa-so-2026.pdf`)
      const pdf = readFileSync(new URL(`../${root}${member.certificateHref}`, import.meta.url))
      assert.equal(pdf.subarray(0, 5).toString(), '%PDF-')
      assert.equal(createHash('sha256').update(pdf).digest('hex'), expectedHashes[member.id])
    }
  }
  const publicContent = JSON.stringify(safetyTeamMembers)
  assert.doesNotMatch(publicContent, /drive\.google|docs\.google|personalNumber|dateOfBirth|email|phone/)
})

for (const language of ['en', 'ka']) {
  const view = safetyTeamContent[language]
  const copy = siteContent[language]
  const expected = language === 'ka' ? expectedKaNames : expectedNames
  const expectedRoles = language === 'ka'
    ? ['IDPA უსაფრთხოების ოფიცერი', 'GDSFF-ის ინსტრუქტორი']
    : ['IDPA Safety Officer', 'GDSFF Instructor']

  test(`${language}: prerendered leadership contains the accessible five-card roster and preserves metadata`, () => {
    const html = readFileSync(new URL(`../dist/${language}/leadership/index.html`, import.meta.url), 'utf8')
    const { document } = new JSDOM(html).window
    const section = document.querySelector('#safety-officers-instructors')
    assert.ok(section)
    assert.equal(document.getElementById(section.getAttribute('aria-labelledby')).textContent, view.title)
    assert.equal(section.querySelector('h2').textContent, view.title)
    assert.equal(document.querySelectorAll('main h1').length, 1)
    const cards = [...section.querySelectorAll('article')]
    assert.equal(cards.length, 5)
    assert.deepEqual(cards.map((card) => card.querySelector('h3').textContent), expected)
    cards.forEach((card, index) => {
      assert.equal(card.id, `safety-team-${safetyTeamMembers[index].id}`)
      assert.equal(document.getElementById(card.getAttribute('aria-labelledby')).textContent, expected[index])
      assert.deepEqual([...card.querySelectorAll('li')].map((node) => node.textContent), expectedRoles)
      assert.equal(card.querySelector('h3').getAttribute('lang'), language === 'ka' && [2, 4].includes(index) ? 'en' : null)
      const certificateLinks = card.querySelectorAll('a')
      assert.equal(certificateLinks.length, 1)
      const certificate = certificateLinks[0]
      assert.equal(certificate.getAttribute('href'), safetyTeamMembers[index].certificateHref)
      assert.equal(certificate.textContent, view.certificateLabel)
      assert.equal(certificate.getAttribute('type'), 'application/pdf')
      assert.equal(certificate.getAttribute('target'), '_blank')
      assert.equal(certificate.getAttribute('rel'), 'noopener noreferrer')
      assert.equal(certificate.getAttribute('aria-label'), `${view.certificateLabel}: ${expected[index]} (${view.certificateNewTab})`)
      const preview = card.querySelector('img')
      assert.ok(preview)
      assert.equal(preview.getAttribute('src'), safetyTeamMembers[index].certificatePreviewSrc)
      assert.equal(preview.getAttribute('alt'), `${view.certificatePreviewLabel}: ${expected[index]}`)
      assert.equal(preview.getAttribute('width'), '1188')
      assert.equal(preview.getAttribute('height'), '918')
      assert.equal(preview.getAttribute('loading'), 'lazy')
      assert.equal(preview.getAttribute('decoding'), 'async')
      assert.equal(card.querySelector('.safety-team-roles').nextElementSibling.querySelector('img'), preview,
        'the certificate is directly below this instructor’s roles')
      assert.equal(preview.nextElementSibling, certificate, 'the full PDF action follows the preview')
    })
    assert.equal(section.querySelectorAll('a').length, 5, 'one certificate link per instructor')
    assert.equal(section.querySelectorAll('img').length, 5, 'one certificate preview per instructor')
    assert.equal(section.querySelectorAll('iframe, object').length, 0, 'no heavyweight PDF embeds')
    assert.doesNotMatch(section.textContent, /Goderdzi|Metreveli|გოდერძი|მეტრეველი|IDPA.certified.instructor|state.licen[cs]ed/i)
    assert.equal(document.querySelectorAll('#leadership-profiles article').length, 2, 'existing leadership stays intact')
    assert.equal(document.querySelectorAll('#president a[download], #director a[download]').length, 2)
    const meta = getRouteMetadata('/leadership', language)
    assert.equal(document.title, meta.title)
    assert.equal(document.querySelector('link[rel="canonical"]').href, meta.url)
    assert.equal(document.querySelectorAll('link[hreflang]').length, 3)
    const ids = [...document.querySelectorAll('[id]')].map((node) => node.id)
    assert.equal(new Set(ids).size, ids.length, 'anchors remain unique')
  })

  test(`${language}: desktop and mobile navigation link to the localized team anchor`, () => {
    const groups = buildFederationNav(copy)
    const group = groups.find(({ key }) => key === 'leadership')
    const item = group.items.find(({ to }) => to === '/leadership#safety-officers-instructors')
    assert.equal(item.label, view.title)
    for (const Navigation of [DesktopFederationNav, MobileFederationNav]) {
      const markup = renderToStaticMarkup(React.createElement(StaticRouter, {
        basename: `/${language}`, location: `/${language}/leadership`,
      }, React.createElement(Navigation, {
        groups, location: { pathname: '/leadership', hash: '', search: '' }, openKey: 'leadership',
        openMenu() {}, queueClose() {}, closeMenu() {}, setOpenKey() {}, closeMobileMenu() {},
      })))
      const { document } = new JSDOM(markup).window
      const link = document.querySelector(`a[href="/${language}/leadership#safety-officers-instructors"]`)
      assert.ok(link)
      assert.ok(link.textContent.includes(view.title))
      assert.ok(document.querySelector(`[aria-label="${group.menuLabel}"][aria-expanded="true"]`))
    }
  })

  test(`${language}: exact certificate names and verified Georgian names find each member`, () => {
    safetyTeamMembers.forEach((member, index) => {
      for (const query of [member.name, member.nameKa].filter(Boolean)) {
        const results = searchSite(copy, query)
        assert.ok(results.some((item) => item.title === expected[index] && item.to === `/leadership#safety-team-${member.id}`), query)
      }
    })
    assert.equal(searchSite(copy, 'Goderdzi Metreveli').some(({ to }) => to?.includes('safety-team-')), false)
  })
}
