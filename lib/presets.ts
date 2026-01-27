import { type PricingPackage, packages, scopeOptions, complexityOptions, growthOptions } from './pricing';

export interface QuotePreset {
  id: string;
  name: string;
  description: string;
  packageId: string;
  optionIds: string[];
}

export const presets: QuotePreset[] = [
  {
    id: 'starter-seo',
    name: 'Starter + SEO',
    description: 'Mini Website met SEO-pakket',
    packageId: 'mini-website',
    optionIds: ['seo-package'],
  },
  {
    id: 'kmo-blog-crm',
    name: 'KMO + Blog + CRM',
    description: 'Standard Business met blog module en CRM-integratie',
    packageId: 'standard-business',
    optionIds: ['blog-module', 'crm-integration'],
  },
  {
    id: 'kmo-complete',
    name: 'KMO Complete',
    description: 'Standard Business met blog, SEO en social media',
    packageId: 'standard-business',
    optionIds: ['blog-module', 'seo-package', 'social-media-setup'],
  },
  {
    id: 'extended-seo-content',
    name: 'Extended + SEO + Content',
    description: 'Extended KMO met SEO-pakket en content creatie',
    packageId: 'extended-kmo',
    optionIds: ['seo-package', 'content-creation'],
  },
  {
    id: 'webshop-basic',
    name: 'Webshop Basic',
    description: 'Basic Webshop met SEO en analytics',
    packageId: 'basic-webshop',
    optionIds: ['seo-package', 'analytics-reporting'],
  },
];

export function applyPreset(
  preset: QuotePreset,
  setPackage: (pkg: PricingPackage | null) => void,
  toggleOption: (optionId: string) => void
) {
  // Set package
  const pkg = packages.find((p) => p.id === preset.packageId);
  if (pkg) {
    setPackage(pkg);
  }

  // Apply options
  const allOptions = [...scopeOptions, ...complexityOptions, ...growthOptions];
  preset.optionIds.forEach((optionId) => {
    const option = allOptions.find((opt) => opt.id === optionId);
    if (option) {
      // Check if already selected, if not toggle it
      // Note: This assumes toggleOption handles selection state
      toggleOption(optionId);
    }
  });
}
