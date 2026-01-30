/**
 * Nudge Webdesign – Offerte PDF
 * Toont alleen wat in de offerte builder is ingevuld/aan geduid:
 * bedrijfsinfo, klant, gekozen pakket, gekozen scope, extra kosten en korting.
 */

import { jsPDF } from 'jspdf';

export interface ApprovedQuoteData {
  selectedPackage: {
    id: string;
    name: string;
    basePrice: number;
  } | null;
  selectedOptions: Array<{
    id: string;
    name: string;
    price: number;
    customPrice?: number;
    note?: string;
  }>;
  selectedMaintenance: {
    id: string;
    name: string;
    price: number;
  } | null;
  extraPages?: number;
  contentPages?: number;
  customLineItems?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  discount?: {
    type: 'percentage' | 'fixed' | null;
    value: number;
  };
  paymentSchedule?: 'once' | 'twice_25' | 'thrice_33';
  pricing?: {
    subtotal: number;
    vat: number;
    total: number;
    discountAmount: number;
  };
  quoteNumber?: string | null;
  timelineWeeks?: number | null;
  feedbackRounds?: number | null;
  timeline?: string | null;
  scopeDescription?: string | null;
}

export interface QuotePdfClientInfo {
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  vat_number?: string;
  company_address?: string;
  company_postal_code?: string;
  company_city?: string;
  company_country?: string;
  company_website?: string;
}

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 18;
const MARGIN_RIGHT = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN - MARGIN_RIGHT;
const AMOUNT_X = PAGE_WIDTH - MARGIN_RIGHT - 36;
const DESC_WIDTH = CONTENT_WIDTH - 42;
const FOOTER_TOP = PAGE_HEIGHT - 22;

const NUDGE_PRIMARY = { r: 144, g: 103, b: 198 };
const NUDGE_FOREGROUND = { r: 36, g: 32, b: 56 };
const NUDGE_MUTED = { r: 141, g: 134, b: 201 };
const NUDGE_BORDER = { r: 202, g: 196, b: 206 };

const FONT_TITLE = 20;
const FONT_SECTION = 12;
const FONT_BODY = 10;
const FONT_SMALL = 9;
const FONT_FOOTER = 8;
const LINE = 5;
const LINE_LOOSE = 6;
const SPACE_SECTION = 6;
const SPACE_BLOCK = 4;

const BRAND_NAME = 'Nudge Webdesign & Marketing';
const BRAND_TAGLINE = 'Hasselt';

const PAYMENT_LABELS: Record<string, string> = {
  once: 'Betaling: 100% vooraf',
  twice_25: 'Betaling: 25% voorschot, 75% bij aflevering',
  thrice_33: 'Betaling: 33% begin, 33% midden, 33% aflevering',
};

