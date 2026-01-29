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

// Layout
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const MARGIN_RIGHT = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN - MARGIN_RIGHT;
const DESC_COL_WIDTH = CONTENT_WIDTH - 35; // space for amount column
const AMOUNT_X = PAGE_WIDTH - MARGIN_RIGHT - 32;

const FONT_TITLE = 22;
const FONT_SECTION = 12;
const FONT_BODY = 10;
const FONT_SMALL = 9;
const FONT_FOOTER = 8;
const LINE_BODY = 5;
const LINE_TITLE = 7;
const SPACE_SECTION = 8;
const SPACE_BLOCK = 6;

const BRAND_NAME = 'Nudge Webdesign & Marketing';
const BRAND_TAGLINE = 'Hasselt';

function formatCurrency(amount: number): string {
  return '€ ' + amount.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Draw horizontal line and advance y */
function lineAndAdvance(doc: jsPDF, y: number, indentLeft = MARGIN, indentRight = PAGE_WIDTH - MARGIN_RIGHT): number {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(indentLeft, y, indentRight, y);
  return y + 3;
}

export async function generateQuotePdfBlob(
  clientInfo: QuotePdfClientInfo,
  quoteData: ApprovedQuoteData,
  totalPrice: number
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  const footerY = PAGE_HEIGHT - 20;
  const maxY = footerY - 15;

  // ----- Header: branding -----
  doc.setFontSize(FONT_TITLE);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(BRAND_NAME, MARGIN, y);
  y += LINE_TITLE;

  doc.setFontSize(FONT_SMALL);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(BRAND_TAGLINE, MARGIN, y);
  y += 4;

  y = lineAndAdvance(doc, y);
  y += SPACE_SECTION;

  // ----- Title + date -----
  doc.setFontSize(FONT_SECTION);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Offerte', MARGIN, y);
  const dateStr = new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_BODY);
  doc.text(`Datum: ${dateStr}`, AMOUNT_X, y, { align: 'right' });
  y += LINE_BODY + SPACE_BLOCK;

  // ----- Klant -----
  doc.setFontSize(FONT_SECTION);
  doc.setFont('helvetica', 'bold');
  doc.text('Aan', MARGIN, y);
  y += LINE_BODY + 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_BODY);
  doc.setTextColor(50, 50, 50);

  const clientLines: string[] = [clientInfo.name];
  if (clientInfo.company_name) clientLines.push(clientInfo.company_name);
  if (clientInfo.email) clientLines.push(clientInfo.email);
  if (clientInfo.phone) clientLines.push(clientInfo.phone);
  const addressParts = [
    clientInfo.company_address,
    [clientInfo.company_postal_code, clientInfo.company_city].filter(Boolean).join(' '),
    clientInfo.company_country,
  ].filter((x): x is string => Boolean(x));
  if (addressParts.length) clientLines.push(...addressParts);
  if (clientInfo.vat_number) clientLines.push(`BTW: ${clientInfo.vat_number}`);
  if (clientInfo.company_website) clientLines.push(clientInfo.company_website);

  clientLines.forEach((line) => {
    doc.text(line, MARGIN, y);
    y += LINE_BODY;
  });
  y += SPACE_SECTION;

  // ----- Intro -----
  doc.text('Hierbij bieden we u onderstaande offerte aan.', MARGIN, y);
  y += LINE_BODY + SPACE_SECTION;

  // ----- Table: header -----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_SMALL);
  doc.setTextColor(60, 60, 60);
  doc.text('Omschrijving', MARGIN, y);
  doc.text('Bedrag', AMOUNT_X, y, { align: 'right' });
  y += LINE_BODY;
  y = lineAndAdvance(doc, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_BODY);
  doc.setTextColor(0, 0, 0);

  // ----- Table: rows -----
  const addRow = (label: string, amount: number, indent = false) => {
    if (y > maxY) {
      doc.addPage();
      y = MARGIN;
      doc.setFontSize(FONT_BODY);
    }
    const rowStartY = y;
    const prefix = indent ? '   ' : '';
    const wrapped = doc.splitTextToSize(prefix + label, DESC_COL_WIDTH);
    wrapped.forEach((line: string) => {
      doc.text(line, MARGIN, y);
      y += LINE_BODY;
    });
    doc.text(formatCurrency(amount), AMOUNT_X, rowStartY + LINE_BODY - 1, { align: 'right' });
    y += 2;
  };

  if (quoteData.selectedPackage) {
    addRow(quoteData.selectedPackage.name, quoteData.selectedPackage.basePrice);
  }

  (quoteData.selectedOptions || []).forEach((opt) => {
    const price = opt.customPrice ?? opt.price;
    addRow(opt.name, price, true);
  });

  if (quoteData.selectedMaintenance) {
    addRow(`Onderhoud: ${quoteData.selectedMaintenance.name}`, quoteData.selectedMaintenance.price);
  }

  const extraPages = quoteData.extraPages ?? 0;
  const contentPages = quoteData.contentPages ?? 0;
  if (extraPages > 0) addRow(`Extra pagina's: ${extraPages}`, extraPages * 125);
  if (contentPages > 0) addRow(`Content pagina's: ${contentPages}`, contentPages * 125);

  (quoteData.customLineItems || []).forEach((item) => {
    addRow(item.name, item.price, true);
  });

  const subtotalExVat = quoteData.pricing?.subtotal ?? 0;
  const discountAmount = quoteData.pricing?.discountAmount ?? 0;
  const discount = quoteData.discount;

  if (discount?.type && discount.value > 0) {
    y += 2;
    addRow(
      `Korting (${discount.type === 'percentage' ? discount.value + '%' : formatCurrency(discount.value)})`,
      -discountAmount
    );
  }

  y += 4;
  y = lineAndAdvance(doc, y);

  doc.setFontSize(FONT_SMALL);
  if (discountAmount > 0) {
    doc.text('Subtotaal (excl. BTW)', MARGIN, y);
    doc.text(formatCurrency(subtotalExVat), AMOUNT_X, y, { align: 'right' });
    y += LINE_BODY;
    doc.text('Korting', MARGIN, y);
    doc.text(`- ${formatCurrency(discountAmount)}`, AMOUNT_X, y, { align: 'right' });
    y += LINE_BODY;
    doc.text('Subtotaal na korting (excl. BTW)', MARGIN, y);
    doc.text(formatCurrency(Math.max(0, subtotalExVat - discountAmount)), AMOUNT_X, y, { align: 'right' });
  } else {
    doc.text('Subtotaal (excl. BTW)', MARGIN, y);
    doc.text(formatCurrency(subtotalExVat), AMOUNT_X, y, { align: 'right' });
  }
  y += LINE_BODY;

  const vat = quoteData.pricing?.vat ?? totalPrice - (subtotalExVat - discountAmount);
  doc.text('BTW (21%)', MARGIN, y);
  doc.text(formatCurrency(vat), AMOUNT_X, y, { align: 'right' });
  y += LINE_BODY + 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_BODY);
  doc.text('Totaal (incl. BTW)', MARGIN, y);
  doc.text(formatCurrency(totalPrice), AMOUNT_X, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += LINE_BODY + SPACE_SECTION;

  // Betaling
  const paymentLabels: Record<string, string> = {
    once: 'In 1 keer op voorhand',
    twice_25: 'In 2 keer: 25% voorschot aan begin, 75% bij aflevering',
    thrice_33: 'In 3 keer: 33% begin, 33% midden, 33% bij aflevering',
  };
  const paymentSchedule = quoteData.paymentSchedule ?? 'once';
  doc.setFontSize(FONT_SMALL);
  doc.setTextColor(60, 60, 60);
  doc.text('Betaling: ' + (paymentLabels[paymentSchedule] ?? paymentLabels.once), MARGIN, y);
  y += LINE_BODY + SPACE_SECTION;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(FONT_BODY);

  // Voorwaarden / footer
  if (y > footerY - 25) {
    doc.addPage();
    y = MARGIN;
  }

  y = lineAndAdvance(doc, footerY - 12);
  doc.setFontSize(FONT_FOOTER);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'Deze offerte is geldig zoals opgesteld. Voorwaarden zoals overeengekomen.',
    MARGIN,
    footerY - 8
  );
  doc.text(BRAND_NAME + ' · ' + BRAND_TAGLINE, MARGIN, footerY - 4);
  doc.setTextColor(0, 0, 0);

  return doc.output('blob');
}
