import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { JSDOM } from 'jsdom'
import { build } from 'vite'
import React, { act } from 'react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { registeredMembership } from '../src/content/registeredMembership.js'

const entry = 'virtual:site-menu-member-tests'
await build({
  logLevel: 'silent',
  plugins: [{
    name: 'site-menu-member-tests',
    resolveId(id) { if (id === entry) return `\0${entry}` },
    load(id) {
      if (id === `\0${entry}`) return `
        export { default as App } from '/src/App.jsx';
        export { buildSiteMenu, buildFederationNav } from '/src/components/FederationNavigation.jsx';
        export { siteContent } from '/src/siteContent.js';
      `
    },
  }],
  build: { ssr: true, outDir: 'node_modules/.cache/site-menu-member-tests', emptyOutDir: true,
    rollupOptions: { input: entry, output: { entryFileNames: 'entry.js' } } },
})
const { App, buildSiteMenu, buildFederationNav, siteContent } = await import('../node_modules/.cache/site-menu-member-tests/entry.js')
const { createRoot } = await import('react-dom/client')
const h = React.createElement

async function withApp(t, language, path, callback, failSummary = false) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
    url: `https://example.invalid/${language}${path}`, pretendToBeVisual: true,
  })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  window.scrollTo = () => {}
  window.HTMLElement.prototype.scrollIntoView = () => {}
  // Browsers ignore focus on inert descendants; JSDOM needs that modeled.
  const nativeFocus = window.HTMLElement.prototype.focus
  window.HTMLElement.prototype.focus = function (...args) {
    if (!this.closest('[inert], [hidden]')) nativeFocus.apply(this, args)
  }
  t.mock.method(globalThis, 'fetch', async () => {
    if (failSummary) throw new Error('Offline fixture')
    return new Response(JSON.stringify({ summary: {
      totalApplications: 25, statusCounts: { submitted: 20, 'under-review': 2, approved: 3, 'needs-info': 0, closed: 0 },
      lastSubmittedAt: '2026-10-01T09:00:00Z',
    } }), { headers: { 'Content-Type': 'application/json' } })
  })
  let location, navigate
  const assigns = []
  const realWindow = window
  globalThis.window = new Proxy(realWindow, { get(target, key) {
    if (key === 'location') return { assign: (url) => assigns.push(url) }
    return Reflect.get(target, key)
  } })
  function Probe() {
    location = useLocation()
    navigate = useNavigate()
    return h(App, { language })
  }
  const root = createRoot(document.getElementById('root'))
  const click = async (element) => { assert.ok(element); await act(async () => element.click()) }
  const key = async (value, shiftKey = false) => act(async () => document.dispatchEvent(new realWindow.KeyboardEvent('keydown', { key: value, shiftKey, bubbles: true, cancelable: true })))
  try {
    await act(async () => root.render(h(MemoryRouter, {
      basename: `/${language}`, initialEntries: [`/${language}${path}`],
      future: { v7_startTransition: true, v7_relativeSplatPath: true },
    }, h(Probe))))
    await callback({ document, click, key, location: () => location, assigns,
      navigate: async (to) => act(async () => navigate(to)) })
  } finally {
    await act(async () => root.unmount())
    realWindow.close()
    delete globalThis.window
    delete globalThis.document
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
}

