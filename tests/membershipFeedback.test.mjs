import assert from 'node:assert/strict'
import { test } from 'node:test'
import { inspect } from 'node:util'
import { JSDOM } from 'jsdom'
import { build } from 'vite'
import React, { act } from 'react'
import { membershipApplicationContent } from '../src/content/membershipApplicationContent.js'
import { enContent } from '../src/content/enContent.js'
import { kaContent } from '../src/content/kaContent.js'
import {
  buildMembershipFeedback,
  buildMembershipErrorFeedback,
  buildNotificationLabel,
} from '../src/utils/membershipFeedback.js'

// Compile the real page and submission formatter without touching the backend.
await build({
  logLevel: 'silent',
  build: {
    ssr: true,
    outDir: 'node_modules/.cache/membership-feedback',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        membershipPage: 'src/pages/MembershipPage.jsx',
        membershipSubmit: 'src/utils/membershipApplicationSubmit.js',
        membershipApi: 'src/utils/socialHubApi.js',
      },
    },
  },
})
const { default: MembershipPage } = await import('../node_modules/.cache/membership-feedback/membershipPage.js')
const { formatMembershipApplicationSummary, createMembershipApplicationPayload } =
  await import('../node_modules/.cache/membership-feedback/membershipSubmit.js')
const { submitMembershipApplication: submitMembershipApplicationRequest } =
  await import('../node_modules/.cache/membership-feedback/membershipApi.js')

// These are synthetic sentinels, never real applicant or server data. Include
// health/guardian information in free text because those fields can contain it.
const privateMarkers = {
  identity: 'PRIVACY_IDENTITY_SYNTHETIC',
  contact: 'privacy_contact_synthetic',
  health: 'PRIVACY_HEALTH_SYNTHETIC',
  guardian: 'PRIVACY_GUARDIAN_SYNTHETIC',
  payload: 'PRIVACY_PAYLOAD_SYNTHETIC',
  response: 'PRIVACY_SERVER_RESPONSE_SYNTHETIC',
  error: 'PRIVACY_ERROR_MESSAGE_SYNTHETIC',
  reference: 'PRIVACY_REFERENCE_SYNTHETIC',
}
const rawMessage = `<img src=x onerror=alert(1)> SMTP_SECRET=${privateMarkers.response} ${privateMarkers.error}`
const applicant = {
  fullName: privateMarkers.identity,
  birthDate: '1990-01-02',
  personalId: `ID-${privateMarkers.identity}`,
  citizenship: 'Synthetic citizenship',
  address: `Synthetic address ${privateMarkers.contact}`,
  phone: '+15550100000',
  email: `${privateMarkers.contact}@example.invalid`,
  membershipType: 'athlete',
  sportInterest: 'both',
  additionalInfo: `${privateMarkers.health} ${privateMarkers.guardian} ${privateMarkers.payload}`,
}

function applicationFor(view, notificationStatus = 'sent') {
  return {
    reference: `MEM-20261001-${privateMarkers.reference}`,
    submittedAt: '2026-10-01T03:00:00.000Z',
    status: 'submitted',
    applicant: { ...applicant },
    confirmations: view.consentItems.map((label) => ({ label, accepted: true })),
    notification: { status: notificationStatus, message: rawMessage },
  }
}

function spyOnConsole(t) {
  const calls = []
  for (const method of ['log', 'info', 'warn', 'error', 'debug']) {
    t.mock.method(console, method, (...args) => { calls.push({ method, args }) })
  }
  return calls
}

