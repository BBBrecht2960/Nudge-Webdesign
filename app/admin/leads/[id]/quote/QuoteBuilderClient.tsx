'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type Lead } from '@/lib/db';
import { Button } from '../../../../components/Button';
import {
  ArrowLeft,
  Plus,
  Minus,
  Check,
  Mail,
  FileText,
  ChevronDown,
  ChevronUp,
  Globe,
  ShoppingCart,
  Rocket,
  Settings,
  TrendingUp,
  Wrench,
  Download,
  Trash2,
  Percent,
  CreditCard,
} from 'lucide-react';
import { generateQuotePdfBlob } from '@/lib/quotePdf';
import {
  packages,
  scopeOptions,
  complexityOptions,
  growthOptions,
  maintenanceOptions,
  getDisplayFeatures,
  getAddOnOptionsForPackage,
  type PricingOption,
  type PricingPackage,
} from '@/lib/pricing';
import { useOfferBuilder, ALLOWED_DISCOUNT_PERCENTAGES, PAYMENT_SCHEDULE_OPTIONS } from '@/lib/hooks/useOfferBuilder';
import { OfferSummary } from '@/app/components/OfferSummary';
import { presets, applyPreset } from '@/lib/presets';
import { exportQuoteAsJSON, downloadQuoteAsJSON } from '@/lib/quoteExport';

