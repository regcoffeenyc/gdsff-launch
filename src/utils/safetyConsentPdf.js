import { jsPDF } from 'jspdf'

const PDF_FONT_FILE = 'arial.ttf'
const PDF_FONT_FAMILY = 'GDSFFArial'

let cachedPdfFontBase64 = null

function sanitizeFilePart(value) {
  return (value || 'Participant')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s+/g, '_')
}

function formatDisplayDate(value) {
  if (!value) {
    return ''
  }

  return value
}

function addWrappedText(doc, text, x, y, width, options = {}) {
  const lines = doc.splitTextToSize(text, width)
  doc.text(lines, x, y, options)
  return y + lines.length * (options.lineHeight ?? 15)
}

function ensureSpace(doc, currentY, neededHeight, margin, drawPageHeader) {
  const pageHeight = doc.internal.pageSize.getHeight()

  if (currentY + neededHeight <= pageHeight - margin) {
    return currentY
  }

  doc.addPage()
  drawPageHeader()
  return 96
}

async function toImageDataUrl(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = reject
    image.src = src
  })
}

function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return window.btoa(binary)
}

async function ensurePdfFont(doc) {
  try {
    if (!cachedPdfFontBase64) {
      const response = await fetch(`${import.meta.env.BASE_URL}fonts/${PDF_FONT_FILE}`)

      if (!response.ok) {
        throw new Error(`Unable to load font file (${response.status})`)
      }

      cachedPdfFontBase64 = arrayBufferToBase64(await response.arrayBuffer())
    }

    const fontList = doc.getFontList?.() ?? {}
    const fontLoaded = Array.isArray(fontList[PDF_FONT_FAMILY])

    if (!fontLoaded) {
      doc.addFileToVFS(PDF_FONT_FILE, cachedPdfFontBase64)
      doc.addFont(PDF_FONT_FILE, PDF_FONT_FAMILY, 'normal')
      doc.addFont(PDF_FONT_FILE, PDF_FONT_FAMILY, 'bold')
    }

    return PDF_FONT_FAMILY
  } catch (error) {
    console.warn('GDSFF safety consent PDF font fallback engaged.', error)
    return 'helvetica'
  }
}

export async function downloadSafetyConsentPdf({
  view,
  participant,
  participantFields,
  safetyItems,
  consentItems,
  signatureDate,
  isMinor,
  signerName,
  participantSignature,
  guardian,
  guardianSignature,
  logoSrc,
}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const fontFamily = await ensurePdfFont(doc)
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 46
  const contentWidth = pageWidth - margin * 2
  let cursorY = 96

  const logoDataUrl = await toImageDataUrl(logoSrc).catch(() => null)

  function drawPageHeader() {
    doc.setFillColor(13, 15, 18)
    doc.rect(0, 0, pageWidth, 68, 'F')
    doc.setDrawColor(212, 187, 131)
    doc.setLineWidth(1.2)
    doc.line(margin, 68, pageWidth - margin, 68)
    doc.setTextColor(242, 221, 176)
    doc.setFont(fontFamily, 'bold')
    doc.setFontSize(10)
    doc.text('GDSFF', margin, 30)
    doc.setFontSize(18)
    doc.text(view.title, margin, 50)

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', pageWidth - margin - 34, 16, 34, 34)
    }

    doc.setTextColor(20, 22, 28)
  }

  function addSectionTitle(title) {
    cursorY = ensureSpace(doc, cursorY, 36, margin, drawPageHeader)
    doc.setFont(fontFamily, 'bold')
    doc.setFontSize(13)
    doc.setTextColor(35, 35, 40)
    doc.text(title, margin, cursorY)
    cursorY += 16
    doc.setDrawColor(212, 187, 131)
    doc.setLineWidth(0.6)
    doc.line(margin, cursorY, pageWidth - margin, cursorY)
    cursorY += 18
  }

  function addLabelValue(label, value) {
    const displayValue = value || '-'
    cursorY = ensureSpace(doc, cursorY, 28, margin, drawPageHeader)
    doc.setFont(fontFamily, 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(58, 58, 62)
    doc.text(`${label}:`, margin, cursorY)
    doc.setFont(fontFamily, 'normal')
    doc.setTextColor(20, 22, 28)
    cursorY = addWrappedText(doc, displayValue, margin + 170, cursorY, contentWidth - 170, { lineHeight: 14 })
    cursorY += 4
  }

  function addBullets(items) {
    items.forEach((item) => {
      cursorY = ensureSpace(doc, cursorY, 24, margin, drawPageHeader)
      doc.setFont(fontFamily, 'normal')
      doc.setFontSize(10.5)
      doc.text('-', margin, cursorY)
      cursorY = addWrappedText(doc, item, margin + 14, cursorY, contentWidth - 14, { lineHeight: 14 })
      cursorY += 4
    })
  }

  function addSignatureFrame(label, imageDataUrl) {
    cursorY = ensureSpace(doc, cursorY, 108, margin, drawPageHeader)
    doc.setFont(fontFamily, 'bold')
    doc.setFontSize(10.5)
    doc.text(label, margin, cursorY)
    cursorY += 10
    doc.setDrawColor(190, 190, 190)
    doc.setFillColor(250, 250, 248)
    doc.roundedRect(margin, cursorY, 220, 74, 8, 8, 'FD')

    if (imageDataUrl) {
      doc.addImage(imageDataUrl, 'PNG', margin + 10, cursorY + 10, 200, 54, undefined, 'FAST')
    }

    cursorY += 92
  }

  function addSignatureBlock(title, typedName, imageDataUrl) {
    addSectionTitle(title)
    addLabelValue(view.signerNameLabel, typedName)
    addLabelValue(view.signatureDateLabel, formatDisplayDate(signatureDate))
    addSignatureFrame(view.signatureLabel, imageDataUrl)
  }

  drawPageHeader()

  doc.setFont(fontFamily, 'normal')
  doc.setFontSize(11)
  doc.setTextColor(20, 22, 28)

  cursorY = addWrappedText(doc, view.introText, margin, cursorY, contentWidth, { lineHeight: 16 })
  cursorY += 10
  cursorY = addWrappedText(doc, view.note, margin, cursorY, contentWidth, { lineHeight: 15 })
  cursorY += 18

  addSectionTitle(view.participantSectionTitle)
  participantFields.forEach((field) => {
    addLabelValue(field.label, participant[field.name])
  })

  addLabelValue(view.minorToggleLabel, isMinor ? view.yes : view.no)

  addSectionTitle(view.safetySectionTitle)
  addBullets(safetyItems)

  addSectionTitle(view.consentSectionTitle)
  addBullets(consentItems)

  addSignatureBlock(view.signatureSectionTitle, signerName, participantSignature)

  if (isMinor) {
    addSectionTitle(view.guardianSectionTitle)
    addLabelValue(view.guardianNameLabel, guardian.name)
    addLabelValue(view.guardianPhoneLabel, guardian.phone)
    addSignatureFrame(view.guardianSignatureLabel, guardianSignature)
  }

  addSectionTitle(view.declarationSectionTitle)
  cursorY = addWrappedText(doc, view.declarationText, margin, cursorY, contentWidth, { lineHeight: 16 })
  cursorY += 20
  addWrappedText(doc, view.footerNote, margin, cursorY, contentWidth, { lineHeight: 15 })

  const fileDate = formatDisplayDate(signatureDate || new Date().toISOString().slice(0, 10))
  const fileName = `${view.pdfFilePrefix}_${sanitizeFilePart(participant.fullName)}_${sanitizeFilePart(fileDate)}.pdf`

  doc.save(fileName)
}
