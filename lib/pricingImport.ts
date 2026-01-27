// Pricing import/export functionality for easy updates

import { type PricingPackage, type PricingOption, packages, scopeOptions, complexityOptions, growthOptions, maintenanceOptions } from './pricing';

export interface PricingData {
  packages: PricingPackage[];
  scopeOptions: PricingOption[];
  complexityOptions: PricingOption[];
  growthOptions: PricingOption[];
  maintenanceOptions: PricingOption[];
}

export function exportPricingToJSON(): string {
  const data: PricingData = {
    packages,
    scopeOptions,
    complexityOptions,
    growthOptions,
    maintenanceOptions,
  };
  return JSON.stringify(data, null, 2);
}

export function importPricingFromJSON(jsonString: string): PricingData {
  try {
    const data = JSON.parse(jsonString) as PricingData;
    // Validate structure
    if (!data.packages || !Array.isArray(data.packages)) {
      throw new Error('Invalid pricing data: packages missing or not an array');
    }
    if (!data.scopeOptions || !Array.isArray(data.scopeOptions)) {
      throw new Error('Invalid pricing data: scopeOptions missing or not an array');
    }
    if (!data.complexityOptions || !Array.isArray(data.complexityOptions)) {
      throw new Error('Invalid pricing data: complexityOptions missing or not an array');
    }
    if (!data.growthOptions || !Array.isArray(data.growthOptions)) {
      throw new Error('Invalid pricing data: growthOptions missing or not an array');
    }
    if (!data.maintenanceOptions || !Array.isArray(data.maintenanceOptions)) {
      throw new Error('Invalid pricing data: maintenanceOptions missing or not an array');
    }
    return data;
  } catch (error) {
    throw new Error(`Failed to parse pricing JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function downloadPricingJSON() {
  const jsonString = exportPricingToJSON();
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pricing-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
