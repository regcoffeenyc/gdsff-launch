import { jsPDF } from 'jspdf'
import { glossaryCategories, glossaryTerms } from '../content/glossaryContent'

/**
 * Printable bilingual (KA + EN) PDF of the full GDSFF glossary.
 * Reuses the Georgian-capable font already shipped for the safety-consent PDF
 * (public/fonts/arial.ttf) so Georgian glyphs render correctly.
 */

const PDF_FONT_FILE = 'arial.ttf'
const PDF_FONT_FAMILY = 'GDSFFArial'

let cachedPdfFontBase64 = null

const BRAND = {
  regCode: '406552902',
  website: 'gdsff.org',
  email: 'office@gdsff.org',
  phone: '+995 511 560038',
}

const docText = {
  en: {
    title: 'Explanatory Glossary',
    subtitle: 'Georgian Dynamic Shooting and Functional Fitness Federation',
    regLabel: 'Reg. code',
    intro:
      'A bilingual reference of dynamic-shooting and range terminology, with explanations drawn from the GDSFF Safety Standards Rulebook. Range commands stay in English with a Georgian explanation.',
    footer: 'GDSFF — Safety Standards Rulebook v0.1 (draft). Section references (§) point to that rulebook.',
    fileName: 'GDSFF_Explanatory_Glossary.pdf',
  },
  ka: {
    title: 'განმარტებითი ლექსიკონი',
    subtitle: 'საქართველოს დინამიური სროლისა და ფუნქციური ფიტნესის ფედერაცია',
    regLabel: 'საიდ. კოდი',
    intro:
      'დინამიური სროლისა და ტირის ტერმინოლოგიის ორენოვანი საცნობარო, განმარტებებით GDSFF-ის უსაფრთხოების სტანდარტების რულბუქიდან. ტირის ბრძანებები რჩება ინგლისურად, ქართული განმარტებით.',
    footer: 'GDSFF — უსაფრთხოების რულბუქი v0.1 (დრაფტი). მუხლების მითითება (§) ეხება ამ რულბუქს.',
    fileName: 'GDSFF_Ganmartebiti_Leksikoni.pdf',
  },
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
    if (!Array.isArray(fontList[PDF_FONT_FAMILY])) {
      doc.addFileToVFS(PDF_FONT_FILE, cachedPdfFontBase64)
      doc.addFont(PDF_FONT_FILE, PDF_FONT_FAMILY, 'normal')
      doc.addFont(PDF_FONT_FILE, PDF_FONT_FAMILY, 'bold')
    }
    return PDF_FONT_FAMILY
  } catch (error) {
    console.warn('GDSFF glossary PDF font fallback engaged.', error)
    return 'helvetica'
  }
}