export default function QuoteBuilderClient({ leadId }: { leadId: string }) {
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showCustomLineItemModal, setShowCustomLineItemModal] = useState(false);
  const [customLineItemName, setCustomLineItemName] = useState('');
  const [customLineItemPrice, setCustomLineItemPrice] = useState('');
  
  // Use the offer builder hook for state management
  const {
    state,
    actions,
    calculations,
    isValid,
  } = useOfferBuilder();
  
  // Destructure for easier access (backward compatibility)
  const selectedPackage = state.selectedPackage;
  const selectedOptions = state.selectedOptions;
  const customPrices = state.customPrices;
  const optionNotes = state.optionNotes;
  const selectedMaintenance = state.selectedMaintenance;
  const extraPages = state.extraPages;
  const contentPages = state.contentPages;
  
  // UI State
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['packages']));
  const [packageCategory, setPackageCategory] = useState<'website' | 'webshop' | 'webapp'>('website');

  useEffect(() => {
    if (leadId) {
      loadLead();
      loadSavedQuote();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- leadId is the only trigger
  }, [leadId]);

  // Auto-save quote when selections change (debounced)
  useEffect(() => {
    if (!state.selectedPackage || !lead) return;

    const saveTimeout = setTimeout(() => {
      saveQuoteDraft();
    }, 2000); // Save 2 seconds after last change

    return () => clearTimeout(saveTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state/lead trigger save, saveQuoteDraft is stable
  }, [state, lead]);

  const loadLead = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) throw error;
      setLead(data);
    } catch (error) {
      console.error('Error loading lead:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedQuote = async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}/quote`);
      if (response.ok) {
        const { quote } = await response.json();
        if (quote && quote.quote_data) {
          const data = quote.quote_data;
          
          // Restore state using hook
          const restoredState: Partial<typeof state> = {};
          
          // Restore package
          if (data.selectedPackage) {
            const pkg = packages.find((p: PricingPackage) => p.id === data.selectedPackage.id);
            if (pkg) restoredState.selectedPackage = pkg;
          }
          
          // Restore options: alleen add-ons (geen dubbel met pakket)
          if (data.selectedOptions && Array.isArray(data.selectedOptions)) {
            const allOptions = [...scopeOptions, ...complexityOptions, ...growthOptions, ...maintenanceOptions];
            const addOnIds = new Set(getAddOnOptionsForPackage(restoredState.selectedPackage ?? null).map((o) => o.id));
            const restoredOptions: PricingOption[] = [];
            data.selectedOptions.forEach((savedOpt: { id: string; name?: string; price?: number }) => {
              const found = allOptions.find((opt) => opt.id === savedOpt.id);
              if (found && addOnIds.has(found.id)) restoredOptions.push(found);
            });
            restoredState.selectedOptions = restoredOptions;
          }
          
          // Restore custom prices
          if (data.customPrices) {
            restoredState.customPrices = data.customPrices;
          }
          
          // Restore option notes
          if (data.optionNotes) {
            restoredState.optionNotes = data.optionNotes;
          }
          
          // Restore maintenance
          if (data.selectedMaintenance) {
            const maint = maintenanceOptions.find((m: PricingOption) => m.id === data.selectedMaintenance.id);
            if (maint) restoredState.selectedMaintenance = maint;
          }
          
          // Restore counters
          if (data.extraPages !== undefined) restoredState.extraPages = data.extraPages;
          if (data.contentPages !== undefined) restoredState.contentPages = data.contentPages;
          
          // Restore scope and timeline
          if (data.scopeDescription !== undefined) restoredState.scopeDescription = data.scopeDescription;
          if (data.timeline !== undefined) restoredState.timeline = data.timeline;
          
          // Restore discount and payment schedule
          if (data.discount) restoredState.discount = data.discount;
          if (data.paymentSchedule && ['once', 'twice_25', 'thrice_33'].includes(data.paymentSchedule)) {
            restoredState.paymentSchedule = data.paymentSchedule;
          }
          if (data.customLineItems && Array.isArray(data.customLineItems)) {
            restoredState.customLineItems = data.customLineItems;
          }
          
          actions.loadState(restoredState);
          
          if (quote.updated_at) {
            setLastSaved(new Date(quote.updated_at));
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved quote:', error);
      // Silently fail - it's OK if no quote exists yet
    }
  };

  const saveQuoteDraft = async () => {
    if (!state.selectedPackage || !lead || isSaving) return;

    try {
      setIsSaving(true);
      
      if (!state.selectedPackage) return;
      
      const quoteData = {
        selectedPackage: {
          id: state.selectedPackage.id,
          name: state.selectedPackage.name,
          basePrice: state.selectedPackage.basePrice,
        },
        selectedOptions: state.selectedOptions.map(opt => ({
          id: opt.id,
          name: opt.name,
          price: getOptionPrice(opt),
        })),
        customPrices: state.customPrices,
        optionNotes: state.optionNotes,
        selectedMaintenance: state.selectedMaintenance ? {
          id: state.selectedMaintenance.id,
          name: state.selectedMaintenance.name,
          price: state.selectedMaintenance.price,
        } : null,
        extraPages: state.extraPages,
        contentPages: state.contentPages,
        customLineItems: state.customLineItems,
        discount: state.discount,
        paymentSchedule: state.paymentSchedule,
        scopeDescription: state.scopeDescription,
        timeline: state.timeline,
        quoteNumber: savedQuoteId ?? undefined,
      };

      const response = await fetch(`/api/leads/${leadId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_data: quoteData,
          total_price: getTotal(),
          status: 'draft',
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
        const json = await response.json().catch(() => ({}));
        if (json?.quote?.id) setSavedQuoteId(json.quote.id);
      }
    } catch (error) {
      console.error('Error auto-saving quote:', error);
      // Don't show error to user for auto-save
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleOption = (option: PricingOption) => {
    actions.toggleOption(option);
  };

  const updateCustomPrice = (optionId: string, price: number) => {
    actions.setCustomPrice(optionId, price);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future export UI
  const _handleExportJSON = () => {
    if (!isValid) {
      alert('Selecteer eerst een basispakket voordat je de offerte exporteert.');
      return;
    }
    
    const exportData = exportQuoteAsJSON(
      state,
      calculations,
      lead,
      undefined // quoteId can be added later if needed
    );
    
    downloadQuoteAsJSON(exportData);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for preset UI
  const _handleApplyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    // Apply preset using the hook actions
    applyPreset(
      preset,
      actions.setSelectedPackage,
      (optionId: string) => {
        const allOptions = [...scopeOptions, ...complexityOptions, ...growthOptions];
        const option = allOptions.find(opt => opt.id === optionId);
        if (option) {
          actions.toggleOption(option);
        }
      }
    );
  };

  // Helper function to get detailed explanation for options
  const getDetailedExplanation = (optionId: string) => {
    switch (optionId) {
      case 'extra-pages':
        return {
          title: 'Extra pagina\'s',
          description: 'Nieuwe pagina\'s toevoegen aan je website met standaard layout en content plaatsing.',
          examples: [
            'Portfolio pagina',
            'Team pagina',
            'FAQ pagina',
            'Cases/Referenties',
            'Diensten detail pagina\'s',
          ],
        };
      case 'blog-module':
        return {
          title: 'Blog module',
          description: 'Volledige blog functionaliteit voor regelmatig content publiceren.',
          examples: [
            'Blog editor met rich text',
            'Categorieën en tags',
            'Zoekfunctie',
            'RSS feed',
            'Social media sharing',
          ],
        };
      case 'multi-language':
        return {
          title: 'Multi-language (NL/FR/EN)',
          description: 'Website beschikbaar in meerdere talen met taalwisselaar.',
          examples: [
            'Nederlandse versie',
            'Franse versie',
            'Engelse versie',
            'Automatische taal detectie',
            'Vertaalde content',
          ],
        };
      case 'custom-integrations':
        return {
          title: 'Custom integraties',
          description: 'Koppelingen met externe systemen en custom functionaliteiten.',
          examples: [
            'CRM koppeling (HubSpot, Salesforce)',
            'Boekhoudsoftware integratie',
            'API koppelingen',
            'Payment providers',
            'Andere externe systemen',
          ],
        };
      case 'e-commerce':
        return {
          title: 'E-commerce functionaliteit',
          description: 'Volledige webshop functionaliteit voor online verkoop.',
          examples: [
            'Winkelwagen en checkout',
            'Betalingsintegratie (Stripe, Mollie)',
            'Productbeheer',
            'Voorraadbeheer',
            'Orderbeheer en tracking',
          ],
        };
      case 'booking-system':
        return {
          title: 'Boekingssysteem',
          description: 'Online systeem voor afspraken en reserveringen.',
          examples: [
            'Kalender met beschikbaarheid',
            'Online boeking door klanten',
            'Bevestigingsemails',
            'Herinneringen',
            'Annulering en wijziging',
          ],
        };
      case 'crm-integration':
        return {
          title: 'CRM-integratie',
          description: 'Automatische synchronisatie tussen website en CRM systeem.',
          examples: [
            'Lead synchronisatie',
            'Contact gegevens sync',
            'Formulier data naar CRM',
            'Automatische follow-ups',
            'Data analyse in CRM',
          ],
        };
      case 'ai-integrations':
        return {
          title: 'AI-integraties',
          description: 'AI-functionaliteiten voor geavanceerde features.',
          examples: [
            'AI chatbot',
            'Automatische content generatie',
            'Personalisatie',
            'Zoekfunctie met AI',
            'Andere AI features',
          ],
        };
      case 'member-portal':
        return {
          title: 'Ledenportaal',
          description: 'Beveiligde omgeving voor leden met exclusieve content.',
          examples: [
            'Gebruikersaccounts en login',
            'Profiel beheer',
            'Exclusieve content',
            'Leden directory',
            'Community features',
          ],
        };
      case 'custom-apis':
        return {
          title: 'Custom API\'s',
          description: 'API ontwikkeling voor data uitwisseling en integraties.',
          examples: [
            'REST API ontwikkeling',
            'Data uitwisseling',
            'Mobiele app koppeling',
            'Externe systemen integratie',
            'Custom endpoints',
          ],
        };
      case 'seo-package':
        return {
          title: 'SEO-pakket (eenmalig)',
          description: 'Eenmalige SEO-optimalisatie voor betere zoekresultaten.',
          examples: [
            'Meta tags optimalisatie',
            'Sitemap generatie',
            'Structured data (JSON-LD)',
            'Technische SEO audit',
            'Page speed optimalisatie',
          ],
        };
      case 'social-media-setup':
        return {
          title: 'Social media setup',
          description: 'Koppeling en integratie met social media platforms.',
          examples: [
            'Facebook integratie',
            'Instagram koppeling',
            'LinkedIn integratie',
            'Automatische content sharing',
            'Social media widgets',
          ],
        };
      case 'google-ads-setup':
        return {
          title: 'Google Ads setup',
          description: 'Volledige Google Ads configuratie en campagne opzet.',
          examples: [
            'Account setup en configuratie',
            'Keywords onderzoek',
            'Advertenties maken',
            'Conversie tracking',
            'Campagne optimalisatie',
          ],
        };
      case 'analytics-reporting':
        return {
          title: 'Analytics & rapportage (maandelijks)',
          description: 'Analytics setup en maandelijkse rapportage van prestaties.',
          examples: [
            'Google Analytics configuratie',
            'Doelen en events instellen',
            'Conversie tracking',
            'Maandelijkse rapportage',
            'Data analyse en advies',
          ],
        };
      default:
        return null;
    }
  };

  // Use calculations from hook instead
  const getTotal = () => calculations.total;

  const getOptionPrice = (option: PricingOption): number => {
    if (option.id === 'extra-pages') {
      const qty = Math.max(0, state.extraPages) || 1;
      return qty * 125;
    }
    if (option.id === 'content-creation') {
      const qty = Math.max(0, state.contentPages) || 1;
      return qty * 125;
    }
    if (option.price > 0) return option.price;
    return customPrices[option.id] || 0;
  };

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const handleDownloadPDF = async () => {    
    if (!lead || !selectedPackage) {
      alert('Selecteer eerst een pakket voordat je de offerte downloadt.');
      return;
    }

    if (isDownloadingPDF) {      return;
    }

    try {
      setIsDownloadingPDF(true);
      const clientInfo = {
        name: lead.name,
        email: lead.email ?? undefined,
        phone: lead.phone ?? undefined,
        company_name: lead.company_name ?? undefined,
        vat_number: lead.vat_number ?? undefined,
        company_address: lead.company_address ?? undefined,
        company_postal_code: lead.company_postal_code ?? undefined,
        company_city: lead.company_city ?? undefined,
        company_country: lead.company_country ?? undefined,
        company_website: lead.company_website ?? undefined,
      };
      const approvedQuote = {
        selectedPackage: { id: selectedPackage.id, name: selectedPackage.name, basePrice: selectedPackage.basePrice },
        selectedOptions: state.selectedOptions.map((opt) => ({ id: opt.id, name: opt.name, price: getOptionPrice(opt) })),
        optionNotes: state.optionNotes,
        extraPages: state.extraPages,
        contentPages: state.contentPages,
        selectedMaintenance: state.selectedMaintenance ? { id: state.selectedMaintenance.id, name: state.selectedMaintenance.name, price: state.selectedMaintenance.price } : null,
        customLineItems: state.customLineItems,
        discount: state.discount.type ? { type: state.discount.type, value: state.discount.value } : undefined,
        paymentSchedule: state.paymentSchedule,
        pricing: {
          subtotal: calculations.subtotalBeforeDiscount,
          vat: calculations.vat,
          total: calculations.total,
          discountAmount: calculations.discountAmount ?? 0,
        },
        quoteNumber: savedQuoteId ?? undefined,
        timeline: state.timeline?.trim() || undefined,
        scopeDescription: state.scopeDescription?.trim() || undefined,
      };
      // Logo tijdelijk uit: wordt later toegevoegd wanneer het definitieve logo klaar is
      const blob = await generateQuotePdfBlob(clientInfo, approvedQuote, calculations.total);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Offerte_${lead.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);    } catch (error) {      console.error('Error generating PDF:', error);
      alert('Fout bij genereren PDF. Probeer het opnieuw.');
    } finally {
      setIsDownloadingPDF(false);    }
  };

  const _handleSendQuote = async () => {
    if (!lead || !selectedPackage) {
      alert('Selecteer eerst een pakket voordat je de offerte verzendt.');
      return;
    }

    if (!lead.email) {
      alert('Deze lead heeft geen e-mailadres. Voeg eerst een e-mailadres toe aan de lead.');
      return;
    }

    // First save the quote if not already saved
    try {
      setIsSending(true);
      
      const quoteData = {
        selectedPackage: {
          id: selectedPackage.id,
          name: selectedPackage.name,
          basePrice: selectedPackage.basePrice,
        },
        selectedOptions: selectedOptions.map(opt => ({
          id: opt.id,
          name: opt.name,
          price: getOptionPrice(opt),
        })),
        customPrices,
        optionNotes,
        selectedMaintenance: selectedMaintenance ? {
          id: selectedMaintenance.id,
          name: selectedMaintenance.name,
          price: selectedMaintenance.price,
        } : null,
        extraPages,
        contentPages,
        customLineItems: state.customLineItems,
        discount: state.discount,
        paymentSchedule: state.paymentSchedule,
        scopeDescription: state.scopeDescription,
        timeline: state.timeline,
      };

      // Save quote first
      const saveResponse = await fetch(`/api/leads/${leadId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_data: quoteData,
          total_price: getTotal(),
          status: 'draft',
        }),
      });

      if (!saveResponse.ok) {
        let errorMessage = 'Fout bij opslaan offerte';
        try {
          const errorData = await saveResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${saveResponse.status}: ${saveResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Send email
      const sendResponse = await fetch(`/api/leads/${leadId}/quote/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!sendResponse.ok) {
        let errorMessage = 'Fout bij verzenden offerte';
        try {
          const responseText = await sendResponse.text();
          if (responseText) {
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorMessage;
            } catch {
              errorMessage = responseText || `HTTP ${sendResponse.status}: ${sendResponse.statusText}`;
            }
          } else {
            errorMessage = `HTTP ${sendResponse.status}: ${sendResponse.statusText}`;
          }
        } catch {
          errorMessage = `HTTP ${sendResponse.status}: ${sendResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Parse response safely (ensure response is consumed)
      try {
        const responseText = await sendResponse.text();
        if (responseText) {
          JSON.parse(responseText);
        }
      } catch {
        // If parsing fails but status is OK, assume success
        console.warn('Could not parse response, but status is OK');
      }
      
      setLastSaved(new Date());
      setShowReview(false);
      alert('Offerte succesvol verzonden via e-mail!');
      router.push(`/admin/leads/${leadId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      console.error('Error sending quote:', {
        error,
        message: errorMessage,
        leadId,
        leadEmail: lead?.email,
      });
      alert(`Fout bij verzenden offerte: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveQuote = async () => {
    if (!lead || !selectedPackage) {
      alert('Selecteer eerst een pakket voordat je de offerte opslaat.');
      return;
    }

    try {
      setIsSaving(true);
      
      // Build quote data
      const quoteData = {
        selectedPackage: {
          id: selectedPackage.id,
          name: selectedPackage.name,
          basePrice: selectedPackage.basePrice,
        },
        selectedOptions: selectedOptions.map(opt => ({
          id: opt.id,
          name: opt.name,
          price: getOptionPrice(opt),
        })),
        customPrices,
        optionNotes,
        selectedMaintenance: selectedMaintenance ? {
          id: selectedMaintenance.id,
          name: selectedMaintenance.name,
          price: selectedMaintenance.price,
        } : null,
        extraPages,
        contentPages,
        customLineItems: state.customLineItems,
        discount: state.discount,
        paymentSchedule: state.paymentSchedule,
        scopeDescription: state.scopeDescription,
        timeline: state.timeline,
      };

      // Save quote to database
      const quoteResponse = await fetch(`/api/leads/${leadId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_data: quoteData,
          total_price: getTotal(),
          status: 'draft',
        }),
      });

      if (!quoteResponse.ok) {
        const errorData = await quoteResponse.json();
        throw new Error(errorData.error || 'Fout bij opslaan offerte');
      }

      await quoteResponse.json();
      
      // Create activity log
      try {
        await fetch(`/api/leads/${leadId}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_type: 'quote_sent',
            title: `Offerte opgesteld: ${selectedPackage.name}`,
            description: `Totaal: €${getTotal().toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          }),
        });
      } catch (activityError) {
        // Don't fail if activity creation fails
        console.error('Error creating activity:', activityError);
      }

      setLastSaved(new Date());
      alert('Offerte succesvol opgeslagen!');
      
      // Optionally redirect back to lead detail
      // router.push(`/admin/leads/${leadId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      console.error('Error saving quote:', error);
      alert(`Fout bij opslaan offerte: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPackages = packages.filter((pkg: PricingPackage) => pkg.category === packageCategory);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground">Lead niet gevonden</div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for save indicator UI
  const _SaveIndicator = () => {
    if (isSaving) {
      return (
        <div className="fixed top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Opslaan...</span>
        </div>
      );
    }
    if (lastSaved) {
      return (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          Opgeslagen {lastSaved.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto relative w-full min-w-0 max-w-full overflow-x-hidden box-border">
      <div className="mb-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 break-words">Offerte Builder</h1>
            <p className="text-muted-foreground break-words text-sm sm:text-base">
              Voor: <span className="font-medium">{lead.name}</span>
              {lead.company_name && ` - ${lead.company_name}`}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
            <Button
              onClick={() => router.push(`/admin/leads/${leadId}`)}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Lead Details
            </Button>
            <Button
              onClick={() => router.push('/admin/leads')}
              variant="outline"
              size="sm"
            >
              Alle Leads
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 min-w-0 w-full">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 min-w-0">
          {/* Step 1: Package Selection */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('packages')}
              className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-accent/50 transition-colors min-w-0"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${selectedPackage ? 'bg-primary text-white' : 'bg-muted'}`}>
                  {selectedPackage ? <Check className="w-5 h-5" /> : '1'}
                </div>
                <div className="text-left min-w-0">
                  <h2 className="text-base sm:text-xl font-bold break-words">Basis Pakket</h2>
                  {selectedPackage && (
                    <p className="text-sm text-muted-foreground break-words truncate sm:whitespace-normal">
                      {selectedPackage.name} – {selectedPackage.basePrice === 0 ? 'Op maat' : `Vanaf €${selectedPackage.basePrice.toLocaleString('nl-BE')}`}
                    </p>
                  )}
                </div>
              </div>
              {expandedSections.has('packages') ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {expandedSections.has('packages') && (
              <div className="px-4 sm:px-6 pb-6 space-y-4 relative min-w-0 overflow-x-hidden">
                {/* Category Tabs */}
                <div className="flex gap-2 border-b border-border overflow-x-auto scrollbar-hide -mb-px min-w-0">
                  <button
                    onClick={() => setPackageCategory('website')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                      packageCategory === 'website'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Globe className="w-4 h-4 inline mr-2" />
                    Websites
                  </button>
                  <button
                    onClick={() => setPackageCategory('webshop')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                      packageCategory === 'webshop'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 inline mr-2" />
                    Webshops
                  </button>
                  <button
                    onClick={() => setPackageCategory('webapp')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                      packageCategory === 'webapp'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Rocket className="w-4 h-4 inline mr-2" />
                    Webapps
                  </button>
                </div>

                {/* Packages Grid */}
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {filteredPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="relative"
                    >
                      <button
                        onClick={() => {
                          actions.setSelectedPackage(pkg);
                          setExpandedSections(new Set(['packages', 'options']));
                        }}
                        className={`w-full h-full min-h-[214px] p-5 border-2 rounded-lg text-left transition-all flex flex-col ${
                          selectedPackage?.id === pkg.id
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-primary/50 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">{pkg.name}</h3>
                            <p className="text-2xl font-bold text-primary">
                              {pkg.basePrice === 0 ? 'Op maat' : `Vanaf €${pkg.basePrice.toLocaleString('nl-BE')}`}
                            </p>
                          </div>
                          {state.selectedPackage?.id === pkg.id && (
                            <Check className="w-6 h-6 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 flex-1">{pkg.description}</p>
                        <div className="text-xs text-muted-foreground">
                          {getDisplayFeatures(pkg).join(' • ')}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Inbegrepen in dit pakket – cumulatief: goedkopere opties + dit pakket, geen dubbels */}
                {selectedPackage && (
                  <div className="mt-6 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      Inbegrepen in {selectedPackage.name}
                    </h3>
                    <ul className="space-y-2">
                      {getDisplayFeatures(selectedPackage).map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary shrink-0">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                      Je kunt hieronder extra scope, complexiteit of onderhoud toevoegen om de offerte uit te breiden.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Project Details - Scope & Timeline */}
          {selectedPackage && (
            <div className="bg-card border border-border rounded-lg overflow-hidden min-w-0">
              <button
                onClick={() => toggleSection('project-details')}
                className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-accent/50 transition-colors min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                  <h2 className="text-base sm:text-xl font-bold break-words text-left">Project Details</h2>
                  {(state.scopeDescription || state.timeline) && (
                    <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                      Ingevuld
                    </span>
                  )}
                </div>
                {expandedSections.has('project-details') ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {expandedSections.has('project-details') && (
                <div className="px-6 pb-6 space-y-4">
                  {/* Timeline */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Levertijd / Tijdsduur
                    </label>
                    <input
                      type="text"
                      value={state.timeline}
                      onChange={(e) => actions.setTimeline(e.target.value)}
                      placeholder="Bijv. 4-6 weken, 2 maanden, etc."
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>

                  {/* Scope Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Scope Beschrijving
                    </label>
                    <textarea
                      value={state.scopeDescription}
                      onChange={(e) => actions.setScopeDescription(e.target.value)}
                      placeholder="Beschrijf de scope in detail. Bijv: Een webshop voor een koffie zaak met donkere kleuren, gerund door een marokkaanse vrouw dus met marokkaanse vibes..."
                      rows={6}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-y"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Beschrijf hier de visie, stijl, doelgroep, en specifieke wensen voor het project.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Options - Only show if package selected */}
          {selectedPackage && (
            <>
              {/* Scope Options */}
              <div className="bg-card border border-border rounded-lg overflow-hidden min-w-0">
                <button
                  onClick={() => toggleSection('scope')}
                  className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-accent/50 transition-colors min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Settings className="w-5 h-5 text-primary shrink-0" />
                    <h2 className="text-base sm:text-xl font-bold break-words text-left">Scope Uitbreidingen</h2>
                      {state.selectedOptions.filter((o) => o.category === 'scope').length > 0 && (
                      <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                        {selectedOptions.filter((o) => o.category === 'scope').length} geselecteerd
                      </span>
                    )}
                  </div>
                  {expandedSections.has('scope') ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {expandedSections.has('scope') && (
                  <div className="px-6 pb-6 space-y-3">
                    {/* Extra Pages: quantity + optie in sync */}
                    {getAddOnOptionsForPackage(selectedPackage).some((o) => o.id === 'extra-pages') && (
                    <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg bg-muted/30">
                      <div>
                        <div className="font-semibold mb-1">Extra pagina&apos;s</div>
                        <div className="text-sm text-muted-foreground">€125 per pagina</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.max(0, state.extraPages - 1);
                            actions.setExtraPages(next);
                            if (next === 0) {
                              const opt = scopeOptions.find((o) => o.id === 'extra-pages');
                              if (opt && state.selectedOptions.some((o) => o.id === 'extra-pages')) actions.toggleOption(opt);
                            }
                          }}
                          disabled={state.extraPages === 0}
                          className="w-10 h-10 rounded-lg border-2 border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-16 text-center font-bold text-lg">{state.extraPages}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = state.extraPages + 1;
                            actions.setExtraPages(next);
                            if (next === 1) {
                              const opt = scopeOptions.find((o) => o.id === 'extra-pages');
                              if (opt && !state.selectedOptions.some((o) => o.id === 'extra-pages')) actions.toggleOption(opt);
                            }
                          }}
                          className="w-10 h-10 rounded-lg border-2 border-primary bg-primary text-white hover:bg-primary/90 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
{state.extraPages > 0 && (
                            <span className="ml-2 font-semibold text-primary">
                            €{(state.extraPages * 125).toLocaleString('nl-BE', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                    )}

                    {scopeOptions.filter((o: PricingOption) => getAddOnOptionsForPackage(selectedPackage).some((a) => a.id === o.id) && o.id !== 'extra-pages').map((option: PricingOption) => {
                      const isSelected = state.selectedOptions.some((o) => o.id === option.id);
                      return (
                        <div
                          key={option.id}
                          className="relative"
                        >
                          <div
                            onClick={() => toggleOption(option)}
                            className={`w-full p-4 border-2 rounded-lg transition-all cursor-pointer hover:border-primary/50 ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-semibold mb-1 flex items-center gap-2">
                                  {option.name}
                                </div>
                                {option.description && (
                                  <div className="text-sm text-muted-foreground">{option.description}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                {option.price > 0 ? (
                                  <span className="font-bold text-primary">
                                    Vanaf €{option.price.toLocaleString('nl-BE')}
                                  </span>
                                ) : isSelected ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">€</span>
                                    <input
                                      type="number"
                                      value={state.customPrices[option.id] || ''}
                                      onChange={(e) => updateCustomPrice(option.id, parseFloat(e.target.value) || 0)}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="0"
                                      className="w-24 px-2 py-1 border border-border rounded text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                                      min="0"
                                      step="50"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground italic">Op offerte</span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleOption(option);
                                  }}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                                    isSelected
                                      ? 'bg-primary border-primary text-white'
                                      : 'border-border hover:border-primary'
                                  }`}
                                >
                                  {isSelected && <Check className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="mt-3 pt-3 border-t border-border space-y-3">
                                {/* Detailed Information */}
                                {(() => {
                                  const detailed = getDetailedExplanation(option.id);
                                  if (detailed) {
                                    return (
                                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                                        <p className="text-sm text-foreground font-medium">{detailed.description}</p>
                                        {detailed.examples && detailed.examples.length > 0 && (
                                          <div className="space-y-1">
                                            <div className="text-xs font-semibold text-muted-foreground">Inbegrepen:</div>
                                            {detailed.examples.map((example, idx) => (
                                              <div key={idx} className="text-sm flex items-start gap-2">
                                                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                <span>{example}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                
                                {/* Extra info textarea */}
                                <div>
                                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Extra info / Toelichting
                                  </label>
                                  <textarea
                                    value={state.optionNotes[option.id] || ''}
                                    onChange={(e) => {
                                      actions.setOptionNote(option.id, e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.stopPropagation()}
                                    placeholder="Voeg extra informatie toe over deze optie (bijv. specifieke wensen, details, etc.)"
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Complexity Options */}
              <div className="bg-card border border-border rounded-lg overflow-hidden min-w-0">
                <button
                  onClick={() => toggleSection('complexity')}
                  className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-accent/50 transition-colors min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Rocket className="w-5 h-5 text-primary shrink-0" />
                    <h2 className="text-base sm:text-xl font-bold break-words text-left">Complexiteit</h2>
                    {state.selectedOptions.filter((o) => o.category === 'complexity').length > 0 && (
                      <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                        {selectedOptions.filter((o) => o.category === 'complexity').length} geselecteerd
                      </span>
                    )}
                  </div>
                  {expandedSections.has('complexity') ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {expandedSections.has('complexity') && (
                  <div className="px-6 pb-6 space-y-3">
                    {complexityOptions.filter((o: PricingOption) => getAddOnOptionsForPackage(selectedPackage).some((a) => a.id === o.id)).map((option: PricingOption) => {
                      const isSelected = state.selectedOptions.some((o) => o.id === option.id);
                      return (
                        <div
                          key={option.id}
                          className="relative"
                        >
                          <div
                            onClick={() => toggleOption(option)}
                            className={`w-full p-4 border-2 rounded-lg transition-all cursor-pointer hover:border-primary/50 ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-semibold mb-1 flex items-center gap-2">
                                  {option.name}
                                </div>
                                {option.description && (
                                  <div className="text-sm text-muted-foreground">{option.description}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                {option.price > 0 ? (
                                  <span className="font-bold text-primary">
                                    Vanaf €{option.price.toLocaleString('nl-BE')}
                                  </span>
                                ) : isSelected ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">€</span>
                                    <input
                                      type="number"
                                      value={state.customPrices[option.id] || ''}
                                      onChange={(e) => updateCustomPrice(option.id, parseFloat(e.target.value) || 0)}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="0"
                                      className="w-24 px-2 py-1 border border-border rounded text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                                      min="0"
                                      step="50"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground italic">Op offerte</span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleOption(option);
                                  }}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                                    isSelected
                                      ? 'bg-primary border-primary text-white'
                                      : 'border-border hover:border-primary'
                                  }`}
                                >
                                  {isSelected && <Check className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="mt-3 pt-3 border-t border-border space-y-3">
                                {/* Detailed Information */}
                                {(() => {
                                  const detailed = getDetailedExplanation(option.id);
                                  if (detailed) {
                                    return (
                                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                                        <p className="text-sm text-foreground font-medium">{detailed.description}</p>
                                        {detailed.examples && detailed.examples.length > 0 && (
                                          <div className="space-y-1">
                                            <div className="text-xs font-semibold text-muted-foreground">Inbegrepen:</div>
                                            {detailed.examples.map((example, idx) => (
                                              <div key={idx} className="text-sm flex items-start gap-2">
                                                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                <span>{example}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                
                                {/* Extra info textarea */}
                                <div>
                                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Extra info / Toelichting
                                  </label>
                                  <textarea
                                    value={state.optionNotes[option.id] || ''}
                                    onChange={(e) => {
                                      actions.setOptionNote(option.id, e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.stopPropagation()}
                                    placeholder="Voeg extra informatie toe over deze optie (bijv. specifieke wensen, details, etc.)"
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Growth Options */}
              <div className="bg-card border border-border rounded-lg overflow-hidden min-w-0">
                <button
                  onClick={() => toggleSection('growth')}
                  className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-accent/50 transition-colors min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <TrendingUp className="w-5 h-5 text-primary shrink-0" />
                    <h2 className="text-base sm:text-xl font-bold break-words text-left">Growth & Marketing</h2>
                    {state.selectedOptions.filter((o) => o.category === 'growth').length > 0 && (
                      <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                        {selectedOptions.filter((o) => o.category === 'growth').length} geselecteerd
                      </span>
                    )}
                  </div>
                  {expandedSections.has('growth') ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {expandedSections.has('growth') && (
                  <div className="px-6 pb-6 space-y-3">
                    {/* Content creatie: quantity + optie in sync */}
                    {getAddOnOptionsForPackage(selectedPackage).some((o) => o.id === 'content-creation') && (
                    <div className="relative flex items-center justify-between p-4 border-2 border-border rounded-lg bg-muted/30">
                      <div>
                        <div className="font-semibold mb-1">Content creatie</div>
                        <div className="text-sm text-muted-foreground">€125 per pagina</div>
                        <div className="text-xs text-muted-foreground/80 mt-1">
                          Professionele tekst schrijven voor pagina&apos;s of blog posts
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.max(0, state.contentPages - 1);
                            actions.setContentPages(next);
                            if (next === 0) {
                              const opt = growthOptions.find((o) => o.id === 'content-creation');
                              if (opt && state.selectedOptions.some((o) => o.id === 'content-creation')) actions.toggleOption(opt);
                            }
                          }}
                          disabled={state.contentPages === 0}
                          className="w-10 h-10 rounded-lg border-2 border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-16 text-center font-bold text-lg">{state.contentPages}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = state.contentPages + 1;
                            actions.setContentPages(next);
                            if (next === 1) {
                              const opt = growthOptions.find((o) => o.id === 'content-creation');
                              if (opt && !state.selectedOptions.some((o) => o.id === 'content-creation')) actions.toggleOption(opt);
                            }
                          }}
                          className="w-10 h-10 rounded-lg border-2 border-primary bg-primary text-white hover:bg-primary/90 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {state.contentPages > 0 && (
                          <span className="ml-2 font-semibold text-primary">
                            €{(state.contentPages * 125).toLocaleString('nl-BE', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                    )}

                    {growthOptions.filter((o: PricingOption) => getAddOnOptionsForPackage(selectedPackage).some((a) => a.id === o.id) && o.id !== 'content-creation').map((option: PricingOption) => {
                      const isSelected = state.selectedOptions.some((o) => o.id === option.id);
                      return (
                        <div
                          key={option.id}
                          className="relative"
                        >
                          <div
                            onClick={() => toggleOption(option)}
                            className={`w-full p-4 border-2 rounded-lg transition-all cursor-pointer hover:border-primary/50 ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-semibold mb-1 flex items-center gap-2">
                                  {option.name}
                                </div>
                                {option.description && (
                                  <div className="text-sm text-muted-foreground">{option.description}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                {option.price > 0 ? (
                                  <span className="font-bold text-primary">
                                    Vanaf €{option.price.toLocaleString('nl-BE')}
                                  </span>
                                ) : isSelected ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">€</span>
                                    <input
                                      type="number"
                                      value={state.customPrices[option.id] || ''}
                                      onChange={(e) => updateCustomPrice(option.id, parseFloat(e.target.value) || 0)}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="0"
                                      className="w-24 px-2 py-1 border border-border rounded text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                                      min="0"
                                      step="50"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground italic">Op offerte</span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleOption(option);
                                  }}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                                    isSelected
                                      ? 'bg-primary border-primary text-white'
                                      : 'border-border hover:border-primary'
                                  }`}
                                >
                                  {isSelected && <Check className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="mt-3 pt-3 border-t border-border space-y-3">
                                {/* Detailed Information */}
                                {(() => {
                                  const detailed = getDetailedExplanation(option.id);
                                  if (detailed) {
                                    return (
                                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                                        <p className="text-sm text-foreground font-medium">{detailed.description}</p>
                                        {detailed.examples && detailed.examples.length > 0 && (
                                          <div className="space-y-1">
                                            <div className="text-xs font-semibold text-muted-foreground">Inbegrepen:</div>
                                            {detailed.examples.map((example, idx) => (
                                              <div key={idx} className="text-sm flex items-start gap-2">
                                                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                <span>{example}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                
                                {/* Extra info textarea */}
                                <div>
                                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    Extra info / Toelichting
                                  </label>
                                  <textarea
                                    value={state.optionNotes[option.id] || ''}
                                    onChange={(e) => {
                                      actions.setOptionNote(option.id, e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.stopPropagation()}
                                    placeholder="Voeg extra informatie toe over deze optie (bijv. specifieke wensen, details, etc.)"
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Maintenance */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('maintenance')}
                  className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-accent/50 transition-colors min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Wrench className="w-5 h-5 text-primary shrink-0" />
                    <h2 className="text-base sm:text-xl font-bold break-words text-left">Onderhoud & Analytics (maandelijks)</h2>
                    {selectedMaintenance && (
                      <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                        Geselecteerd
                      </span>
                    )}
                  </div>
                  {expandedSections.has('maintenance') ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {expandedSections.has('maintenance') && (
                  <div className="px-6 pb-6 space-y-3">
                    {/* Maintenance Packages */}
                    {/* Geen onderhoud: afvinken */}
                    <button
                      type="button"
                      onClick={() => actions.setSelectedMaintenance(null)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        !selectedMaintenance ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Geen onderhoud</span>
                        {!selectedMaintenance && (
                          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </button>

                    {maintenanceOptions.filter((opt: PricingOption) => opt.id.startsWith('maintenance-') && getAddOnOptionsForPackage(selectedPackage).some((a) => a.id === opt.id)).map((option: PricingOption) => {
                      const isSelected = selectedMaintenance?.id === option.id;
                      return (
                        <div
                          key={option.id}
                          className="relative"
                        >
                          <button
                            type="button"
                            onClick={() => actions.setSelectedMaintenance(isSelected ? null : option)}
                            className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-semibold mb-1">{option.name}</div>
                                {option.description && (
                                  <div className="text-sm text-muted-foreground">{option.description}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                <span className="font-bold text-primary">
                                  Vanaf €{option.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/maand
                                </span>
                                {isSelected && (
                                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                                    <Check className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                    
                    {/* Analytics & Reporting (as separate option) */}
                    {maintenanceOptions.filter((opt: PricingOption) => opt.id === 'analytics-reporting').map((option: PricingOption) => {
                      const isSelected = state.selectedOptions.some((o) => o.id === option.id);
                      return (
                        <div
                          key={option.id}
                          className="relative"
                        >
                          <button
                            onClick={() => actions.toggleOption(option)}
                            className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-semibold mb-1">{option.name}</div>
                                {option.description && (
                                  <div className="text-sm text-muted-foreground">{option.description}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                <span className="font-bold text-primary">
                                  Vanaf €{option.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/maand
                                </span>
                                {isSelected && (
                                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                                    <Check className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6 min-w-0">
          <div className="sticky top-6 space-y-6 min-w-0">
            {/* Custom Line Items Section - Above Summary */}
            <div className="bg-card border-2 border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Extra Kosten</h3>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCustomLineItemModal(true);
                    setCustomLineItemName('');
                    setCustomLineItemPrice('');
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Toevoegen
                </Button>
              </div>
              
              {state.customLineItems.length > 0 ? (
                <div className="space-y-2">
                  {state.customLineItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                      <span className="flex-1 truncate">{item.name}</span>
                      <span className="font-medium mr-2">Vanaf €{item.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          actions.removeCustomLineItem(item.id);
                        }}
                        className="text-red-600 hover:text-red-700 p-1 shrink-0"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Geen extra kosten toegevoegd</p>
              )}
            </div>

            {/* Discount Section - Above Summary */}
            <div className="bg-card border-2 border-border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Korting</h3>
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <Percent className="w-4 h-4 text-muted-foreground shrink-0" />
                  <select
                    value={state.discount.type === null ? 'none' : state.discount.type}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'none') {
                        actions.setDiscount(null, 0);
                      } else if (val === 'percentage') {
                        actions.setDiscount('percentage', 5);
                      } else {
                        actions.setDiscount('fixed', state.discount.type === 'fixed' ? state.discount.value : 0);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="none">Geen korting</option>
                    <option value="percentage">Percentage (max 15%)</option>
                    <option value="fixed">Vast bedrag (€)</option>
                  </select>
                </div>
                {state.discount.type === 'percentage' && (
                  <div className="flex gap-2 items-center pl-6">
                    <select
                      value={state.discount.value}
                      onChange={(e) => actions.setDiscount('percentage', Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {ALLOWED_DISCOUNT_PERCENTAGES.map((p) => (
                        <option key={p} value={p}>{p}%</option>
                      ))}
                    </select>
                  </div>
                )}
                {state.discount.type === 'fixed' && (
                  <div className="flex gap-2 items-center pl-6">
                    <span className="text-sm text-muted-foreground">€</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={state.discount.value === 0 ? '' : state.discount.value}
                      onChange={(e) => {
                        const v = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                        actions.setDiscount('fixed', v);
                      }}
                      placeholder="0"
                      className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Payment Schedule - Betaling */}
            <div className="bg-card border-2 border-border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Betaling</h3>
              <div className="flex gap-2 items-start">
                <CreditCard className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  {PAYMENT_SCHEDULE_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentSchedule"
                        value={opt.value}
                        checked={state.paymentSchedule === opt.value}
                        onChange={() => actions.setPaymentSchedule(opt.value)}
                        className="mt-1 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Offer Summary - Below Extra Costs and Discount */}
            <OfferSummary
              subtotal={calculations.subtotal}
              vat={calculations.vat}
              total={calculations.total}
              discountAmount={calculations.discountAmount}
              customLineItems={state.customLineItems}
            />

            <div className="space-y-2 mt-6">
              <Button
                onClick={() => setShowReview(true)}
                disabled={!selectedPackage}
                className="w-full"
                size="lg"
              >
                <FileText className="w-4 h-4 mr-2" />
                Bekijk Offerte
              </Button>
              <Button
                onClick={handleDownloadPDF}
                disabled={!selectedPackage || isDownloadingPDF}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloadingPDF ? 'PDF genereren...' : 'Download PDF'}
              </Button>
              <Button
                onClick={handleSaveQuote}
                disabled={isSaving || isSending || !selectedPackage}
                variant="outline"
                className="w-full"
              >
                {isSaving ? 'Opslaan...' : 'Opslaan als concept'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 max-w-3xl w-full max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden min-w-0">
            <h2 className="text-2xl font-bold mb-6">Offerte Overzicht</h2>
            
            <div className="space-y-6 mb-6">
              {/* Klantgegevens */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-primary">Klantgegevens</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Naam:</span>
                    <span className="ml-2 font-medium">{lead.name}</span>
                  </div>
                  {lead.company_name && (
                    <div>
                      <span className="text-muted-foreground">Bedrijf:</span>
                      <span className="ml-2 font-medium">{lead.company_name}</span>
                    </div>
                  )}
                  {lead.vat_number && (
                    <div>
                      <span className="text-muted-foreground">BTW-nummer:</span>
                      <span className="ml-2 font-medium">{lead.vat_number}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">E-mail:</span>
                    <span className="ml-2 font-medium">{lead.email}</span>
                  </div>
                  {lead.phone && (
                    <div>
                      <span className="text-muted-foreground">Telefoon:</span>
                      <span className="ml-2 font-medium">{lead.phone}</span>
                    </div>
                  )}
                  {lead.company_address && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Adres:</span>
                      <span className="ml-2 font-medium">{lead.company_address}</span>
                      {(lead.company_postal_code || lead.company_city) && (
                        <span className="ml-2">
                          {[lead.company_postal_code, lead.company_city].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Project Details */}
              {(state.scopeDescription || state.timeline) && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-primary">Project Details</h3>
                  {state.timeline && (
                    <div className="mb-3">
                      <span className="text-sm text-muted-foreground">Levertijd:</span>
                      <span className="ml-2 font-medium text-sm">{state.timeline}</span>
                    </div>
                  )}
                  {state.scopeDescription && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">Scope Beschrijving:</span>
                      <p className="text-sm whitespace-pre-wrap break-words">{state.scopeDescription}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Geselecteerde Items */}
              <div>
                <h3 className="font-semibold mb-3 text-primary">Geselecteerde Items</h3>
                <div className="space-y-2">
                  {/* Package */}
                  {selectedPackage && (
                    <div className="p-3 bg-muted rounded-lg border border-border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{selectedPackage.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{selectedPackage.description}</div>
                        </div>
                        <div className="ml-4 font-bold text-primary">
                          {selectedPackage.basePrice === 0 ? 'Op maat' : `Vanaf € ${selectedPackage.basePrice.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  {selectedOptions
                    .filter((o) => {
                      const price = getOptionPrice(o);
                      return price > 0;
                    })
                    .map((option) => (
                      <div key={option.id} className="p-3 bg-muted rounded-lg border border-border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{option.name}</div>
                            {option.description && (
                              <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                            )}
                            {optionNotes[option.id] && (
                              <div className="mt-2 text-xs text-muted-foreground italic border-t border-border pt-2">
                                <strong>Extra info:</strong> {optionNotes[option.id]}
                              </div>
                            )}
                          </div>
                          <div className="ml-4 font-bold text-primary">
                            Vanaf € {getOptionPrice(option).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    ))}

                  {/* Extra Pages */}
                  {state.extraPages > 0 && (
                    <div className="p-3 bg-muted rounded-lg border border-border">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">Extra pagina&apos;s ({state.extraPages}x)</div>
                        <div className="font-bold text-primary">
                          Vanaf € {(state.extraPages * 100).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content Pages */}
                  {state.contentPages > 0 && (
                    <div className="p-3 bg-muted rounded-lg border border-border">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">Content creatie ({state.contentPages}x pagina&apos;s)</div>
                        <div className="font-bold text-primary">
                          Vanaf € {(state.contentPages * 125).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Custom Line Items */}
                  {state.customLineItems.length > 0 && (
                    <>
                      {state.customLineItems.map((item) => (
                        <div key={item.id} className="p-3 bg-muted rounded-lg border border-border">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{item.name}</div>
                            <div className="font-bold text-primary">
                              Vanaf € {item.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-primary/5 border-2 border-primary rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotaal (excl. BTW)</span>
                  <span className="font-medium">
                    € {(calculations.subtotal + (calculations.discountAmount || 0)).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                
                {calculations.discountAmount && calculations.discountAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Korting</span>
                      <span className="font-medium">
                        -€ {calculations.discountAmount.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotaal na korting</span>
                      <span className="font-medium">
                        € {calculations.subtotal.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">BTW (21%)</span>
                  <span className="font-medium">
                    € {calculations.vat.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="border-t border-primary/30 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Totaal (incl. BTW)</span>
                    <span className="text-primary">
                      € {calculations.total.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Betaling: {PAYMENT_SCHEDULE_OPTIONS.find((o) => o.value === state.paymentSchedule)?.label ?? 'In 1 keer op voorhand'}
                  </p>
                </div>

                {/* Maintenance */}
                {selectedMaintenance && (
                    <div className="border-t border-primary/30 pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Onderhoud (per maand)</span>
                      <span className="font-medium text-primary">
                        Vanaf € {selectedMaintenance.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowReview(false)}
                variant="outline"
                className="flex-1"
                disabled={isSending}
              >
                Sluiten
              </Button>
              <Button
                onClick={() => _handleSendQuote()}
                disabled={!selectedPackage || isSending || !lead?.email}
                className="flex-1"
                title={!lead?.email ? 'Lead heeft geen e-mailadres' : !selectedPackage ? 'Selecteer eerst een pakket' : 'Verstuur offerte per e-mail'}
              >
                {isSending ? (
                  <>Bezig...</>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Verstuur offerte
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Custom Line Item Modal */}
      {showCustomLineItemModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCustomLineItemModal(false);
              setCustomLineItemName('');
              setCustomLineItemPrice('');
            }
          }}
        >
          <div 
            className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full max-w-[calc(100vw-2rem)] p-4 sm:p-6 space-y-4 overflow-x-hidden min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-foreground">Extra Kost Toevoegen</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Naam van de extra kost
              </label>
              <input
                type="text"
                value={customLineItemName}
                onChange={(e) => setCustomLineItemName(e.target.value)}
                placeholder="Bijv. Extra ontwikkeling, Setup kosten, etc."
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowCustomLineItemModal(false);
                    setCustomLineItemName('');
                    setCustomLineItemPrice('');
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Bedrag (excl. BTW)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">€</span>
                <input
                  type="number"
                  value={customLineItemPrice}
                  onChange={(e) => setCustomLineItemPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customLineItemName.trim() && customLineItemPrice) {
                      const price = parseFloat(customLineItemPrice.replace(',', '.')) || 0;
                      if (price > 0) {
                        actions.addCustomLineItem(customLineItemName.trim(), price);
                        setShowCustomLineItemModal(false);
                        setCustomLineItemName('');
                        setCustomLineItemPrice('');
                      }
                    }
                    if (e.key === 'Escape') {
                      setShowCustomLineItemModal(false);
                      setCustomLineItemName('');
                      setCustomLineItemPrice('');
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowCustomLineItemModal(false);
                  setCustomLineItemName('');
                  setCustomLineItemPrice('');
                }}
                variant="outline"
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button
                onClick={() => {
                  if (!customLineItemName.trim()) {
                    alert('Voer een naam in voor de extra kost');
                    return;
                  }
                  const price = parseFloat(customLineItemPrice.replace(',', '.')) || 0;
                  if (price <= 0) {
                    alert('Voer een geldig bedrag in (groter dan 0)');
                    return;
                  }
                  actions.addCustomLineItem(customLineItemName.trim(), price);
                  setShowCustomLineItemModal(false);
                  setCustomLineItemName('');
                  setCustomLineItemPrice('');
                }}
                className="flex-1"
              >
                Toevoegen
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
