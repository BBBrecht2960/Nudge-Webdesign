import { type OfferBuilderState } from './hooks/useOfferBuilder';

export interface QuoteExport {
  quoteId?: string;
  timestamp: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
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
  extraPages: number;
  contentPages: number;
  customLineItems: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  discount: {
    type: 'percentage' | 'fixed' | null;
    value: number;
  };
  paymentSchedule: 'once' | 'twice_25' | 'thrice_33';
  pricing: {
    subtotal: number;
    vat: number;
    total: number;
    discountAmount: number;
  };
}

export function exportQuoteAsJSON(
  state: OfferBuilderState,
  calculations: {
    subtotal: number;
    vat: number;
    total: number;
  },
  lead?: { name?: string; email?: string; phone?: string } | null,
  quoteId?: string
): QuoteExport {
  const exportData: QuoteExport = {
    quoteId,
    timestamp: new Date().toISOString(),
    customerName: lead?.name,
    customerEmail: lead?.email,
    customerPhone: lead?.phone,
    selectedPackage: state.selectedPackage
      ? {
          id: state.selectedPackage.id,
          name: state.selectedPackage.name,
          basePrice: state.selectedPackage.basePrice,
        }
      : null,
    selectedOptions: state.selectedOptions.map((opt) => ({
      id: opt.id,
      name: opt.name,
      price: opt.price,
      customPrice: state.customPrices[opt.id],
      note: state.optionNotes[opt.id],
    })),
    selectedMaintenance: state.selectedMaintenance
      ? {
          id: state.selectedMaintenance.id,
          name: state.selectedMaintenance.name,
          price: state.selectedMaintenance.price,
        }
      : null,
    extraPages: state.extraPages,
    contentPages: state.contentPages,
    customLineItems: state.customLineItems,
    discount: state.discount,
    paymentSchedule: state.paymentSchedule,
    pricing: {
      subtotal: calculations.subtotal,
      vat: calculations.vat,
      total: calculations.total,
      discountAmount: state.discount.type === 'percentage'
        ? (calculations.subtotal * state.discount.value / 100)
        : state.discount.type === 'fixed'
        ? state.discount.value
        : 0,
    },
  };

  return exportData;
}

export function downloadQuoteAsJSON(exportData: QuoteExport, filename?: string) {
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `offerte-${exportData.timestamp.split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