export async function downloadGlossaryPdf(language = 'ka', logoSrc) {
  const localeKey = language === 'ka' ? 'ka' : 'en'
  const otherKey = localeKey === 'ka' ? 'en' : 'ka'
  const t = docText[localeKey]

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const fontFamily = await ensurePdfFont(doc)
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 46
  const contentWidth = pageWidth - margin * 2
  let cursorY = 96
  let pageNo = 1

  let logoDataUrl = null
  if (logoSrc) {
    logoDataUrl = await new Promise((resolve) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        canvas.getContext('2d').drawImage(image, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      image.onerror = () => resolve(null)
      image.src = logoSrc
    })
  }

  function drawHeader() {
    doc.setFillColor(13, 15, 18)
    doc.rect(0, 0, pageWidth, 68, 'F')
    doc.setDrawColor(212, 187, 131)
    doc.setLineWidth(1.2)
    doc.line(margin, 68, pageWidth - margin, 68)
    doc.setTextColor(242, 221, 176)
    doc.setFont(fontFamily, 'bold')
    doc.setFontSize(10)
    doc.text('GDSFF', margin, 30)
    doc.setFontSize(16)
    doc.text(t.title, margin, 50)
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', pageWidth - margin - 34, 16, 34, 34)
    }
    doc.setTextColor(20, 22, 28)
  }

  function drawFooter() {
    doc.setDrawColor(212, 187, 131)
    doc.setLineWidth(0.5)
    doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40)

    doc.setFont(fontFamily, 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(150, 150, 156)
    doc.text(t.footer, margin, pageHeight - 27, { maxWidth: contentWidth - 30 })

    doc.setFontSize(8)
    doc.setTextColor(120, 100, 56)
    doc.text(`GDSFF · ${BRAND.website} · ${BRAND.email} · ${BRAND.phone}`, margin, pageHeight - 15)
    doc.setTextColor(140, 140, 146)
    doc.text(String(pageNo), pageWidth - margin, pageHeight - 15, { align: 'right' })
  }

  function newPage() {
    drawFooter()
    doc.addPage()
    pageNo += 1
    drawHeader()
    cursorY = 92
  }

  function ensureSpace(needed) {
    if (cursorY + needed > pageHeight - 46) {
      newPage()
    }
  }

  function addWrapped(text, x, y, width, lineHeight) {
    const lines = doc.splitTextToSize(text, width)
    doc.text(lines, x, y)
    return y + lines.length * lineHeight
  }

  function addSectionTitle(title) {
    ensureSpace(44)
    cursorY += 8
    doc.setFont(fontFamily, 'bold')
    doc.setFontSize(13)
    doc.setTextColor(35, 35, 40)
    doc.text(title, margin, cursorY)
    cursorY += 12
    doc.setDrawColor(212, 187, 131)
    doc.setLineWidth(0.6)
    doc.line(margin, cursorY, pageWidth - margin, cursorY)
    cursorY += 18
  }

  function addEntry(entry) {
    const primary = entry[localeKey]
    const secondary = entry[otherKey]
    const showSecondary = !entry.command && secondary.term !== primary.term

    // Rough height estimate to avoid splitting an entry across pages.
    const defWidth = contentWidth
    const primaryLines = doc.splitTextToSize(primary.def, defWidth).length
    const secondaryLines = doc.splitTextToSize(secondary.def, defWidth).length
    const estimated = 18 + (showSecondary ? 12 : 0) + primaryLines * 13 + secondaryLines * 12 + 14
    ensureSpace(estimated)

    // Term line + citation
    doc.setFont(fontFamily, 'bold')
    doc.setFontSize(11.5)
    doc.setTextColor(28, 30, 36)
    doc.text(primary.term, margin, cursorY)
    if (entry.cite) {
      doc.setFontSize(9)
      doc.setTextColor(150, 120, 60)
      doc.text(entry.cite, pageWidth - margin, cursorY, { align: 'right' })
    }
    cursorY += 14

    if (showSecondary) {
      doc.setFont(fontFamily, 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(120, 122, 128)
      doc.text(secondary.term, margin, cursorY)
      cursorY += 12
    }

    // Primary-language explanation
    doc.setFont(fontFamily, 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(34, 36, 42)
    cursorY = addWrapped(primary.def, margin, cursorY, defWidth, 13)
    cursorY += 3

    // Secondary-language explanation (muted)
    doc.setFontSize(9.5)
    doc.setTextColor(110, 112, 118)
    cursorY = addWrapped(secondary.def, margin, cursorY, defWidth, 12)
    cursorY += 14
  }

  // ---- Render ----
  drawHeader()
  doc.setFont(fontFamily, 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(90, 92, 98)
  cursorY = addWrapped(`${t.subtitle}  ·  ${t.regLabel}: ${BRAND.regCode}`, margin, cursorY, contentWidth, 13)
  cursorY += 4
  doc.setFontSize(10)
  doc.setTextColor(40, 42, 48)
  cursorY = addWrapped(t.intro, margin, cursorY, contentWidth, 14)
  cursorY += 10

  // Branded contact strip
  doc.setDrawColor(212, 187, 131)
  doc.setFillColor(250, 247, 240)
  doc.setLineWidth(0.6)
  doc.roundedRect(margin, cursorY, contentWidth, 30, 6, 6, 'FD')
  doc.setFont(fontFamily, 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(70, 60, 34)
  doc.text(`${BRAND.website}     ${BRAND.email}     ${BRAND.phone}`, margin + 14, cursorY + 19)
  cursorY += 30 + 16

  glossaryCategories.forEach((category) => {
    const items = glossaryTerms.filter((entry) => entry.cat === category.key)
    if (items.length === 0) return
    addSectionTitle(`${category.ka}  /  ${category.en}`)
    items.forEach(addEntry)
  })

  drawFooter()
  doc.save(t.fileName)
}
