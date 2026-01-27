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

export default function QuoteBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<PricingPackage | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<PricingOption[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({}); // Store custom prices for "op offerte" items
  const [optionNotes, setOptionNotes] = useState<Record<string, string>>({}); // Store extra notes/info per option
  const [selectedMaintenance, setSelectedMaintenance] = useState<PricingOption | null>(null);
  const [extraPages, setExtraPages] = useState(0);
  const [contentPages, setContentPages] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  // UI State
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['packages']));
  const [packageCategory, setPackageCategory] = useState<'website' | 'webshop' | 'webapp'>('website');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (leadId) {
      loadLead();
      loadSavedQuote();
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [leadId]);

  // Auto-save quote when selections change (debounced)
  useEffect(() => {
    if (!selectedPackage || !lead) return;

    const saveTimeout = setTimeout(() => {
      saveQuoteDraft();
    }, 2000); // Save 2 seconds after last change

    return () => clearTimeout(saveTimeout);
  }, [selectedPackage, selectedOptions, customPrices, selectedMaintenance, extraPages, contentPages]);

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
          
          // Restore package
          if (data.selectedPackage) {
            const pkg = packages.find(p => p.id === data.selectedPackage.id);
            if (pkg) setSelectedPackage(pkg);
          }
          
          // Restore options - need to find full option objects from pricing config
          if (data.selectedOptions && Array.isArray(data.selectedOptions)) {
            const restoredOptions: PricingOption[] = [];
            data.selectedOptions.forEach((savedOpt: any) => {
              // Try to find in all option arrays
              const allOptions = [...scopeOptions, ...complexityOptions, ...growthOptions, ...maintenanceOptions];
              const found = allOptions.find(opt => opt.id === savedOpt.id);
              if (found) {
                restoredOptions.push(found);
              }
            });
            setSelectedOptions(restoredOptions);
          }
          
          // Restore custom prices
          if (data.customPrices) {
            setCustomPrices(data.customPrices);
          }
          
          // Restore option notes
          if (data.optionNotes) {
            setOptionNotes(data.optionNotes);
          }
          
          // Restore maintenance
          if (data.selectedMaintenance) {
            const maint = maintenanceOptions.find(m => m.id === data.selectedMaintenance.id);
            if (maint) setSelectedMaintenance(maint);
          }
          
          // Restore counters
          if (data.extraPages) setExtraPages(data.extraPages);
          if (data.contentPages) setContentPages(data.contentPages);
          
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
    if (!selectedPackage || !lead || isSaving) return;

    try {
      setIsSaving(true);
      
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
    const isSelected = selectedOptions.some((o) => o.id === option.id);
    if (isSelected) {
      setSelectedOptions(selectedOptions.filter((o) => o.id !== option.id));
      // Remove custom price if it exists
      if (customPrices[option.id]) {
        const newCustomPrices = { ...customPrices };
        delete newCustomPrices[option.id];
        setCustomPrices(newCustomPrices);
      }
      // Remove notes if they exist
      if (optionNotes[option.id]) {
        const newNotes = { ...optionNotes };
        delete newNotes[option.id];
        setOptionNotes(newNotes);
      }
    } else {
      setSelectedOptions([...selectedOptions, option]);
      // If price is 0, initialize custom price as empty (user will fill it)
      if (option.price === 0 && !customPrices[option.id]) {
        setCustomPrices({ ...customPrices, [option.id]: 0 });
      }
    }
  };

  const updateCustomPrice = (optionId: string, price: number) => {
    setCustomPrices({ ...customPrices, [optionId]: price });
  };

  const handleMouseEnter = (itemId: string, event: React.MouseEvent) => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    // Store mouse position
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    // Show tooltip after 1.5 seconds
    const timeout = setTimeout(() => {
      setHoveredItem(itemId);
    }, 1500);
    setHoverTimeout(timeout);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    // Check if mouse is still over the element
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    const isOverElement = (
      mouseX >= rect.left &&
      mouseX <= rect.right &&
      mouseY >= rect.top &&
      mouseY <= rect.bottom
    );

    if (isOverElement) {
      // Update tooltip position as mouse moves
      if (hoveredItem) {
        setTooltipPosition({ x: mouseX, y: mouseY });
      } else {
        // Store position for when tooltip appears
        setTooltipPosition({ x: mouseX, y: mouseY });
      }
    } else {
      // Mouse moved away from element - hide tooltip
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
      setHoveredItem(null);
      setTooltipPosition(null);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setHoveredItem(null);
    setTooltipPosition(null);
  };

  const getTotal = () => {
    let total = selectedPackage?.basePrice || 0;

    selectedOptions.forEach((option) => {
      if (option.price > 0) {
        total += option.price;
      } else if (option.price === 0 && customPrices[option.id]) {
        // Use custom price for "op offerte" items
        total += customPrices[option.id] || 0;
      }
    });

    const extraPagesOption = scopeOptions.find((o) => o.id === 'extra-pages');
    if (extraPagesOption && extraPages > 0) {
      total += extraPagesOption.price * extraPages;
    }

    const contentOption = growthOptions.find((o) => o.id === 'content-creation');
    if (contentOption && contentPages > 0) {
      total += contentOption.price * contentPages;
    }

    return total;
  };

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
      const businessName = 'Almost 3000 BV';
      const businessEmail = 'brecht.leap@gmail.com';
      const businessPhone = '+32494299633';
      const businessAddress = 'Herkenrodesingel 19C/4.2, 3500 Hasselt, België';
      
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);

      // Header
      doc.setFillColor(36, 32, 56); // Midnight Violet
      doc.rect(0, 0, pageWidth, 50, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(businessName, margin, 30);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Offerte', margin, 40);

      // Reset text color
      doc.setTextColor(0, 0, 0);
      yPos = 60;

      // Client info
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Voor:', margin, yPos);
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(lead.name, margin, yPos);
      yPos += 6;
      if (lead.company_name) {
        doc.text(lead.company_name, margin, yPos);
        yPos += 6;
      }
      if (lead.email) {
        doc.text(lead.email, margin, yPos);
        yPos += 6;
      }
      if (lead.phone) {
        doc.text(lead.phone, margin, yPos);
        yPos += 6;
      }

      yPos += 10;

      // Quote details
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Offerte Details', margin, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      // Package
      doc.setFont('helvetica', 'bold');
      doc.text('Basis Pakket:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      const packageText = `${selectedPackage.name} - €${selectedPackage.basePrice.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      doc.text(packageText, margin + 50, yPos);
      yPos += 8;

      // Options
      if (selectedOptions.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Extra Opties:', margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        selectedOptions.forEach((option) => {
          const price = getOptionPrice(option);
          if (price > 0) {
            const optionText = `• ${option.name} - €${price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const lines = doc.splitTextToSize(optionText, maxWidth - 50);
            lines.forEach((line: string) => {
              if (yPos > 250) {
                doc.addPage();
                yPos = 20;
              }
              doc.text(line, margin + 10, yPos);
              yPos += 6;
            });
            
            // Add note if exists
            if (optionNotes[option.id]) {
              doc.setFontSize(9);
              doc.setTextColor(100, 100, 100);
              const noteText = `  ℹ️ ${optionNotes[option.id]}`;
              const noteLines = doc.splitTextToSize(noteText, maxWidth - 60);
              noteLines.forEach((line: string) => {
                if (yPos > 250) {
                  doc.addPage();
                  yPos = 20;
                }
                doc.text(line, margin + 20, yPos);
                yPos += 5;
              });
              doc.setFontSize(11);
              doc.setTextColor(0, 0, 0);
              yPos += 2;
            }
          }
        });
        yPos += 4;
      }

      // Extra pages
      if (extraPages > 0) {
        const extraPagesPrice = scopeOptions.find((o) => o.id === 'extra-pages')!.price * extraPages;
        doc.text(`Extra pagina's (${extraPages}x) - €${extraPagesPrice.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
        yPos += 6;
      }

      // Content pages
      if (contentPages > 0) {
        const contentPrice = growthOptions.find((o) => o.id === 'content-creation')!.price * contentPages;
        doc.text(`Content creatie (${contentPages}x) - €${contentPrice.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPos);
        yPos += 6;
      }

      // Maintenance
      if (selectedMaintenance) {
        yPos += 4;
        doc.setFont('helvetica', 'bold');
        doc.text('Onderhoud:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`€${selectedMaintenance.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per maand`, margin + 50, yPos);
        yPos += 8;
      }

      // Total
      yPos += 6;
      doc.setDrawColor(144, 103, 198); // Lavender Purple
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const totalText = `Totaal (eenmalig): €${getTotal().toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      doc.text(totalText, margin, yPos);
      yPos += 10;

      if (selectedMaintenance) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Onderhoud: €${selectedMaintenance.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per maand`, margin, yPos);
        yPos += 10;
      }

      // Footer
      yPos = doc.internal.pageSize.getHeight() - 60;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Contactgegevens:', margin, yPos);
      yPos += 5;
      doc.text(`E-mail: ${businessEmail}`, margin, yPos);
      yPos += 5;
      doc.text(`Telefoon: ${businessPhone}`, margin, yPos);
      yPos += 5;
      doc.text(businessAddress, margin, yPos);
      yPos += 8;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Dit is een automatisch gegenereerde offerte. Voor vragen, neem contact op via bovenstaande gegevens.', margin, yPos, { maxWidth: maxWidth });

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
          const errorData = await sendResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP ${sendResponse.status}: ${sendResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await sendResponse.json();
      
      setLastSaved(new Date());
      setShowReview(false);
      alert('Offerte succesvol verzonden via e-mail!');
      router.push(`/admin/leads/${leadId}`);
    } catch (error: any) {
      console.error('Error sending quote:', {
        error,
        message: error?.message,
        leadId,
        leadEmail: lead?.email,
      });
      alert(`Fout bij verzenden offerte: ${error?.message || 'Onbekende fout'}`);
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
    } catch (error: any) {
      console.error('Error saving quote:', error);
      alert(`Fout bij opslaan offerte: ${error.message || 'Onbekende fout'}`);
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
      {/* Tooltips - rendered outside of sections to prevent layout shifts */}
      {hoveredItem && tooltipPosition && (
        <div
          className="fixed z-[9999] w-80 max-w-[calc(100vw-2rem)] bg-card border-2 border-primary shadow-2xl rounded-lg p-4 pointer-events-none"
          style={{
            left: `${Math.min(tooltipPosition.x + 15, typeof window !== 'undefined' ? window.innerWidth - 340 : 0)}px`,
            top: `${Math.min(tooltipPosition.y + 15, typeof window !== 'undefined' ? window.innerHeight - 200 : 0)}px`,
          }}
        >
          {hoveredItem.startsWith('package-') && (() => {
            const pkg = filteredPackages.find(p => hoveredItem === `package-${p.id}`);
            if (!pkg) return null;
            return (
              <>
                <h4 className="font-bold text-lg mb-2">{pkg.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Inbegrepen:</div>
                  {pkg.features.map((feature, idx) => (
                    <div key={idx} className="text-sm flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
          
          {hoveredItem.startsWith('option-') && (() => {
            const allOptions = [...scopeOptions, ...complexityOptions, ...growthOptions];
            const option = allOptions.find(o => hoveredItem === `option-${o.id}`);
            if (!option) return null;
            
            // Get detailed explanation based on option type
            const getDetailedExplanation = () => {
              switch (option.id) {
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
            
            const detailed = getDetailedExplanation();
            
            return (
              <>
                <h4 className="font-bold text-lg mb-2">{option.name}</h4>
                {detailed ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">{detailed.description}</p>
                    {detailed.examples && detailed.examples.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-muted-foreground mb-2">Inbegrepen:</div>
                        {detailed.examples.map((example, idx) => (
                          <div key={idx} className="text-sm flex items-start gap-2">
                            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span>{example}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  option.description && (
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  )
                )}
              </>
            );
          })()}
          
          {hoveredItem.startsWith('maintenance-') && (() => {
            const option = maintenanceOptions.find(o => hoveredItem === `maintenance-${o.id}`);
            if (!option) return null;
            
            const getMaintenanceDetails = () => {
              switch (option.id) {
                case 'maintenance-starter':
                  return {
                    description: 'Basis onderhoudspakket voor kleine websites.',
                    features: [
                      'Maandelijkse updates (plugins, themes, core)',
                      'Automatische dagelijkse backups',
                      'SSL certificaat beheer',
                      'Basis firewall beveiliging',
                      'Email support (binnen 48u)',
                    ],
                  };
                case 'maintenance-business':
                  return {
                    description: 'Professioneel onderhoudspakket voor KMO websites.',
                    features: [
                      'Wekelijkse updates',
                      'Real-time backups (bij elke wijziging)',
                      'Geavanceerde beveiliging',
                      'Prioriteit support (binnen 24u)',
                      'Uptime monitoring',
                      'Performance optimalisatie',
                    ],
                  };
                case 'maintenance-growth':
                  return {
                    description: 'Premium onderhoudspakket voor groeiende bedrijven.',
                    features: [
                      'Dagelijkse updates',
                      'Onbeperkte backups',
                      'Premium beveiliging (malware scanning)',
                      'Telefonische support (binnen 4u)',
                      'Performance optimalisatie',
                      'Maandelijkse rapportage',
                      'Proactieve monitoring',
                    ],
                  };
                default:
                  return null;
              }
            };
            
            const details = getMaintenanceDetails();
            
            return (
              <>
                <h4 className="font-bold text-lg mb-2">{option.name}</h4>
                {details ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">{details.description}</p>
                    {details.features && details.features.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-muted-foreground mb-2">Inbegrepen:</div>
                        {details.features.map((feature, idx) => (
                          <div key={idx} className="text-sm flex items-start gap-2">
                            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  option.description && (
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  )
                )}
              </>
            );
          })()}
          
        </div>
      )}
      
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
                      onMouseEnter={(e) => handleMouseEnter(`package-${pkg.id}`, e)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    >
                      <button
                        onClick={() => {
                          setSelectedPackage(pkg);
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
                          {selectedPackage?.id === pkg.id && (
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
                    {selectedOptions.filter((o) => o.category === 'scope').length > 0 && (
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
                        <div className="font-semibold mb-1">Extra pagina's</div>
                        <div className="text-sm text-muted-foreground">€100 per pagina</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setExtraPages(Math.max(0, extraPages - 1))}
                          disabled={extraPages === 0}
                          className="w-10 h-10 rounded-lg border-2 border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-16 text-center font-bold text-lg">{extraPages}</span>
                        <button
                          onClick={() => setExtraPages(extraPages + 1)}
                          className="w-10 h-10 rounded-lg border-2 border-primary bg-primary text-white hover:bg-primary/90 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {extraPages > 0 && (
                          <span className="ml-2 font-semibold text-primary">
                            €{(extraPages * 100).toLocaleString('nl-BE')}
                          </span>
                        )}
                      </div>
                    </div>

                    {scopeOptions.filter((o) => o.id !== 'extra-pages').map((option) => {
                      const isSelected = selectedOptions.some((o) => o.id === option.id);
                      return (
                        <div
                          key={option.id}
                          className="relative"
                          onMouseEnter={(e) => handleMouseEnter(`option-${option.id}`, e)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div
                            className={`w-full p-4 border-2 rounded-lg transition-all ${
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
                                      value={customPrices[option.id] || ''}
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
                                  onClick={() => toggleOption(option)}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
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
                              <div className="mt-3 pt-3 border-t border-border">
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                  Extra info / Toelichting
                                </label>
                                <textarea
                                  value={optionNotes[option.id] || ''}
                                  onChange={(e) => {
                                    setOptionNotes(prev => ({
                                      ...prev,
                                      [option.id]: e.target.value
                                    }));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Voeg extra informatie toe over deze optie (bijv. specifieke wensen, details, etc.)"
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
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
                    {selectedOptions.filter((o) => o.category === 'complexity').length > 0 && (
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
                      const isSelected = selectedOptions.some((o) => o.id === option.id);
                      return (
                        <div
                          key={option.id}
                          className="relative"
                          onMouseEnter={(e) => handleMouseEnter(`option-${option.id}`, e)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div
                            className={`w-full p-4 border-2 rounded-lg transition-all ${
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
                                      value={customPrices[option.id] || ''}
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
                                  onClick={() => toggleOption(option)}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
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
                              <div className="mt-3 pt-3 border-t border-border">
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                  Extra info / Toelichting
                                </label>
                                <textarea
                                  value={optionNotes[option.id] || ''}
                                  onChange={(e) => {
                                    setOptionNotes(prev => ({
                                      ...prev,
                                      [option.id]: e.target.value
                                    }));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Voeg extra informatie toe over deze optie (bijv. specifieke wensen, details, etc.)"
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
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
                    {selectedOptions.filter((o) => o.category === 'growth').length > 0 && (
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
                      onMouseEnter={(e) => handleMouseEnter('option-content-creation', e)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div>
                        <div className="font-semibold mb-1">Content creatie</div>
                        <div className="text-sm text-muted-foreground">€125 per pagina</div>
                        <div className="text-xs text-muted-foreground/80 mt-1">
                          Professionele tekst schrijven voor pagina's of blog posts
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setContentPages(Math.max(0, contentPages - 1))}
                          disabled={contentPages === 0}
                          className="w-10 h-10 rounded-lg border-2 border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-16 text-center font-bold text-lg">{contentPages}</span>
                        <button
                          onClick={() => setContentPages(contentPages + 1)}
                          className="w-10 h-10 rounded-lg border-2 border-primary bg-primary text-white hover:bg-primary/90 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {contentPages > 0 && (
                          <span className="ml-2 font-semibold text-primary">
                            €{(contentPages * 125).toLocaleString('nl-BE')}
                          </span>
                        )}
                      </div>
                    </div>

                    {growthOptions.filter((o) => o.id !== 'content-creation').map((option) => {
                      const isSelected = selectedOptions.some((o) => o.id === option.id);
                      return (
                        <div
                          key={option.id}
                          className="relative"
                          onMouseEnter={(e) => handleMouseEnter(`option-${option.id}`, e)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div
                            className={`w-full p-4 border-2 rounded-lg transition-all ${
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
                                      value={customPrices[option.id] || ''}
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
                                  onClick={() => toggleOption(option)}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
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
                              <div className="mt-3 pt-3 border-t border-border">
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                  Extra info / Toelichting
                                </label>
                                <textarea
                                  value={optionNotes[option.id] || ''}
                                  onChange={(e) => {
                                    setOptionNotes(prev => ({
                                      ...prev,
                                      [option.id]: e.target.value
                                    }));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Voeg extra informatie toe over deze optie (bijv. specifieke wensen, details, etc.)"
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
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
                          onMouseEnter={(e) => handleMouseEnter(`maintenance-${option.id}`, e)}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleMouseLeave}
                        >
                          <button
                            onClick={() => setSelectedMaintenance(option)}
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
                          {hoveredItem === `maintenance-${option.id}` && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-card border-2 border-primary shadow-2xl rounded-lg p-4">
                              <h4 className="font-bold text-lg mb-2">{option.name}</h4>
                              {option.description && (
                                <p className="text-sm text-muted-foreground">{option.description}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar - Total */}
        <div className="space-y-6">
          <div className="bg-card border-2 border-primary/20 rounded-lg p-6 sticky top-6 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Totaal</h2>
            </div>

            <div className="space-y-3 mb-6">
              {selectedPackage ? (
                <>
                  <div className="pb-3 border-b border-border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{selectedPackage.name}</span>
                      <span className="font-bold text-lg text-primary">
                        €{selectedPackage.basePrice.toLocaleString('nl-BE')}
                      </span>
                    </div>
                  </div>

                  {(extraPages > 0 || contentPages > 0 || selectedOptions.filter((o) => o.price > 0).length > 0) && (
                    <div className="space-y-2 text-sm">
                      {extraPages > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Extra pagina's ({extraPages}x)</span>
                          <span className="font-medium">
                            €{(scopeOptions.find((o) => o.id === 'extra-pages')!.price * extraPages).toLocaleString('nl-BE')}
                          </span>
                        </div>
                      )}

                      {contentPages > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Content creatie ({contentPages}x)</span>
                          <span className="font-medium">
                            €{(growthOptions.find((o) => o.id === 'content-creation')!.price * contentPages).toLocaleString('nl-BE')}
                          </span>
                        </div>
                      )}

                      {selectedOptions
                        .filter((o) => o.price > 0 || (o.price === 0 && customPrices[o.id] > 0))
                        .map((option) => (
                          <div key={option.id} className="flex justify-between">
                            <span className="text-muted-foreground">{option.name}</span>
                            <span className="font-medium">
                              €{getOptionPrice(option).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                  <div className="border-t-2 border-primary pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Totaal (eenmalig)</span>
                      <span className="text-2xl font-bold text-primary">
                        €{total.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {selectedMaintenance && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Onderhoud</span>
                        <span className="font-semibold text-primary">
                          €{selectedMaintenance.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/maand
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedOptions.some((o) => o.price === 0 && (!customPrices[o.id] || customPrices[o.id] === 0)) && (
                    <div className="mt-3 text-xs text-muted-foreground italic bg-yellow-50 p-2 rounded border border-yellow-200">
                      * Vul een prijs in voor items "op offerte"
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Selecteer eerst een basis pakket</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
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
    </>
  );
}
