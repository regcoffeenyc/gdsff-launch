import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { jsPDF } from 'jspdf'

const referencePdf = new URL('../artifacts/MDT_Target_1inGrid_reference.pdf', import.meta.url)
const overlayPdf = new URL('../artifacts/gdsff-target-brand-overlay.pdf', import.meta.url)
const canonicalPdfOutput = new URL('../public/downloads/gdsff-printable-target-1in-grid.pdf', import.meta.url)
const legacyPdfOutput = new URL('../public/downloads/gdsff-printable-target-a4.pdf', import.meta.url)
const socialPreviewOutput = new URL('../public/downloads/gdsff-target-facebook-preview.svg', import.meta.url)
const logoPath = new URL('../public/gdsff-logo-approved.png', import.meta.url)
const logoData = readFileSync(logoPath).toString('base64')
const logoDataUrl = `data:image/png;base64,${logoData}`

const website = 'https://gdsff.org'
const email = 'office@gdsff.org'
const phone = '+995 511 560038'
const federationName = 'Georgian Dynamic Shooting & Functional Fitness Federation'

function assertReferencePdf() {
  if (!existsSync(referencePdf)) {
    throw new Error(`Missing reference target PDF: ${referencePdf.pathname}`)
  }
}

function drawOverlayPage(doc, pageLabel) {
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, 612, 86, 'F')
  doc.rect(0, 684, 612, 108, 'F')

  doc.addImage(logoDataUrl, 'PNG', 54, 19, 38, 38)
  doc.setTextColor(18, 20, 22)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(federationName, 104, 29)
  doc.setFontSize(17)
  doc.text('GDSFF 1-Inch Grid Training Target', 104, 49)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Reference target with GDSFF federation branding | Print at 100% scale', 104, 63)

  doc.setDrawColor(18, 20, 22)
  doc.setLineWidth(0.6)
  doc.line(54, 705, 558, 705)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(pageLabel, 54, 724)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`${website} | ${email} | ${phone}`, 54, 739)
  doc.text('Use only in a safe, legal, supervised sport training environment.', 54, 754)
  doc.text('Membership: gdsff.org/membership | Signature: gdsff.org/safety-consent', 54, 768)
}

function writeOverlayPdf() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter', compress: true })
  drawOverlayPage(doc, 'Page 1: GDSFF branded 1-inch grid target')
  doc.addPage('letter', 'portrait')
  drawOverlayPage(doc, 'Page 2: GDSFF branded 1-inch grid target')
  writeFileSync(overlayPdf, Buffer.from(doc.output('arraybuffer')))
}

function mergeOverlay() {
  const mergeScript = `
from pathlib import Path
from pypdf import PdfReader, PdfWriter
import sys

source = Path(sys.argv[1])
overlay_path = Path(sys.argv[2])
output = Path(sys.argv[3])

source_reader = PdfReader(str(source))
overlay_reader = PdfReader(str(overlay_path))
writer = PdfWriter()

for index, page in enumerate(source_reader.pages):
    overlay_page = overlay_reader.pages[min(index, len(overlay_reader.pages) - 1)]
    page.merge_page(overlay_page)
    writer.add_page(page)

with output.open('wb') as handle:
    writer.write(handle)
`

  const result = spawnSync('python', [
    '-c',
    mergeScript,
    fileURLToPath(referencePdf),
    fileURLToPath(overlayPdf),
    fileURLToPath(canonicalPdfOutput),
  ], {
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    throw new Error(`PDF merge failed:\n${result.stderr || result.stdout}`)
  }

  copyFileSync(canonicalPdfOutput, legacyPdfOutput)
}

function drawSocialPreview() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="GDSFF 1-inch grid target download">
  <rect width="1200" height="630" fill="#111315"/>
  <rect x="52" y="52" width="1096" height="526" rx="18" fill="#f7f4ed"/>
  <g transform="translate(116 92)">
    <rect x="0" y="0" width="420" height="384" fill="none" stroke="#111315" stroke-width="5"/>
    <g stroke="#777" stroke-width="1.4">
      <path d="M60 0v384M120 0v384M180 0v384M240 0v384M300 0v384M360 0v384"/>
      <path d="M0 48h420M0 96h420M0 144h420M0 192h420M0 240h420M0 288h420M0 336h420"/>
    </g>
    <g fill="#111315">
      <path d="M60 20l40 40-40 40-40-40z"/>
      <path d="M210 20l40 40-40 40-40-40z"/>
      <path d="M360 20l40 40-40 40-40-40z"/>
      <path d="M360 164l40 40-40 40-40-40z"/>
      <path d="M360 308l40 40-40 40-40-40z"/>
      <path d="M210 308l40 40-40 40-40-40z"/>
      <path d="M60 308l40 40-40 40-40-40z"/>
      <path d="M60 164l40 40-40 40-40-40z"/>
    </g>
  </g>
  <text x="590" y="156" fill="#111315" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700">GDSFF</text>
  <text x="590" y="210" fill="#111315" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="700">1-Inch Grid Target</text>
  <text x="590" y="264" fill="#2b2f33" font-family="Arial, Helvetica, sans-serif" font-size="28">Official target PDF with federation branding</text>
  <text x="590" y="334" fill="#111315" font-family="Arial, Helvetica, sans-serif" font-size="26">Download: gdsff.org/documents#printable-target</text>
  <text x="590" y="382" fill="#111315" font-family="Arial, Helvetica, sans-serif" font-size="26">Join: gdsff.org/membership#online-application</text>
  <text x="590" y="430" fill="#111315" font-family="Arial, Helvetica, sans-serif" font-size="26">Signature: gdsff.org/safety-consent</text>
  <text x="590" y="512" fill="#2b2f33" font-family="Arial, Helvetica, sans-serif" font-size="22">${email} | ${phone}</text>
</svg>
`
  writeFileSync(socialPreviewOutput, svg, 'utf8')
}

assertReferencePdf()
writeOverlayPdf()
mergeOverlay()
drawSocialPreview()
console.log(`Used ${referencePdf.pathname}`)
console.log(`Wrote ${canonicalPdfOutput.pathname}`)
console.log(`Wrote ${legacyPdfOutput.pathname}`)
console.log(`Wrote ${socialPreviewOutput.pathname}`)
