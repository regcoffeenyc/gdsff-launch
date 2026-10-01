import assert from 'node:assert/strict'
import { test } from 'node:test'
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
      },
    },
  },
})
const { default: MembershipPage } = await import('../node_modules/.cache/membership-feedback/membershipPage.js')
const { formatMembershipApplicationSummary, createMembershipApplicationPayload } =
  await import('../node_modules/.cache/membership-feedback/membershipSubmit.js')

const rawMessage = '<img src=x onerror=alert(1)> SMTP_SECRET=private-server-detail'
const applicant = {
  fullName: 'Test Applicant',
  birthDate: '1990-01-02',
  personalId: '12345678901',
  citizenship: 'Georgia',
  address: 'Test address',
  phone: '+995555010101',
  email: 'test@example.com',
  membershipType: 'athlete',
  sportInterest: 'both',
  additionalInfo: 'Test application',
}

function applicationFor(view, notificationStatus = 'sent') {
  return {
    reference: 'MEM-20261001-TEST1234',
    submittedAt: '2026-10-01T03:00:00.000Z',
    status: 'submitted',
    applicant: { ...applicant },
    confirmations: view.consentItems.map((label) => ({ label, accepted: true })),
    notification: { status: notificationStatus, message: rawMessage },
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
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

  for (const outcome of ['sent', 'unsent-response', 'stored-error', 'validation-error', 'network-error', 'invalid-form']) {
    test(`${localeKey}: rendered membership form handles ${outcome} without leaking raw errors`, async (t) => {
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
      t.mock.method(console, 'error', () => {})
      const application = applicationFor(view, outcome === 'sent' ? 'sent' : 'failed')
      const requests = []
      globalThis.fetch = async (url, options) => {
        if (url.endsWith('/api/membership/summary')) {
          return jsonResponse({ summary: { totalApplications: 0 } })
        }
        assert.ok(url.endsWith('/api/membership/applications'))
        requests.push(JSON.parse(options.body))
        if (outcome === 'network-error') throw new TypeError(rawMessage)
        if (outcome === 'validation-error') {
          return jsonResponse({ error: 'Please enter a valid email address before submitting.' }, 500)
        }
        return jsonResponse({
          application,
          summary: { totalApplications: 1, statusCounts: { submitted: 1 } },
          notification: application.notification,
          ...(outcome === 'stored-error' ? { stored: true, error: rawMessage } : {}),
        }, outcome === 'stored-error' ? 502 : 200)
      }
      const { default: ReactDOMClient } = await import('react-dom/client')
      const root = ReactDOMClient.createRoot(document.getElementById('root'))
      try {
        await act(async () => root.render(React.createElement(MembershipPage, {
          copy: localeKey === 'ka' ? kaContent : enContent,
          language: localeKey,
        })))
        const form = document.querySelector('form')
        if (outcome !== 'invalid-form') {
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
          if (['sent', 'unsent-response', 'stored-error'].includes(outcome)) {
            assert.ok(banner.textContent.includes(application.reference))
            assert.equal(banner.className, `status-banner is-${outcome === 'sent' ? 'success' : outcome === 'unsent-response' ? 'warning' : 'error'}`)
            assert.equal(document.querySelector('.membership-reference-chip strong').textContent, application.reference)
            assert.ok(document.querySelector('.membership-summary-textarea').value.includes(view.statusLabels.submitted))
            assert.equal(form.elements.namedItem('fullName').value, '')
          } else {
            assert.equal(banner.className, 'status-banner is-error')
            assert.ok(banner.textContent.includes(outcome === 'network-error' ? view.submitErrorText : view.validationTitle))
            assert.equal(form.elements.namedItem('fullName').value, applicant.fullName)
            assert.equal(document.querySelector('.membership-reference-chip'), null)
          }
        }
      } finally {
        await act(async () => root.unmount())
        dom.window.close()
        globalThis.window = originals.window
        globalThis.document = originals.document
        globalThis.fetch = originals.fetch
        globalThis.IS_REACT_ACT_ENVIRONMENT = originals.act
      }
    })
  }
}
