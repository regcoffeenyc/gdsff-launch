import { glossaryCategories, glossaryTerms } from '../content/glossaryContent.js'

/**
 * Printable bilingual (KA + EN) PDF of the full GDSFF glossary, designed as an
 * official reference booklet: a title cover, category dividers, a clear
 * typographic hierarchy, and federation branding on every page.
 *
 * `renderGlossaryDoc` holds all drawing and is pure (no browser globals) so it
 * can be exercised in Node for visual iteration. `downloadGlossaryPdf` is the
 * browser wrapper that loads the Georgian-capable font + logo and saves.
 */

// Georgian-capable subset of DejaVu Sans (Arial has no Georgian glyphs).
const PDF_FONT_NORMAL = 'gdsff-pdf.ttf'
const PDF_FONT_BOLD = 'gdsff-pdf-bold.ttf'
const PDF_FONT_FAMILY = 'GDSFFPdf'

const BRAND = {
  regCode: '406552902',
  website: 'gdsff.org',
  email: 'office@gdsff.org',
  phone: '+995 511 560038',
}

const docText = {
  en: {
    wordmark: 'GDSFF',
    title: 'Explanatory Glossary',
    subtitle: 'Georgian Dynamic Shooting and Functional Fitness Federation',
    tagline: 'PRECISION · STRENGTH · DISCIPLINE',
    regLabel: 'Reg. code',
    version: 'Rulebook v0.1 — draft',
    countLabel: 'terms',
    intro:
      'A bilingual reference of dynamic-shooting and range terminology. Every entry gives the term in both languages, a short explanation, and the Safety Standards Rulebook section (§) it derives from. Range commands stay in English with a Georgian explanation.',
    contactLabel: 'Contact',
    runningTitle: 'Explanatory Glossary',
    equivLabel: 'KA',
    equivLabelOther: 'EN',
    footerNote: 'Section references (§) point to the GDSFF Safety Standards Rulebook.',
    fileName: 'GDSFF_Explanatory_Glossary.pdf',
  },
  ka: {
    wordmark: 'GDSFF',
    title: 'განმარტებითი ლექსიკონი',
    subtitle: 'საქართველოს დინამიური სროლისა და ფუნქციური ფიტნესის ფედერაცია',
    tagline: 'სიზუსტე · ძალა · დისციპლინა',
    regLabel: 'საიდ. კოდი',
    version: 'რულბუქი v0.1 — დრაფტი',
    countLabel: 'ტერმინი',
    intro:
      'დინამიური სროლისა და ტირის ტერმინოლოგიის ორენოვანი საცნობარო. თითოეული ჩანაწერი გაძლევს ტერმინს ორივე ენაზე, მოკლე განმარტებას და უსაფრთხოების რულბუქის მუხლს (§), საიდანაც ის მომდინარეობს. ტირის ბრძანებები რჩება ინგლისურად, ქართული განმარტებით.',
    contactLabel: 'კონტაქტი',
    runningTitle: 'განმარტებითი ლექსიკონი',
    equivLabel: 'EN',
    equivLabelOther: 'KA',
    footerNote: 'მუხლების მითითება (§) ეხება GDSFF-ის უსაფრთხოების სტანდარტების რულბუქს.',
    fileName: 'GDSFF_Ganmartebiti_Leksikoni.pdf',
  },
}

// ---- Palette (print-safe, warm) ----
const INK = [26, 34, 44]
const BODY = [58, 70, 82]
const GOLD = [168, 128, 44]
const GOLD_SOFT = [201, 170, 105]
const MUTED = [128, 138, 150]
const HAIR = [228, 224, 213]
const PANEL = [250, 247, 239]
const PAPER = [255, 255, 255]
const RED = [178, 59, 47]

/**
 * Render the whole document. Pure: relies only on the passed jsPDF `doc`,
 * a registered `fontFamily`, the chosen `language`, and an optional
 * pre-decoded `logoDataUrl`.
 */
