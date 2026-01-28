'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function QuoteBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const leadId = id;

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
          
          // Restore scope and timeline
          if (data.scopeDescription !== undefined) restoredState.scopeDescription = data.scopeDescription;
          if (data.timeline !== undefined) restoredState.timeline = data.timeline;
          
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
        scopeDescription: state.scopeDescription,
        timeline: state.timeline,
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
    if (option.price > 0) return option.price;
    return customPrices[option.id] || 0;
  };

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7f84300c-ac62-4dd7-94e2-7611dcdf26c7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'quote/page.tsx:475',message:'PDF download initiated',data:{hasLead:!!lead,hasPackage:!!selectedPackage,isDownloadingPDF},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    
    if (!lead || !selectedPackage) {
      alert('Selecteer eerst een pakket voordat je de offerte downloadt.');
      return;
    }

    if (isDownloadingPDF) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7f84300c-ac62-4dd7-94e2-7611dcdf26c7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'quote/page.tsx:482',message:'PDF download prevented - already downloading',data:{isDownloadingPDF},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return;
    }

    try {
      setIsDownloadingPDF(true);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7f84300c-ac62-4dd7-94e2-7611dcdf26c7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'quote/page.tsx:488',message:'Starting PDF generation',data:{leadId,packageId:selectedPackage.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
      
      // Load logo as base64
      let logoBase64: string | null = null;
      try {
        const logoResponse = await fetch('/Nudge websdesign & marketing Hasselt logo.png');
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          logoBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('Failed to convert logo to base64'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(logoBlob);
          });
        }
      } catch (logoError) {
        console.warn('Could not load logo:', logoError);
      }

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

      // Enhanced Header with gradient effect
      const headerHeight = 70;
      doc.setFillColor(144, 103, 198); // Primary purple
      doc.rect(0, 0, pageWidth, headerHeight, 'F');
      
      // Subtle gradient effect (darker bottom)
      doc.setFillColor(120, 85, 170);
      doc.rect(0, headerHeight - 10, pageWidth, 10, 'F');
      
      // Logo with transparent background
      const logoSize = 45;
      const logoX = pageWidth - margin - logoSize;
      const logoY = margin;
      
      if (logoBase64) {
        try {
          // Add logo image with transparent background
          doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize, undefined, 'FAST');
        } catch (imageError) {
          console.warn('Could not add logo image:', imageError);
          // Fallback to text if image fails
          doc.setFontSize(7);
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'normal');
          doc.text('Nudge', logoX + logoSize / 2, logoY + logoSize / 2, { align: 'center' });
        }
      } else {
        // Fallback to text if logo not loaded
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'normal');
        doc.text('Nudge', logoX + logoSize / 2, logoY + logoSize / 2, { align: 'center' });
      }
      
      // Company name and title with better typography
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(businessName, margin, margin + 18);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.text('Offerte', margin, margin + 30);
      
      // Date with better styling - positioned to avoid logo overlap
      const today = new Date();
      const dateStr = today.toLocaleDateString('nl-BE', { day: '2-digit', month: 'long', year: 'numeric' });
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      // Place date to the left of the logo with 10px spacing
      const dateX = logoX - 10;
      doc.text(`Datum: ${dateStr}`, dateX, margin + 20, { align: 'right' });

      // Reset for content
      doc.setTextColor(0, 0, 0);
      yPos = headerHeight + 20;

      // Enhanced Client information section
      let clientInfoHeight = 35;
      let clientInfoLines = 4; // Base: naam, email, phone, company
      if (lead.company_name) clientInfoLines++;
      if (lead.vat_number) clientInfoLines++;
      if (lead.company_address) clientInfoLines++;
      if (lead.company_postal_code || lead.company_city) clientInfoLines++;
      if (lead.company_country) clientInfoLines++;
      if (lead.company_website) clientInfoLines++;
      clientInfoHeight = Math.max(40, 12 + (clientInfoLines * (lineHeight + 1)) + 8);
      
      // Background with subtle border
      doc.setFillColor(248, 248, 252);
      doc.setDrawColor(144, 103, 198);
      doc.setLineWidth(1.5);
      doc.rect(margin, yPos, contentWidth, clientInfoHeight, 'FD');
      
      yPos += 10;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(144, 103, 198);
      doc.text('Klantgegevens', margin + 8, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
      
      // Divider line
      doc.setDrawColor(220, 220, 230);
      doc.setLineWidth(0.5);
      doc.line(margin + 8, yPos - 2, pageWidth - margin - 8, yPos - 2);
      yPos += 3;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      
      // Name with label styling
      doc.setFont('helvetica', 'bold');
      doc.text('Naam:', margin + 8, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(lead.name, margin + 30, yPos);
      yPos += lineHeight + 2;
      
      if (lead.company_name) {
        doc.setFont('helvetica', 'bold');
        doc.text('Bedrijf:', margin + 8, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(lead.company_name, margin + 30, yPos);
        yPos += lineHeight + 2;
      }
      
      if (lead.vat_number) {
        doc.setFont('helvetica', 'bold');
        doc.text('BTW-nummer:', margin + 8, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(lead.vat_number, margin + 30, yPos);
        yPos += lineHeight + 2;
      }
      
      if (lead.company_address) {
        doc.setFont('helvetica', 'bold');
        doc.text('Adres:', margin + 8, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(lead.company_address, margin + 30, yPos);
        yPos += lineHeight + 2;
      }
      
      if (lead.company_postal_code || lead.company_city) {
        const postalCity = [lead.company_postal_code, lead.company_city].filter(Boolean).join(' ');
        doc.setFont('helvetica', 'bold');
        doc.text('Postcode & Stad:', margin + 8, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(postalCity, margin + 30, yPos);
        yPos += lineHeight + 2;
      }
      
      if (lead.company_country) {
        doc.setFont('helvetica', 'bold');
        doc.text('Land:', margin + 8, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(lead.company_country, margin + 30, yPos);
        yPos += lineHeight + 2;
      }
      
      if (lead.email) {
        doc.setFont('helvetica', 'bold');
        doc.text('E-mail:', margin + 8, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(lead.email, margin + 30, yPos);
        yPos += lineHeight + 2;
      }
      
      if (lead.phone) {
        doc.setFont('helvetica', 'bold');
        doc.text('Telefoon:', margin + 8, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(lead.phone, margin + 30, yPos);
        yPos += lineHeight + 2;
      }
      
      if (lead.company_website) {
        doc.setFont('helvetica', 'bold');
        doc.text('Website:', margin + 8, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(lead.company_website, margin + 30, yPos);
        yPos += lineHeight + 2;
      }
      
      yPos += 5;
      
      // Project Details (Scope & Timeline)
      if (state.timeline || state.scopeDescription) {
        // Add spacing before project details
        yPos += 5;
        
        // Check if we need a new page
        checkNewPage(15);
        
        // Project Details section
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(144, 103, 198);
        doc.text('Project Details', margin + 8, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 8;
        
        // Divider line
        doc.setDrawColor(220, 220, 230);
        doc.setLineWidth(0.5);
        doc.line(margin + 8, yPos - 2, pageWidth - margin - 8, yPos - 2);
        yPos += 5;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        if (state.timeline) {
          doc.setFont('helvetica', 'bold');
          doc.text('Levertijd:', margin + 8, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(state.timeline, margin + 30, yPos);
          yPos += lineHeight + 3;
        }
        
        if (state.scopeDescription) {
          doc.setFont('helvetica', 'bold');
          doc.text('Scope Beschrijving:', margin + 8, yPos);
          yPos += lineHeight + 2;
          doc.setFont('helvetica', 'normal');
          
          // Split scope description into lines that fit the page width
          const scopeLines = doc.splitTextToSize(state.scopeDescription, contentWidth - 16);
          scopeLines.forEach((line: string) => {
            checkNewPage(5);
            doc.text(line, margin + 8, yPos);
            yPos += lineHeight + 1;
          });
          yPos += 3;
        }
        
        yPos += 5;
      }

      doc.setTextColor(0, 0, 0);
      yPos += sectionSpacing + 5;

      // Enhanced Quote items section header
      checkNewPage(30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(144, 103, 198);
      doc.text('Geselecteerde Items', margin, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 12;

      // Enhanced Table header with gradient
      doc.setFillColor(144, 103, 198);
      doc.rect(margin, yPos, contentWidth, 10, 'F');
      doc.setDrawColor(120, 85, 170);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPos, contentWidth, 10, 'S');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Omschrijving', margin + 5, yPos + 7);
      doc.text('Bedrag', pageWidth - margin - 5, yPos + 7, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPos += 12;

      // Enhanced Package row with alternating background
      checkNewPage(10);
      doc.setFillColor(252, 250, 255);
      doc.setDrawColor(230, 230, 240);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPos - 1, contentWidth, 9, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      const packageName = doc.splitTextToSize(selectedPackage.name, contentWidth - 70);
      doc.text(packageName[0], margin + 5, yPos + 6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(144, 103, 198);
      doc.text(`€ ${selectedPackage.basePrice.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 5, yPos + 6, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPos += 11;

      // Enhanced Options rows with alternating backgrounds
      let rowIndex = 0;
      selectedOptions.forEach((option) => {
        const price = getOptionPrice(option);
        if (price > 0) {
          checkNewPage(15);
          const isEven = rowIndex % 2 === 0;
          if (isEven) {
            doc.setFillColor(255, 255, 255);
          } else {
            doc.setFillColor(250, 248, 255);
          }
          doc.setDrawColor(235, 235, 245);
          doc.setLineWidth(0.5);
          doc.rect(margin, yPos - 1, contentWidth, 9, 'FD');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(50, 50, 50);
          
          let optionText = option.name;
          if (optionNotes[option.id]) {
            optionText += ` (${optionNotes[option.id]})`;
          }
          
          const optionLines = doc.splitTextToSize(optionText, contentWidth - 70);
          doc.text(optionLines[0], margin + 5, yPos + 6);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(144, 103, 198);
          doc.text(`€ ${price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 5, yPos + 6, { align: 'right' });
          doc.setTextColor(0, 0, 0);
          
          // If option text wraps, add extra lines
          if (optionLines.length > 1) {
            for (let i = 1; i < optionLines.length; i++) {
              yPos += 6;
              checkNewPage(10);
              doc.setFont('helvetica', 'normal');
              doc.text(optionLines[i], margin + 5, yPos + 6);
            }
            yPos += 2;
          }
          
          rowIndex++;
          yPos += 11;
        }
      });

      // Extra pages
      if (extraPages > 0) {
        checkNewPage(10);
        const extraPagesPrice = scopeOptions.find((o) => o.id === 'extra-pages')!.price * extraPages;
        const isEven = rowIndex % 2 === 0;
        if (isEven) {
          doc.setFillColor(255, 255, 255);
        } else {
          doc.setFillColor(250, 248, 255);
        }
        doc.setDrawColor(235, 235, 245);
        doc.setLineWidth(0.5);
        doc.rect(margin, yPos - 1, contentWidth, 9, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.text(`Extra pagina's (${extraPages}x)`, margin + 5, yPos + 6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(144, 103, 198);
        doc.text(`€ ${extraPagesPrice.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 5, yPos + 6, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        rowIndex++;
        yPos += 11;
      }

      // Content pages
      if (contentPages > 0) {
        checkNewPage(10);
        const contentPrice = growthOptions.find((o) => o.id === 'content-creation')!.price * contentPages;
        const isEven = rowIndex % 2 === 0;
        if (isEven) {
          doc.setFillColor(255, 255, 255);
        } else {
          doc.setFillColor(250, 248, 255);
        }
        doc.setDrawColor(235, 235, 245);
        doc.setLineWidth(0.5);
        doc.rect(margin, yPos - 1, contentWidth, 9, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.text(`Content creatie (${contentPages}x pagina's)`, margin + 5, yPos + 6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(144, 103, 198);
        doc.text(`€ ${contentPrice.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 5, yPos + 6, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        rowIndex++;
        yPos += 11;
      }

      // Custom line items
      if (state.customLineItems.length > 0) {
        state.customLineItems.forEach((item) => {
          checkNewPage(10);
          const isEven = rowIndex % 2 === 0;
          if (isEven) {
            doc.setFillColor(255, 255, 255);
          } else {
            doc.setFillColor(250, 248, 255);
          }
          doc.setDrawColor(235, 235, 245);
          doc.setLineWidth(0.5);
          doc.rect(margin, yPos - 1, contentWidth, 9, 'FD');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(50, 50, 50);
          const itemLines = doc.splitTextToSize(item.name, contentWidth - 70);
          doc.text(itemLines[0], margin + 5, yPos + 6);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(144, 103, 198);
          doc.text(`€ ${item.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 5, yPos + 6, { align: 'right' });
          doc.setTextColor(0, 0, 0);
          if (itemLines.length > 1) {
            for (let i = 1; i < itemLines.length; i++) {
              yPos += 6;
              checkNewPage(10);
              doc.setFont('helvetica', 'normal');
              doc.text(itemLines[i], margin + 5, yPos + 6);
            }
            yPos += 2;
          }
          rowIndex++;
          yPos += 11;
        });
      }

      // Discount
      if (state.discount.type && state.discount.value) {
        checkNewPage(10);
        doc.setFillColor(255, 245, 245);
        doc.setDrawColor(240, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(margin, yPos - 1, contentWidth, 9, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        const discountText = state.discount.type === 'percentage' 
          ? `Korting (${state.discount.value}%)`
          : `Korting (€ ${state.discount.value.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
        doc.text(discountText, margin + 5, yPos + 6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(200, 0, 0);
        doc.text(`-€ ${calculations.discountAmount.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 5, yPos + 6, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        yPos += 11;
      }

      yPos += 8;

      // Enhanced Totals section with highlight box
      checkNewPage(50);
      
      // Background box for totals
      const totalsBoxHeight = 50;
      doc.setFillColor(252, 250, 255);
      doc.setDrawColor(144, 103, 198);
      doc.setLineWidth(1.5);
      doc.rect(margin, yPos, contentWidth, totalsBoxHeight, 'FD');
      
      yPos += 12;
      
      // Subtotal
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Subtotaal (excl. BTW)', margin + 8, yPos);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(`€ ${calculations.subtotal.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 8, yPos, { align: 'right' });
      yPos += 10;

      // VAT
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('BTW (21%)', margin + 8, yPos);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(`€ ${calculations.vat.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 8, yPos, { align: 'right' });
      yPos += 12;

      // Divider line
      doc.setDrawColor(200, 190, 220);
      doc.setLineWidth(1);
      doc.line(margin + 8, yPos, pageWidth - margin - 8, yPos);
      yPos += 10;

      // Total - highlighted
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(144, 103, 198);
      doc.text('Totaal (incl. BTW)', margin + 8, yPos);
      doc.setFontSize(18);
      doc.text(`€ ${calculations.total.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 8, yPos, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPos += 15;

      // Enhanced Maintenance if selected
      if (selectedMaintenance) {
        checkNewPage(15);
        doc.setFillColor(240, 238, 250);
        doc.setDrawColor(144, 103, 198);
        doc.setLineWidth(1);
        doc.rect(margin, yPos, contentWidth, 14, 'FD');
        yPos += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(144, 103, 198);
        doc.text('Onderhoud (per maand)', margin + 8, yPos);
        doc.setFontSize(12);
        doc.text(`€ ${selectedMaintenance.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 8, yPos, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        yPos += 15;
      }

      // Enhanced Footer on last page
      const footerY = pageHeight - 55;
      
      // Footer background
      doc.setFillColor(248, 248, 252);
      doc.rect(0, footerY - 5, pageWidth, pageHeight - footerY + 5, 'F');
      
      // Footer top border
      doc.setDrawColor(144, 103, 198);
      doc.setLineWidth(1);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(144, 103, 198);
      doc.text('Contactgegevens', margin, footerY + 5);
      doc.setTextColor(0, 0, 0);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(businessEmail, margin, footerY + 12);
      doc.text(businessPhone, margin, footerY + 19);
      doc.text(businessAddress, margin, footerY + 26);
      
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'italic');
      const footerText = 'Dit is een automatisch gegenereerde offerte. Voor vragen, neem contact op via bovenstaande gegevens.';
      doc.text(footerText, margin, footerY + 35, { maxWidth: contentWidth });

      // Generate filename
      const fileName = `Offerte_${lead.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7f84300c-ac62-4dd7-94e2-7611dcdf26c7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'quote/page.tsx:1079',message:'PDF generation completed, saving file',data:{fileName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
      
      // Save PDF
      doc.save(fileName);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7f84300c-ac62-4dd7-94e2-7611dcdf26c7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'quote/page.tsx:1084',message:'PDF download successful',data:{fileName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7f84300c-ac62-4dd7-94e2-7611dcdf26c7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'quote/page.tsx:1087',message:'PDF generation error',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('Error generating PDF:', error);
      alert('Fout bij genereren PDF. Probeer het opnieuw.');
    } finally {
      setIsDownloadingPDF(false);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7f84300c-ac62-4dd7-94e2-7611dcdf26c7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'quote/page.tsx:1094',message:'PDF download finished',data:{isDownloadingPDF:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
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
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Offerte Builder</h1>
            <p className="text-muted-foreground">
              Voor: <span className="font-medium">{lead.name}</span>
              {lead.company_name && ` - ${lead.company_name}`}
            </p>
          </div>
          <div className="flex gap-2">
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
                          {pkg.features.join(' • ')}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Project Details - Scope & Timeline */}
          {selectedPackage && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('project-details')}
                className="w-full p-6 flex items-center justify-between hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Project Details</h2>
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
                    <h2 className="text-xl font-bold">Onderhoud & Analytics (maandelijks)</h2>
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
                    {maintenanceOptions.filter(opt => opt.id.startsWith('maintenance-')).map((option) => {
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
                        </div>
                      );
                    })}
                    
                    {/* Analytics & Reporting (as separate option) */}
                    {maintenanceOptions.filter(opt => opt.id === 'analytics-reporting').map((option) => {
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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
                          € {selectedPackage.basePrice.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                            € {getOptionPrice(option).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                          € {(state.extraPages * 100).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                          € {(state.contentPages * 125).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                              € {item.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                </div>

                {/* Maintenance */}
                {selectedMaintenance && (
                  <div className="border-t border-primary/30 pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Onderhoud (per maand)</span>
                      <span className="font-medium text-primary">
                        € {selectedMaintenance.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                onClick={() => {
                  alert('E-mail verzenden is tijdelijk uitgeschakeld. Gebruik de PDF download om de offerte te delen.');
                }}
                disabled={true}
                className="flex-1 opacity-50 cursor-not-allowed"
                title="E-mail verzenden is tijdelijk uitgeschakeld. Gebruik de PDF download."
              >
                <Mail className="w-4 h-4 mr-2" />
                Verzend Offerte (Uitgeschakeld)
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
