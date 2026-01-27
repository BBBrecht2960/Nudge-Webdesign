import { useState, useCallback, useMemo } from 'react';
import {
  packages,
  scopeOptions,
  complexityOptions,
  growthOptions,
  maintenanceOptions,
  type PricingPackage,
  type PricingOption,
} from '@/lib/pricing';

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
};

export function useOfferBuilder() {
  const [state, setState] = useState<OfferBuilderState>(initialState);

  const setSelectedPackage = useCallback((pkg: PricingPackage | null) => {
    setState((prev) => ({ ...prev, selectedPackage: pkg }));
  }, []);

  const toggleOption = useCallback((option: PricingOption) => {
    setState((prev) => {
      const isSelected = prev.selectedOptions.some((opt) => opt.id === option.id);
      let newOptions: PricingOption[];
      let newCustomPrices = { ...prev.customPrices };
      let newOptionNotes = { ...prev.optionNotes };

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
    setState((prev) => ({
      ...prev,
      discount: { type, value: Math.max(0, value) },
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const loadState = useCallback((newState: Partial<OfferBuilderState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  }, []);

  // Calculate subtotal before discount (excluding VAT)
  const subtotalBeforeDiscount = useMemo(() => {
    let total = 0;

    if (state.selectedPackage) {
      total += state.selectedPackage.basePrice;
    }

    state.selectedOptions.forEach((option) => {
      const price = state.customPrices[option.id] ?? option.price;
      if (price > 0) {
        total += price;
      }
    });

    // Extra pages
    total += state.extraPages * 125; // Updated price

    // Content pages
    total += state.contentPages * 125;

    // Maintenance (first month for quote)
    if (state.selectedMaintenance) {
      total += state.selectedMaintenance.price;
    }

    // Custom line items
    state.customLineItems.forEach((item) => {
      total += item.price;
    });

    return total;
  }, [state]);

  // Calculate discount amount
  const discountAmount = useMemo(() => {
    if (state.discount.type === 'percentage') {
      return subtotalBeforeDiscount * (state.discount.value / 100);
    } else if (state.discount.type === 'fixed') {
      return Math.min(state.discount.value, subtotalBeforeDiscount);
    }
    return 0;
  }, [state.discount, subtotalBeforeDiscount]);

  // Calculate subtotal after discount (excluding VAT)
  const subtotal = useMemo(() => {
    return Math.max(0, subtotalBeforeDiscount - discountAmount);
  }, [subtotalBeforeDiscount, discountAmount]);

  // Calculate VAT (21% in Belgium)
  const vat = useMemo(() => {
    return subtotal * 0.21;
  }, [subtotal]);

  // Calculate total (including VAT)
  const total = useMemo(() => {
    return subtotal + vat;
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