export function renderGlossaryDoc(doc, { fontFamily, language = 'ka', logoDataUrl = null } = {}) {
  const localeKey = language === 'ka' ? 'ka' : 'en'
  const otherKey = localeKey === 'ka' ? 'en' : 'ka'
  const t = docText[localeKey]

  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const MX = 56 // horizontal margin
  const CW = W - MX * 2

  const setColor = (c) => doc.setTextColor(c[0], c[1], c[2])
  const setDraw = (c) => doc.setDrawColor(c[0], c[1], c[2])
  const setFill = (c) => doc.setFillColor(c[0], c[1], c[2])
  const font = (style = 'normal') => doc.setFont(fontFamily, style)

  const totalTerms = glossaryTerms.length
  let pageNo = 0
  let cursorY = 0

  // ---------------- Cover ----------------
  function drawCover() {
    pageNo += 1
    // top + bottom hairline frame accents
    setDraw(GOLD)
    doc.setLineWidth(2)
    doc.line(MX, 70, MX + 46, 70)
    doc.setLineWidth(0.6)
    doc.line(MX + 52, 70, W - MX, 70)

    let y = 150
    if (logoDataUrl) {
      const size = 78
      try {
        doc.addImage(logoDataUrl, 'PNG', (W - size) / 2, y, size, size)
      } catch {
        /* logo optional */
      }
      y += size + 26
    } else {
      y += 20
    }

    // Wordmark
    font('bold')
    doc.setFontSize(15)
    setColor(INK)
    doc.text(t.wordmark, W / 2, y, { align: 'center', charSpace: 6 })
    y += 26

    // Federation full name (subtitle)
    font('normal')
    doc.setFontSize(9.5)
    setColor(MUTED)
    doc.text(doc.splitTextToSize(t.subtitle, CW - 60), W / 2, y, { align: 'center', lineHeightFactor: 1.35 })
    y += 46

    // Gold rule
    setDraw(GOLD)
    doc.setLineWidth(0.8)
    doc.line(W / 2 - 26, y, W / 2 + 26, y)
    y += 40

    // Title (primary language)
    font('bold')
    doc.setFontSize(30)
    setColor(INK)
    doc.text(t.title, W / 2, y, { align: 'center' })
    y += 26

    // Title (other language) in gold
    font('normal')
    doc.setFontSize(13)
    setColor(GOLD)
    doc.text(docText[otherKey].title, W / 2, y, { align: 'center' })
    y += 34

    // Tagline
    font('bold')
    doc.setFontSize(8)
    setColor(GOLD)
    doc.text(t.tagline, W / 2, y, { align: 'center', charSpace: 2.5 })
    y += 58

    // Meta row: version · terms · reg code
    const meta = `${t.version}      ·      ${totalTerms} ${t.countLabel}      ·      ${t.regLabel} ${BRAND.regCode}`
    font('normal')
    doc.setFontSize(9)
    setColor(BODY)
    doc.text(meta, W / 2, y, { align: 'center' })

    // Intro block (panel)
    const introLines = doc.splitTextToSize(t.intro, CW - 56)
    const introH = introLines.length * 14 + 34
    const introY = H - 210 - introH
    setFill(PANEL)
    setDraw(HAIR)
    doc.setLineWidth(0.8)
    doc.roundedRect(MX, introY, CW, introH, 10, 10, 'FD')
    setDraw(GOLD)
    doc.setLineWidth(2)
    doc.line(MX, introY + 12, MX, introY + introH - 12)
    font('normal')
    doc.setFontSize(10)
    setColor(BODY)
    doc.text(introLines, MX + 22, introY + 26, { lineHeightFactor: 1.4 })

    // Contact block (bottom)
    const cy = H - 150
    setDraw(HAIR)
    doc.setLineWidth(0.8)
    doc.line(MX, cy, W - MX, cy)
    font('bold')
    doc.setFontSize(7.5)
    setColor(GOLD)
    doc.text(t.contactLabel.toUpperCase(), MX, cy + 20, { charSpace: 2 })
    font('normal')
    doc.setFontSize(11)
    setColor(INK)
    doc.text(BRAND.website, MX, cy + 40)
    doc.text(BRAND.email, MX + 150, cy + 40)
    doc.text(BRAND.phone, MX + 330, cy + 40)

    // Cover footer
    font('normal')
    doc.setFontSize(8)
    setColor(MUTED)
    doc.text(t.subtitle.split(' ')[0] === 'Georgian' ? 'GDSFF' : 'GDSFF · gdsff.org', MX, H - 44)
    doc.text('01', W - MX, H - 44, { align: 'right' })
  }

  // ---------------- Content page furniture ----------------
  function drawRunningHeader(categoryLabel) {
    font('bold')
    doc.setFontSize(8)
    setColor(GOLD)
    doc.text(t.wordmark, MX, 46, { charSpace: 3 })
    font('normal')
    setColor(MUTED)
    doc.setFontSize(8)
    doc.text(t.runningTitle, MX + 46, 46)
    if (categoryLabel) {
      doc.text(categoryLabel, W - MX, 46, { align: 'right' })
    }
    setDraw(HAIR)
    doc.setLineWidth(0.6)
    doc.line(MX, 54, W - MX, 54)
  }

  function drawFooter() {
    setDraw(HAIR)
    doc.setLineWidth(0.6)
    doc.line(MX, H - 52, W - MX, H - 52)
    font('normal')
    doc.setFontSize(7.5)
    setColor(MUTED)
    doc.text(t.footerNote, MX, H - 38, { maxWidth: CW - 120 })
    setColor(GOLD)
    doc.setFontSize(8)
    doc.text(`GDSFF · ${BRAND.website} · ${BRAND.email} · ${BRAND.phone}`, MX, H - 26)
    // page number
    setColor(MUTED)
    doc.setFontSize(9)
    doc.text(String(pageNo).padStart(2, '0'), W - MX, H - 30, { align: 'right' })
  }

  let currentCategoryLabel = ''
  function newContentPage() {
    doc.addPage()
    pageNo += 1
    drawRunningHeader(currentCategoryLabel)
    drawFooter()
    cursorY = 84
  }

  function ensure(needed) {
    if (cursorY + needed > H - 66) newContentPage()
  }

  // ---------------- Category divider ----------------
  function drawCategoryHeader(index, category) {
    ensure(74)
    cursorY += 6
    // big faded numeral (background accent)
    font('bold')
    doc.setFontSize(44)
    setColor(PANEL)
    doc.text(String(index + 1).padStart(2, '0'), W - MX, cursorY + 24, { align: 'right' })
    // section kicker
    font('bold')
    doc.setFontSize(7.5)
    setColor(GOLD)
    doc.text(`SECTION ${String(index + 1).padStart(2, '0')}`, MX, cursorY - 2, { charSpace: 2 })
    // primary title
    font('bold')
    doc.setFontSize(17)
    setColor(INK)
    doc.text(category[localeKey], MX, cursorY + 20)
    // other-language subtitle
    font('normal')
    doc.setFontSize(9.5)
    setColor(MUTED)
    doc.text(category[otherKey], MX, cursorY + 35)
    cursorY += 46
    setDraw(GOLD)
    doc.setLineWidth(1.4)
    doc.line(MX, cursorY, MX + 40, cursorY)
    setDraw(HAIR)
    doc.setLineWidth(0.6)
    doc.line(MX + 46, cursorY, W - MX, cursorY)
    cursorY += 22
  }

  // ---------------- Entry ----------------
  function drawEntry(entry, isLast) {
    const primary = entry[localeKey]
    const secondary = entry[otherKey]
    const showSecondary = !entry.command && secondary.term !== primary.term
    const defIndent = 16
    const defWidth = CW - defIndent

    // estimate height
    font('normal')
    doc.setFontSize(10.25)
    const primaryLines = doc.splitTextToSize(primary.def, defWidth).length
    doc.setFontSize(9.25)
    const secondaryLines = doc.splitTextToSize(secondary.def, defWidth).length
    const est = 20 + (showSecondary ? 13 : 2) + primaryLines * 13.5 + 6 + secondaryLines * 12 + 20
    ensure(est)

    const topY = cursorY

    // gold tick
    setFill(GOLD)
    doc.rect(MX, topY - 8, 2.4, 13, 'F')

    // term
    font('bold')
    doc.setFontSize(11.5)
    setColor(INK)
    doc.text(primary.term, MX + defIndent, cursorY, { maxWidth: CW - defIndent - 60 })

    // § pill (right)
    if (entry.cite) {
      const label = entry.cite
      doc.setFont(fontFamily, 'bold')
      doc.setFontSize(8)
      const tw = doc.getTextWidth(label)
      const pillW = tw + 16
      const pillX = W - MX - pillW
      setFill(PANEL)
      setDraw(GOLD_SOFT)
      doc.setLineWidth(0.6)
      doc.roundedRect(pillX, cursorY - 9.5, pillW, 14, 7, 7, 'FD')
      setColor(GOLD)
      doc.text(label, pillX + pillW / 2, cursorY, { align: 'center' })
    }
    cursorY += showSecondary ? 13 : 6

    // secondary term (gold, small)
    if (showSecondary) {
      font('normal')
      doc.setFontSize(9)
      setColor(GOLD)
      doc.text(secondary.term, MX + defIndent, cursorY)
      cursorY += 12
    }

    // primary definition
    font('normal')
    doc.setFontSize(10.25)
    setColor(BODY)
    const pl = doc.splitTextToSize(primary.def, defWidth)
    doc.text(pl, MX + defIndent, cursorY, { lineHeightFactor: 1.32 })
    cursorY += pl.length * 13.5 + 5

    // secondary definition (muted)
    doc.setFontSize(9.25)
    setColor(MUTED)
    const sl = doc.splitTextToSize(secondary.def, defWidth)
    doc.text(sl, MX + defIndent, cursorY, { lineHeightFactor: 1.3 })
    cursorY += sl.length * 12 + 16

    if (!isLast) {
      setDraw(HAIR)
      doc.setLineWidth(0.5)
      doc.line(MX + defIndent, cursorY - 9, W - MX, cursorY - 9)
    }
  }

  // ---------------- Compose ----------------
  drawCover()

  // First content page
  doc.addPage()
  pageNo += 1
  cursorY = 84

  glossaryCategories.forEach((category, index) => {
    const items = glossaryTerms.filter((e) => e.cat === category.key)
    if (items.length === 0) return
    currentCategoryLabel = category[localeKey]
    // header/footer for the (possibly first) page
    if (pageNo >= 2 && cursorY === 84) {
      drawRunningHeader(currentCategoryLabel)
      drawFooter()
    }
    drawCategoryHeader(index, category)
    items.forEach((entry, i) => drawEntry(entry, i === items.length - 1))
    cursorY += 10
  })
}

