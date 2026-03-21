import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { jsPDF } from 'jspdf'
import { humanizeMembershipValue } from './membershipApplication.js'

const PDF_FONT_FILE = 'arial.ttf'
const PDF_FONT_FAMILY = 'GDSFFArial'
const fontPath = fileURLToPath(new URL('../../public/fonts/arial.ttf', import.meta.url))
const logoPath = fileURLToPath(new URL('../../public/gdsff-logo-approved.png', import.meta.url))

const localizedCatalog = {
  en: {
    title: 'GDSFF Membership Application',
    subtitle: 'Georgian Dynamic Shooting & Functional Fitness Federation',
    metadataTitle: 'Submission Record',
    applicantTitle: 'Applicant Details',
    confirmationTitle: 'Required Confirmations',
    footerNote:
      'This application was submitted through the official GDSFF online membership registration form.',
    referenceLabel: 'Submission Reference',
    submittedAtLabel: 'Submission Date / Time',
    statusLabel: 'Application Status',
    sourceLabel: 'Submission Source',
    fullNameLabel: 'Full Name',
    birthDateLabel: 'Date of Birth',
    personalIdLabel: 'Personal ID Number',
    citizenshipLabel: 'Citizenship',
    addressLabel: 'Address',
    phoneLabel: 'Phone Number',
    emailLabel: 'Email',
    membershipTypeLabel: 'Membership Type',
    sportInterestLabel: 'Sport Interest',
    additionalInfoLabel: 'Additional Information',
    confirmedLabel: 'Confirmed',
    notConfirmedLabel: 'Not Confirmed',
    noAdditionalInfo: 'No additional information provided.',
  },
  ka: {
    title: 'GDSFF წევრობის განაცხადი',
    subtitle: 'საქართველოს დინამიური სროლის და ფუნქციური ფიტნესის ფედერაცია',
    metadataTitle: 'გაგზავნის ჩანაწერი',
    applicantTitle: 'აპლიკანტის ინფორმაცია',
    confirmationTitle: 'სავალდებულო დადასტურებები',
    footerNote: 'ეს განაცხადი გაიგზავნა GDSFF-ის ოფიციალური ონლაინ წევრობის ფორმიდან.',
    referenceLabel: 'გაგზავნის რეფერენსი',
    submittedAtLabel: 'გაგზავნის თარიღი / დრო',
    statusLabel: 'განაცხადის სტატუსი',
    sourceLabel: 'გაგზავნის წყარო',
    fullNameLabel: 'სახელი და გვარი',
    birthDateLabel: 'დაბადების თარიღი',
    personalIdLabel: 'პირადი ნომერი',
    citizenshipLabel: 'მოქალაქეობა',
    addressLabel: 'მისამართი',
    phoneLabel: 'ტელეფონის ნომერი',
    emailLabel: 'ელფოსტა',
    membershipTypeLabel: 'წევრობის ტიპი',
    sportInterestLabel: 'სპორტული მიმართულება',
    additionalInfoLabel: 'დამატებითი ინფორმაცია',
    confirmedLabel: 'დადასტურებულია',
    notConfirmedLabel: 'არ არის დადასტურებული',
    noAdditionalInfo: 'დამატებითი ინფორმაცია არ არის მითითებული.',
  },
}

const localizedMembershipTypeLabels = {
  en: {
    athlete: 'Athlete',
    coach: 'Coach',
    'club-representative': 'Club Representative',
    supporter: 'Supporter',
    other: 'Other',
  },
  ka: {
    athlete: 'სპორტსმენი',
    coach: 'მწვრთნელი',
    'club-representative': 'კლუბის წარმომადგენელი',
    supporter: 'მხარდამჭერი',
    other: 'სხვა',
  },
}

const localizedSportInterestLabels = {
  en: {
    'dynamic-shooting': 'Dynamic Shooting',
    'functional-fitness': 'Functional Fitness',
    both: 'Both',
  },
  ka: {
    'dynamic-shooting': 'დინამიური სროლა',
    'functional-fitness': 'ფუნქციური ფიტნესი',
    both: 'ორივე',
  },
}

