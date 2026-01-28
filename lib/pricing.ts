// Pricing configuration for quote builder
// Updated with optimized pricing structure for VibeCoding and Massa

export interface PricingOption {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: 'website' | 'webshop' | 'webapp' | 'scope' | 'complexity' | 'growth' | 'maintenance';
  isRecurring?: boolean; // true if this is a monthly/recurring service
}

export interface PricingPackage {
  id: string;
  name: string;
  basePrice: number;
  description: string;
  category: 'website' | 'webshop' | 'webapp';
  features: string[];
}

export const packages: PricingPackage[] = [
  {
    id: 'mini-website',
    name: 'Mini Website',
    basePrice: 399,
    description: 'Onepager – supersnel leverbaar, ideaal voor starters.',
    category: 'website',
    features: [
      '1 pagina met essentiële info',
      'Responsive (mobiel & desktop)',
      'Contactformulier',
      'Basis SEO',
      'SSL-certificaat',
      '1 maand gratis onderhoud',
    ],
  },
  {
    id: 'standard-website',
    name: 'Standard Website',
    basePrice: 699,
    description: '4–6 pagina\'s, standaard structuur, veelgevraagd.',
    category: 'website',
    features: [
      '4-6 pagina\'s (Home, Over ons, Diensten, Contact, …)',
      'Responsive design',
      'Contactformulier + Google Maps',
      'SEO-optimalisatie',
      'Blog mogelijkheid',
      'Social media integratie',
      '1 maand gratis onderhoud',
    ],
  },
  {
    id: 'extended-website',
    name: 'Extended Website',
    basePrice: 2499,
    description: 'Op maat voor KMO\'s, multi-language, CRM, blog inbegrepen.',
    category: 'website',
    features: [
      'Onbeperkt pagina\'s',
      'Custom design op maat',
      'Meerdere formulieren',
      'Geavanceerde SEO',
      'Blog met categorieën',
      'Multi-language (NL/FR/EN)',
      'CRM-integratie',
      '2 maanden gratis onderhoud',
    ],
  },
  {
    id: 'basic-webshop',
    name: 'Basic Webshop',
    basePrice: 1499,
    description: 'Tot 50 producten, Mollie, WooCommerce/Shopify Light.',
    category: 'webshop',
    features: [
      'Tot 50 producten',
      'Betalingsintegratie (Mollie)',
      'Verzendopties',
      'Productcategorieën',
      'Basis productbeheer',
    ],
  },
  {
    id: 'pro-webshop',
    name: 'Pro Webshop',
    basePrice: 3499,
    description: 'Onbeperkt producten, filters, accounts, meertaligheid.',
    category: 'webshop',
    features: [
      'Onbeperkt producten',
      'Geavanceerde filters',
      'Klantaccounts',
      'Bestelhistorie',
      'Multi-language',
      'Geavanceerde logistiek',
    ],
  },
  {
    id: 'enterprise-webshop',
    name: 'Enterprise Webshop',
    basePrice: 6999,
    description: 'Custom features, schaalbaar, koppelingen, logistiek.',
    category: 'webshop',
    features: [
      'Custom features',
      'Multi-channel',
      'Geavanceerde logistiek',
      'Volledige customisatie',
      'Schaalbaarheid',
      'API-koppelingen',
    ],
  },
  {
    id: 'webapp',
    name: 'Webapp op maat',
    basePrice: 4999,
    description: 'Enkel via intake – AI, CRM, API-integratie, dashboarding.',
    category: 'webapp',
    features: [
      'Custom functionaliteiten',
      'API- en AI-integraties',
      'Database oplossingen',
      'Automatisering',
      'Schaalbaarheid',
      'Dashboarding',
    ],
  },
];

export const scopeOptions: PricingOption[] = [
  {
    id: 'extra-pages',
    name: 'Extra pagina\'s',
    price: 125,
    description: 'Per extra pagina: nieuwe pagina\'s toevoegen aan je website met herbruikbare blokken',
    category: 'scope',
  },
  {
    id: 'blog-module',
    name: 'Blog module',
    price: 399,
    description: 'Volledige blog functionaliteit met categorieën: blog systeem met editor, categorieën, tags, zoekfunctie, en RSS feed',
    category: 'scope',
  },
  {
    id: 'multi-language',
    name: 'Multi-language (NL/FR/EN)',
    price: 299,
    description: 'Meertalige website ondersteuning: website beschikbaar in meerdere talen (Nederlands, Frans, Engels) met taalwisselaar',
    category: 'scope',
  },
];

