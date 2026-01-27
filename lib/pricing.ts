// Pricing configuration for quote builder

export interface PricingOption {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: 'website' | 'webshop' | 'webapp' | 'scope' | 'complexity' | 'growth' | 'maintenance';
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
    basePrice: 300,
    description: 'Perfect voor starters of een eenvoudige online aanwezigheid.',
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
    id: 'standard-business',
    name: 'Standard Business',
    basePrice: 500,
    description: 'Ideaal voor KMO\'s die een professionele site met meerdere pagina\'s nodig hebben.',
    category: 'website',
    features: [
      '5–10 pagina\'s (Home, Over ons, Diensten, Contact, …)',
      'Responsive design',
      'Contactformulier + Google Maps',
      'SEO-optimalisatie',
      'Blog mogelijkheid',
      'Social media integratie',
      '1 maand gratis onderhoud',
    ],
  },
  {
    id: 'extended-kmo',
    name: 'Extended KMO',
    basePrice: 3000,
    description: 'Uitgebreide site voor grotere KMO\'s met specifieke wensen en integraties.',
    category: 'website',
    features: [
      'Onbeperkt pagina\'s',
      'Custom design op maat',
      'Meerdere formulieren',
      'Geavanceerde SEO',
      'Blog met categorieën',
      'Integraties (CRM, boekingssysteem, AI)',
      'Multi-language (NL/FR/EN)',
      '2 maanden gratis onderhoud',
    ],
  },
  {
    id: 'basic-webshop',
    name: 'Basic Webshop',
    basePrice: 2000,
    description: 'Eenvoudige webshop voor kleine tot middelgrote assortimenten.',
    category: 'webshop',
    features: [
      'Tot 50 producten',
      'Betalingsintegratie',
      'Verzendopties',
      'Productcategorieën',
    ],
  },
  {
    id: 'standard-webshop',
    name: 'Standard Webshop',
    basePrice: 5000,
    description: 'Professionele webshop met geavanceerde functionaliteiten.',
    category: 'webshop',
    features: [
      'Onbeperkt producten',
      'Geavanceerde filters',
      'Klantaccounts',
      'Bestelhistorie',
    ],
  },
  {
    id: 'enterprise-webshop',
    name: 'Enterprise Webshop',
    basePrice: 10000,
    description: 'Volledig custom webshop voor grote bedrijven.',
    category: 'webshop',
    features: [
      'Custom features',
      'Multi-channel',
      'Geavanceerde logistiek',
      'Volledige customisatie',
    ],
  },
  {
    id: 'webapp',
    name: 'Custom Webapp',
    basePrice: 5000,
    description: 'Op maat gebouwde applicaties voor specifieke bedrijfsprocessen.',
    category: 'webapp',
    features: [
      'Custom functionaliteiten',
      'API- en AI-integraties',
      'Database oplossingen',
      'Automatisering',
      'Schaalbaarheid',
    ],
  },
];

export const scopeOptions: PricingOption[] = [
  {
    id: 'extra-pages',
    name: 'Extra pagina\'s',
    price: 100, // Gemiddelde tussen €50-€150
    description: 'Per extra pagina: nieuwe pagina\'s toevoegen aan je website (bijv. Portfolio, Team, FAQ, Cases) met standaard layout en content plaatsing',
    category: 'scope',
  },
  {
    id: 'blog-module',
    name: 'Blog module',
    price: 350, // Gemiddelde tussen €200-€500
    description: 'Volledige blog functionaliteit met categorieën: blog systeem met editor, categorieën, tags, zoekfunctie, en RSS feed voor regelmatig content publiceren',
    category: 'scope',
  },
  {
    id: 'multi-language',
    name: 'Multi-language (NL/FR/EN)',
    price: 1000, // Gemiddelde tussen €500-€1.500
    description: 'Meertalige website ondersteuning: website beschikbaar in meerdere talen (Nederlands, Frans, Engels) met taalwisselaar en vertaalde content',
    category: 'scope',
  },
  {
    id: 'custom-integrations',
    name: 'Custom integraties',
    price: 0, // Op offerte
    description: 'Op offerte - afhankelijk van complexiteit: koppelingen met externe systemen zoals CRM, boekhoudsoftware, API\'s, of andere custom functionaliteiten',
    category: 'scope',
  },
];

