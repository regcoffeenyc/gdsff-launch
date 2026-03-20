import { submitMembershipApplication as submitMembershipApplicationRequest } from './socialHubApi'

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

export function createMembershipApplicationPayload({ values, consents, view, localeKey }) {
  return {
    locale: localeKey,
    source: 'website-registration',
    applicant: {
      fullName: values.fullName ?? '',
      birthDate: values.birthDate ?? '',
      personalId: values.personalId ?? '',
      citizenship: values.citizenship ?? '',
      address: values.address ?? '',
      phone: values.phone ?? '',
      email: values.email ?? '',
      membershipType: values.membershipType ?? '',
      sportInterest: values.sportInterest ?? '',
      additionalInfo: values.additionalInfo ?? '',
    },
    confirmations: view.consentItems.map((label, index) => ({
      label,
      accepted: Boolean(consents[index]),
    })),
  }
}

export function formatMembershipApplicationSummary(application, view, localeKey) {
  const applicant = buildApplicantRecord(application.applicant || {}, view)
  const isGeorgian = localeKey === 'ka'
  const headings = isGeorgian
    ? {
        reference: 'რეფერენსი',
        submittedAt: 'გაგზავნის დრო',
        status: 'სტატუსი',
        details: 'აპლიკანტის მონაცემები',
        confirmations: 'დადასტურებები',
      }
    : {
        reference: 'Reference',
        submittedAt: 'Submitted At',
        status: 'Status',
        details: 'Applicant Details',
        confirmations: 'Confirmations',
      }

  const yesLabel = isGeorgian ? 'დიახ' : 'Yes'
  const noLabel = isGeorgian ? 'არა' : 'No'
  const lines = [
    `${headings.reference}: ${application.reference || ''}`,
    `${headings.submittedAt}: ${application.submittedAt || ''}`,
    `${headings.status}: ${application.status || ''}`,
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
    ...(application.confirmations || []).map((item) => `- ${item.accepted ? yesLabel : noLabel}: ${item.label}`),
  ]

  return lines.join('\n')
}

export async function submitMembershipApplication({ values, consents, view, localeKey }) {
  const payload = createMembershipApplicationPayload({
    values,
    consents,
    view,
    localeKey,
  })

  const result = await submitMembershipApplicationRequest(payload)

  return {
    ...result,
    reference: result.application?.reference || '',
    summaryText: formatMembershipApplicationSummary(result.application || payload, view, localeKey),
  }
}