function formatCurrency(amount: number): string {
  return '€ ' + amount.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function setColor(doc: jsPDF, c: { r: number; g: number; b: number }) {
  doc.setTextColor(c.r, c.g, c.b);
}
function setDrawColor(doc: jsPDF, c: { r: number; g: number; b: number }) {
  doc.setDrawColor(c.r, c.g, c.b);
}

function hr(doc: jsPDF, y: number): number {
  setDrawColor(doc, NUDGE_BORDER);
  doc.setLineWidth(0.35);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  return y + SPACE_BLOCK;
}

/** Reserve ruimte boven footer; bij tekort nieuwe pagina met header. */
function ensureSpace(
  doc: jsPDF,
  y: number,
  needMm: number,
  drawHeader: (doc: jsPDF, isContinuation: boolean) => number
): number {
  const reserve = needMm + SPACE_BLOCK;
  if (y + reserve > FOOTER_TOP) {
    doc.addPage();
    return drawHeader(doc, true);
  }
  return y;
}

/** Schrijft meerdere regels tekst met max breedte; retourneert aantal regels. */
function writeWrapped(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number = LINE
): number {
  if (!text.trim()) return 0;
  const lines = doc.splitTextToSize(text.trim(), maxWidth);
  lines.forEach((line: string) => {
    doc.text(line, x, y);
    y += lineHeight;
  });
  return lines.length;
}

export async function generateQuotePdfBlob(
  clientInfo: QuotePdfClientInfo,
  quoteData: ApprovedQuoteData,
  totalPrice: number,
  logoDataUrl?: string | null
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const footerY = PAGE_HEIGHT - 6;

  const projectType = quoteData.selectedPackage?.name ?? 'Website';
  const clientName = clientInfo.company_name?.trim() || clientInfo.name?.trim() || 'n.t.b.';
  const subtotalExVat = quoteData.pricing?.subtotal ?? 0;
  const discountAmount = quoteData.pricing?.discountAmount ?? 0;
  const vatAmount = quoteData.pricing?.vat ?? 0;
  const dateStr = new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' });
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' });
  const quoteNum = (quoteData.quoteNumber ?? '').toString().trim() || 'n.t.b.';

  const drawHeader = (pdf: jsPDF, isContinuation: boolean): number => {
    let y = MARGIN;
    if (logoDataUrl) {
      try {
        const format = logoDataUrl.startsWith('data:image/jpeg') || logoDataUrl.startsWith('data:image/jpg') ? 'JPEG' : 'PNG';
        pdf.addImage(logoDataUrl, format, MARGIN, y - 3, 36, 14);
        y += 14 + 4;
      } catch {
        // geen logo
      }
    }
    if (!logoDataUrl || isContinuation) {
      pdf.setFontSize(FONT_SECTION);
      pdf.setFont('helvetica', 'bold');
      setColor(pdf, NUDGE_PRIMARY);
      pdf.text(BRAND_NAME, MARGIN, y);
      y += LINE;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(FONT_SMALL);
      setColor(pdf, NUDGE_MUTED);
      pdf.text(BRAND_TAGLINE, MARGIN, y);
      y += LINE;
    }
    if (!isContinuation) {
      pdf.setFontSize(FONT_SMALL);
      setColor(pdf, NUDGE_MUTED);
      pdf.text(`Datum: ${dateStr}  ·  Nr: ${quoteNum}  ·  Geldig tot: ${validUntil}`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' });
      y += LINE_LOOSE;
    }
    y = hr(pdf, y);
    y += SPACE_SECTION;
    return y;
  };

  const drawFooter = (pdf: jsPDF) => {
    setDrawColor(pdf, NUDGE_BORDER);
    pdf.setLineWidth(0.25);
    pdf.line(MARGIN, FOOTER_TOP, PAGE_WIDTH - MARGIN_RIGHT, FOOTER_TOP);
    pdf.setFontSize(FONT_FOOTER);
    setColor(pdf, NUDGE_MUTED);
    pdf.text(BRAND_NAME + ' · ' + BRAND_TAGLINE, MARGIN, footerY - 4);
    pdf.text('Deze offerte is geldig zoals opgesteld. Voorwaarden zoals overeengekomen.', MARGIN, footerY);
  };

  let y = drawHeader(doc, false);

  // ——— Klantgegevens (alleen ingevulde velden) ———
  const hasClient = !!(clientInfo.company_name || clientInfo.name || clientInfo.email || clientInfo.phone
    || clientInfo.company_address || clientInfo.company_postal_code || clientInfo.company_city
    || clientInfo.vat_number || clientInfo.company_website);
  if (hasClient) {
    doc.setFontSize(FONT_SMALL);
    const clientLines = [
      [clientInfo.company_name, clientInfo.name].filter(Boolean).join(' – ') || 'n.t.b.',
      clientInfo.email ?? '',
      clientInfo.phone ?? '',
      [clientInfo.company_address, clientInfo.company_postal_code, clientInfo.company_city, clientInfo.company_country].filter(Boolean).join(' '),
      clientInfo.vat_number ? 'BTW: ' + clientInfo.vat_number : '',
      clientInfo.company_website ?? '',
    ].filter(Boolean);
    let clientLineCount = 10;
    for (const line of clientLines) {
      clientLineCount += doc.splitTextToSize(line, CONTENT_WIDTH).length;
    }
    const clientHeight = clientLineCount * LINE + SPACE_BLOCK;
    y = ensureSpace(doc, y, clientHeight, drawHeader);
    doc.setFontSize(FONT_SECTION);
    doc.setFont('helvetica', 'bold');
    setColor(doc, NUDGE_PRIMARY);
    doc.text('Klantgegevens', MARGIN, y);
    y += LINE_LOOSE;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SMALL);
    setColor(doc, NUDGE_FOREGROUND);
    for (const line of clientLines) {
      const n = writeWrapped(doc, line, MARGIN, y, CONTENT_WIDTH);
      y += n * LINE;
    }
    y += SPACE_BLOCK;
    y = hr(doc, y);
    y += SPACE_SECTION;
  }

  // ——— Titel ———
  const titleText = `Offerte – ${projectType} voor ${clientName}`;
  doc.setFontSize(FONT_TITLE);
  const titleLines = doc.splitTextToSize(titleText, CONTENT_WIDTH);
  const titleHeight = titleLines.length * (LINE_LOOSE + 1) + LINE_LOOSE + SPACE_SECTION;
  y = ensureSpace(doc, y, titleHeight, drawHeader);
  doc.setFont('helvetica', 'bold');
  setColor(doc, NUDGE_FOREGROUND);
  titleLines.forEach((line: string) => {
    doc.text(line, MARGIN, y);
    y += LINE_LOOSE + 1;
  });
  y += LINE;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_BODY);
  doc.text('Op maat gemaakte oplossing volgens onderstaande scope en investering.', MARGIN, y);
  y += LINE_LOOSE + SPACE_SECTION;
  y = hr(doc, y);
  y += SPACE_SECTION;

  // ——— Scope: alleen gekozen opties (geen vaste lijst) ———
  const scopeOptionNames = (quoteData.selectedOptions || []).map((o) => o.name);
  const scopeDesc = quoteData.scopeDescription?.trim();
  const hasScope = scopeOptionNames.length > 0 || scopeDesc;
  if (hasScope) {
    const scopeDescLines = scopeDesc ? doc.splitTextToSize(scopeDesc, CONTENT_WIDTH).length + 1 : 0;
    const scopeBlockHeight = 14 + scopeDescLines * LINE + scopeOptionNames.length * LINE + SPACE_SECTION;
    y = ensureSpace(doc, y, scopeBlockHeight, drawHeader);
    doc.setFontSize(FONT_SECTION);
    doc.setFont('helvetica', 'bold');
    setColor(doc, NUDGE_PRIMARY);
    doc.text('Scope', MARGIN, y);
    y += LINE_LOOSE;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONT_SMALL);
    if (scopeDesc) {
      setColor(doc, NUDGE_FOREGROUND);
      y += writeWrapped(doc, scopeDesc, MARGIN, y, CONTENT_WIDTH) * LINE;
      y += SPACE_BLOCK;
    }
    setColor(doc, NUDGE_FOREGROUND);
    scopeOptionNames.forEach((name) => {
      doc.text('· ' + name, MARGIN, y);
      y += LINE;
    });
    y += SPACE_SECTION;
    y = hr(doc, y);
    y += SPACE_SECTION;
  }

  // ——— Investering: alleen wat is gekozen/ingevuld ———
  const addRow = (label: string, amount: number, indent = false) => {
    const prefix = indent ? '   ' : '';
    const lines = doc.splitTextToSize(prefix + label, DESC_WIDTH);
    const rowHeight = lines.length * LINE + 2;
    y = ensureSpace(doc, y, rowHeight, drawHeader);
    const rowY = y;
    lines.forEach((l: string) => {
      doc.text(l, MARGIN, y);
      y += LINE;
    });
    doc.text(formatCurrency(amount), AMOUNT_X, rowY + (lines.length - 1) * LINE, { align: 'right' });
    y += 2;
  };

  y = ensureSpace(doc, y, 15, drawHeader);
  doc.setFontSize(FONT_SECTION);
  doc.setFont('helvetica', 'bold');
  setColor(doc, NUDGE_PRIMARY);
  doc.text('Investering', MARGIN, y);
  y += LINE_LOOSE;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_BODY);
  setColor(doc, NUDGE_FOREGROUND);

  if (quoteData.selectedPackage) {
    y = ensureSpace(doc, y, 12, drawHeader);
    doc.setFont('helvetica', 'bold');
    doc.text(quoteData.selectedPackage.name, MARGIN, y);
    doc.text(formatCurrency(quoteData.selectedPackage.basePrice), AMOUNT_X, y, { align: 'right' });
    y += LINE + 2;
    doc.setFont('helvetica', 'normal');
  }

  (quoteData.selectedOptions || []).forEach((opt) => {
    const price = opt.customPrice ?? opt.price;
    addRow(opt.name, price, true);
  });
  const extraPages = quoteData.extraPages ?? 0;
  const contentPages = quoteData.contentPages ?? 0;
  if (extraPages > 0) addRow(`Extra pagina's: ${extraPages}`, extraPages * 125);
  if (contentPages > 0) addRow(`Content pagina's: ${contentPages}`, contentPages * 125);
  if (quoteData.selectedMaintenance) {
    addRow(`${quoteData.selectedMaintenance.name} (1e maand)`, quoteData.selectedMaintenance.price, true);
  }
  (quoteData.customLineItems || []).forEach((item) => addRow(item.name, item.price, true));

  if (quoteData.discount?.type && quoteData.discount.value > 0) {
    const lbl = quoteData.discount.type === 'percentage' ? `Korting ${quoteData.discount.value}%` : `Korting ${formatCurrency(quoteData.discount.value)}`;
    addRow(lbl, -discountAmount);
  }

  const totalsBlockHeight = 28;
  y += SPACE_BLOCK;
  y = ensureSpace(doc, y, totalsBlockHeight, drawHeader);
  y = hr(doc, y);
  doc.setFontSize(FONT_SMALL);
  setColor(doc, NUDGE_FOREGROUND);
  doc.text('Subtotaal (excl. BTW)', MARGIN, y);
  doc.text(formatCurrency(Math.max(0, subtotalExVat - discountAmount)), AMOUNT_X, y, { align: 'right' });
  y += LINE;
  doc.text('BTW (21%)', MARGIN, y);
  doc.text(formatCurrency(vatAmount), AMOUNT_X, y, { align: 'right' });
  y += LINE + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_BODY);
  setColor(doc, NUDGE_PRIMARY);
  doc.text('Totaal (incl. BTW)', MARGIN, y);
  doc.text(formatCurrency(totalPrice), AMOUNT_X, y, { align: 'right' });
  setColor(doc, NUDGE_FOREGROUND);
  doc.setFont('helvetica', 'normal');
  y += LINE_LOOSE + SPACE_SECTION;

  // ——— Onderhoud alleen tonen als er een is gekozen ———
  if (quoteData.selectedMaintenance) {
    doc.setFontSize(FONT_SMALL);
    setColor(doc, NUDGE_MUTED);
    doc.text('Onderhoud (maandelijks): ' + quoteData.selectedMaintenance.name + ' – ' + formatCurrency(quoteData.selectedMaintenance.price) + '/maand', MARGIN, y);
    y += LINE + SPACE_BLOCK;
    setColor(doc, NUDGE_FOREGROUND);
  }

  // ——— Planning & betaling ———
  const planningBlockHeight = 35;
  y = ensureSpace(doc, y, planningBlockHeight, drawHeader);
  y = hr(doc, y);
  y += SPACE_BLOCK;
  doc.setFontSize(FONT_SECTION);
  doc.setFont('helvetica', 'bold');
  setColor(doc, NUDGE_PRIMARY);
  doc.text('Planning & betaling', MARGIN, y);
  y += LINE_LOOSE;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SMALL);
  setColor(doc, NUDGE_MUTED);
  const payment = quoteData.paymentSchedule ?? 'once';
  const timelineStr = quoteData.timelineWeeks != null && quoteData.timelineWeeks > 0
    ? `${quoteData.timelineWeeks} weken`
    : (quoteData.timeline?.trim() || 'n.t.b.');
  const feedbackStr = quoteData.feedbackRounds != null && quoteData.feedbackRounds >= 0 ? `${quoteData.feedbackRounds}` : 'n.t.b.';
  doc.text('Start: na goedkeuring', MARGIN, y);
  y += LINE;
  doc.text(`Doorlooptijd: ${timelineStr}`, MARGIN, y);
  y += LINE;
  doc.text(`Feedbackrondes: ${feedbackStr}`, MARGIN, y);
  y += LINE;
  doc.text('Factuur: bij akkoord', MARGIN, y);
  y += LINE;
  doc.text(PAYMENT_LABELS[payment] ?? PAYMENT_LABELS.once, MARGIN, y);
  setColor(doc, NUDGE_FOREGROUND);

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(doc);
  }

  return doc.output('blob');
}
