/**
 * Offerte PDF – één vast template, altijd dezelfde professionele layout.
 * Alle maten en kleuren komen uit LAYOUT en COLORS; bodytekst altijd donker voor leesbaarheid.
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
  customLineItems?: Array<{ id: string; name: string; price: number }>;
  discount?: { type: 'percentage' | 'fixed'; value: number } | null;
}

const BUSINESS_NAME = 'Almost 3000 BV';
const BUSINESS_EMAIL = 'info@almost3000.be';
const BUSINESS_PHONE = process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+32494299633';
const BUSINESS_ADDRESS = 'Herkenrodesingel 19C/4.2, 3500 Hasselt, België';

/** Eén template: alle maten en kleuren op één plek. */
const LAYOUT = {
  margin: 20,
  headerHeight: 36,
  logoSize: 26,
  lineHeight: 5.2,
  rowHeight: 8,
  footerHeight: 20,
  /** Onderkant content (boven footer). */
  contentBottom(doc: jsPDF) {
    return doc.internal.pageSize.getHeight() - LAYOUT.footerHeight - 8;
  },
} as const;

/** Kleuren: bodytekst altijd donker (main/muted), accent alleen voor header en totaal. */
const COLORS = {
  textMain: [25, 25, 35] as [number, number, number],
  textMuted: [70, 70, 85] as [number, number, number],
  accent: [90, 60, 140] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  border: [200, 198, 210] as [number, number, number],
  tableHeaderBg: [240, 238, 248] as [number, number, number],
  tableRowBg: [250, 250, 252] as [number, number, number],
  totalBg: [248, 246, 252] as [number, number, number],
} as const;

