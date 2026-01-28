/**
 * Generate a quote PDF from approved_quote + client info (for customer detail page).
 * Uses same layout as the quote builder PDF.
 */
import jsPDF from 'jspdf';
import { scopeOptions, growthOptions } from '@/lib/pricing';

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

export interface ApprovedQuoteData {
  selectedPackage: { id: string; name: string; basePrice: number };
  selectedOptions: Array<{ id: string; name: string; price: number }>;
  optionNotes?: Record<string, string>;
  extraPages?: number;
  contentPages?: number;
  selectedMaintenance?: { id: string; name: string; price: number } | null;
}

const BUSINESS_NAME = 'Almost 3000 BV';
const BUSINESS_EMAIL = 'info@almost3000.be';
const BUSINESS_PHONE = process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+32494299633';
const BUSINESS_ADDRESS = 'Herkenrodesingel 19C/4.2, 3500 Hasselt, België';

export async function generateQuotePdfBlob(
  clientInfo: QuotePdfClientInfo,
  approvedQuote: ApprovedQuoteData,
  quoteTotal: number
): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 7;
  const optionNotes = approvedQuote.optionNotes || {};
  const extraPages = approvedQuote.extraPages || 0;
  const contentPages = approvedQuote.contentPages || 0;

  let yPos = margin;

  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Logo (optional)
  let logoBase64: string | null = null;
  try {
    const logoResponse = await fetch('/Nudge websdesign & marketing Hasselt logo.png');
    if (logoResponse.ok) {
      const logoBlob = await logoResponse.blob();
      logoBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Not string')));
        reader.onerror = reject;
        reader.readAsDataURL(logoBlob);
      });
    }
  } catch {
    /* ignore */
  }

  // Header
  const headerHeight = 70;
  doc.setFillColor(144, 103, 198);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  doc.setFillColor(120, 85, 170);
  doc.rect(0, headerHeight - 10, pageWidth, 10, 'F');

  const logoSize = 45;
  const logoX = pageWidth - margin - logoSize;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', logoX, margin, logoSize, logoSize, undefined, 'FAST');
    } catch {
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(BUSINESS_NAME, logoX + logoSize / 2, margin + logoSize / 2, { align: 'center' });
    }
  } else {
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(BUSINESS_NAME, logoX + logoSize / 2, margin + logoSize / 2, { align: 'center' });
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(BUSINESS_NAME, margin, margin + 18);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Offerte', margin, margin + 30);
  const dateStr = new Date().toLocaleDateString('nl-BE', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFontSize(10);
  doc.text(`Datum: ${dateStr}`, logoX - 10, margin + 20, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  yPos = headerHeight + 20;

  // Client block
  let clientLines = 2;
  if (clientInfo.company_name) clientLines++;
  if (clientInfo.vat_number) clientLines++;
  if (clientInfo.company_address) clientLines++;
  if (clientInfo.company_postal_code || clientInfo.company_city) clientLines++;
  if (clientInfo.company_country) clientLines++;
  if (clientInfo.email) clientLines++;
  if (clientInfo.phone) clientLines++;
  if (clientInfo.company_website) clientLines++;
  const clientInfoHeight = Math.max(40, 12 + clientLines * (lineHeight + 2) + 8);

  doc.setFillColor(248, 248, 252);
  doc.setDrawColor(144, 103, 198);
  doc.setLineWidth(1.5);
  doc.rect(margin, yPos, contentWidth, clientInfoHeight, 'FD');
  yPos += 10;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(144, 103, 198);
  doc.text('Klantgegevens', margin + 8, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 10;
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.5);
  doc.line(margin + 8, yPos - 2, pageWidth - margin - 8, yPos - 2);
  yPos += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);

  const addLine = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin + 8, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 30, yPos);
    yPos += lineHeight + 2;
  };
  addLine('Naam', clientInfo.name);
  if (clientInfo.company_name) addLine('Bedrijf', clientInfo.company_name);
  if (clientInfo.vat_number) addLine('BTW-nummer', clientInfo.vat_number);
  if (clientInfo.company_address) addLine('Adres', clientInfo.company_address);
  if (clientInfo.company_postal_code || clientInfo.company_city) {
    addLine('Postcode & Stad', [clientInfo.company_postal_code, clientInfo.company_city].filter(Boolean).join(' '));
  }
  if (clientInfo.company_country) addLine('Land', clientInfo.company_country);
  if (clientInfo.email) addLine('E-mail', clientInfo.email);
  if (clientInfo.phone) addLine('Telefoon', clientInfo.phone);
  if (clientInfo.company_website) addLine('Website', clientInfo.company_website);

  yPos += 15;

  // Items table
  checkNewPage(30);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(144, 103, 198);
  doc.text('Geselecteerde Items', margin, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 12;

  doc.setFillColor(144, 103, 198);
  doc.rect(margin, yPos, contentWidth, 10, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Omschrijving', margin + 5, yPos + 7);
  doc.text('Bedrag', pageWidth - margin - 5, yPos + 7, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  yPos += 12;

  // Package row
  const pkg = approvedQuote.selectedPackage;
  checkNewPage(10);
  doc.setFillColor(252, 250, 255);
  doc.setDrawColor(230, 230, 240);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos - 1, contentWidth, 9, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(pkg.name, margin + 5, yPos + 6);
  doc.setTextColor(144, 103, 198);
  doc.text(`€ ${pkg.basePrice.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 5, yPos + 6, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  yPos += 11;

  // Options
  approvedQuote.selectedOptions.forEach((option) => {
    if (option.price <= 0) return;
    checkNewPage(15);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(235, 235, 245);
    doc.rect(margin, yPos - 1, contentWidth, 9, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    let optionText = option.name;
    if (optionNotes[option.id]) optionText += ` (${optionNotes[option.id]})`;
    const lines = doc.splitTextToSize(optionText, contentWidth - 70);
    doc.text(lines[0], margin + 5, yPos + 6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(144, 103, 198);
    doc.text(`€ ${option.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 5, yPos + 6, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    yPos += 11;
  });

  // Extra pages
  if (extraPages > 0) {
    const extraOption = scopeOptions.find((o) => o.id === 'extra-pages');
    const price = extraOption ? extraOption.price * extraPages : 0;
    if (price > 0) {
      checkNewPage(10);
      doc.setFillColor(250, 248, 255);
      doc.setDrawColor(235, 235, 245);
      doc.rect(margin, yPos - 1, contentWidth, 9, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`Extra pagina's (${extraPages}x)`, margin + 5, yPos + 6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(144, 103, 198);
      doc.text(`€ ${price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 5, yPos + 6, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPos += 11;
    }
  }

  // Content pages
  if (contentPages > 0) {
    const contentOption = growthOptions.find((o) => o.id === 'content-creation');
    const price = contentOption ? contentOption.price * contentPages : 0;
    if (price > 0) {
      checkNewPage(10);
      doc.setFillColor(250, 248, 255);
      doc.setDrawColor(235, 235, 245);
      doc.rect(margin, yPos - 1, contentWidth, 9, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`Content creatie (${contentPages}x)`, margin + 5, yPos + 6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(144, 103, 198);
      doc.text(`€ ${price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 5, yPos + 6, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPos += 11;
    }
  }

  yPos += 8;

  // Totals (we have quote_total; show as total incl. BTW)
  checkNewPage(50);
  const subtotal = quoteTotal / 1.21;
  const vat = quoteTotal - subtotal;
  doc.setFillColor(252, 250, 255);
  doc.setDrawColor(144, 103, 198);
  doc.setLineWidth(1.5);
  doc.rect(margin, yPos, contentWidth, 50, 'FD');
  yPos += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Subtotaal (excl. BTW)', margin + 8, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`€ ${subtotal.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 8, yPos, { align: 'right' });
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('BTW (21%)', margin + 8, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`€ ${vat.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 8, yPos, { align: 'right' });
  yPos += 12;
  doc.setDrawColor(200, 190, 220);
  doc.setLineWidth(1);
  doc.line(margin + 8, yPos, pageWidth - margin - 8, yPos);
  yPos += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(144, 103, 198);
  doc.text('Totaal (incl. BTW)', margin + 8, yPos);
  doc.setFontSize(18);
  doc.text(`€ ${quoteTotal.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 8, yPos, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  yPos += 15;

  // Maintenance if present
  if (approvedQuote.selectedMaintenance && approvedQuote.selectedMaintenance.price > 0) {
    checkNewPage(15);
    doc.setFillColor(240, 238, 250);
    doc.setDrawColor(144, 103, 198);
    doc.setLineWidth(1);
    doc.rect(margin, yPos, contentWidth, 14, 'FD');
    yPos += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(144, 103, 198);
    doc.text('Onderhoud (per maand)', margin + 8, yPos);
    doc.setFontSize(12);
    doc.text(`€ ${approvedQuote.selectedMaintenance.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 8, yPos, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  // Footer
  const footerY = pageHeight - 55;
  doc.setFillColor(248, 248, 252);
  doc.rect(0, footerY - 5, pageWidth, pageHeight - footerY + 5, 'F');
  doc.setDrawColor(144, 103, 198);
  doc.setLineWidth(1);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(144, 103, 198);
  doc.text('Contactgegevens', margin, footerY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(BUSINESS_EMAIL, margin, footerY + 12);
  doc.text(BUSINESS_PHONE, margin, footerY + 19);
  doc.text(BUSINESS_ADDRESS, margin, footerY + 26);

  return doc.output('blob') as Blob;
}