for (const language of ['en', 'ka']) {
  test(`${language}: unified menu lists every public page and every existing internal section`, () => {
    const pages = buildSiteMenu(siteContent[language])
    const expected = ['/', '/about', '/sports', '/leadership', '/membership', '/safety-consent', '/events', '/support', '/partners', '/gallery', '/documents', '/glossary', '/contact']
    for (const path of expected) assert.ok(pages.some((page) => page.to === path), path)
    assert.equal(pages[1].to, '/leadership#safety-officers-instructors')
    assert.ok(pages[1].featured)
    assert.equal(new Set(pages.map(({ to }) => to)).size, pages.length)
    const allDestinations = pages.flatMap((page) => [page.to, ...page.items.map((item) => item.to)])
    for (const item of buildFederationNav(siteContent[language]).flatMap((group) => group.items)) {
      if (!item.external) assert.ok(allDestinations.includes(item.to), item.to)
    }
    assert.ok(allDestinations.every((to) => !/admin|social|media-bot/.test(to)))
  })

  test(`${language}: menu opens, collapses, traps keyboard focus and closes by Escape/outside click`, async (t) => {
    await withApp(t, language, '/', async ({ document, click, key }) => {
      const trigger = document.querySelector('.site-menu-toggle')
      const overlay = document.querySelector('.site-menu-overlay')
      const panel = document.querySelector('.site-menu-panel')
      assert.equal(trigger.textContent, language === 'en' ? 'Menu' : 'მენიუ')
      assert.equal(document.querySelectorAll('.site-menu-toggle').length, 1)
      assert.ok(overlay.hidden)
      await click(trigger)
      assert.equal(trigger.getAttribute('aria-expanded'), 'true')
      assert.equal(overlay.hidden, false)
      assert.equal(document.activeElement, document.querySelector('.site-menu-close'))
      assert.equal(document.body.style.overflow, 'hidden')
      assert.ok(document.querySelector('main').parentElement.hasAttribute('inert'))
      const sectionToggle = panel.querySelector('.site-menu-section-toggle')
      await click(sectionToggle)
      assert.equal(sectionToggle.getAttribute('aria-expanded'), 'true')
      await click(sectionToggle)
      assert.equal(sectionToggle.getAttribute('aria-expanded'), 'false', 'must stay collapsed instead of auto-reopening')
      const focusable = [...panel.querySelectorAll('a[href], button, input')].filter((el) => !el.closest('[hidden]'))
      focusable[0].focus()
      await key('Tab', true)
      assert.equal(document.activeElement, focusable.at(-1))
      await key('Tab')
      assert.equal(document.activeElement, focusable[0])
      await key('Escape')
      assert.ok(overlay.hidden)
      assert.equal(document.activeElement, trigger)
      assert.equal(document.body.style.overflow, '')
      await click(trigger)
      await click(document.querySelector('.site-menu-backdrop'))
      assert.ok(overlay.hidden)
      assert.equal(document.activeElement, trigger)
    })
  })

  test(`${language}: instructor tap, repeated selection, Back/Forward and menu language switch retain destinations`, async (t) => {
    await withApp(t, language, '/about', async ({ document, click, navigate, location, assigns }) => {
      const trigger = document.querySelector('.site-menu-toggle')
      const overlay = document.querySelector('.site-menu-overlay')
      const destination = `/${language}/leadership#safety-officers-instructors`
      for (let repeat = 0; repeat < 2; repeat++) {
        await click(trigger)
        await click(document.querySelector(`.site-menu-link[href="${destination}"]`))
        assert.ok(overlay.hidden)
        assert.equal(location().pathname, '/leadership')
        assert.equal(location().hash, '#safety-officers-instructors')
        assert.equal(document.querySelectorAll('#safety-officers-instructors article').length, 5)
      }
      // Same-destination navigation creates a history entry; step through it.
      await navigate(-1)
      await navigate(-1)
      assert.equal(location().pathname, '/about')
      await navigate(1)
      assert.equal(location().hash, '#safety-officers-instructors')
      await navigate('/leadership?from=menu#safety-officers-instructors')
      await click(trigger)
      const next = language === 'en' ? 'ka' : 'en'
      const button = [...document.querySelectorAll('.site-menu-language button')].find((el) => el.textContent === next.toUpperCase())
      await click(button)
      assert.deepEqual(assigns, [`/${next}/leadership?from=menu#safety-officers-instructors`])
      assert.ok(overlay.hidden)
    })
  })

  test(`${language}: registered 101 stays independent of 25 real website applications and statuses`, async (t) => {
    await withApp(t, language, '/membership', async ({ document }) => {
      assert.equal(document.querySelector('.registered-members-total strong').textContent, '101')
      assert.equal(document.querySelector('.membership-stat-total strong').textContent, '25')
      assert.deepEqual([...document.querySelectorAll('.membership-status-chip strong')].map((el) => el.textContent), ['20', '02', '03', '00', '00'])
      assert.equal(document.querySelector('.registered-members-stat time').dateTime, '2026-10-03')
      assert.equal(document.querySelector('.registered-members-total span').textContent, language === 'en' ? 'Registered members' : 'რეგისტრირებული წევრები')
      assert.equal(document.querySelector('.membership-stat-total span').textContent, language === 'en' ? 'Total Online Applications' : 'სულ ონლაინ განაცხადები')
    })
  })

  test(`${language}: unavailable application data is unknown, while confirmed membership remains 101`, async (t) => {
    await withApp(t, language, '/membership', async ({ document }) => {
      assert.equal(document.querySelector('.registered-members-total strong').textContent, '101')
      assert.equal(document.querySelector('.membership-stat-total strong').textContent, '—')
      assert.ok([...document.querySelectorAll('.membership-status-chip strong')].every((el) => el.textContent === '—'))
    }, true)
  })

  test(`${language}: direct/reloaded static pages include the confirmed count and instructor anchor`, () => {
    for (const route of ['', '/membership']) {
      const html = readFileSync(new URL(`../dist/${language}${route}/index.html`, import.meta.url), 'utf8')
      const { document } = new JSDOM(html).window
      assert.equal(document.querySelector('.registered-members-total strong').textContent, '101')
      assert.equal(document.querySelector('.registered-members-stat time').dateTime, registeredMembership.confirmedOn)
      assert.ok(document.querySelector(`.site-menu-link[href="/${language}/leadership#safety-officers-instructors"]`))
      const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
      assert.equal(new Set(ids).size, ids.length)
    }
  })
}

test('registered membership is an explicit dated snapshot, not a fabricated application total', () => {
  assert.deepEqual(registeredMembership, { total: 101, confirmedOn: '2026-10-03', source: 'Federation confirmation' })
  const home = readFileSync(new URL('../src/pages/HomePage.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(home, /getMembershipSummary|totalApplications/)
})