const localizedStatusLabels = {
  en: {
    submitted: 'Submitted',
    'under-review': 'Under Review',
    approved: 'Approved',
    'needs-info': 'Needs Info',
    closed: 'Closed',
  },
  ka: {
    submitted: 'გაგზავნილია',
    'under-review': 'განხილვაშია',
    approved: 'დამტკიცებულია',
    'needs-info': 'საჭიროა დამატებითი ინფორმაცია',
    closed: 'დახურულია',
  },
}

let cachedFontBase64Promise = null
let cachedLogoDataUrlPromise = null

function sanitizeFilePart(value) {
  return `${value || 'Application'}`
    .replace(/[^\p{L}\p{N}_-]/gu, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function resolveLocale(application) {
  return application?.locale === 'ka' ? 'ka' : 'en'
}

function getLocalizedView(application) {
  return localizedCatalog[resolveLocale(application)]
}

function resolveMembershipTypeLabel(value, locale) {
  return localizedMembershipTypeLabels[locale][value] || humanizeMembershipValue(value) || '-'
}

function resolveSportInterestLabel(value, locale) {
  return localizedSportInterestLabels[locale][value] || humanizeMembershipValue(value) || '-'
}

function resolveStatusLabel(value, locale) {
  return localizedStatusLabels[locale][value] || humanizeMembershipValue(value) || '-'
}

function arrayBufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64')
}

async function ensurePdfFont(doc) {
  if (!cachedFontBase64Promise) {
    cachedFontBase64Promise = readFile(fontPath).then((buffer) => buffer.toString('base64'))
  }

  const fontBase64 = await cachedFontBase64Promise
  const fontList = doc.getFontList?.() ?? {}
  const fontLoaded = Array.isArray(fontList[PDF_FONT_FAMILY])

  if (!fontLoaded) {
    doc.addFileToVFS(PDF_FONT_FILE, fontBase64)
    doc.addFont(PDF_FONT_FILE, PDF_FONT_FAMILY, 'normal')
    doc.addFont(PDF_FONT_FILE, PDF_FONT_FAMILY, 'bold')
  }

  return PDF_FONT_FAMILY
}

async function getLogoDataUrl() {
  if (!cachedLogoDataUrlPromise) {
    cachedLogoDataUrlPromise = readFile(logoPath)
      .then((buffer) => `data:image/png;base64,${arrayBufferToBase64(buffer)}`)
      .catch(() => '')
  }

  return cachedLogoDataUrlPromise
}

function addWrappedText(doc, text, x, y, width, options = {}) {
  const lines = doc.splitTextToSize(text, width)
  doc.text(lines, x, y, options)
  return y + lines.length * (options.lineHeight ?? 14)
}

function ensureSpace(doc, currentY, neededHeight, margin, drawPageHeader) {
  const pageHeight = doc.internal.pageSize.getHeight()

  if (currentY + neededHeight <= pageHeight - margin) {
    return currentY
  }

  doc.addPage()
  drawPageHeader()
  return 104
}

function buildMetadataRows(application, view, locale) {
  return [
    [view.referenceLabel, application.reference || '-'],
    [view.submittedAtLabel, application.submittedAt || '-'],
    [view.statusLabel, resolveStatusLabel(application.status, locale)],
    [view.sourceLabel, application.source || 'website'],
  ]
}

function buildApplicantRows(application, view, locale) {
  const applicant = application?.applicant || {}

  return [
    [view.fullNameLabel, applicant.fullName || '-'],
    [view.birthDateLabel, applicant.birthDate || '-'],
    [view.personalIdLabel, applicant.personalId || '-'],
    [view.citizenshipLabel, applicant.citizenship || '-'],
    [view.addressLabel, applicant.address || '-'],
    [view.phoneLabel, applicant.phone || '-'],
    [view.emailLabel, applicant.email || '-'],
    [view.membershipTypeLabel, resolveMembershipTypeLabel(applicant.membershipType, locale)],
    [view.sportInterestLabel, resolveSportInterestLabel(applicant.sportInterest, locale)],
    [view.additionalInfoLabel, applicant.additionalInfo || view.noAdditionalInfo],
  ]
}

function buildConfirmationRows(application, view) {
  const confirmations = Array.isArray(application?.confirmations) ? application.confirmations : []

  return confirmations.map((item) => ({
    status: item.accepted ? view.confirmedLabel : view.notConfirmedLabel,
    label: item.label || '',
  }))
}

function buildPdfFileName(reference) {
  return `GDSFF_Membership_Application_${sanitizeFilePart(reference || 'Application')}.pdf`
}

export async function generateMembershipApplicationPdfBuffer(application) {
  const locale = resolveLocale(application)
  const view = getLocalizedView(application)
  const metadataRows = buildMetadataRows(application, view, locale)
  const applicantRows = buildApplicantRows(application, view, locale)
  const confirmationRows = buildConfirmationRows(application, view)
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true, putOnlyUsedFonts: true })
  const fontFamily = await ensurePdfFont(doc)
  const logoDataUrl = await getLogoDataUrl()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 48
  const labelWidth = 176
  const contentWidth = pageWidth - margin * 2
  let cursorY = 104

  function drawPageHeader() {
    doc.setFillColor(15, 18, 22)
    doc.rect(0, 0, pageWidth, 78, 'F')
    doc.setDrawColor(212, 187, 131)
    doc.setLineWidth(1.2)
    doc.line(margin, 78, pageWidth - margin, 78)
    doc.setTextColor(242, 221, 176)
    doc.setFont(fontFamily, 'bold')
    doc.setFontSize(10.5)
    doc.text('GDSFF', margin, 28)
    doc.setFontSize(18)
    doc.text(view.title, margin, 48)
    doc.setFont(fontFamily, 'normal')
    doc.setFontSize(10)
    doc.setTextColor(229, 229, 229)
    doc.text(view.subtitle, margin, 64)

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', pageWidth - margin - 38, 18, 38, 38)
    }

    doc.setTextColor(20, 22, 28)
  }

  function addSectionTitle(title) {
    cursorY = ensureSpace(doc, cursorY, 38, margin, drawPageHeader)
    doc.setFont(fontFamily, 'bold')
    doc.setFontSize(13)
    doc.setTextColor(36, 36, 40)
    doc.text(title, margin, cursorY)
    cursorY += 16
    doc.setDrawColor(212, 187, 131)
    doc.setLineWidth(0.6)
    doc.line(margin, cursorY, pageWidth - margin, cursorY)
    cursorY += 20
  }

  function addLabelValue(label, value) {
    const displayValue = value || '-'
    cursorY = ensureSpace(doc, cursorY, 34, margin, drawPageHeader)
    doc.setFont(fontFamily, 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(58, 58, 62)
    doc.text(`${label}:`, margin, cursorY)
    doc.setFont(fontFamily, 'normal')
    doc.setTextColor(20, 22, 28)
    cursorY = addWrappedText(doc, displayValue, margin + labelWidth, cursorY, contentWidth - labelWidth, {
      lineHeight: 14,
    })
    cursorY += 6
  }

  function addConfirmationRow(item) {
    cursorY = ensureSpace(doc, cursorY, 28, margin, drawPageHeader)
    doc.setFont(fontFamily, 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(58, 58, 62)
    doc.text('-', margin, cursorY)
    doc.text(`${item.status}:`, margin + 14, cursorY)
    doc.setFont(fontFamily, 'normal')
    doc.setTextColor(20, 22, 28)
    cursorY = addWrappedText(doc, item.label || '-', margin + 98, cursorY, contentWidth - 98, { lineHeight: 14 })
    cursorY += 6
  }

  drawPageHeader()

  doc.setFont(fontFamily, 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(20, 22, 28)

  addSectionTitle(view.metadataTitle)
  metadataRows.forEach(([label, value]) => addLabelValue(label, value))

  addSectionTitle(view.applicantTitle)
  applicantRows.forEach(([label, value]) => addLabelValue(label, value))

  addSectionTitle(view.confirmationTitle)
  confirmationRows.forEach((item) => addConfirmationRow(item))

  cursorY = ensureSpace(doc, cursorY, 48, margin, drawPageHeader)
  cursorY += 8
  doc.setFont(fontFamily, 'normal')
  doc.setFontSize(10)
  doc.setTextColor(70, 70, 76)
  addWrappedText(doc, view.footerNote, margin, cursorY, contentWidth, { lineHeight: 14 })

  return Buffer.from(doc.output('arraybuffer'))
}

export async function buildMembershipApplicationPdfAttachment(application) {
  const filename = buildPdfFileName(application?.reference || '')
  const content = await generateMembershipApplicationPdfBuffer(application)

  return {
    filename,
    content,
    contentType: 'application/pdf',
  }
}
