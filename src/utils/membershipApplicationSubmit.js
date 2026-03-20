function resolveField(view, name) {
  return view.fields.find((field) => field.name === name)
}

function resolveOptionLabel(view, name, value) {
  const field = resolveField(view, name)
  const option = field?.options?.find((item) => item.value === value)

  return option?.label ?? value
}

function resolveFieldLabel(view, name) {
  return resolveField(view, name)?.label ?? name
}

function buildApplicantRecord(values, view) {
  return Object.fromEntries(
    view.fields.map((field) => {
      if (field.name === 'membershipType' || field.name === 'sportInterest') {
        return [
          field.name,
          {
            value: values[field.name] ?? '',
            label: resolveOptionLabel(view, field.name, values[field.name] ?? ''),
          },
        ]
      }

      return [field.name, values[field.name] ?? '']
    }),
  )
}

export function createMembershipApplicationPayload({ values, consents, view, localeKey, destinationEmail }) {
  return {
    submittedAt: new Date().toISOString(),
    locale: localeKey,
    destinationEmail,
    applicant: buildApplicantRecord(values, view),
    confirmations: view.consentItems.map((label, index) => ({
      label,
      accepted: Boolean(consents[index]),
    })),
  }
}

export function formatMembershipApplicationSummary(payload, reference, view, localeKey) {
  const applicant = payload.applicant
  const isGeorgian = localeKey === 'ka'
  const yesLabel = isGeorgian ? '\u10d3\u10d8\u10d0\u10ee' : 'Yes'
  const noLabel = isGeorgian ? '\u10d0\u10e0\u10d0' : 'No'
  const headings = isGeorgian
    ? {
        reference: '\u10e0\u10d4\u10e4\u10d4\u10e0\u10d4\u10dc\u10e1\u10d8',
        submittedAt: '\u10d2\u10d0\u10d2\u10d6\u10d0\u10d5\u10dc\u10d8\u10e1 \u10d3\u10e0\u10dd',
        locale: '\u10d4\u10dc\u10d0',
        details: '\u10d0\u10de\u10da\u10d8\u10d9\u10d0\u10dc\u10e2\u10d8\u10e1 \u10db\u10dd\u10dc\u10d0\u10ea\u10d4\u10db\u10d4\u10d1\u10d8',
        confirmations: '\u10d3\u10d0\u10d3\u10d0\u10e1\u10e2\u10e3\u10e0\u10d4\u10d1\u10d4\u10d1\u10d8',
      }
    : {
        reference: 'Reference',
        submittedAt: 'Submitted At',
        locale: 'Locale',
        details: 'Applicant Details',
        confirmations: 'Confirmations',
      }
  const lines = [
    `${headings.reference}: ${reference}`,
    `${headings.submittedAt}: ${payload.submittedAt}`,
    `${headings.locale}: ${payload.locale}`,
    '',
    headings.details,
    `${resolveFieldLabel(view, 'fullName')}: ${applicant.fullName}`,
    `${resolveFieldLabel(view, 'birthDate')}: ${applicant.birthDate}`,
    `${resolveFieldLabel(view, 'personalId')}: ${applicant.personalId}`,
    `${resolveFieldLabel(view, 'citizenship')}: ${applicant.citizenship}`,
    `${resolveFieldLabel(view, 'address')}: ${applicant.address}`,
    `${resolveFieldLabel(view, 'phone')}: ${applicant.phone}`,
    `${resolveFieldLabel(view, 'email')}: ${applicant.email}`,
    `${resolveFieldLabel(view, 'membershipType')}: ${applicant.membershipType.label}`,
    `${resolveFieldLabel(view, 'sportInterest')}: ${applicant.sportInterest.label}`,
    `${resolveFieldLabel(view, 'additionalInfo')}: ${applicant.additionalInfo || '-'}`,
    '',
    headings.confirmations,
    ...payload.confirmations.map((item) => `- ${item.accepted ? yesLabel : noLabel}: ${item.label}`),
  ]

  return lines.join('\n')
}

export function buildMembershipApplicationMailto({ destinationEmail, applicantName, reference, summary, localeKey }) {
  const subjectPrefix =
    localeKey === 'ka' ? 'GDSFF \u10ec\u10d4\u10d5\u10e0\u10dd\u10d1\u10d8\u10e1 \u10d2\u10d0\u10dc\u10d0\u10ea\u10ee\u10d0\u10d3\u10d8' : 'GDSFF Membership Application'
  const subject = `${subjectPrefix} - ${applicantName || 'Applicant'} - ${reference}`
  const body = `${summary}\n\n---\nPrepared via gdsff.org membership form`

  return `mailto:${destinationEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export async function submitMembershipApplication({ values, consents, view, localeKey, destinationEmail }) {
  const reference = `MA-${Date.now().toString(36).toUpperCase()}`
  const payload = createMembershipApplicationPayload({
    values,
    consents,
    view,
    localeKey,
    destinationEmail,
  })

  const summary = formatMembershipApplicationSummary(payload, reference, view, localeKey)
  const mailtoHref = buildMembershipApplicationMailto({
    destinationEmail,
    applicantName: values.fullName,
    reference,
    summary,
    localeKey,
  })

  // Frontend-ready handoff until direct API or email service delivery is connected.
  await new Promise((resolve) => {
    window.setTimeout(resolve, 700)
  })

  return {
    ok: true,
    reference,
    payload,
    summary,
    mailtoHref,
  }
}