// ---------------- Browser wrapper ----------------
const fontCache = {}

function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return window.btoa(binary)
}

async function fetchFontBase64(file) {
  if (!fontCache[file]) {
    const response = await fetch(`${import.meta.env.BASE_URL}fonts/${file}`)
    if (!response.ok) throw new Error(`Unable to load font file ${file} (${response.status})`)
    fontCache[file] = arrayBufferToBase64(await response.arrayBuffer())
  }
  return fontCache[file]
}

async function ensurePdfFont(doc) {
  try {
    const [normal, bold] = await Promise.all([
      fetchFontBase64(PDF_FONT_NORMAL),
      fetchFontBase64(PDF_FONT_BOLD),
    ])
    const fontList = doc.getFontList?.() ?? {}
    if (!Array.isArray(fontList[PDF_FONT_FAMILY])) {
      doc.addFileToVFS(PDF_FONT_NORMAL, normal)
      doc.addFont(PDF_FONT_NORMAL, PDF_FONT_FAMILY, 'normal')
      doc.addFileToVFS(PDF_FONT_BOLD, bold)
      doc.addFont(PDF_FONT_BOLD, PDF_FONT_FAMILY, 'bold')
    }
    return PDF_FONT_FAMILY
  } catch (error) {
    console.warn('GDSFF glossary PDF font fallback engaged (Georgian text may be missing).', error)
    return 'helvetica'
  }
}

async function loadLogoDataUrl(logoSrc) {
  if (!logoSrc) return null
  return new Promise((resolve) => {
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

export async function downloadGlossaryPdf(language = 'ka', logoSrc) {
  const localeKey = language === 'ka' ? 'ka' : 'en'
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const fontFamily = await ensurePdfFont(doc)
  const logoDataUrl = await loadLogoDataUrl(logoSrc)
  renderGlossaryDoc(doc, { fontFamily, language: localeKey, logoDataUrl })
  doc.save(docText[localeKey].fileName)
}
