// Dynamically imported so html2canvas + jsPDF are not bundled in the main chunk

export interface PdfExportOptions {
  workflowName: string
  nodeCount: number
  edgeCount: number
}

export async function exportWorkflowAsPdf(opts: PdfExportOptions): Promise<void> {
  const { workflowName, nodeCount, edgeCount } = opts

  // Lazy-load heavy libraries (splits them into a separate chunk)
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  // ── 1. Find the React Flow viewport element ──────────────────
  const flowEl = document.querySelector('.react-flow__viewport') as HTMLElement | null
  if (!flowEl) throw new Error('React Flow viewport not found')

  // Temporarily show the full graph by fitting it to the container
  const container = document.querySelector('.react-flow__renderer') as HTMLElement | null
  const containerWidth  = container?.offsetWidth  ?? 1200
  const containerHeight = container?.offsetHeight ?? 800

  // ── 2. Capture the canvas ────────────────────────────────────
  const canvas = await html2canvas(flowEl, {
    backgroundColor: '#f8fafc',   // matches .react-flow__background
    scale: 2,                      // 2× for retina-quality output
    useCORS: true,
    logging: false,
    width:  containerWidth,
    height: containerHeight,
    windowWidth:  containerWidth,
    windowHeight: containerHeight,
  })

  const imgData   = canvas.toDataURL('image/png')
  const imgWidth  = canvas.width
  const imgHeight = canvas.height

  // ── 3. Build PDF ─────────────────────────────────────────────
  // Landscape A4 in points: 841.89 × 595.28
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  const PAGE_W = pdf.internal.pageSize.getWidth()
  const PAGE_H = pdf.internal.pageSize.getHeight()

  const HEADER_H = 54   // pt — top banner
  const FOOTER_H = 28   // pt — bottom strip
  const PADDING  = 20   // pt — side padding

  // ── 3a. Header ───────────────────────────────────────────────
  // Background
  pdf.setFillColor(67, 56, 202)           // indigo-700
  pdf.rect(0, 0, PAGE_W, HEADER_H, 'F')

  // Workflow name
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.setTextColor(255, 255, 255)
  pdf.text(workflowName, PADDING, 32)

  // Meta line — node/edge counts
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(199, 210, 254)         // indigo-200
  pdf.text(
    `${nodeCount} node${nodeCount !== 1 ? 's' : ''}  ·  ${edgeCount} edge${edgeCount !== 1 ? 's' : ''}`,
    PADDING,
    46,
  )

  // Export date (right-aligned)
  const dateStr = new Date().toLocaleString('en', {
    dateStyle: 'medium', timeStyle: 'short',
  })
  pdf.setFontSize(8)
  pdf.setTextColor(165, 180, 252)         // indigo-300
  const dateW = pdf.getTextWidth(dateStr)
  pdf.text(dateStr, PAGE_W - PADDING - dateW, 38)

  // ── 3b. Canvas image ─────────────────────────────────────────
  const availW = PAGE_W - PADDING * 2
  const availH = PAGE_H - HEADER_H - FOOTER_H - PADDING * 2

  // Scale image to fit available area, keeping aspect ratio
  const ratio   = Math.min(availW / imgWidth, availH / imgHeight)
  const drawW   = imgWidth  * ratio
  const drawH   = imgHeight * ratio
  const drawX   = PADDING + (availW - drawW) / 2
  const drawY   = HEADER_H + PADDING + (availH - drawH) / 2

  // Subtle shadow rectangle
  pdf.setFillColor(226, 232, 240)         // slate-200
  pdf.roundedRect(drawX + 3, drawY + 3, drawW, drawH, 4, 4, 'F')

  pdf.addImage(imgData, 'PNG', drawX, drawY, drawW, drawH)

  // Optional thin border around canvas area
  pdf.setDrawColor(203, 213, 225)         // slate-300
  pdf.setLineWidth(0.5)
  pdf.roundedRect(drawX, drawY, drawW, drawH, 4, 4, 'S')

  // ── 3c. Footer ───────────────────────────────────────────────
  const footerY = PAGE_H - FOOTER_H
  pdf.setFillColor(248, 250, 252)         // slate-50
  pdf.setDrawColor(226, 232, 240)
  pdf.setLineWidth(0.5)
  pdf.line(0, footerY, PAGE_W, footerY)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(148, 163, 184)         // slate-400
  pdf.text('FlowBuilder — Visual Workflow Editor', PADDING, footerY + 18)

  const pageLabel = 'Page 1 of 1'
  const pageLabelW = pdf.getTextWidth(pageLabel)
  pdf.text(pageLabel, PAGE_W - PADDING - pageLabelW, footerY + 18)

  // ── 4. Save ──────────────────────────────────────────────────
  const filename = `${workflowName.replace(/\s+/g, '_') || 'workflow'}.pdf`
  pdf.save(filename)
}
