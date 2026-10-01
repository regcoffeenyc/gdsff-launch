import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { JSDOM } from 'jsdom'
import { build } from 'vite'
import React, { act } from 'react'
import { submitSafetyConsentForm } from '../src/utils/safetyConsentSubmit.js'

// Bundle the real components as in metadata-navigation.test.mjs. Only the PDF
// side effect is replaced: these tests never generate/download files or contact
// APIs, and all participant values below are deliberately synthetic.
const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const entryId = 'virtual:gdsff-language-consent-tests'
const pdfId = '\0gdsff-safety-pdf-test-double'
await build({
  root: projectRoot,
  logLevel: 'silent',
  plugins: [{
    name: 'language-consent-test-entry',
    enforce: 'pre',
    resolveId(id) {
      if (id === entryId) return `\0${entryId}`
      if (/(?:^|\/)safetyConsentPdf(?:\.js)?$/.test(id)) return pdfId
    },
    load(id) {
      if (id === pdfId) {
        return 'export async function downloadSafetyConsentPdf(payload) { return globalThis.__testSafetyPdf(payload) }'
      }
      if (id === `\0${entryId}`) return `
        export { default as App } from '/src/App.jsx';
        export { default as DocumentsPage } from '/src/pages/DocumentsPage.jsx';
        export { default as SafetyConsentPage } from '/src/pages/SafetyConsentPage.jsx';
        export { buildFederationNav, DesktopFederationNav, MobileFederationNav } from '/src/components/FederationNavigation.jsx';
        export { siteContent } from '/src/siteContent.js';
        export { safetyConsentContent } from '/src/content/safetyConsentContent.js';
      `
    },
  }],
  build: {
    ssr: true,
    outDir: 'node_modules/.cache/language-consent-tests',
    emptyOutDir: true,
    rollupOptions: { input: entryId, output: { entryFileNames: 'entry.js' } },
  },
})

// ReactDOM determines input-event support at import time. Give it a DOM before
// importing the router/SSR bundle so controlled field edits exercise onChange.
const bootstrapDom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = bootstrapDom.window
globalThis.document = bootstrapDom.window.document
const { createRoot } = await import('react-dom/client')
const { MemoryRouter, useLocation, useNavigate } = await import('react-router-dom')
const {
  App, DocumentsPage, SafetyConsentPage, buildFederationNav,
  DesktopFederationNav, MobileFederationNav, siteContent, safetyConsentContent,
} = await import('../node_modules/.cache/language-consent-tests/entry.js')
bootstrapDom.window.close()
delete globalThis.window
delete globalThis.document

const h = React.createElement
const unavailableText = {
  en: 'Online submission is currently unavailable. Download the completed PDF to keep a copy. Downloading does not send the form to the federation.',
  ka: 'ონლაინ გაგზავნა ამ ეტაპზე მიუწვდომელია. შევსებული ფორმის ასლის შესანახად ჩამოტვირთეთ PDF. ჩამოტვირთვით ფორმა ფედერაციას არ ეგზავნება.',
}