export const complexityOptions: PricingOption[] = [
  {
    id: 'crm-integration',
    name: 'CRM-integratie',
    price: 749,
    description: 'Integratie met CRM systeem: automatische synchronisatie van leads, contacten en data tussen website en CRM (bijv. HubSpot, Salesforce)',
    category: 'complexity',
  },
  {
    id: 'member-portal',
    name: 'Ledenportaal',
    price: 499,
    description: 'Ledenportaal met login en profielen: beveiligde ledenomgeving met gebruikersaccounts, profielen, en exclusieve content voor ingelogde gebruikers',
    category: 'complexity',
  },
  {
    id: 'booking-system',
    name: 'Boekingssysteem',
    price: 599,
    description: 'Online boekingssysteem: klanten kunnen afspraken of reserveringen maken, kalender integratie, bevestigingsemails, en beschikbaarheidsbeheer',
    category: 'complexity',
  },
  {
    id: 'ai-integrations',
    name: 'AI-module (chat of content)',
    price: 0, // Op offerte - vanaf €1.250
    description: 'Op offerte - afhankelijk van type integratie: AI chatbots, automatische content generatie, personalisatie, of andere AI-functionaliteiten',
    category: 'complexity',
  },
  {
    id: 'custom-integrations',
    name: 'Custom integraties',
    price: 0, // Op offerte
    description: 'Op offerte - afhankelijk van complexiteit: koppelingen met externe systemen zoals CRM, boekhoudsoftware, API\'s, of andere custom functionaliteiten',
    category: 'complexity',
  },
];

export const growthOptions: PricingOption[] = [
  {
    id: 'seo-package',
    name: 'SEO-pakket (eenmalig)',
    price: 1250,
    description: 'Eenmalige SEO-optimalisatie: zoekwoordanalyse, content, meta tags, sitemap, structured data, en technische SEO-verbeteringen',
    category: 'growth',
  },
  {
    id: 'content-creation',
    name: 'Content creatie',
    price: 125, // Per pagina
    description: 'Professionele tekst schrijven per pagina (bijv. Over ons, Diensten, Blog posts, Productbeschrijvingen)',
    category: 'growth',
  },
  {
    id: 'social-media-setup',
    name: 'Social media setup',
    price: 350,
    description: 'Setup en integratie social media: koppeling met Facebook, Instagram, LinkedIn, en automatische sharing van nieuwe content',
    category: 'growth',
  },
  {
    id: 'google-ads-setup',
    name: 'Google Ads setup',
    price: 550,
    description: 'Google Ads account setup en configuratie: campagne opzetten, keywords onderzoek, advertenties maken en conversie tracking instellen',
    category: 'growth',
  },
];

export const maintenanceOptions: PricingOption[] = [
  {
    id: 'maintenance-starter',
    name: 'Onderhoud Starter',
    price: 24.99,
    description: '€24,99/maand - Maandelijkse updates (plugins, themes, core), automatische backups, basis beveiliging (SSL, firewall), en email support',
    category: 'maintenance',
  },
  {
    id: 'maintenance-business',
    name: 'Onderhoud Business',
    price: 59.99,
    description: '€59,99/maand - Wekelijkse updates, real-time backups, geavanceerde beveiliging, prioriteit support (binnen 24u), en uptime monitoring',
    category: 'maintenance',
  },
  {
    id: 'maintenance-growth',
    name: 'Onderhoud Growth',
    price: 119,
    description: '€119/maand - Dagelijkse updates, onbeperkte backups, premium beveiliging, telefonische support (binnen 4u), performance optimalisatie, en maandelijkse rapportage',
    category: 'maintenance',
  },
  {
    id: 'analytics-reporting',
    name: 'Analytics & rapportage (maandelijks)',
    price: 350,
    description: 'Analytics setup en maandelijkse rapportage: Google Analytics configureren, doelen instellen, en maandelijks overzicht van prestaties',
    category: 'maintenance',
    isRecurring: true,
  },
];

