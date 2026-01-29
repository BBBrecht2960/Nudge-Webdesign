/**
 * Deterministic PDF offerte generator.
 *
 * ——— ROLE ———
 * Je bent een deterministic document generator.
 * Je gebruikt ALTIJD exact dezelfde offerte-template.
 * Je mag NOOIT layout, volgorde of stijl aanpassen op basis van input.
 *
 * ——— DOEL ———
 * Genereer een 1-page premium offerte (A4, PDF-ready) voor een digital agency
 * met een vaste, onveranderlijke structuur en branding.
 *
 * ——— ABSOLUTE REGELS (BREKEN = FOUT) ———
 * - Gebruik ALTIJD dezelfde template.
 * - Wijzig NOOIT: layout, volgorde van secties, typografie, spacing, kleurgebruik.
 * - Alleen tekst en cijfers mogen veranderen.
 * - Maximaal 1 pagina A4.
 * - Extra pagina ALLEEN als content objectief niet past
 *   (meer dan 6 prijsitems of meer dan 12 scope-items).
 * - Geen emojis. Geen gradients. Geen marketingtaal. Veel witruimte.
 *
 * ——— TEMPLATE STRUCTUUR (LOCKED) ———
 *
 * [HEADER — LOCKED]
 * - Logo links
 * - Agency naam + contact klein
 * - Offerte datum, nummer, geldig tot rechts
 * - Subtiele horizontale lijn
 *
 * [SECTION 1 — SAMENVATTING]
 * - Titel: "Offerte – {{Projecttype}} voor {{Klantnaam}}"
 * - Subtitel (1 zin, resultaatgericht)
 * - Bullets (exact 3): Doel, Oplossing, Resultaat
 *
 * [SECTION 2 — SCOPE] Twee kolommen.
 * Links — Inbegrepen: Pagina's, Functionaliteiten, Admin, Integraties
 * Rechts — Niet inbegrepen: Hosting, Contentcreatie (tenzij vermeld), Marketingcampagnes (tenzij vermeld)
 *
 * [SECTION 3 — INVESTERING]
 * Blok 1 — Basis: {{PakketNaam}}, korte omschrijving (max 1 zin), prijs excl. btw
 * Blok 2 — Optioneel: lijst uitbreidingen + prijs; "Op aanvraag" waar van toepassing
 * Blok 3 — Onderhoud (maandelijks): Starter, Business, Growth
 *
 * [SECTION 4 — PLANNING & BETALING]
 * - Start: na goedkeuring
 * - Doorlooptijd: {{X}} weken
 * - Feedbackrondes: {{X}}
 * - Betaling: 100% vooraf (of gekozen schema)
 * - Factuur bij akkoord
 *
 * [FOOTER — LOCKED]
 * - Bedrijfsnaam, Locatie, Bedrijfsgegevens, Korte tagline (optioneel, klein)
 *
 * ——— DESIGN TOKENS (LOCKED) ———
 * - Font family: Inter (fallback: helvetica in jsPDF)
 * - Titel: 18–22pt, semibold
 * - Body: 10–11pt, regular
 * - Line-height: ruim
 * - Kleur: primary brand, grijswaarden voor tekst, accent alleen bij prijzen
 * - Grid: consistente margins, geen afwijkingen
 * - Geen gradients, geen iconen, geen decoratieve elementen
 *
 * ——— CONTENT REGELS ———
 * - Professioneel, helder Nederlands. Korte zinnen.
 * - Geen uitleg. Geen aannames.
 * - Onbekende data = leeg laten of "n.t.b."
 *
 * ——— OUTPUT ———
 * - Print-ready document, geschikt voor PDF-export
 * - Exact dezelfde visuele output voor elke offerte; alleen content verschilt
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
  /** Offerte-/referentienummer; toont "n.t.b." indien leeg. */
  quoteNumber?: string | null;
  /** Doorlooptijd in weken; toont "n.t.b." indien niet gezet. */
  timelineWeeks?: number | null;
  /** Aantal feedbackrondes; toont "n.t.b." indien niet gezet. */
  feedbackRounds?: number | null;
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

// ——— LOCKED LAYOUT ———
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 18;
const MARGIN_RIGHT = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN - MARGIN_RIGHT;
const AMOUNT_X = PAGE_WIDTH - MARGIN_RIGHT - 32;
const DESC_WIDTH = CONTENT_WIDTH - 38;

// ——— LOCKED TYPOGRAPHY ———
const FONT_TITLE = 20;
const FONT_SECTION = 11;
const FONT_BODY = 10;
const FONT_SMALL = 9;
const FONT_FOOTER = 8;
const LINE = 5;
const LINE_LOOSE = 6;
const SPACE_SECTION = 6;
const SPACE_BLOCK = 4;

