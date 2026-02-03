import { useState, useCallback, useMemo } from 'react';
import type { PricingPackage, PricingOption } from '@/lib/pricing';

const EXTRA_PAGES_PRICE = 125;
const CONTENT_PAGE_PRICE = 125;

/** Alleen deze kortingspercentages zijn toegestaan (max 15%). */
export const ALLOWED_DISCOUNT_PERCENTAGES = [5, 10, 15] as const;

/** Betalingsschema: wanneer betaald de klant. */
export type PaymentSchedule = 'once' | 'twice_25' | 'thrice_33';

export const PAYMENT_SCHEDULE_OPTIONS: { value: PaymentSchedule; label: string }[] = [
  { value: 'once', label: 'In 1 keer op voorhand' },
  { value: 'twice_25', label: 'In 2 keer: 25% voorschot aan begin, 75% bij aflevering' },
  { value: 'thrice_33', label: 'In 3 keer: 33% begin, 33% midden, 33% bij aflevering' },
];

function normalizeDiscountPercentage(value: number): number {
  if (value <= 0) return 0;
  const capped = Math.min(value, 15);
  const allowed = [...ALLOWED_DISCOUNT_PERCENTAGES];
  const nearest = allowed.reduce((prev, curr) =>
    Math.abs(curr - capped) < Math.abs(prev - capped) ? curr : prev
  );
  return nearest;
}

export interface CustomLineItem {
  id: string;
  name: string;
  price: number;
}

export interface OfferBuilderState {
  selectedPackage: PricingPackage | null;
  selectedOptions: PricingOption[];
  customPrices: Record<string, number>;
  optionNotes: Record<string, string>;
  selectedMaintenance: PricingOption | null;
  extraPages: number;
  contentPages: number;
  customLineItems: CustomLineItem[];
  discount: {
    type: 'percentage' | 'fixed' | null;
    value: number;
  };
  paymentSchedule: PaymentSchedule;
  scopeDescription: string; // Detailed scope description
  timeline: string; // Project timeline/duration
}

export interface OfferBuilderActions {
  setSelectedPackage: (pkg: PricingPackage | null) => void;
  toggleOption: (option: PricingOption) => void;
  setCustomPrice: (optionId: string, price: number) => void;
  setOptionNote: (optionId: string, note: string) => void;
  setSelectedMaintenance: (maintenance: PricingOption | null) => void;
  setExtraPages: (count: number) => void;
  setContentPages: (count: number) => void;
  addCustomLineItem: (name: string, price: number) => void;
  removeCustomLineItem: (id: string) => void;
  updateCustomLineItem: (id: string, name: string, price: number) => void;
  setDiscount: (type: 'percentage' | 'fixed' | null, value: number) => void;
  setPaymentSchedule: (schedule: PaymentSchedule) => void;
  setScopeDescription: (description: string) => void;
  setTimeline: (timeline: string) => void;
  reset: () => void;
  loadState: (state: Partial<OfferBuilderState>) => void;
}

const initialState: OfferBuilderState = {
  selectedPackage: null,
  selectedOptions: [],
  customPrices: {},
  optionNotes: {},
  selectedMaintenance: null,
  extraPages: 0,
  contentPages: 0,
  customLineItems: [],
  discount: {
    type: null,
    value: 0,
  },
  paymentSchedule: 'once',
  scopeDescription: '',
  timeline: '',
};