async function withDom(t, language, callback) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
    url: `https://example.invalid/${language}/documents`, pretendToBeVisual: true,
  })
  const savedGlobals = new Map(['window', 'document', 'IS_REACT_ACT_ENVIRONMENT', '__testSafetyPdf']
    .map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const calls = { network: [], storage: [], logs: [], pdf: [], assign: [] }
  globalThis.__testSafetyPdf = async (payload) => { calls.pdf.push(payload) }
  const { window } = dom
  window.scrollTo = () => {}
  window.HTMLElement.prototype.scrollIntoView = () => {}
  window.HTMLCanvasElement.prototype.getContext = () => ({
    setTransform() {}, scale() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
  })
  window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,U1lOVEhFVElD'
  window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 100 })
  t.mock.method(globalThis, 'fetch', async (...args) => {
    calls.network.push(['fetch', ...args])
    return new Response(JSON.stringify({ summary: { totalApplications: 0 }, applications: [] }), {
      headers: { 'Content-Type': 'application/json' },
    })
  })
  window.fetch = globalThis.fetch
  t.mock.method(window.XMLHttpRequest.prototype, 'open', (...args) => { calls.network.push(['xhr', ...args]) })
  t.mock.method(window.XMLHttpRequest.prototype, 'send', (...args) => { calls.network.push(['xhr-send', ...args]) })
  window.navigator.sendBeacon = (...args) => { calls.network.push(['beacon', ...args]); return false }
  for (const method of ['getItem', 'setItem', 'removeItem', 'clear']) {
    t.mock.method(window.Storage.prototype, method, (...args) => {
      calls.storage.push([method, ...args])
      return null
    })
  }
  for (const method of ['log', 'info', 'debug', 'warn', 'error']) {
    t.mock.method(console, method, (...args) => { calls.logs.push([method, ...args]) })
  }
  const root = createRoot(window.document.getElementById('root'))
  let location
  let navigate
  function RouterProbe({ children }) {
    location = useLocation()
    navigate = useNavigate()
    return children
  }
  const ctx = {
    dom, window, document: window.document, calls,
    location: () => location,
    navigate: async (to) => { await act(async () => navigate(to)) },
    render: async (element, path = '/documents?from=library#downloads') => {
      await act(async () => root.render(h(MemoryRouter, {
        basename: `/${language}`, initialEntries: [`/${language}${path}`],
        future: { v7_startTransition: true, v7_relativeSplatPath: true },
      }, h(RouterProbe, null, element))))
    },
    click: async (element) => { assert.ok(element); await act(async () => element.click()) },
    change: async (element, value) => {
      assert.ok(element)
      const prototype = element instanceof window.HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype
        : element instanceof window.HTMLSelectElement ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype
      Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value)
      await act(async () => {
        element.dispatchEvent(new window.Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }))
      })
    },
  }
  try {
    await callback(ctx)
  } finally {
    await act(async () => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of savedGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
}

function assertNoSubmissionSideEffects(calls) {
  assert.deepEqual(calls.network, [], 'must not send network requests')
  assert.deepEqual(calls.storage, [], 'must not read or persist participant data in storage')
  assert.deepEqual(calls.logs, [], 'must not log participant data or simulated submission results')
}

test('unconfigured safety helper immediately fails closed without reading or logging the payload', async (t) => {
  await withDom(t, 'en', async ({ window, calls }) => {
    const timers = []
    t.mock.method(window, 'setTimeout', (callback, delay) => { timers.push(delay); callback(); return 0 })
    t.mock.method(globalThis, 'setTimeout', (callback, delay) => { timers.push(delay); callback(); return 0 })
    const payload = new Proxy({ synthetic: true }, {
      get() { assert.fail('unconfigured helper must not inspect participant data') },
      ownKeys() { assert.fail('unconfigured helper must not serialize participant data') },
    })
    const result = await submitSafetyConsentForm(payload)
    assert.deepEqual(result, { ok: false, code: 'NOT_CONFIGURED' })
    assert.equal(Object.hasOwn(result, 'reference'), false)
    assert.deepEqual(timers, [], 'no simulated sending delay')
    assertNoSubmissionSideEffects(calls)
  })
})

for (const language of ['en', 'ka']) {
  const copy = siteContent[language]
  const view = safetyConsentContent[language]

  test(`${language}: Documents form links preserve locale, hash, and router back/forward history`, async (t) => {
    await withDom(t, language, async ({ document, render, click, navigate, location, calls }) => {
      await render(h(DocumentsPage, { copy }))
      for (const [selector, path, hash] of [
        ['.printable-target-actions .secondary-button', '/membership', '#online-application'],
        ['.printable-target-actions .ghost-button', '/safety-consent', ''],
      ]) {
        const link = document.querySelector(selector)
        assert.equal(link.tagName, 'A')
        assert.equal(link.getAttribute('href'), `/${language}${path}${hash}`)
        await click(link)
        assert.equal(location().pathname, path)
        assert.equal(location().hash, hash)
        assert.equal(location().search, '')
        await navigate(-1)
        assert.equal(location().pathname, '/documents')
        assert.equal(location().search, '?from=library')
        assert.equal(location().hash, '#downloads')
        await navigate(1)
        assert.equal(location().pathname, path)
        assert.equal(location().hash, hash)
        await navigate(-1)
      }
      const pdf = document.querySelector('.printable-target-actions a[download]')
      assert.equal(pdf.getAttribute('href'), '/downloads/gdsff-printable-target-1in-grid.pdf')
      assertNoSubmissionSideEffects(calls)
    })
  })

  test(`${language}: Documents modified clicks remain available for native browser handling`, async (t) => {
    await withDom(t, language, async ({ document, window, render, location }) => {
      await render(h(DocumentsPage, { copy }))
      for (const selector of ['.printable-target-actions .secondary-button', '.printable-target-actions .ghost-button']) {
        for (const modifier of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
          let preventedByRouter
          // Observe after React handles the event, then stop JSDOM from trying
          // unsupported native navigation. The app must not consume this click.
          document.addEventListener('click', (event) => {
            preventedByRouter = event.defaultPrevented
            event.preventDefault()
          }, { once: true })
          await act(async () => document.querySelector(selector).dispatchEvent(new window.MouseEvent('click', {
            bubbles: true, cancelable: true, button: 0, ...modifier,
          })))
          assert.equal(preventedByRouter, false, JSON.stringify(modifier))
          assert.equal(location().pathname, '/documents')
          assert.equal(location().search, '?from=library')
        }
      }
    })
  })

  test(`${language}: target labels and desktop/mobile navigation menu names are localized`, async (t) => {
    await withDom(t, language, async ({ document, render }) => {
      const groups = buildFederationNav(copy)
      const noop = () => {}
      const props = { groups, location: { pathname: '/documents', hash: '' }, openKey: null,
        openMenu: noop, queueCloseMenu: noop, closeMenu: noop, setOpenKey: noop, ariaLabel: 'Test navigation' }
      await render(h(React.Fragment, null, h(DocumentsPage, { copy }),
        h(DesktopFederationNav, props), h(MobileFederationNav, props)))
      for (const group of groups) {
        const expected = `${group.label} ${language === 'ka' ? 'მენიუ' : 'menu'}`
        assert.equal(group.menuLabel, expected)
        assert.equal(document.querySelector(`[aria-controls="${group.key}-dropdown-panel"]`).getAttribute('aria-label'), expected)
        assert.equal(document.querySelector(`[aria-controls="${group.key}-mobile-panel"]`).getAttribute('aria-label'), expected)
      }
      const feature = document.querySelector('.printable-target-copy')
      const targetPanel = document.getElementById('target-practice-documents-panel')
      const targetCategory = targetPanel.closest('.document-library-group')
      const labels = [feature, targetCategory].map((element) => element.textContent).join(' ')
      const targetNavLinks = [...document.querySelectorAll(`nav a[href="/${language}/documents#printable-target"]`)]
      assert.equal(targetNavLinks.length, 2, 'desktop and mobile must both expose the localized target link')
      for (const link of targetNavLinks) {
        assert.equal(link.querySelector('.nav-entry-title').textContent, language === 'ka' ? 'დასაბეჭდი სამიზნე' : 'Printable Target')
        if (language === 'ka') {
          assert.match(link.querySelector('.nav-entry-copy').textContent, /სამიზნის ჩამოტვირთვა/)
          assert.doesNotMatch(link.textContent, /grid target|branding|contact details/i)
        }
      }
      if (language === 'ka') {
        assert.match(labels, /დასაბეჭდი სამიზნე/)
        assert.match(labels, /სამიზნის PDF-ის ჩამოტვირთვა/)
        assert.equal(feature.querySelector('.secondary-button').textContent, 'წევრობის ფორმის გახსნა')
        assert.equal(feature.querySelector('.ghost-button').textContent, 'ხელმოწერის ფორმის გახსნა')
        assert.doesNotMatch(labels, /Printable Target|Download Target|Open Membership|Open Signature|grid target|print-ready|diamond drills/i)
      } else {
        assert.match(labels, /Printable Target/)
        assert.equal(feature.querySelector('.secondary-button').textContent, 'Open Membership Form')
        assert.equal(feature.querySelector('.ghost-button').textContent, 'Open Signature Workflow')
      }
    })
  })

  test(`${language}: desktop/mobile language switching preserves route, query, and hash`, async (t) => {
    await withDom(t, language, async ({ document, window, render, click, calls }) => {
      const next = language === 'en' ? 'ka' : 'en'
      // JSDOM's Location.assign is unforgeable. Substitute only the global
      // window's location access, leaving the actual DOM/event APIs untouched.
      globalThis.window = new Proxy(window, {
        get(target, key) {
          if (key === 'location') return { assign: (url) => calls.assign.push(url) }
          return Reflect.get(target, key, target)
        },
      })
      await render(h(App, { language }), '/documents?source=library%20card#downloads')
      for (const selector of ['.desktop-language-toggle', '.mobile-language-toggle']) {
        const buttons = [...document.querySelectorAll(`${selector} button`)]
        await click(buttons.find((button) => button.textContent === language.toUpperCase()))
        assert.equal(calls.assign.length, selector.includes('desktop') ? 0 : 1, 'current language must be a no-op')
        await click(buttons.find((button) => button.textContent === next.toUpperCase()))
      }
      assert.deepEqual(calls.assign, Array(2).fill(`/${next}/documents?source=library%20card#downloads`))
      assert.deepEqual(calls.storage, Array(2).fill(['setItem', 'gdsff-language', next]))
      assert.deepEqual(calls.network, [])
    })
  })

  test(`${language}: disabled submit and direct/Enter-generated submits cannot simulate delivery`, async (t) => {
    await withDom(t, language, async ({ document, window, render, click, change, calls }) => {
      await render(h(SafetyConsentPage, { copy }), '/safety-consent')
      const form = document.querySelector('.safety-consent-form')
      const submit = form.querySelector('button[type="submit"]')
      const notice = document.getElementById('safety-submission-unavailable')
      assert.equal(submit.disabled, true)
      assert.equal(submit.getAttribute('aria-describedby'), notice.id)
      assert.equal(notice.textContent, unavailableText[language])
      assert.equal(view.submitUnavailableText, unavailableText[language])
      await click(submit)
      assert.equal(document.querySelector('.status-banner'), null)

      for (const enter of [false, true]) {
        if (enter) {
          const input = form.querySelector('[name="fullName"]')
          await change(input, 'Synthetic Participant')
          await act(async () => input.dispatchEvent(new window.KeyboardEvent('keydown', {
            key: 'Enter', code: 'Enter', bubbles: true, cancelable: true,
          })))
        }
        // JSDOM does not implement implicit keyboard submission. Dispatch the
        // resulting submit event explicitly to exercise the same React guard.
        const event = new window.SubmitEvent('submit', { bubbles: true, cancelable: true })
        await act(async () => form.dispatchEvent(event))
        assert.equal(event.defaultPrevented, true)
        const feedback = document.querySelector('.status-banner')
        assert.equal(feedback.className, 'status-banner is-info')
        assert.equal(feedback.querySelector('strong').textContent, view.submitUnavailableTitle)
        assert.equal(feedback.querySelector('p').textContent, unavailableText[language])
        assert.equal(document.querySelector('.status-banner.is-success'), null)
        assert.doesNotMatch(feedback.textContent, /SC-[A-Z0-9]+|Reference code|accepted for internal processing|ტესტური ელექტრონული/)
        assert.equal(submit.disabled, true)
      }
      assert.deepEqual(calls.pdf, [], 'attempting submission must not trigger PDF export either')
      assertNoSubmissionSideEffects(calls)
    })
  })

  test(`${language}: PDF validation/export and reset retain fields, declarations, and signatures`, async (t) => {
    await withDom(t, language, async ({ document, window, render, click, change, calls }) => {
      await render(h(SafetyConsentPage, { copy }), '/safety-consent')
      const form = document.querySelector('.safety-consent-form')
      const download = form.querySelector('.secondary-button')
      const reset = form.querySelector('.ghost-button')
      assert.equal(download.type, 'button')
      assert.equal(reset.type, 'button')
      assert.equal(download.disabled, false)
      assert.equal(reset.disabled, false)
      assert.equal(document.querySelector('.safety-declaration').textContent, view.declarationText)
      for (const link of document.querySelectorAll('a[download]')) {
        assert.equal(link.getAttribute('href'), '/downloads/07_GDSFF_Safety_Rules_And_Informed_Consent.html')
      }
      await click(download)
      assert.equal(document.querySelector('.status-banner p').textContent, view.validationSubmit)
      assert.deepEqual(calls.pdf, [])

      const synthetic = {
        fullName: 'Synthetic Participant', birthDate: '1990-01-01', personalId: 'TEST-NOT-REAL',
        citizenship: 'Synthetic Citizenship', address: 'Synthetic Test Address', phone: '+15550100000',
        email: 'synthetic@example.invalid', status: view.participantFields.find((field) => field.name === 'status').options[0],
        emergencyContactName: 'Synthetic Emergency Contact', emergencyContactPhone: '+15550100001',
      }
      for (const field of view.participantFields) await change(form.querySelector(`[name="${field.name}"]`), synthetic[field.name])
      for (const checkbox of form.querySelectorAll('.safety-checklist input')) await click(checkbox)
      assert.equal(form.querySelector('[name="signerName"]').value, synthetic.fullName)
      await click(download)
      assert.equal(document.querySelector('.field-error').textContent, view.validationSignature)
      assert.deepEqual(calls.pdf, [])

      async function sign(canvas) {
        for (const type of ['mousedown', 'mouseup']) {
          await act(async () => canvas.dispatchEvent(new window.MouseEvent(type, {
            clientX: 30, clientY: 20, bubbles: true, cancelable: true,
          })))
        }
      }
      await sign(form.querySelector('canvas'))
      await click(form.querySelector('.minor-toggle input'))
      await click(download)
      assert.match(document.querySelector('.safety-guardian-card').textContent, new RegExp(view.validationGuardianSignature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      await change(form.querySelector('.safety-guardian-card [name="name"]'), 'Synthetic Guardian')
      await change(form.querySelector('.safety-guardian-card [name="phone"]'), '+15550100002')
      await sign(form.querySelector('.safety-guardian-card canvas'))
      await click(download)
      assert.equal(calls.pdf.length, 1)
      const payload = calls.pdf[0]
      assert.deepEqual(payload.participant, synthetic)
      assert.deepEqual(payload.participantFields, view.participantFields)
      assert.deepEqual(payload.safetyItems, view.safetyItems)
      assert.deepEqual(payload.consentItems, view.consentItems)
      assert.equal(payload.view.declarationText, view.declarationText)
      assert.equal(payload.signerName, synthetic.fullName)
      assert.equal(payload.isMinor, true)
      assert.deepEqual(payload.guardian, { name: 'Synthetic Guardian', phone: '+15550100002' })
      assert.equal(payload.participantSignature, 'data:image/png;base64,U1lOVEhFVElD')
      assert.equal(payload.guardianSignature, payload.participantSignature)
      assert.match(payload.signatureDate, /^\d{4}-\d{2}-\d{2}$/)
      assert.equal(document.querySelector('.status-banner strong').textContent, view.actionDownload)
      assert.equal(form.querySelector('button[type="submit"]').disabled, true)
      await click(reset)
      for (const field of form.querySelectorAll('input[name], textarea[name], select[name]')) assert.equal(field.value, '')
      for (const checkbox of form.querySelectorAll('input[type="checkbox"]')) assert.equal(checkbox.checked, false)
      assert.equal(form.querySelector('.safety-guardian-card'), null)
      assert.equal(form.querySelector('.signature-state.is-signed'), null)
      assert.equal(document.querySelector('.status-banner p').textContent, view.resetConfirmation)
      assert.equal(document.getElementById('safety-submission-unavailable').textContent, unavailableText[language])
      assertNoSubmissionSideEffects(calls)
    })
  })
}