/**
 * Feature groups: binnen elke groep supersedeert de latere de eerdere.
 * Bij weergave tonen we alleen de hoogste (laatste) van elke groep, geen dubbels.
 */
const FEATURE_GROUPS: string[][] = [
  // Pagina's: 1 pagina → 4-6 → onbeperkt
  [
    '1 pagina met essentiële info',
    '4-6 pagina\'s (Home, Over ons, Diensten, Contact, …)',
    'Onbeperkt pagina\'s',
  ],
  // Responsive
  ['Responsive (mobiel & desktop)', 'Responsive design'],
  // Formulieren
  ['Contactformulier', 'Contactformulier + Google Maps', 'Meerdere formulieren'],
  // SEO
  ['Basis SEO', 'SEO-optimalisatie', 'Geavanceerde SEO'],
  // Blog
  ['Blog mogelijkheid', 'Blog met categorieën'],
  // Onderhoud
  ['1 maand gratis onderhoud', '2 maanden gratis onderhoud'],
  // Webshop: producten
  ['Tot 50 producten', 'Onbeperkt producten'],
  // Webshop: logistiek (Basic heeft geen "Geavanceerde logistiek", Pro en Enterprise wel – zelfde term)
  ['Geavanceerde logistiek'],
];

/**
 * Webshop → website van dezelfde maat: Basic = Mini, Pro = Standard, Enterprise = Extended.
 * Een webshop bevat altijd de features van het bijbehorende website-pakket.
 */
const WEBSHOP_TO_WEBSITE: Record<string, string> = {
  'basic-webshop': 'mini-website',
  'pro-webshop': 'standard-website',
  'enterprise-webshop': 'extended-website',
};

/** Cumulative features van het bijbehorende website-pakket (alleen voor webshops). */
function getWebsiteFeaturesForWebshop(webshopPkg: PricingPackage): string[] {
  const websiteId = WEBSHOP_TO_WEBSITE[webshopPkg.id];
  if (!websiteId) return [];
  const websitePkg = packages.find((p) => p.id === websiteId);
  if (!websitePkg) return [];
  return getCumulativeFeaturesForCategory(websitePkg);
}

/** Extended Website-pakket: gebruikt als basis voor Webapp op maat (zelfde top-tier inhoud). */
const EXTENDED_WEBSITE_ID = 'extended-website';

/** Cumulative features van Extended Website (voor Webapp op maat: juiste inhoud van het begin). */
function getExtendedWebsiteFeatures(): string[] {
  const websitePkg = packages.find((p) => p.id === EXTENDED_WEBSITE_ID);
  if (!websitePkg) return [];
  return getCumulativeFeaturesForCategory(websitePkg);
}

/**
 * Cumulative features binnen de eigen category (zonder website-features voor webshops).
 * Gebruikt intern om recursie te vermijden.
 */
function getCumulativeFeaturesForCategory(pkg: PricingPackage): string[] {
  const sameCategory = packages
    .filter((p) => p.category === pkg.category)
    .sort((a, b) => a.basePrice - b.basePrice);
  const cheaper = sameCategory.filter((p) => p.basePrice < pkg.basePrice);
  const allFeatures = [
    ...cheaper.flatMap((p) => p.features),
    ...pkg.features,
  ].map((f) => f.trim());
  const seen = new Set<string>();
  return allFeatures.filter((f) => {
    if (seen.has(f)) return false;
    seen.add(f);
    return true;
  });
}

/**
 * Returns cumulative features for a package: all features from cheaper packages
 * in the same category + this package's features, with no duplicates (exact string).
 * Voor webshops: ook de features van het website-pakket van dezelfde maat (Basic=Mini, Pro=Standard, Enterprise=Extended).
 * Voor webapp: ook de features van Extended Website, zodat de juiste inhoud van het begin staat.
 */
export function getCumulativeFeatures(pkg: PricingPackage): string[] {
  const categoryFeatures = getCumulativeFeaturesForCategory(pkg);
  if (pkg.category === 'webshop') {
    const websiteFeatures = getWebsiteFeaturesForWebshop(pkg);
    const combined = [...websiteFeatures, ...categoryFeatures].map((f) => f.trim());
    const seen = new Set<string>();
    return combined.filter((f) => {
      if (seen.has(f)) return false;
      seen.add(f);
      return true;
    });
  }
  if (pkg.category === 'webapp') {
    const websiteFeatures = getExtendedWebsiteFeatures();
    const combined = [...websiteFeatures, ...categoryFeatures].map((f) => f.trim());
    const seen = new Set<string>();
    return combined.filter((f) => {
      if (seen.has(f)) return false;
      seen.add(f);
      return true;
    });
  }
  return categoryFeatures;
}

