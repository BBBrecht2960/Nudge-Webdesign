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
    if (option.price > 0) {
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