function assertNoPrivateConsoleOutput(calls) {
  for (const { method, args } of calls) {
    // JSON.stringify alone misses Error.message/stack and other non-enumerable
    // details. Do not invoke getters or custom inspection on hostile objects.
    const output = inspect(args, { depth: Infinity, showHidden: true, customInspect: false, getters: false })
    for (const [category, marker] of Object.entries(privateMarkers)) {
      assert.ok(!output.includes(marker), `console.${method} must not contain the ${category} marker`)
    }
  }
  // No framework warning needs an exemption in this isolated page. Require
  // silence as well, so a new log cannot hide unmarked application data.
  assert.deepEqual(calls, [], 'membership submission must not write to any console method')
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// The request layer must never decide a reference is safe to log based on its
// presence or expected format. Exercise unexpected JSON shapes without turning
// this privacy regression suite into a separate UI response-schema change.
const referenceCases = [
  ['missing', undefined],
  ['null', null],
  ['boolean', false],
  ['number', 12345],
  ['array', [privateMarkers.reference, privateMarkers.identity]],
  ['object', { reference: privateMarkers.reference, guardian: privateMarkers.guardian }],
  ['invalid-toString', { toString: privateMarkers.reference, contact: privateMarkers.contact }],
  ['hostile-string', `<script>${privateMarkers.reference}</script>\n${privateMarkers.identity} ${privateMarkers.contact}`],
]

for (const [referenceCase, reference] of referenceCases) {
  for (const storedError of [false, true]) {
    test(`membership API: ${storedError ? 'stored HTTP error' : 'success'} with ${referenceCase} reference never logs private data`, async (t) => {
      const consoleCalls = spyOnConsole(t)
      const view = membershipApplicationContent.en
      const payload = createMembershipApplicationPayload({ values: applicant, consents: [true, true, true], view, localeKey: 'en' })
      const application = { ...applicationFor(view, storedError ? 'failed' : 'sent'), reference }
      const body = {
        application,
        notification: application.notification,
        diagnostics: { ...privateMarkers, payload },
        ...(storedError ? { error: rawMessage, stored: true } : {}),
      }
      const expectedBody = JSON.parse(JSON.stringify(body))
      const requests = []
      t.mock.method(globalThis, 'fetch', async (url, options) => {
        requests.push({ url, options })
        return jsonResponse(body, storedError ? 502 : 200)
      })
      if (storedError) {
        await assert.rejects(submitMembershipApplicationRequest(payload), (error) => {
          assert.equal(error.statusCode, 502)
          assert.equal(error.message, rawMessage)
          assert.deepEqual(error.details, expectedBody, 'preserve stored application details for localized feedback')
          return true
        })
      } else {
        assert.deepEqual(await submitMembershipApplicationRequest(payload), expectedBody)
      }
      assert.equal(requests.length, 1)
      assert.ok(requests[0].url.endsWith('/api/membership/applications'))
      assert.equal(requests[0].options.method, 'POST')
      assert.deepEqual(JSON.parse(requests[0].options.body), payload)
      assertNoPrivateConsoleOutput(consoleCalls)
    })
  }
}

for (const localeKey of ['ka', 'en']) {
  const view = membershipApplicationContent[localeKey]

  test(`${localeKey}: sent notification uses localized success and keeps the reference`, () => {
    const application = applicationFor(view)
    const feedback = buildMembershipFeedback({ application }, view, localeKey)
    assert.equal(feedback.type, 'success')
    assert.equal(feedback.title, view.submitSuccessTitle)
    assert.ok(feedback.text.includes(application.reference))
    assert.ok(feedback.text.includes(view.submitSuccessText))
    assert.ok(!feedback.text.includes(rawMessage))
    assert.equal(buildNotificationLabel(application.notification, localeKey),
      localeKey === 'ka' ? 'ელფოსტა წარმატებით გაიგზავნა.' : 'Email delivered successfully.')
  })

  test(`${localeKey}: every unsent response keeps the stored warning without server text`, () => {
    for (const status of ['not-configured', 'failed', 'pending', 'unexpected']) {
      const application = applicationFor(view, status)
      const feedback = buildMembershipFeedback({ application }, view, localeKey)
      assert.equal(feedback.type, 'warning')
      assert.ok(feedback.text.includes(application.reference))
      assert.match(feedback.text, localeKey === 'ka' ? /თავიდან ნუ გააგზავნით/ : /do not submit it again/)
      assert.ok(!JSON.stringify(feedback).includes(rawMessage))
      const notificationLabel = buildNotificationLabel(application.notification, localeKey)
      assert.match(notificationLabel, localeKey === 'ka' ? /შენახულია/ : /stored/)
      assert.ok(!notificationLabel.includes(rawMessage))
    }
    assert.equal(buildNotificationLabel(null, localeKey), '')
  })

  test(`${localeKey}: stored HTTP error preserves reference and no-resubmission guidance`, () => {
    const application = applicationFor(view, 'failed')
    const error = Object.assign(new Error(rawMessage), {
      statusCode: 502,
      details: { application, stored: true, notification: { status: 'failed', message: rawMessage } },
    })
    const feedback = buildMembershipErrorFeedback(error, view, localeKey)
    assert.equal(feedback.type, 'error')
    assert.ok(feedback.text.includes(application.reference))
    assert.match(feedback.text, localeKey === 'ka' ? /თავიდან ნუ გააგზავნით/ : /do not submit it again/)
    assert.ok(!JSON.stringify(feedback).includes(rawMessage))
    assert.ok(!feedback.text.includes(view.submitErrorText))
  })

  test(`${localeKey}: recognized validation errors are translated, including legacy HTTP 500 responses`, () => {
    const messages = [
      'Please complete all required membership fields before submitting.',
      'Please enter a valid email address before submitting.',
      'Membership type is not valid.',
      'Sport interest is not valid.',
      'All required confirmations must be accepted before submitting.',
    ]
    for (const message of messages) {
      const error = Object.assign(new Error(message), { statusCode: 500 })
      const feedback = buildMembershipErrorFeedback(error, view, localeKey)
      assert.equal(feedback.type, 'error')
      assert.equal(feedback.title, view.validationTitle)
      assert.notEqual(feedback.text, message)
      assert.match(feedback.text, localeKey === 'ka' ? /გთხოვთ/ : /Please/)
    }
    for (const statusCode of [400, 422]) {
      const feedback = buildMembershipErrorFeedback({ statusCode, message: rawMessage }, view, localeKey)
      assert.equal(feedback.text, view.validationText)
    }
  })

  test(`${localeKey}: network and unknown errors only show the friendly localized fallback`, () => {
    for (const error of [
      new TypeError('Failed to fetch'),
      Object.assign(new Error(rawMessage), { statusCode: 0 }),
      Object.assign(new Error(rawMessage), { statusCode: 500, details: { error: rawMessage } }),
      null,
    ]) {
      assert.deepEqual(buildMembershipErrorFeedback(error, view, localeKey), {
        type: 'error',
        title: view.submitErrorTitle,
        text: view.submitErrorText,
      })
    }
  })

  test(`${localeKey}: all known summary statuses use existing labels and preserve application data`, () => {
    const application = applicationFor(view)
    const statusHeading = localeKey === 'ka' ? 'სტატუსი' : 'Status'
    for (const [status, label] of Object.entries(view.statusLabels)) {
      const summary = formatMembershipApplicationSummary({ ...application, status }, view, localeKey)
      assert.ok(summary.split('\n').includes(`${statusHeading}: ${label}`))
      assert.ok(summary.includes(application.reference))
      assert.ok(summary.includes(applicant.email))
      for (const consent of view.consentItems) assert.ok(summary.includes(consent))
    }
    // Forward-compatible fallback stays intact for an unknown status.
    assert.ok(formatMembershipApplicationSummary({ ...application, status: 'future-status' }, view, localeKey)
      .includes(`${statusHeading}: future-status`))
    const payload = createMembershipApplicationPayload({
      values: applicant, consents: [true, true, true], view, localeKey,
    })
    assert.deepEqual(payload, {
      locale: localeKey,
      source: 'website-registration',
      applicant,
      confirmations: application.confirmations,
    })
  })

  for (const outcome of [
    'sent', 'unsent-response', 'stored-error', 'validation-error', 'network-error', 'invalid-form',
    'hostile-reference-sent', 'hostile-reference-stored-error', 'malformed-json', 'malformed-error-json', 'unknown-error',
  ]) {
    test(`${localeKey}: rendered membership form handles ${outcome} without displaying raw errors or logging private data`, async (t) => {
      const dom = new JSDOM('<!doctype html><div id="root"></div>', {
        url: `https://gdsff.org/${localeKey}/membership`, pretendToBeVisual: true,
      })
      const originals = {
        window: globalThis.window,
        document: globalThis.document,
        fetch: globalThis.fetch,
        act: globalThis.IS_REACT_ACT_ENVIRONMENT,
      }
      globalThis.window = dom.window
      globalThis.document = dom.window.document
      globalThis.IS_REACT_ACT_ENVIRONMENT = true
      const consoleCalls = spyOnConsole(t)
      const sent = ['sent', 'hostile-reference-sent'].includes(outcome)
      const storedError = ['stored-error', 'hostile-reference-stored-error'].includes(outcome)
      const application = applicationFor(view, sent ? 'sent' : 'failed')
      if (outcome.startsWith('hostile-reference')) {
        application.reference = `<img src=x onerror=alert(1)> ${privateMarkers.reference} ${privateMarkers.identity} ${privateMarkers.contact}`
      }
      const requests = []
      globalThis.fetch = async (url, options) => {
        if (url.endsWith('/api/membership/summary')) {
          return jsonResponse({ summary: { totalApplications: 0 } })
        }
        assert.ok(url.endsWith('/api/membership/applications'))
        requests.push(JSON.parse(options.body))
        if (outcome === 'network-error') throw new TypeError(rawMessage)
        if (['malformed-json', 'malformed-error-json'].includes(outcome)) {
          return new Response(`{"error":"${privateMarkers.error}","reference":"${privateMarkers.reference}","payload":`, {
            status: outcome === 'malformed-error-json' ? 502 : 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        if (outcome === 'validation-error') {
          return jsonResponse({
            error: 'Please enter a valid email address before submitting.',
            diagnostics: { ...privateMarkers, payload: requests[0] },
          }, 500)
        }
        if (outcome === 'unknown-error') {
          return jsonResponse({ error: rawMessage, diagnostics: { ...privateMarkers, payload: requests[0] } }, 500)
        }
        return jsonResponse({
          application,
          summary: { totalApplications: 1, statusCounts: { submitted: 1 } },
          notification: application.notification,
          diagnostics: { ...privateMarkers, payload: requests[0] },
          ...(storedError ? { stored: true, error: rawMessage } : {}),
        }, storedError ? 502 : 200)
      }
      const { default: ReactDOMClient } = await import('react-dom/client')
      const root = ReactDOMClient.createRoot(document.getElementById('root'))
      try {
        await act(async () => root.render(React.createElement(MembershipPage, {
          copy: localeKey === 'ka' ? kaContent : enContent,
          language: localeKey,
        })))
        const form = document.querySelector('form')
        for (const [name, value] of Object.entries(applicant)) {
          const input = form.elements.namedItem(name)
          const prototype = input.tagName === 'SELECT' ? dom.window.HTMLSelectElement.prototype
            : input.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype
              : dom.window.HTMLInputElement.prototype
          await act(async () => {
            Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value)
            input.dispatchEvent(new dom.window.Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }))
          })
        }
        if (outcome !== 'invalid-form') {
          for (const checkbox of form.querySelectorAll('input[type="checkbox"]')) {
            await act(async () => checkbox.click())
          }
        }
        await act(async () => {
          form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))
          await new Promise((resolve) => setTimeout(resolve, 0))
        })
        const banner = document.querySelector('.status-banner')
        assert.ok(banner)
        assert.ok(!document.body.textContent.includes(rawMessage))
        assert.ok(!document.body.textContent.includes('SMTP_SECRET'))
        assert.equal(document.querySelectorAll('img[onerror]').length, 0)
        assert.equal(form.querySelector('button[type="submit"]').disabled, false)

        if (outcome === 'invalid-form') {
          assert.equal(requests.length, 0)
          assert.ok(banner.textContent.includes(view.validationText))
        } else {
          assert.equal(requests.length, 1)
          assert.deepEqual(requests[0].applicant, applicant)
          assert.deepEqual(requests[0].confirmations, application.confirmations)
          if (sent || outcome === 'unsent-response' || storedError) {
            assert.ok(banner.textContent.includes(application.reference))
            assert.equal(banner.className, `status-banner is-${sent ? 'success' : outcome === 'unsent-response' ? 'warning' : 'error'}`)
            assert.equal(document.querySelector('.membership-reference-chip strong').textContent, application.reference)
            assert.ok(document.querySelector('.membership-summary-textarea').value.includes(view.statusLabels.submitted))
            assert.equal(form.elements.namedItem('fullName').value, '')
            if (!sent) {
              assert.match(banner.textContent, localeKey === 'ka' ? /თავიდან ნუ გააგზავნით/ : /do not submit it again/)
            }
          } else {
            assert.equal(banner.className, 'status-banner is-error')
            assert.ok(banner.textContent.includes(outcome === 'validation-error' ? view.validationTitle : view.submitErrorText))
            assert.equal(form.elements.namedItem('fullName').value, applicant.fullName)
            assert.equal(document.querySelector('.membership-reference-chip'), null)
          }
        }
      } finally {
        try {
          await act(async () => root.unmount())
        } finally {
          dom.window.close()
          globalThis.window = originals.window
          globalThis.document = originals.document
          globalThis.fetch = originals.fetch
          globalThis.IS_REACT_ACT_ENVIRONMENT = originals.act
        }
      }
      assertNoPrivateConsoleOutput(consoleCalls)
    })
  }
}
