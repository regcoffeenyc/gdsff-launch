import { randomUUID } from 'node:crypto'

export const membershipTypeCatalog = new Set(['athlete', 'coach', 'club-representative', 'supporter', 'other'])
export const sportInterestCatalog = new Set(['dynamic-shooting', 'functional-fitness', 'both'])
export const membershipStatusCatalog = new Set(['submitted', 'under-review', 'approved', 'needs-info', 'closed'])

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeMembershipValue(value) {
  return `${value ?? ''}`.trim()
}

function normalizeMembershipEmail(value) {
  return normalizeMembershipValue(value).toLowerCase()
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function buildMembershipReference() {
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `MEM-${dateStamp}-${randomUUID().split('-')[0].toUpperCase()}`
}

export function sanitizeMembershipApplicationInput(input) {
  const applicantInput = input?.applicant && typeof input.applicant === 'object' ? input.applicant : {}
  const applicant = {
    fullName: normalizeMembershipValue(applicantInput.fullName),
    birthDate: normalizeMembershipValue(applicantInput.birthDate),
    personalId: normalizeMembershipValue(applicantInput.personalId),
    citizenship: normalizeMembershipValue(applicantInput.citizenship),
    address: normalizeMembershipValue(applicantInput.address),
    phone: normalizeMembershipValue(applicantInput.phone),
    email: normalizeMembershipEmail(applicantInput.email),
    membershipType: normalizeMembershipValue(applicantInput.membershipType),
    sportInterest: normalizeMembershipValue(applicantInput.sportInterest),
    additionalInfo: normalizeMembershipValue(applicantInput.additionalInfo),
  }

  const requiredFields = [
    'fullName',
    'birthDate',
    'personalId',
    'citizenship',
    'address',
    'phone',
    'email',
    'membershipType',
    'sportInterest',
  ]

  const missingField = requiredFields.find((fieldName) => !hasValue(applicant[fieldName]))
  if (missingField) {
    throw new Error('Please complete all required membership fields before submitting.')
  }

  if (!isValidEmail(applicant.email)) {
    throw new Error('Please enter a valid email address before submitting.')
  }

  if (!membershipTypeCatalog.has(applicant.membershipType)) {
    throw new Error('Membership type is not valid.')
  }

  if (!sportInterestCatalog.has(applicant.sportInterest)) {
    throw new Error('Sport interest is not valid.')
  }

  const confirmations = (Array.isArray(input?.confirmations) ? input.confirmations : []).slice(0, 3).map((item, index) => ({
    label: hasValue(item?.label) ? `${item.label}`.trim() : `Confirmation ${index + 1}`,
    accepted: Boolean(item?.accepted),
  }))

  if (confirmations.length < 3 || confirmations.some((item) => !item.accepted)) {
    throw new Error('All required confirmations must be accepted before submitting.')
  }

  return {
    locale: normalizeMembershipValue(input?.locale) === 'ka' ? 'ka' : 'en',
    source: normalizeMembershipValue(input?.source) || 'website',
    applicant,
    confirmations,
  }
}

export function buildMembershipSummaryFromApplications(applicationsInput) {
  const applications = [...(Array.isArray(applicationsInput) ? applicationsInput : [])].sort(
    (left, right) => new Date(right.submittedAt || 0).getTime() - new Date(left.submittedAt || 0).getTime(),
  )
  const statusCounts = {
    submitted: 0,
    'under-review': 0,
    approved: 0,
    'needs-info': 0,
    closed: 0,
  }
  const typeCounts = {
    athlete: 0,
    coach: 0,
    'club-representative': 0,
    supporter: 0,
    other: 0,
  }

  for (const application of applications) {
    if (statusCounts[application.status] !== undefined) {
      statusCounts[application.status] += 1
    }

    if (typeCounts[application.applicant?.membershipType] !== undefined) {
      typeCounts[application.applicant.membershipType] += 1
    }
  }

  return {
    totalApplications: applications.length,
    statusCounts,
    typeCounts,
    lastSubmittedAt: applications[0]?.submittedAt || '',
  }
}

export function humanizeMembershipValue(value) {
  return `${value || ''}`
    .split('-')
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ')
}