export const complexityOptions: PricingOption[] = [
  {
    id: 'e-commerce',
    name: 'E-commerce functionaliteit',
    price: 2000,
    description: 'Vanaf €2.000 - Winkelwagen, checkout, betalingsintegratie, productbeheer, voorraadbeheer, en orderbeheer voor online verkoop',
    category: 'complexity',
  },
  {
    id: 'booking-system',
    name: 'Boekingssysteem',
    price: 1250, // Gemiddelde tussen €500-€2.000
    description: 'Online boekingssysteem: klanten kunnen afspraken of reserveringen maken, kalender integratie, bevestigingsemails, en beschikbaarheidsbeheer',
    category: 'complexity',
  },
  {
    id: 'crm-integration',
    name: 'CRM-integratie',
    price: 650, // Gemiddelde tussen €300-€1.000
    description: 'Integratie met CRM systeem: automatische synchronisatie van leads, contacten en data tussen website en CRM (bijv. HubSpot, Salesforce)',
    category: 'complexity',
  },
  {
    id: 'ai-integrations',
    name: 'AI-integraties',
    price: 0, // Op offerte
    description: 'Op offerte - afhankelijk van type integratie: AI chatbots, automatische content generatie, personalisatie, of andere AI-functionaliteiten',
    category: 'complexity',
  },
  {
    id: 'member-portal',
    name: 'Ledenportaal',
    price: 2000, // Gemiddelde tussen €1.000–€3.000
    description: 'Ledenportaal met login en profielen: beveiligde ledenomgeving met gebruikersaccounts, profielen, en exclusieve content voor ingelogde gebruikers',
    category: 'complexity',
  },
  {
    id: 'custom-apis',
    name: 'Custom API\'s',
    price: 0, // Op offerte
    description: 'Op offerte - afhankelijk van complexiteit: custom API ontwikkeling voor data uitwisseling, integraties met externe systemen, of mobiele app koppelingen',
    category: 'complexity',
  },
];

export const growthOptions: PricingOption[] = [
  {
    id: 'seo-package',
    name: 'SEO-pakket (eenmalig)',
    price: 1250, // Gemiddelde tussen €500-€2.000
    description: 'Eenmalige SEO-optimalisatie: meta tags, sitemap, structured data, en technische SEO-verbeteringen voor betere zoekresultaten',
    category: 'growth',
  },
  {
    id: 'content-creation',
    name: 'Content creatie',
    price: 125, // Gemiddelde tussen €50-€200
    description: 'Professionele tekst schrijven per pagina (bijv. Over ons, Diensten, Blog posts, Productbeschrijvingen)',
    category: 'growth',
  },
  {
    id: 'social-media-setup',
    name: 'Social media setup',
    price: 350, // Gemiddelde tussen €200-€500
    description: 'Setup en integratie social media: koppeling met Facebook, Instagram, LinkedIn, en automatische sharing van nieuwe content',
    category: 'growth',
  },
  {
    id: 'google-ads-setup',
    name: 'Google Ads setup',
    price: 550, // Gemiddelde tussen €300-€800
    description: 'Google Ads account setup en configuratie: campagne opzetten, keywords onderzoek, advertenties maken en conversie tracking instellen',
    category: 'growth',
  },
  {
    id: 'analytics-reporting',
    name: 'Analytics & rapportage',
    price: 350, // Gemiddelde tussen €200-€500
    description: 'Analytics setup en maandelijkse rapportage: Google Analytics configureren, doelen instellen, en maandelijks overzicht van prestaties',
    category: 'growth',
  },
];

export const maintenanceOptions: PricingOption[] = [
  {
    id: 'maintenance-starter',
    name: 'Onderhoud Starter',
    price: 19.99,
    description: '€19,99/maand - Maandelijkse updates (plugins, themes, core), automatische backups, basis beveiliging (SSL, firewall), en email support',
    category: 'maintenance',
  },
  {
    id: 'maintenance-business',
    name: 'Onderhoud Business',
    price: 49.99,
    description: '€49,99/maand - Wekelijkse updates, real-time backups, geavanceerde beveiliging, prioriteit support (binnen 24u), en uptime monitoring',
    category: 'maintenance',
  },
  {
    id: 'maintenance-growth',
    name: 'Onderhoud Growth',
    price: 99.99,
    description: '€99,99/maand - Dagelijkse updates, onbeperkte backups, premium beveiliging, telefonische support (binnen 4u), performance optimalisatie, en maandelijkse rapportage',
    category: 'maintenance',
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
