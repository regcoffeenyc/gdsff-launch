import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { JSDOM } from 'jsdom'
import { build } from 'vite'
import React, { act } from 'react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { getRouteMetadata } from '../src/seo/routesMeta.js'

// Exercise the real App and SiteLayout effects in a DOM. This catches metadata
// regressions that inspecting the prerendered HTML alone cannot detect.
await build({
  logLevel: 'silent',
  build: { ssr: 'src/App.jsx', outDir: 'node_modules/.cache/seo-app', emptyOutDir: true },
})
const { default: App } = await import('../node_modules/.cache/seo-app/App.js')

for (const language of ['ka', 'en']) {
  for (const initialRoute of ['/about', '/search']) {
    test(`${language}: direct ${initialRoute} and client navigation preserve indexing signals`, async () => {
      const html = readFileSync(new URL(`../dist/${language}${initialRoute}/index.html`, import.meta.url), 'utf8')
      const dom = new JSDOM(html, { url: getRouteMetadata(initialRoute, language).url, pretendToBeVisual: true })
      globalThis.window = dom.window
      globalThis.document = dom.window.document
      globalThis.IS_REACT_ACT_ENVIRONMENT = true
      dom.window.scrollTo = () => {}
      dom.window.HTMLElement.prototype.scrollIntoView = () => {}
      const originalFetch = globalThis.fetch
      // No membership API or other external requests should be made by this test.
      globalThis.fetch = async () => new Response(JSON.stringify({ summary: { totalApplications: 0 } }), {
        headers: { 'Content-Type': 'application/json' },
      })
      const { default: ReactDOMClient } = await import('react-dom/client')
      const root = ReactDOMClient.createRoot(document.getElementById('root'))
      let navigate
      function NavigationProbe() {
        navigate = useNavigate()
        return React.createElement(App, { language })
      }

      function assertHead(route) {
        const meta = getRouteMetadata(route, language)
        assert.equal(document.documentElement.lang, language)
        assert.equal(document.title, meta.title)
        assert.equal(document.querySelector('meta[name="description"]').content, meta.description)
        assert.equal(document.querySelectorAll('link[rel="canonical"]').length, 1)
        assert.equal(document.querySelector('link[rel="canonical"]').href, meta.url)
        assert.equal(document.querySelector('meta[property="og:url"]').content, meta.url)
        assert.equal(document.querySelector('meta[property="og:title"]').content, meta.title)
        assert.equal(document.querySelector('meta[property="og:description"]').content, meta.description)
        assert.equal(document.querySelector('meta[name="twitter:title"]').content, meta.title)
        assert.equal(document.querySelector('meta[name="twitter:description"]').content, meta.description)
        assert.equal(document.querySelectorAll('link[hreflang]').length, 3)
        for (const alternate of meta.alternates) {
          assert.equal(document.querySelector(`link[hreflang="${alternate.language}"]`).href, alternate.url)
        }
        assert.equal(document.querySelector('meta[name="robots"]')?.content ?? null, meta.noindex ? 'noindex' : null)
      }

      try {
        assertHead(initialRoute)
        await act(async () => root.render(React.createElement(MemoryRouter, {
          basename: `/${language}`,
          initialEntries: [`/${language}${initialRoute}`],
          future: { v7_startTransition: true, v7_relativeSplatPath: true },
        }, React.createElement(NavigationProbe))))
        assertHead(initialRoute)
        for (const route of ['/search?q=training', '/glossary', '/', '/about/', '/contact']) {
          await act(async () => navigate(route))
          assertHead(route.split('?')[0])
        }
      } finally {
        await act(async () => root.unmount())
        dom.window.close()
        globalThis.fetch = originalFetch
        delete globalThis.window
        delete globalThis.document
        delete globalThis.IS_REACT_ACT_ENVIRONMENT
      }
    })
  }
}