function setColor(doc: jsPDF, rgb: readonly [number, number, number]) {
  if (!rgb || rgb.length < 3) return;
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}
function setFill(doc: jsPDF, rgb: readonly [number, number, number]) {
  if (!rgb || rgb.length < 3) return;
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setDraw(doc: jsPDF, rgb: readonly [number, number, number]) {
  if (!rgb || rgb.length < 3) return;
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

export async function generateQuotePdfBlob(
  clientInfo: QuotePdfClientInfo,
  approvedQuote: ApprovedQuoteData,
  quoteTotal: number
): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const m = LAYOUT.margin;
  const contentWidth = pageWidth - m * 2;
  const optionNotes = approvedQuote.optionNotes || {};
  const extraPages = approvedQuote.extraPages || 0;
  const contentPages = approvedQuote.contentPages || 0;
  const customLineItems = approvedQuote.customLineItems || [];
  const discount = approvedQuote.discount;

  let yPos = m;
  let pageNumber = 1;

  const contentBottom = () => LAYOUT.contentBottom(doc);

  const checkNewPage = (requiredSpace: number): void => {
    if (yPos + requiredSpace > contentBottom()) {
      drawFooter();
      doc.addPage();
      pageNumber += 1;
      yPos = m;
    }
  };

  const drawFooter = () => {
    const fy = pageHeight - LAYOUT.footerHeight;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setColor(doc, COLORS.textMuted);
    doc.text(BUSINESS_NAME, m, fy);
    doc.text(BUSINESS_EMAIL, m, fy + 4);
    doc.text(`${BUSINESS_PHONE} · ${BUSINESS_ADDRESS}`, m, fy + 8);
    doc.text(`Pagina ${pageNumber}`, pageWidth - m, fy + 4, { align: 'right' });
  };

  // ----- Logo (voor header) -----
  let logoBase64: string | null = null;
  try {
    const res = await fetch('/Nudge websdesign & marketing Hasselt logo.png');
    if (res.ok) {
      const blob = await res.blob();
      logoBase64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => (typeof r.result === 'string' ? resolve(r.result) : reject());
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
    }
  } catch {
    /* ignore */
  }

  // ----- Header (vaste hoogte, geen tekst buiten het blok) -----
  setFill(doc, COLORS.accent);
  doc.rect(0, 0, pageWidth, LAYOUT.headerHeight, 'F');

  const logoX = pageWidth - m - LAYOUT.logoSize;
  const logoY = (LAYOUT.headerHeight - LAYOUT.logoSize) / 2;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', logoX, logoY, LAYOUT.logoSize, LAYOUT.logoSize, undefined, 'FAST');
    } catch {
      setColor(doc, COLORS.white);
      doc.setFontSize(8);
      doc.text(BUSINESS_NAME, logoX + LAYOUT.logoSize / 2, LAYOUT.headerHeight / 2 + 1, { align: 'center' });
    }
  } else {
    setColor(doc, COLORS.white);
    doc.setFontSize(8);
    doc.text(BUSINESS_NAME, logoX + LAYOUT.logoSize / 2, LAYOUT.headerHeight / 2 + 1, { align: 'center' });
  }

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  setColor(doc, COLORS.white);
  doc.text('Offerte', m, 14);

  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + 30);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const dateStr = today.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' });
  const validStr = validUntil.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Datum: ${dateStr}`, logoX - 4, 10, { align: 'right' });
  doc.text(`Geldig tot: ${validStr}`, logoX - 4, 16, { align: 'right' });

  setColor(doc, COLORS.textMain);
  yPos = LAYOUT.headerHeight + 18;

  // ----- Klantgegevens (label "Aan" in donkere tekst) -----
  const clientLines: string[] = [];
  clientLines.push(clientInfo.name);
  if (clientInfo.company_name) clientLines.push(clientInfo.company_name);
  if (clientInfo.vat_number) clientLines.push(`BTW ${clientInfo.vat_number}`);
  if (clientInfo.company_address) clientLines.push(clientInfo.company_address);
  if (clientInfo.company_postal_code || clientInfo.company_city) {
    clientLines.push([clientInfo.company_postal_code, clientInfo.company_city].filter(Boolean).join(' '));
  }
  if (clientInfo.company_country) clientLines.push(clientInfo.company_country);
  if (clientInfo.email) clientLines.push(clientInfo.email);
  if (clientInfo.phone) clientLines.push(clientInfo.phone);
  if (clientInfo.company_website) clientLines.push(clientInfo.company_website);

  const clientBoxH = 10 + clientLines.length * (LAYOUT.lineHeight + 1.2) + 10;
  checkNewPage(clientBoxH + 24);

  setFill(doc, COLORS.tableRowBg);
  setDraw(doc, COLORS.border);
  doc.setLineWidth(0.35);
  doc.rect(m, yPos, contentWidth, clientBoxH, 'FD');
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setColor(doc, COLORS.textMain);
  doc.text('Aan', m + 5, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += LAYOUT.lineHeight + 1;
  doc.setFontSize(10);
  clientLines.forEach((line) => {
    doc.text(line, m + 5, yPos);
    yPos += LAYOUT.lineHeight + 1.2;
  });
  yPos += 14;

  // ----- Intro -----
  doc.setFontSize(9);
  setColor(doc, COLORS.textMuted);
  doc.text(
    'Hierbij ontvangt u onze offerte voor onderstaande leveringen en diensten. Alle bedragen zijn exclusief BTW tenzij anders vermeld.',
    m,
    yPos,
    { maxWidth: contentWidth }
  );
  yPos += 12;

  // ----- Tabel (met zichtbare randen) -----
  checkNewPage(50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  setColor(doc, COLORS.textMain);
  doc.text('Overzicht', m, yPos);
  yPos += 7;

  const colDesc = m + 5;
  const colAmount = pageWidth - m - 5;
  const rowH = LAYOUT.rowHeight;
  setDraw(doc, COLORS.border);
  doc.setLineWidth(0.25);

  setFill(doc, COLORS.tableHeaderBg);
  doc.rect(m, yPos, contentWidth, rowH, 'FD');
  doc.rect(m, yPos, contentWidth, rowH, 'S');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setColor(doc, COLORS.textMain);
  doc.text('Omschrijving', colDesc, yPos + rowH / 2 + 1);
  doc.text('Bedrag (excl. BTW)', colAmount, yPos + rowH / 2 + 1, { align: 'right' });
  yPos += rowH;

  const addRow = (label: string, amount: number, fill: boolean) => {
    checkNewPage(rowH + 2);
    if (fill) setFill(doc, COLORS.tableRowBg);
    doc.rect(m, yPos, contentWidth, rowH, fill ? 'FD' : 'S');
    if (!fill) doc.rect(m, yPos, contentWidth, rowH, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(doc, COLORS.textMain);
    const lines = doc.splitTextToSize(label, contentWidth - 55);
    doc.text(lines[0], colDesc, yPos + rowH / 2 + 1);
    doc.setFont('helvetica', 'bold');
    doc.text(`€ ${amount.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colAmount, yPos + rowH / 2 + 1, { align: 'right' });
    yPos += rowH;
  };

  const pkg = approvedQuote.selectedPackage;
  addRow(pkg.name, pkg.basePrice, true);

  approvedQuote.selectedOptions.forEach((opt) => {
    if (opt.price <= 0) return;
    let label = opt.name;
    if (optionNotes[opt.id]) label += ` – ${optionNotes[opt.id]}`;
    addRow(label, opt.price, false);
  });

  if (extraPages > 0) {
    const opt = scopeOptions.find((o) => o.id === 'extra-pages');
    const price = opt ? opt.price * extraPages : 0;
    if (price > 0) addRow(`Extra pagina's (${extraPages}x)`, price, true);
  }

  if (contentPages > 0) {
    const opt = growthOptions.find((o) => o.id === 'content-creation');
    const price = opt ? opt.price * contentPages : 0;
    if (price > 0) addRow(`Content creatie (${contentPages}x)`, price, true);
  }

  customLineItems.forEach((item) => {
    if (item.price <= 0) return;
    addRow(item.name, item.price, false);
  });

  const subtotalAfterDiscount = quoteTotal / 1.21;
  let discountAmount = 0;
  if (discount?.type === 'percentage') {
    const before = subtotalAfterDiscount / (1 - discount.value / 100);
    discountAmount = before - subtotalAfterDiscount;
  } else if (discount?.type === 'fixed') {
    discountAmount = Math.min(discount.value, subtotalAfterDiscount);
  }
  if (discountAmount > 0) {
    checkNewPage(rowH + 2);
    setFill(doc, [252, 242, 242]);
    setDraw(doc, [220, 200, 200]);
    doc.rect(m, yPos, contentWidth, rowH, 'FD');
    doc.rect(m, yPos, contentWidth, rowH, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(doc, COLORS.textMain);
    const discountLabel = discount!.type === 'percentage' ? `Korting (${discount!.value}%)` : 'Korting (vast bedrag)';
    doc.text(discountLabel, colDesc, yPos + rowH / 2 + 1);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(160, 0, 0);
    doc.text(`-€ ${discountAmount.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colAmount, yPos + rowH / 2 + 1, { align: 'right' });
    setColor(doc, COLORS.textMain);
    yPos += rowH;
  }

  yPos += 10;

  // ----- Totalen -----
  const subtotal = quoteTotal / 1.21;
  const vat = quoteTotal - subtotal;
  const totalBoxH = 36;
  checkNewPage(totalBoxH + 20);

  setFill(doc, COLORS.totalBg);
  setDraw(doc, COLORS.border);
  doc.setLineWidth(0.4);
  doc.rect(m, yPos, contentWidth, totalBoxH, 'FD');
  doc.rect(m, yPos, contentWidth, totalBoxH, 'S');
  yPos += 9;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setColor(doc, COLORS.textMuted);
  doc.text('Subtotaal (excl. BTW)', m + 6, yPos);
  doc.setFont('helvetica', 'bold');
  setColor(doc, COLORS.textMain);
  doc.text(`€ ${subtotal.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colAmount, yPos, { align: 'right' });
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  setColor(doc, COLORS.textMuted);
  doc.text('BTW (21%)', m + 6, yPos);
  doc.setFont('helvetica', 'bold');
  setColor(doc, COLORS.textMain);
  doc.text(`€ ${vat.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colAmount, yPos, { align: 'right' });
  yPos += 8;
  doc.setDrawColor(180, 175, 200);
  doc.setLineWidth(0.3);
  doc.line(m + 6, yPos, pageWidth - m - 6, yPos);
  yPos += 7;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  setColor(doc, COLORS.accent);
  doc.text('Totaal (incl. BTW)', m + 6, yPos);
  doc.setFontSize(13);
  doc.text(`€ ${quoteTotal.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colAmount, yPos, { align: 'right' });
  setColor(doc, COLORS.textMain);
  yPos += 16;

  if (approvedQuote.selectedMaintenance && approvedQuote.selectedMaintenance.price > 0) {
    checkNewPage(18);
    setFill(doc, COLORS.tableHeaderBg);
    setDraw(doc, COLORS.border);
    doc.rect(m, yPos, contentWidth, 12, 'FD');
    doc.rect(m, yPos, contentWidth, 12, 'S');
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.textMain);
    doc.text('Maandelijks onderhoud', m + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`€ ${approvedQuote.selectedMaintenance.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / maand`, colAmount, yPos, { align: 'right' });
    yPos += 12;
  }

  checkNewPage(22);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setColor(doc, COLORS.textMuted);
  doc.text('Deze offerte is 30 dagen geldig. Prijzen zijn exclusief BTW tenzij anders vermeld. Bij akkoord gelden onze algemene voorwaarden (zie volgende pagina\'s).', m, yPos, { maxWidth: contentWidth });

  // ----- Algemene voorwaarden (extra document voor klant) -----
  addAlgemeneVoorwaardenPages(doc, pageWidth, pageHeight, m, contentWidth, () => pageNumber, (n) => { pageNumber = n; }, drawFooter, contentBottom, LAYOUT.lineHeight);
  drawFooter();
  return doc.output('blob') as Blob;
}

/** Tekst voor het klantdocument "Algemene voorwaarden" (zelfde als website). */
const AV_SECTIONS: { title: string; items: string[] }[] = [
  {
    title: '1. Toepassingsgebied en definities',
    items: [
      'Deze algemene voorwaarden zijn van toepassing op alle offertes, overeenkomsten en diensten van Almost 3000 BV, handelend onder de naam Nudge Webdesign (hierna: "de Leverancier"), met de opdrachtgever (hierna: "de Opdrachtgever"). Afwijkingen zijn alleen geldig indien schriftelijk overeengekomen.',
      'Onder "diensten" worden onder meer begrepen: het ontwerpen, ontwikkelen, hosten, onderhouden en beheren van websites, webshops, webapplicaties, SEO, content creatie en alle daarmee verband houdende diensten.',
    ],
  },
  {
    title: '2. Offertes en totstandkoming overeenkomst',
    items: [
      '• Alle offertes zijn vrijblijvend tenzij uitdrukkelijk anders vermeld of een aanvaardingstermijn is gesteld.',
      '• Offertes zijn 30 dagen geldig tenzij anders vermeld.',
      '• De overeenkomst komt tot stand door schriftelijke (waaronder e-mail) aanvaarding van de offerte door de Opdrachtgever, of door het verrichten van werkzaamheden waartoe de Leverancier door de Opdrachtgever is gemandateerd.',
      '• Door opdrachtbevestiging of aanvaarding verklaart de Opdrachtgever deze algemene voorwaarden te hebben gelezen en te aanvaarden.',
    ],
  },
  {
    title: '3. Uitvoering, levering en acceptatie',
    items: [
      '• De Leverancier voert de overeenkomst naar beste inzicht en vermogen uit. Genoemde termijnen zijn indicatief en niet fatale termijnen, tenzij uitdrukkelijk schriftelijk anders overeengekomen.',
      '• De Opdrachtgever verschaft tijdig alle informatie, materiaal en toegang (zoals inloggegevens, content, logo\'s) die voor de uitvoering nodig zijn. Vertraging door het ontbreken daarvan komt niet voor rekening van de Leverancier.',
      '• Levering geschiedt in onderling overleg (o.a. online, via staging-omgeving of overdracht van bestanden). De Opdrachtgever onderzoekt het geleverde binnen 14 dagen op overeenstemming met de overeenkomst. Gebrek aan (tijdige) reactie geldt als stilzwijgende acceptatie.',
      '• Kleine afwijkingen die de bruikbaarheid niet wezenlijk aantasten, geven geen recht op ontbinding of prijsvermindering.',
    ],
  },
  {
    title: '4. Prijzen, betaling en betalingsverzuim',
    items: [
      '• Alle prijzen zijn in euro\'s en exclusief BTW tenzij uitdrukkelijk anders vermeld.',
      '• Facturen zijn binnen 14 dagen na factuurdatum betaalbaar, tenzij anders schriftelijk overeengekomen. Betaling geschiedt door overschrijving op de vermelde rekening.',
      '• Bij betalingsverzuim is de Opdrachtgever van rechtswege in gebreke. Vanaf de vervaldag zijn wettelijke interest verschuldigd. Daarnaast is een forfaitaire vergoeding van 10% van het openstaande bedrag verschuldigd, met een minimum van € 50, zonder voorrecht op het bewijs van hogere schade.',
      '• De Leverancier is gerechtigd voorschotten of tussentijdse facturatie te verlangen. Bij projecten kan een betalingsschema worden overeengekomen.',
      '• Kosten van incasso en gerechtelijke procedures komen voor rekening van de Opdrachtgever bij betalingsverzuim.',
    ],
  },
  {
    title: '5. Intellectueel eigendom en licentie',
    items: [
      '• Alle intellectuele eigendomsrechten op door de Leverancier ontwikkelde of geleverde materialen (inclusief ontwerpen, code, documentatie) berusten bij de Leverancier, tenzij partijen uitdrukkelijk schriftelijk anders overeenkomen.',
      '• Na volledige betaling van alle verschuldigde bedragen verleent de Leverancier de Opdrachtgever een niet-exclusieve, wereldwijde licentie om het specifiek voor de Opdrachtgever gemaakte eindresultaat (website, webshop, applicatie) te gebruiken voor het beoogde doel. Voor open source, frameworks en door derden geleverde onderdelen blijven de respectievelijke licenties van toepassing.',
      '• De Leverancier behoudt het recht om algemene kennis en technieken te gebruiken voor andere opdrachten. Broncode wordt niet standaard overgedragen tenzij schriftelijk overeengekomen.',
      '• Door de Leverancier geleverde content (teksten, afbeeldingen) van derden blijft eigendom van de rechthebbenden; de Opdrachtgever zorgt voor de nodige rechten of licentie.',
    ],
  },
  {
    title: '6. Aansprakelijkheid',
    items: [
      '• De aansprakelijkheid van de Leverancier is beperkt tot het bedrag dat in het betreffende geval door de aansprakelijkheidsverzekering wordt gedekt, en voor zover niet gedekt, tot het bedrag van de facturatie van de opdracht in de afgelopen 12 maanden (excl. BTW), met een maximum van € 5.000 per gebeurtenis.',
      '• De Leverancier is niet aansprakelijk voor indirecte schade, gevolgschade, gederfde winst, gemiste besparingen, schade aan gegevens of reputatieschade.',
      '• De Leverancier is niet aansprakelijk voor schade voortvloeiend uit handelingen of nalatigheden van de Opdrachtgever of derden, of uit het gebruik van door de Opdrachtgever of derden aangeleverde content of software.',
      '• Aansprakelijkheid voor schade als gevolg van veroudering, hacking, DDoS of andere externe invloeden op systemen en netwerken is uitgesloten voor zover de Leverancier redelijke maatregelen heeft getroffen.',
      '• Elke aansprakelijkheid vervalt 12 maanden na het ontstaan van de schade.',
    ],
  },
  {
    title: '7. Overmacht',
    items: [
      'Noch de Leverancier noch de Opdrachtgever is gehouden tot nakoming van enige verplichting indien zij daarin verhinderd worden door overmacht. Onder overmacht wordt mede begrepen: oorlog, natuurrampen, stakingen, overheidsmaatregelen, uitval van netwerken of essentiële derden (hosting, domein, API\'s), en alle overige omstandigheden buiten de redelijke controle van de partij die zich op overmacht beroept.',
      'Bij overmacht kunnen de verplichtingen worden opgeschort. Duurt de overmacht langer dan 90 dagen, dan is elk der partijen gerechtigd de overeenkomst te ontbinden zonder verplichting tot schadevergoeding.',
    ],
  },
  {
    title: '8. Geheimhouding',
    items: [
      'Partijen zijn verplicht tot geheimhouding van alle vertrouwelijke informatie die zij in het kader van de overeenkomst verkrijgen. Deze verplichting blijft bestaan na beëindiging van de overeenkomst. Uitgezonderd is informatie die openbaar is of door de wederpartij schriftelijk vrijgegeven mag worden.',
    ],
  },
  {
    title: '9. Duur, opzegging en ontbinding',
    items: [
      '• Eenmalige projecten eindigen na oplevering en acceptatie (of stilzwijgende acceptatie). Abonnementen (hosting, onderhoud) lopen voor onbepaalde tijd tenzij anders overeengekomen en kunnen worden opgezegd met inachtneming van een opzegtermijn van minimaal 30 dagen voor het einde van een facturatieperiode.',
      '• Ontbinding (ook wegens wanprestatie) geschiedt schriftelijk. Bij ontbinding door de Opdrachtgever zonder dat de Leverancier tekortschiet, is de Leverancier gerechtigd op reeds verrichte werkzaamheden te factureren en eventuele vooruitbetalingen te behouden voor zover redelijk.',
      '• Bij ontbinding door de Leverancier wegens wanprestatie van de Opdrachtgever (waaronder niet-betaling of niet-tijdig aanleveren van materiaal) is de Leverancier gerechtigd tot schadevergoeding over reeds verricht werk en gemaakte kosten.',
    ],
  },
  {
    title: '10. Klachten en geschillen',
    items: [
      '• Klachten over geleverde prestaties moeten binnen 14 dagen na ontdekking schriftelijk worden gemeld. Na deze termijn worden klachten niet in behandeling genomen.',
      '• Op alle overeenkomsten is uitsluitend Belgisch recht van toepassing.',
      '• Geschillen worden voorgelegd aan de bevoegde rechtbank van het gerechtelijk arrondissement waar de Leverancier zijn zetel heeft, tenzij de wet dwingend een andere rechter aanwijst.',
    ],
  },
  {
    title: '11. Overige bepalingen',
    items: [
      '• Indien een bepaling van deze voorwaarden nietig of niet-afdwingbaar is, blijven de overige bepalingen van kracht.',
      '• De Leverancier is gerechtigd deze algemene voorwaarden te wijzigen. De geldende versie is gepubliceerd op de website. Voor lopende overeenkomsten gelden de voorwaarden zoals die op het moment van opdrachtbevestiging golden, tenzij partijen anders overeenkomen.',
    ],
  },
  {
    title: '12. Contact',
    items: [
      'Almost 3000 BV (Nudge Webdesign)',
      'Herkenrodesingel 19C/4.2, 3500 Hasselt, België',
      'E-mail: info@almost3000.be',
      'BTW-nummer: BE 1007.673.513',
    ],
  },
];

function addAlgemeneVoorwaardenPages(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  m: number,
  contentWidth: number,
  getPageNumber: () => number,
  setPageNumber: (n: number) => void,
  drawFooter: () => void,
  contentBottom: () => number,
  lineHeight: number
) {
  doc.addPage();
  setPageNumber(getPageNumber() + 1);
  let yPos = m;

  const checkSpace = (required: number) => {
    if (yPos + required > contentBottom()) {
      drawFooter();
      doc.addPage();
      setPageNumber(getPageNumber() + 1);
      yPos = m;
    }
  };

  setFill(doc, COLORS.accent);
  doc.rect(0, 0, pageWidth, LAYOUT.headerHeight, 'F');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  setColor(doc, COLORS.white);
  doc.text('Algemene voorwaarden', m, 14);
  setColor(doc, COLORS.textMain);
  yPos = LAYOUT.headerHeight + 14;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  setColor(doc, COLORS.textMuted);
  doc.text(`Document behorende bij de offerte. Laatst bijgewerkt: ${new Date().toLocaleDateString('nl-BE', { year: 'numeric', month: 'long', day: 'numeric' })}.`, m, yPos, { maxWidth: contentWidth });
  yPos += 10;

  const lineH = lineHeight + 0.8;
  for (const section of AV_SECTIONS) {
    checkSpace(20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.textMain);
    const titleLines = doc.splitTextToSize(section.title, contentWidth);
    for (const line of titleLines) {
      checkSpace(lineH);
      doc.text(line, m, yPos);
      yPos += lineH;
    }
    yPos += 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const item of section.items) {
      const isBullet = item.startsWith('• ');
      const text = isBullet ? item : item;
      const lines = doc.splitTextToSize(text, contentWidth - (isBullet ? 0 : 0));
      for (const line of lines) {
        checkSpace(lineH);
        doc.text(line, m, yPos);
        yPos += lineH;
      }
    }
    yPos += 6;
  }
}