// ——— LOCKED BRAND ———
const BRAND_NAME = 'Nudge Webdesign & Marketing';
const BRAND_TAGLINE = 'Hasselt';
const COLOR_TEXT = 40;
const COLOR_MUTED = 100;
const COLOR_ACCENT = 0;

// ——— LOCKED ONDERHOUD (Starter, Business, Growth) ———
const MAINTENANCE_TIERS: { name: string; price: number }[] = [
  { name: 'Starter', price: 24.99 },
  { name: 'Business', price: 59.99 },
  { name: 'Growth', price: 119 },
];

function formatCurrency(amount: number): string {
  return '€ ' + amount.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hr(doc: jsPDF, y: number): number {
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.25);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  return y + SPACE_BLOCK;
}

export async function generateQuotePdfBlob(
  clientInfo: QuotePdfClientInfo,
  quoteData: ApprovedQuoteData,
  totalPrice: number
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;
  const footerY = PAGE_HEIGHT - 18;

  const projectType = quoteData.selectedPackage?.name ?? 'Website';
  const clientName = clientInfo.company_name?.trim() || clientInfo.name?.trim() || 'n.t.b.';
  const subtotalExVat = quoteData.pricing?.subtotal ?? 0;
  const discountAmount = quoteData.pricing?.discountAmount ?? 0;
  const vatAmount = quoteData.pricing?.vat ?? 0;

  // ——— [HEADER — LOCKED] ———
  doc.setFontSize(FONT_SECTION);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_TEXT);
  doc.text(BRAND_NAME, MARGIN, y);
  y += LINE;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SMALL);
  doc.setTextColor(COLOR_MUTED);
  doc.text(BRAND_TAGLINE, MARGIN, y);
  y += LINE;
  const dateStr = new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' });
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' });
  const quoteNum = (quoteData.quoteNumber ?? '').trim() || 'n.t.b.';
  doc.text(`Datum: ${dateStr}  ·  Nr: ${quoteNum}  ·  Geldig tot: ${validUntil}`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' });
  y += LINE_LOOSE;
  y = hr(doc, y);
  y += SPACE_SECTION;

  // ——— [SECTION 1 — SAMENVATTING] ———
  doc.setFontSize(FONT_TITLE);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLOR_TEXT);
  doc.text(`Offerte – ${projectType} voor ${clientName}`, MARGIN, y);
  y += LINE_LOOSE;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_BODY);
  doc.text('Op maat gemaakte oplossing volgens onderstaande scope en investering.', MARGIN, y);
  y += LINE_LOOSE + 2;
  doc.setFontSize(FONT_SMALL);
  doc.setTextColor(COLOR_MUTED);
  doc.text('• Doel: professionele online aanwezigheid', MARGIN, y);
  y += LINE;
  doc.text('• Oplossing: website of webapp conform offerte', MARGIN, y);
  y += LINE;
  doc.text('• Resultaat: levering na goedkeuring', MARGIN, y);
  y += SPACE_SECTION;
  doc.setTextColor(COLOR_TEXT);
  doc.setFontSize(FONT_BODY);
  y = hr(doc, y);
  y += SPACE_SECTION;

  // ——— [SECTION 2 — SCOPE] Twee kolommen ———
  doc.setFontSize(FONT_SECTION);
  doc.setFont('helvetica', 'bold');
  doc.text('Scope', MARGIN, y);
  y += LINE_LOOSE;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SMALL);
  const colLeft = MARGIN;
  const colRight = MARGIN + CONTENT_WIDTH / 2 + 4;
  doc.setTextColor(COLOR_MUTED);
  doc.text('Inbegrepen:', colLeft, y);
  doc.text('Niet inbegrepen:', colRight, y);
  y += LINE;
  doc.setTextColor(COLOR_TEXT);
  const inBegrepen: string[] = ['Pagina\'s', 'Functionaliteiten', 'Admin', 'Integraties'];
  (quoteData.selectedOptions || []).forEach((o) => inBegrepen.push(o.name));
  inBegrepen.slice(0, 12).forEach((line) => {
    doc.text('· ' + line, colLeft, y);
    y += LINE;
  });
  const scopeLineCount = Math.min(inBegrepen.length, 12);
  const yScopeRight = y - scopeLineCount * LINE;
  doc.text('· Hosting', colRight, yScopeRight);
  doc.text('· Contentcreatie (tenzij vermeld)', colRight, yScopeRight + LINE);
  doc.text('· Marketingcampagnes (tenzij vermeld)', colRight, yScopeRight + LINE * 2);
  y += SPACE_SECTION;
  y = hr(doc, y);
  y += SPACE_SECTION;

  // ——— [SECTION 3 — INVESTERING] ———
  doc.setFontSize(FONT_SECTION);
  doc.setFont('helvetica', 'bold');
  doc.text('Investering', MARGIN, y);
  y += LINE_LOOSE;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_BODY);

  const addRow = (label: string, amount: number, indent = false) => {
    const prefix = indent ? '   ' : '';
    const lines = doc.splitTextToSize(prefix + label, DESC_WIDTH);
    const rowY = y;
    lines.forEach((l: string) => {
      doc.text(l, MARGIN, y);
      y += LINE;
    });
    doc.text(formatCurrency(amount), AMOUNT_X, rowY + LINE - 1, { align: 'right' });
    y += 2;
  };

  if (quoteData.selectedPackage) {
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
  (quoteData.customLineItems || []).forEach((item) => addRow(item.name, item.price, true));

  if (quoteData.discount?.type && quoteData.discount.value > 0) {
    const lbl = quoteData.discount.type === 'percentage' ? `Korting ${quoteData.discount.value}%` : `Korting ${formatCurrency(quoteData.discount.value)}`;
    addRow(lbl, -discountAmount);
  }

  y += SPACE_BLOCK;
  y = hr(doc, y);
  doc.setFontSize(FONT_SMALL);
  doc.text('Subtotaal (excl. BTW)', MARGIN, y);
  doc.text(formatCurrency(Math.max(0, subtotalExVat - discountAmount)), AMOUNT_X, y, { align: 'right' });
  y += LINE;
  doc.text('BTW (21%)', MARGIN, y);
  doc.text(formatCurrency(vatAmount), AMOUNT_X, y, { align: 'right' });
  y += LINE + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_BODY);
  doc.setTextColor(COLOR_ACCENT);
  doc.text('Totaal (incl. BTW)', MARGIN, y);
  doc.text(formatCurrency(totalPrice), AMOUNT_X, y, { align: 'right' });
  doc.setTextColor(COLOR_TEXT);
  doc.setFont('helvetica', 'normal');
  y += LINE_LOOSE + SPACE_SECTION;

  doc.setFontSize(FONT_SMALL);
  doc.setTextColor(COLOR_MUTED);
  doc.text('Onderhoud (maandelijks):', MARGIN, y);
  y += LINE;
  MAINTENANCE_TIERS.forEach((tier) => {
    doc.text('· ' + tier.name + ' – ' + formatCurrency(tier.price) + '/maand', MARGIN + 4, y);
    y += LINE;
  });
  y += SPACE_BLOCK;
  doc.setTextColor(COLOR_TEXT);

  // ——— [SECTION 4 — PLANNING & BETALING] ———
  y = hr(doc, y);
  y += SPACE_BLOCK;
  doc.setFontSize(FONT_SECTION);
  doc.setFont('helvetica', 'bold');
  doc.text('Planning & betaling', MARGIN, y);
  y += LINE_LOOSE;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SMALL);
  doc.setTextColor(COLOR_MUTED);
  const paymentLabels: Record<string, string> = {
    once: 'Betaling: 100% vooraf',
    twice_25: 'Betaling: 25% voorschot, 75% bij aflevering',
    thrice_33: 'Betaling: 33% begin, 33% midden, 33% aflevering',
  };
  const payment = quoteData.paymentSchedule ?? 'once';
  const timelineStr = quoteData.timelineWeeks != null && quoteData.timelineWeeks > 0 ? `${quoteData.timelineWeeks} weken` : 'n.t.b.';
  const feedbackStr = quoteData.feedbackRounds != null && quoteData.feedbackRounds >= 0 ? `${quoteData.feedbackRounds}` : 'n.t.b.';
  doc.text('Start: na goedkeuring', MARGIN, y);
  y += LINE;
  doc.text(`Doorlooptijd: ${timelineStr}`, MARGIN, y);
  y += LINE;
  doc.text(`Feedbackrondes: ${feedbackStr}`, MARGIN, y);
  y += LINE;
  doc.text('Factuur: bij akkoord', MARGIN, y);
  y += LINE;
  doc.text(paymentLabels[payment] ?? paymentLabels.once, MARGIN, y);
  y += SPACE_SECTION;
  doc.setTextColor(COLOR_TEXT);
  doc.setFontSize(FONT_BODY);

  // ——— [FOOTER — LOCKED] ———
  if (y > footerY - 14) y = footerY - 14;
  y = hr(doc, footerY - 10);
  doc.setFontSize(FONT_FOOTER);
  doc.setTextColor(COLOR_MUTED);
  doc.text(BRAND_NAME + ' · ' + BRAND_TAGLINE, MARGIN, footerY - 6);
  doc.text('Deze offerte is geldig zoals opgesteld. Voorwaarden zoals overeengekomen.', MARGIN, footerY - 2);
  doc.setTextColor(COLOR_TEXT);

  return doc.output('blob');
}