export function useOfferBuilder() {
  const [state, setState] = useState<OfferBuilderState>(initialState);

  const setSelectedPackage = useCallback((pkg: PricingPackage | null) => {
    setState((prev) => ({
      ...prev,
      selectedPackage: pkg,
      selectedOptions: [],
    }));
  }, []);

  const toggleOption = useCallback((option: PricingOption) => {
    setState((prev) => {
      const isSelected = prev.selectedOptions.some((opt) => opt.id === option.id);
      let newOptions: PricingOption[];
      const newCustomPrices = { ...prev.customPrices };
      const newOptionNotes = { ...prev.optionNotes };

      if (isSelected) {
        newOptions = prev.selectedOptions.filter((opt) => opt.id !== option.id);
        delete newCustomPrices[option.id];
        delete newOptionNotes[option.id];
      } else {
        newOptions = [...prev.selectedOptions, option];
        // If option has price 0, initialize custom price as 0
        if (option.price === 0) {
          newCustomPrices[option.id] = 0;
        }
      }

      return {
        ...prev,
        selectedOptions: newOptions,
        customPrices: newCustomPrices,
        optionNotes: newOptionNotes,
      };
    });
  }, []);

  const setCustomPrice = useCallback((optionId: string, price: number) => {
    setState((prev) => ({
      ...prev,
      customPrices: { ...prev.customPrices, [optionId]: price },
    }));
  }, []);

  const setOptionNote = useCallback((optionId: string, note: string) => {
    setState((prev) => ({
      ...prev,
      optionNotes: { ...prev.optionNotes, [optionId]: note },
    }));
  }, []);

  const setSelectedMaintenance = useCallback((maintenance: PricingOption | null) => {
    setState((prev) => ({ ...prev, selectedMaintenance: maintenance }));
  }, []);

  const setExtraPages = useCallback((count: number) => {
    setState((prev) => ({ ...prev, extraPages: Math.max(0, count) }));
  }, []);

  const setContentPages = useCallback((count: number) => {
    setState((prev) => ({ ...prev, contentPages: Math.max(0, count) }));
  }, []);

  const addCustomLineItem = useCallback((name: string, price: number) => {
    setState((prev) => ({
      ...prev,
      customLineItems: [
        ...prev.customLineItems,
        {
          id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          price,
        },
      ],
    }));
  }, []);

  const removeCustomLineItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      customLineItems: prev.customLineItems.filter((item) => item.id !== id),
    }));
  }, []);

  const updateCustomLineItem = useCallback((id: string, name: string, price: number) => {
    setState((prev) => ({
      ...prev,
      customLineItems: prev.customLineItems.map((item) =>
        item.id === id ? { ...item, name, price } : item
      ),
    }));
  }, []);

  const setDiscount = useCallback((type: 'percentage' | 'fixed' | null, value: number) => {
    setState((prev) => {
      let finalType = type;
      let finalValue = Math.max(0, value);
      if (type === 'percentage') {
        finalValue = normalizeDiscountPercentage(value);
        if (finalValue === 0) finalType = null;
      }
      return { ...prev, discount: { type: finalType, value: finalValue } };
    });
  }, []);

  const setPaymentSchedule = useCallback((paymentSchedule: PaymentSchedule) => {
    setState((prev) => ({ ...prev, paymentSchedule }));
  }, []);

  const setScopeDescription = useCallback((description: string) => {
    setState((prev) => ({
      ...prev,
      scopeDescription: description,
    }));
  }, []);

  const setTimeline = useCallback((timeline: string) => {
    setState((prev) => ({
      ...prev,
      timeline: timeline,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const loadState = useCallback((newState: Partial<OfferBuilderState>) => {
    setState((prev) => {
      const merged = { ...prev, ...newState };
      if (merged.discount?.type === 'percentage' && merged.discount.value != null) {
        const normalized = normalizeDiscountPercentage(merged.discount.value);
        merged.discount = normalized > 0
          ? { type: 'percentage', value: normalized }
          : { type: null, value: 0 };
      }
      return merged;
    });
  }, []);

  // Één duidelijke berekening: pakket + add-ons (geen dubbels), onderhoud, extra regels. Alles afronden op 2 decimalen.
  const subtotalBeforeDiscount = useMemo(() => {
    let sum = 0;
    if (state.selectedPackage) {
      sum += state.selectedPackage.basePrice;
    }
    state.selectedOptions.forEach((option) => {
      if (option.id === 'extra-pages') {
        const qty = Math.max(0, state.extraPages) || 1;
        sum += qty * EXTRA_PAGES_PRICE;
      } else if (option.id === 'content-creation') {
        const qty = Math.max(0, state.contentPages) || 1;
        sum += qty * CONTENT_PAGE_PRICE;
      } else {
        const price = state.customPrices[option.id] ?? option.price;
        sum += Math.max(0, price);
      }
    });
    if (state.selectedMaintenance) {
      sum += state.selectedMaintenance.price;
    }
    state.customLineItems.forEach((item) => {
      sum += Math.max(0, item.price);
    });
    return Math.round(sum * 100) / 100;
  }, [state]);

  const discountAmount = useMemo(() => {
    if (state.discount.type === 'percentage') {
      return Math.round((subtotalBeforeDiscount * (state.discount.value / 100)) * 100) / 100;
    }
    if (state.discount.type === 'fixed') {
      return Math.round(Math.min(state.discount.value, subtotalBeforeDiscount) * 100) / 100;
    }
    return 0;
  }, [state.discount, subtotalBeforeDiscount]);

  const subtotal = useMemo(() => {
    return Math.round(Math.max(0, subtotalBeforeDiscount - discountAmount) * 100) / 100;
  }, [subtotalBeforeDiscount, discountAmount]);

  const vat = useMemo(() => {
    return Math.round(subtotal * 0.21 * 100) / 100;
  }, [subtotal]);

  const total = useMemo(() => {
    return Math.round((subtotal + vat) * 100) / 100;
  }, [subtotal, vat]);


  // Validation: check if base package is selected
  const isValid = useMemo(() => {
    return state.selectedPackage !== null;
  }, [state.selectedPackage]);

  const actions: OfferBuilderActions = {
    setSelectedPackage,
    toggleOption,
    setCustomPrice,
    setOptionNote,
    setSelectedMaintenance,
    setExtraPages,
    setContentPages,
    addCustomLineItem,
    removeCustomLineItem,
    updateCustomLineItem,
    setDiscount,
    setPaymentSchedule,
    setScopeDescription,
    setTimeline,
    reset,
    loadState,
  };

  return {
    state,
    actions,
    calculations: {
      subtotal,
      subtotalBeforeDiscount,
      discountAmount,
      vat,
      total,
    },
    isValid,
  };
}
