'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, type Lead } from '@/lib/db';
import { Button } from '../../../../components/Button';
import {
  ArrowLeft,
  Plus,
  Minus,
  Check,
  Calculator,
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
  AlertTriangle,
  Trash2,
  Percent,
  Euro,
} from 'lucide-react';
import jsPDF from 'jspdf';
import {
  packages,
  scopeOptions,
  complexityOptions,
  growthOptions,
  maintenanceOptions,
  type PricingPackage,
  type PricingOption,
} from '@/lib/pricing';
import { useOfferBuilder } from '@/lib/hooks/useOfferBuilder';
import { OfferSummary } from '@/app/components/OfferSummary';
import { presets, applyPreset } from '@/lib/presets';
import { exportQuoteAsJSON, downloadQuoteAsJSON } from '@/lib/quoteExport';

export default function QuoteBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
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
    
  }, [leadId]);

  // Auto-save quote when selections change (debounced)
  useEffect(() => {
    if (!state.selectedPackage || !lead) return;

    const saveTimeout = setTimeout(() => {
      saveQuoteDraft();
    }, 2000); // Save 2 seconds after last change

    return () => clearTimeout(saveTimeout);
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
            const pkg = packages.find(p => p.id === data.selectedPackage.id);
            if (pkg) restoredState.selectedPackage = pkg;
          }
          
          // Restore options - need to find full option objects from pricing config
          if (data.selectedOptions && Array.isArray(data.selectedOptions)) {
            const restoredOptions: PricingOption[] = [];
            data.selectedOptions.forEach((savedOpt: { id: string; name?: string; price?: number }) => {
              // Try to find in all option arrays
              const allOptions = [...scopeOptions, ...complexityOptions, ...growthOptions, ...maintenanceOptions];
              const found = allOptions.find(opt => opt.id === savedOpt.id);
              if (found) {
                restoredOptions.push(found);
              }
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
            const maint = maintenanceOptions.find(m => m.id === data.selectedMaintenance.id);
            if (maint) restoredState.selectedMaintenance = maint;
          }
          
          // Restore counters
          if (data.extraPages !== undefined) restoredState.extraPages = data.extraPages;
          if (data.contentPages !== undefined) restoredState.contentPages = data.contentPages;
          
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
  
  const handleExportJSON = () => {
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
  
  const handleApplyPreset = (presetId: string) => {
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
          title: 'Analytics & rapportage',
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
    if (option.price > 0) return option.price;
    return customPrices[option.id] || 0;
  };

  const handleDownloadPDF = () => {
    if (!lead || !selectedPackage) {
      alert('Selecteer eerst een pakket voordat je de offerte downloadt.');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      const lineHeight = 7;
      const sectionSpacing = 12;
      
      let yPos = margin;
      const businessName = 'Nudge Webdesign';
      const businessEmail = 'brecht.leap@gmail.com';
      const businessPhone = '+32494299633';
      const businessAddress = 'Herkenrodesingel 19C/4.2, 3500 Hasselt, België';

      // Helper function to check if new page is needed
      const checkNewPage = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - 40) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Helper function to add text with proper wrapping
      const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 11, fontStyle: 'normal' | 'bold' = 'normal') => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          if (y > pageHeight - 40) {
            doc.addPage();
            return margin;
          }
          doc.text(line, x, y);
          y += lineHeight;
        });
        return y;
      };

      // Header with logo space
      doc.setFillColor(144, 103, 198); // Primary purple
      doc.rect(0, 0, pageWidth, 60, 'F');
      
      // Logo placeholder (40x40px space at top right)
      // TODO: Replace this placeholder with actual logo image
      // To add logo: doc.addImage(logoData, 'PNG', pageWidth - margin - 40, margin, 40, 40)
      // Logo should be placed at: public/nudge-logo.png (or .jpg)
      doc.setFillColor(255, 255, 255);
      doc.rect(pageWidth - margin - 40, margin, 40, 40, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(pageWidth - margin - 40, margin, 40, 40, 'S');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('LOGO', pageWidth - margin - 20, margin + 20, { align: 'center' });
      
      // Company name and title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(businessName, margin, margin + 15);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Offerte', margin, margin + 25);
      
      // Date
      const today = new Date();
      const dateStr = today.toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      doc.setFontSize(10);
      doc.text(`Datum: ${dateStr}`, pageWidth - margin, margin + 15, { align: 'right' });

      // Reset for content
      doc.setTextColor(0, 0, 0);
      yPos = 75;

      // Client information section
      let clientInfoHeight = 35;
      let clientInfoLines = 4; // Base: naam, email, phone, company
      if (lead.company_name) clientInfoLines++;
      if (lead.vat_number) clientInfoLines++;
      if (lead.company_address) clientInfoLines++;
      if (lead.company_postal_code || lead.company_city) clientInfoLines++;
      if (lead.company_country) clientInfoLines++;
      if (lead.company_website) clientInfoLines++;
      clientInfoHeight = Math.max(35, 8 + (clientInfoLines * lineHeight) + 5);
      
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos, contentWidth, clientInfoHeight, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPos, contentWidth, clientInfoHeight, 'S');
      
      yPos += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Klantgegevens', margin + 5, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Naam: ${lead.name}`, margin + 5, yPos);
      yPos += lineHeight;
      
      if (lead.company_name) {
        doc.text(`Bedrijf: ${lead.company_name}`, margin + 5, yPos);
        yPos += lineHeight;
      }
      
      if (lead.vat_number) {
        doc.setFont('helvetica', 'bold');
        doc.text(`BTW-nummer: ${lead.vat_number}`, margin + 5, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += lineHeight;
      }
      
      if (lead.company_address) {
        doc.text(`Adres: ${lead.company_address}`, margin + 5, yPos);
        yPos += lineHeight;
      }
      
      if (lead.company_postal_code || lead.company_city) {
        const postalCity = [lead.company_postal_code, lead.company_city].filter(Boolean).join(' ');
        doc.text(`Postcode & Stad: ${postalCity}`, margin + 5, yPos);
        yPos += lineHeight;
      }
      
      if (lead.company_country) {
        doc.text(`Land: ${lead.company_country}`, margin + 5, yPos);
        yPos += lineHeight;
      }
      
      if (lead.email) {
        doc.text(`E-mail: ${lead.email}`, margin + 5, yPos);
        yPos += lineHeight;
      }
      
      if (lead.phone) {
        doc.text(`Telefoon: ${lead.phone}`, margin + 5, yPos);
        yPos += lineHeight;
      }
      
      if (lead.company_website) {
        doc.text(`Website: ${lead.company_website}`, margin + 5, yPos);
        yPos += lineHeight;
      }

      yPos += sectionSpacing;

      // Quote items table header
      checkNewPage(30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Geselecteerde Items', margin, yPos);
      yPos += 10;

      // Table header
      doc.setFillColor(230, 230, 230);
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPos, contentWidth, 8, 'S');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Omschrijving', margin + 3, yPos + 6);
      doc.text('Bedrag', pageWidth - margin - 3, yPos + 6, { align: 'right' });
      yPos += 10;

      // Package row
      checkNewPage(10);
      doc.setDrawColor(220, 220, 220);
      doc.rect(margin, yPos - 2, contentWidth, 8, 'S');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const packageName = doc.splitTextToSize(selectedPackage.name, contentWidth - 60);
      doc.text(packageName[0], margin + 3, yPos + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(`€${selectedPackage.basePrice.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, yPos + 5, { align: 'right' });
      yPos += 10;

      // Options rows
      selectedOptions.forEach((option) => {
        const price = getOptionPrice(option);
        if (price > 0) {
          checkNewPage(15);
          doc.setDrawColor(220, 220, 220);
          doc.rect(margin, yPos - 2, contentWidth, 8, 'S');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          
          let optionText = option.name;
          if (optionNotes[option.id]) {
            optionText += ` (${optionNotes[option.id]})`;
          }
          
          const optionLines = doc.splitTextToSize(optionText, contentWidth - 60);
          doc.text(optionLines[0], margin + 3, yPos + 5);
          doc.setFont('helvetica', 'bold');
          doc.text(`€${price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, yPos + 5, { align: 'right' });
          
          // If option text wraps, add extra lines
          if (optionLines.length > 1) {
            for (let i = 1; i < optionLines.length; i++) {
              yPos += 6;
              checkNewPage(10);
              doc.setFont('helvetica', 'normal');
              doc.text(optionLines[i], margin + 3, yPos + 5);
            }
            yPos += 2;
          }
          
          yPos += 10;
        }
      });

      // Extra pages
      if (extraPages > 0) {
        checkNewPage(10);
        const extraPagesPrice = scopeOptions.find((o) => o.id === 'extra-pages')!.price * extraPages;
        doc.setDrawColor(220, 220, 220);
        doc.rect(margin, yPos - 2, contentWidth, 8, 'S');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Extra pagina's (${extraPages}x)`, margin + 3, yPos + 5);
        doc.setFont('helvetica', 'bold');
        doc.text(`€${extraPagesPrice.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, yPos + 5, { align: 'right' });
        yPos += 10;
      }

      // Content pages
      if (contentPages > 0) {
        checkNewPage(10);
        const contentPrice = growthOptions.find((o) => o.id === 'content-creation')!.price * contentPages;
        doc.setDrawColor(220, 220, 220);
        doc.rect(margin, yPos - 2, contentWidth, 8, 'S');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Content creatie (${contentPages}x pagina's)`, margin + 3, yPos + 5);
        doc.setFont('helvetica', 'bold');
        doc.text(`€${contentPrice.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, yPos + 5, { align: 'right' });
        yPos += 10;
      }

      // Custom line items
      if (state.customLineItems.length > 0) {
        state.customLineItems.forEach((item) => {
          checkNewPage(10);
          doc.setDrawColor(220, 220, 220);
          doc.rect(margin, yPos - 2, contentWidth, 8, 'S');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          const itemLines = doc.splitTextToSize(item.name, contentWidth - 60);
          doc.text(itemLines[0], margin + 3, yPos + 5);
          doc.setFont('helvetica', 'bold');
          doc.text(`€${item.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, yPos + 5, { align: 'right' });
          if (itemLines.length > 1) {
            for (let i = 1; i < itemLines.length; i++) {
              yPos += 6;
              checkNewPage(10);
              doc.setFont('helvetica', 'normal');
              doc.text(itemLines[i], margin + 3, yPos + 5);
            }
            yPos += 2;
          }
          yPos += 10;
        });
      }

      // Discount
      if (state.discount.type && state.discount.value) {
        checkNewPage(10);
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPos - 2, contentWidth, 8, 'S');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const discountText = state.discount.type === 'percentage' 
          ? `Korting (${state.discount.value}%)`
          : `Korting (€${state.discount.value.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
        doc.text(discountText, margin + 3, yPos + 5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(200, 0, 0);
        doc.text(`-€${calculations.discountAmount.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, yPos + 5, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        yPos += 10;
      }

      yPos += 5;

      // Totals section
      checkNewPage(40);
      doc.setDrawColor(144, 103, 198);
      doc.setLineWidth(1);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Subtotal
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotaal (excl. BTW)', margin, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`€${calculations.subtotal.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 8;

      // VAT
      doc.setFont('helvetica', 'normal');
      doc.text('BTW (21%)', margin, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`€${calculations.vat.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 10;

      // Total
      doc.setDrawColor(144, 103, 198);
      doc.setLineWidth(1.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Totaal (incl. BTW)', margin, yPos);
      doc.text(`€${calculations.total.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 12;

      // Maintenance if selected
      if (selectedMaintenance) {
        checkNewPage(15);
        doc.setFillColor(245, 245, 255);
        doc.rect(margin, yPos, contentWidth, 12, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPos, contentWidth, 12, 'S');
        yPos += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Onderhoud (per maand)', margin + 3, yPos);
        doc.text(`€${selectedMaintenance.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, yPos, { align: 'right' });
        yPos += 12;
      }

      // Footer on last page
      const footerY = pageHeight - 50;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Contactgegevens', margin, footerY + 8);
      doc.setFontSize(8);
      doc.text(businessEmail, margin, footerY + 14);
      doc.text(businessPhone, margin, footerY + 20);
      doc.text(businessAddress, margin, footerY + 26);
      
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      const footerText = 'Dit is een automatisch gegenereerde offerte. Voor vragen, neem contact op via bovenstaande gegevens.';
      doc.text(footerText, margin, footerY + 34, { maxWidth: contentWidth });

      // Generate filename
      const fileName = `Offerte_${lead.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Save PDF
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Fout bij genereren PDF. Probeer het opnieuw.');
    }
  };

  const handleSendQuote = async () => {
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
        } catch (parseError) {
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
        } catch (parseError) {
          errorMessage = `HTTP ${sendResponse.status}: ${sendResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Parse response safely
      let result;
      try {
        const responseText = await sendResponse.text();
        if (responseText) {
          result = JSON.parse(responseText);
        } else {
          // Empty response but status is OK - assume success
          result = { success: true, message: 'Offerte verzonden' };
        }
      } catch (parseError) {
        // If parsing fails but status is OK, assume success
        console.warn('Could not parse response, but status is OK:', parseError);
        result = { success: true, message: 'Offerte verzonden' };
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

      const { quote } = await quoteResponse.json();
      
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

  const filteredPackages = packages.filter((pkg) => pkg.category === packageCategory);

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

  // Show save indicator
  const SaveIndicator = () => {
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

  const total = getTotal();

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto relative">
      <Button
        onClick={() => router.push(`/admin/leads/${leadId}`)}
        variant="outline"
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Terug naar lead
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Offerte Builder</h1>
        <p className="text-muted-foreground">
          Voor: <span className="font-medium">{lead.name}</span>
          {lead.company_name && ` - ${lead.company_name}`}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step 1: Package Selection */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('packages')}
              className="w-full p-6 flex items-center justify-between hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedPackage ? 'bg-primary text-white' : 'bg-muted'}`}>
                  {selectedPackage ? <Check className="w-5 h-5" /> : '1'}
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold">Basis Pakket</h2>
                  {selectedPackage && (
                    <p className="text-sm text-muted-foreground">{selectedPackage.name} - €{selectedPackage.basePrice.toLocaleString('nl-BE')}</p>
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
              <div className="px-6 pb-6 space-y-4 relative">
                {/* Category Tabs */}
                <div className="flex gap-2 border-b border-border">
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
                              €{pkg.basePrice.toLocaleString('nl-BE')}
                            </p>
                          </div>
                          {state.selectedPackage?.id === pkg.id && (
                            <Check className="w-6 h-6 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 flex-1">{pkg.description}</p>
                        <div className="text-xs text-muted-foreground">
                          {pkg.features.slice(0, 3).join(' • ')}
                          {pkg.features.length > 3 && ' • ...'}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Options - Only show if package selected */}
          {selectedPackage && (
            <>
              {/* Scope Options */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('scope')}
                  className="w-full p-6 flex items-center justify-between hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Scope Uitbreidingen</h2>
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
                    {/* Extra Pages Counter */}
                    <div className="flex items-center justify-between p-4 border-2 border-border rounded-lg bg-muted/30">
                      <div>
                        <div className="font-semibold mb-1">Extra pagina&apos;s</div>
                        <div className="text-sm text-muted-foreground">€100 per pagina</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => actions.setExtraPages(state.extraPages - 1)}
                          disabled={extraPages === 0}
                          className="w-10 h-10 rounded-lg border-2 border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-16 text-center font-bold text-lg">{state.extraPages}</span>
                        <button
                          onClick={() => actions.setExtraPages(state.extraPages + 1)}
                          className="w-10 h-10 rounded-lg border-2 border-primary bg-primary text-white hover:bg-primary/90 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {state.extraPages > 0 && (
                          <span className="ml-2 font-semibold text-primary">
                            €{(state.extraPages * 100).toLocaleString('nl-BE')}
                          </span>
                        )}
                      </div>
                    </div>

                    {scopeOptions.filter((o) => o.id !== 'extra-pages').map((option) => {
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
                                <div className="font-semibold mb-1">{option.name}</div>
                                {option.description && (
                                  <div className="text-sm text-muted-foreground">{option.description}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                {option.price > 0 ? (
                                  <span className="font-bold text-primary">
                                    €{option.price.toLocaleString('nl-BE')}
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
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('complexity')}
                  className="w-full p-6 flex items-center justify-between hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Rocket className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Complexiteit</h2>
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
                    {complexityOptions.map((option) => {
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
                                <div className="font-semibold mb-1">{option.name}</div>
                                {option.description && (
                                  <div className="text-sm text-muted-foreground">{option.description}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                {option.price > 0 ? (
                                  <span className="font-bold text-primary">
                                    €{option.price.toLocaleString('nl-BE')}
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
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('growth')}
                  className="w-full p-6 flex items-center justify-between hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Growth & Marketing</h2>
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
                    {/* Content Creation Counter */}
                    <div 
                      className="relative flex items-center justify-between p-4 border-2 border-border rounded-lg bg-muted/30"
                    >
                      <div>
                        <div className="font-semibold mb-1">Content creatie</div>
                        <div className="text-sm text-muted-foreground">€125 per pagina</div>
                        <div className="text-xs text-muted-foreground/80 mt-1">
                          Professionele tekst schrijven voor pagina&apos;s of blog posts
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => actions.setContentPages(state.contentPages - 1)}
                          disabled={contentPages === 0}
                          className="w-10 h-10 rounded-lg border-2 border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-16 text-center font-bold text-lg">{state.contentPages}</span>
                        <button
                          onClick={() => actions.setContentPages(state.contentPages + 1)}
                          className="w-10 h-10 rounded-lg border-2 border-primary bg-primary text-white hover:bg-primary/90 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {state.contentPages > 0 && (
                          <span className="ml-2 font-semibold text-primary">
                            €{(state.contentPages * 125).toLocaleString('nl-BE')}
                          </span>
                        )}
                      </div>
                    </div>

                    {growthOptions.filter((o) => o.id !== 'content-creation').map((option) => {
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
                                <div className="font-semibold mb-1">{option.name}</div>
                                {option.description && (
                                  <div className="text-sm text-muted-foreground">{option.description}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                {option.price > 0 ? (
                                  <span className="font-bold text-primary">
                                    €{option.price.toLocaleString('nl-BE')}
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
                  className="w-full p-6 flex items-center justify-between hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Wrench className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Onderhoud (maandelijks)</h2>
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
                    {maintenanceOptions.map((option) => {
                      const isSelected = selectedMaintenance?.id === option.id;
                      return (
                        <div
                          key={option.id}
                          className="relative"
                        >
                          <button
                            onClick={() => actions.setSelectedMaintenance(option)}
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
                                  €{option.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/maand
                                </span>
                                {isSelected && (
                                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                                    <Check className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                          
                          {/* Tooltip */}
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
        <div className="space-y-6">
          <div className="sticky top-6 space-y-6">
            {/* Custom Line Items Section - Above Summary */}
            <div className="bg-white border-2 border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Extra Kosten</h3>
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
                      <span className="font-medium mr-2">€{item.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
            <div className="bg-white border-2 border-border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold">Korting</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={state.discount.type || ''}
                    onChange={(e) => {
                      const type = e.target.value as 'percentage' | 'fixed' | '';
                      actions.setDiscount(type === '' ? null : type, state.discount.value);
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Geen korting</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Vast bedrag</option>
                  </select>
                </div>
                
                {state.discount.type && (
                  <div className="flex gap-2 items-center">
                    {state.discount.type === 'percentage' ? (
                      <Percent className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <Euro className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <input
                      type="number"
                      value={state.discount.value || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        actions.setDiscount(state.discount.type!, value);
                      }}
                      placeholder={state.discount.type === 'percentage' ? '10' : '100'}
                      min="0"
                      max={state.discount.type === 'percentage' ? 100 : undefined}
                      className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {state.discount.type === 'percentage' && (
                      <span className="text-sm text-muted-foreground shrink-0">%</span>
                    )}
                    {state.discount.type === 'fixed' && (
                      <span className="text-sm text-muted-foreground shrink-0">€</span>
                    )}
                  </div>
                )}
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
                disabled={!selectedPackage}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Offerte Overzicht</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Klantgegevens</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Naam:</strong> {lead.name}</p>
                  {lead.company_name && <p><strong>Bedrijf:</strong> {lead.company_name}</p>}
                  <p><strong>E-mail:</strong> {lead.email}</p>
                  {lead.phone && <p><strong>Telefoon:</strong> {lead.phone}</p>}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Geselecteerde Items</h3>
                <div className="text-sm space-y-2">
                  {selectedPackage && (
                    <div className="p-3 bg-muted rounded">
                      <div className="font-medium">{selectedPackage.name}</div>
                      <div className="text-muted-foreground">€{selectedPackage.basePrice.toLocaleString('nl-BE')}</div>
                    </div>
                  )}
                  {selectedOptions
                    .filter((o) => o.price > 0 || (o.price === 0 && customPrices[o.id] > 0))
                    .map((option) => (
                      <div key={option.id} className="p-3 bg-muted rounded">
                        <div className="font-medium">{option.name}</div>
                        <div className="text-muted-foreground">
                          €{getOptionPrice(option).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {optionNotes[option.id] && (
                          <div className="mt-2 text-xs text-muted-foreground italic border-t border-border pt-2">
                            <strong>Extra info:</strong> {optionNotes[option.id]}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Totaal</span>
                  <span className="text-primary">€{total.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
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
                onClick={async () => {
                  await handleSendQuote();
                  if (!isSending) {
                    setShowReview(false);
                  }
                }}
                disabled={isSending || isSaving || !selectedPackage || !lead?.email}
                className="flex-1"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Verzenden...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Verzend Offerte
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCustomLineItemModal(false);
              setCustomLineItemName('');
              setCustomLineItemPrice('');
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Extra Kost Toevoegen</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Naam van de extra kost
              </label>
              <input
                type="text"
                value={customLineItemName}
                onChange={(e) => setCustomLineItemName(e.target.value)}
                placeholder="Bijv. Extra ontwikkeling, Setup kosten, etc."
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
              <label className="block text-sm font-medium">
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
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