/**
 * Returns features for display: cumulative list with superseded items removed.
 * Binnen elke FEATURE_GROUPS wordt alleen de hoogste (laatste) getoond, geen conceptuele dubbels.
 */
export function getDisplayFeatures(pkg: PricingPackage): string[] {
  const cumulative = getCumulativeFeatures(pkg);
  const toRemove = new Set<string>();
  for (const group of FEATURE_GROUPS) {
    const normalizedGroup = group.map((f) => f.trim());
    const inList = normalizedGroup.filter((g) =>
      cumulative.some((c) => c.trim() === g)
    );
    if (inList.length <= 1) continue;
    for (let i = 0; i < inList.length - 1; i++) {
      toRemove.add(inList[i]);
    }
  }
  return cumulative.filter((f) => !toRemove.has(f.trim()));
}

/**
 * Mapping: pakketfeature (exacte string) → optienaam in de offerte-bouwer.
 * Gebruikt wanneer de featuretekst niet exact overeenkomt met de optienaam.
 */
const FEATURE_TO_OPTION_NAME: { feature: string; optionName: string }[] = [
  { feature: 'Blog met categorieën', optionName: 'Blog module' },
  { feature: 'Blog mogelijkheid', optionName: 'Blog module' },
  { feature: 'Social media integratie', optionName: 'Social media setup' },
  { feature: 'SEO-optimalisatie', optionName: 'SEO-pakket (eenmalig)' },
  { feature: 'Geavanceerde SEO', optionName: 'SEO-pakket (eenmalig)' },
  { feature: 'Basis SEO', optionName: 'SEO-pakket (eenmalig)' },
  { feature: 'Multi-language', optionName: 'Multi-language (NL/FR/EN)' },
];

/** Set van optienamen die bij een pakket horen (exacte match + mapping). */
function getIncludedOptionNames(pkg: PricingPackage): Set<string> {
  const features = getCumulativeFeatures(pkg).map((f) => f.trim());
  const names = new Set<string>(features);
  for (const { feature, optionName } of FEATURE_TO_OPTION_NAME) {
    if (features.includes(feature.trim())) {
      names.add(optionName.trim());
    }
  }
  return names;
}

/** All selectable options (scope + complexity + growth + maintenance) for matching package features */
export function getAllSelectableOptions(): PricingOption[] {
  return [
    ...scopeOptions,
    ...complexityOptions,
    ...growthOptions,
    ...maintenanceOptions,
  ];
}

/**
 * Returns options that match this package's cumulative features (exact name + feature→option mapping).
 * Used to auto-select package content in the quote builder; these options are not charged extra.
 */
export function getOptionsForPackage(pkg: PricingPackage): PricingOption[] {
  const all = getAllSelectableOptions();
  const includedNames = getIncludedOptionNames(pkg);
  return all.filter((opt) => includedNames.has(opt.name.trim()));
}

/** Whether this option is included in the selected package (no extra charge) */
export function isOptionIncludedInPackage(
  option: PricingOption,
  pkg: PricingPackage | null
): boolean {
  if (!pkg) return false;
  const includedNames = getIncludedOptionNames(pkg);
  return includedNames.has(option.name.trim());
}

export function calculateTotal(
  selectedPackage: PricingPackage | null,
  selectedOptions: PricingOption[],
  maintenanceOption: PricingOption | null
): number {
  let total = 0;

  if (selectedPackage) {
    total += selectedPackage.basePrice;
  }

  selectedOptions.forEach((option) => {
    if (option.price > 0 && !isOptionIncludedInPackage(option, selectedPackage)) {
      total += option.price;
    }
  });

  // Maintenance is monthly, but we show it as one-time for the quote
  // In practice, you'd show it separately
  if (maintenanceOption) {
    // For quote purposes, show first month or annual
    // You might want to adjust this
  }

  return total;
}
