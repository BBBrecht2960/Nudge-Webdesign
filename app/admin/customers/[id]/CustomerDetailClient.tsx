'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Customer, type CustomerActivity, type CustomerAttachment, type CustomerUpdate, type CustomerProgressHistory } from '@/lib/db';
import { Button } from '@/app/components/Button';
import {
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  Image as ImageIcon,
  File,
  Code,
  Copy,
  CheckCircle2,
  Plus,
  TrendingUp,
  Flag,
  AlertTriangle,
  Edit,
  History,
  Trash2,
  Download,
  User,
  Paperclip,
  Upload,
  Pencil,
  X,
} from 'lucide-react';
import { generateQuotePdfBlob, type ApprovedQuoteData } from '@/lib/quotePdf';

type CustomerTabId = 'overview' | 'offerte' | 'updates' | 'activiteiten' | 'bijlagen';

function CustomerDetailClientInner({ customerId }: { customerId: string }) {
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [attachments, setAttachments] = useState<CustomerAttachment[]>([]);
  const [updates, setUpdates] = useState<CustomerUpdate[]>([]);
  const [progressHistory, setProgressHistory] = useState<CustomerProgressHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [projectStatus, setProjectStatus] = useState<string>('');
  const [showDeleteCustomerModal, setShowDeleteCustomerModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeCustomerTab, setActiveCustomerTab] = useState<CustomerTabId>('overview');
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [editCompany, setEditCompany] = useState<Partial<Customer>>({});
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form state
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');
  const [updateType, setUpdateType] = useState<'progress' | 'milestone' | 'issue' | 'note' | 'change'>('progress');
  const [updateProgress, setUpdateProgress] = useState<number | undefined>(undefined);
  const [updateMilestone, setUpdateMilestone] = useState('');
  const [isSavingUpdate, setIsSavingUpdate] = useState(false);

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadCustomerData is stable, customerId is the trigger
  }, [customerId]);

  useEffect(() => {
    if (customer) {
      setProjectStatus(customer.project_status);
    }
  }, [customer]);

  // Revoke PDF blob URL on unmount to avoid memory leaks
  useEffect(() => {
    const url = pdfBlobUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [pdfBlobUrl]);

  const loadCustomerData = async () => {
    try {
      setIsLoading(true);

      // Load customer
      const customerRes = await fetch(`/api/customers/${customerId}`, { credentials: 'include' });
      if (!customerRes.ok) {
        if (customerRes.status === 404) {
          setCustomer(null);
          return;
        }
        throw new Error(customerRes.statusText || 'Failed to load customer');
      }
      const customerData = await customerRes.json();
      setCustomer(customerData);

      // Load activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('customer_activities')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (activitiesError) console.error('Error loading activities:', activitiesError);
      setActivities(activitiesData || []);

      // Load attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('customer_attachments')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (attachmentsError) console.error('Error loading attachments:', attachmentsError);
      setAttachments(attachmentsData || []);

      // Load updates
      const updatesResponse = await fetch(`/api/customers/${customerId}/updates`);
      if (updatesResponse.ok) {
        const updatesData = await updatesResponse.json();
        setUpdates(updatesData.updates || []);
      }

      // Load progress history
      const { data: historyData, error: historyError } = await supabase
        .from('customer_progress_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (historyError) console.error('Error loading progress history:', historyError);
      setProgressHistory(historyData || []);
    } catch (error) {
      console.error('Error loading customer data:', error);
      alert('Fout bij het laden van customer data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    
    if (!customer || customer.project_status === newStatus) {
      return;
    }

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    
    try {
      const oldStatus = customer.project_status;
      
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({ project_status: newStatus })
        .eq('id', customerId)
        .select()
        .single();

      if (updateError) {
        // Log full error object to understand structure
        console.error('Full updateError object:', JSON.stringify(updateError, null, 2));
        console.error('updateError type:', typeof updateError);
        console.error('updateError keys:', Object.keys(updateError || {}));
        
        type ErrShape = { code?: string; error_code?: string; message?: string; error_message?: string; details?: unknown; error_details?: unknown; hint?: string; error_hint?: string };
        const err = updateError as ErrShape;
        const errorCode = err?.code || err?.error_code;
        const errorMessage = err?.message || err?.error_message || String(updateError);
        const errorDetails = err?.details || err?.error_details;
        const errorHint = err?.hint || err?.error_hint;
        
        const errorInfo = {
          code: errorCode,
          message: errorMessage,
          details: errorDetails,
          hint: errorHint,
          raw: updateError,
        };
        
        console.error('Error updating customer status:', errorInfo);
        
        // Check if it's a constraint violation (e.g., canceled not in CHECK constraint)
        if (errorCode === '23514' || errorMessage?.includes('check constraint') || errorMessage?.includes('CHECK constraint')) {
          throw new Error('De status "Geannuleerd" is nog niet toegevoegd aan de database. Voer add-canceled-status.sql uit in Supabase.');
        }
        
        // Check if it's a null constraint or other database error
        if (errorCode === '23502' || errorMessage?.includes('null value')) {
          throw new Error('Een verplicht veld ontbreekt. Probeer opnieuw.');
        }
        
        throw new Error(errorMessage || 'Fout bij bijwerken status');
      }

      // If customer is canceled, also update related lead to "lost"
      if (newStatus === 'canceled' && customer.lead_id) {
        
        try {
          const { error: leadUpdateError } = await supabase
            .from('leads')
            .update({ status: 'lost' })
            .eq('id', customer.lead_id);


          if (leadUpdateError) {
            console.warn('Error updating related lead to lost:', leadUpdateError);
            // Don't fail the customer update, just log the warning
          }
        } catch (leadErr) {
          console.warn('Error updating related lead to lost:', leadErr);
        }
      }

      // Add to progress history (non-blocking - don't fail if table doesn't exist)
      try {
        const { error: historyError } = await supabase
          .from('customer_progress_history')
          .insert({
            customer_id: customerId,
            old_status: oldStatus,
            new_status: newStatus,
            changed_by: 'Admin',
          });

        if (historyError) {
          // Check if table doesn't exist
          if (historyError.code === '42P01' || historyError.message?.includes('does not exist')) {
            console.warn('customer_progress_history table does not exist. Run create-customer-updates-table.sql');
          } else {
            console.warn('Error adding to progress history (non-critical):', historyError);
          }
        }
      } catch (historyErr) {
        console.warn('Error adding to progress history (non-critical):', historyErr);
      }

      if (updatedCustomer) {
        setCustomer(updatedCustomer);
        setProjectStatus(newStatus);
      } else {
        // Reload customer data if update didn't return data
        loadCustomerData();
      }
      
      // Reload progress history (non-blocking)
      try {
        const { data: historyData } = await supabase
          .from('customer_progress_history')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });
        setProgressHistory(historyData || []);
      } catch (historyErr) {
        console.warn('Error reloading progress history:', historyErr);
      }
    } catch (error: unknown) {
      // Better error handling
      let errorMessage = 'Onbekende fout';
      let errorDetails = '';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as { code?: string; message?: string; details?: string; hint?: string };
        errorMessage = errorObj.message || errorMessage;
        errorDetails = [
          errorObj.code ? `Code: ${errorObj.code}` : '',
          errorObj.details ? `Details: ${errorObj.details}` : '',
          errorObj.hint ? `Hint: ${errorObj.hint}` : '',
        ].filter(Boolean).join(', ');
      }

      console.error('Error updating customer status:', {
        error,
        errorMessage,
        errorDetails,
        customerId,
        newStatus,
      });

      // Check for specific error types
      if (errorMessage.includes('check constraint') || errorMessage.includes('23514')) {
        alert('De status "Geannuleerd" is nog niet toegevoegd aan de database. Voer add-canceled-status.sql uit in Supabase.');
      } else {
        alert(`Fout bij het bijwerken van de status: ${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    
    if (!customer || !customerId) return;
    
    const customerDisplayName = customer.company_name || customer.name;
    if (deleteConfirmName !== customerDisplayName) {
      alert('De naam komt niet overeen. Typ de exacte naam om te bevestigen.');
      return;
    }

    if (isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      
      
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });


      if (!response.ok) {
        let errorMessage = 'Fout bij verwijderen';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }


      // Redirect to customers list
      router.push('/admin/customers');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Fout bij verwijderen van klant';
      console.error('Error deleting customer:', {
        error,
        message: errorMessage,
        customerId,
      });
      alert(errorMessage);
      setIsDeleting(false);
    }
  };

  const handleAddUpdate = async () => {
    
    if (!updateTitle.trim() || !updateDescription.trim()) {
      alert('Titel en beschrijving zijn verplicht');
      return;
    }

    if (isSavingUpdate) {
      return;
    }

    setIsSavingUpdate(true);
    
    try {
      
      const response = await fetch(`/api/customers/${customerId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updateTitle,
          description: updateDescription,
          update_type: updateType,
          progress_percentage: updateProgress,
          milestone: updateMilestone || null,
          created_by: 'Admin',
        }),
      });


      if (!response.ok) {
        let errorMessage = 'Fout bij opslaan update';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          
          
          // Check for specific error about missing table
          if (errorData.error?.includes('tabel bestaat niet')) {
            errorMessage = `${errorData.error}\n\nVoer het SQL script uit in Supabase om de tabel aan te maken.`;
          }
        } catch {
          const responseText = await response.text();
          errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      const { update } = responseData;
      
      setUpdates([update, ...updates]);
      
      // Reset form
      setUpdateTitle('');
      setUpdateDescription('');
      setUpdateType('progress');
      setUpdateProgress(undefined);
      setUpdateMilestone('');
      setShowUpdateForm(false);
    } catch (error) {
      console.error('Error adding update:', error);
      const errorMessage = error instanceof Error ? error.message : 'Fout bij toevoegen update';
      
      // Show more detailed error message
      if (errorMessage.includes('tabel bestaat niet')) {
        alert(`⚠️ Database Setup Vereist\n\n${errorMessage}\n\nVoer "create-customer-updates-table.sql" uit in je Supabase SQL Editor.`);
      } else {
        alert(`Fout bij toevoegen update:\n\n${errorMessage}`);
      }
    } finally {
      setIsSavingUpdate(false);
    }
  };

  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return <Flag className="w-4 h-4" />;
      case 'issue':
        return <AlertTriangle className="w-4 h-4" />;
      case 'change':
        return <Edit className="w-4 h-4" />;
      case 'note':
        return <FileText className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'milestone':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'issue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'change':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'note':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const copyPromptToClipboard = async () => {
    if (!customer?.cursor_prompt) return;
    
    try {
      await navigator.clipboard.writeText(customer.cursor_prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Fout bij kopiëren naar clipboard');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_hold':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 font-semibold';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'Nieuw',
      in_progress: 'In Uitvoering',
      review: 'In Review',
      completed: 'Voltooid',
      on_hold: 'On Hold',
      canceled: 'Geannuleerd',
    };
    return labels[status] || status;
  };

  const handleSaveCompany = async () => {
    if (!customerId || isSavingCompany) return;
    setIsSavingCompany(true);
    try {
      const payload = Object.fromEntries(Object.entries(editCompany).filter(([, v]) => v !== undefined && v !== ''));
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Fout bij opslaan');
      }
      const updated = await res.json();
      setCustomer(updated);
      setShowEditCompany(false);
      setEditCompany({});
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fout bij opslaan');
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !customerId || isUploadingAttachment) return;
    setIsUploadingAttachment(true);
    e.target.value = '';
    try {
      const formData = new FormData();
      formData.set('file', file);
      const res = await fetch(`/api/customers/${customerId}/upload`, { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload mislukt');
      setAttachments((prev) => [data.attachment, ...prev]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fout bij uploaden');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">Laden...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Customer niet gevonden</p>
          <Button onClick={() => router.push('/admin/customers')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar Klanten
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
      {/* Back + Header */}
      <div className="mb-8">
        <Button
          onClick={() => router.push('/admin/customers')}
          variant="outline"
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug naar klanten
        </Button>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Klantgegevens</p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">
              {customer.company_name || customer.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 min-w-0">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="break-all">{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-1 min-w-0">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span className="break-all">{customer.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 min-w-0">
            <button
              onClick={() => setShowDeleteCustomerModal(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
              title="Klant verwijderen"
            >
              <Trash2 className="w-4 h-4" />
              Verwijderen
            </button>
            <select
              value={projectStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isSaving}
              className="px-3 py-2 border border-border rounded-md bg-card text-sm min-w-0"
            >
              <option value="new">Nieuw</option>
              <option value="in_progress">In Uitvoering</option>
              <option value="review">In Review</option>
              <option value="completed">Voltooid</option>
              <option value="on_hold">On Hold</option>
              <option value="canceled">Geannuleerd</option>
            </select>
          </div>
        </div>
      </div>

      {/* Canceled Warning Banner */}
      {customer.project_status === 'canceled' && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                <span className="text-red-800 font-bold text-lg">✕</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-red-900 mb-1 break-words">
                Deze klant is geannuleerd
              </h3>
              <p className="text-sm text-red-700 break-words">
                Deze klant telt niet meer mee in de omzetberekening. Alle gegevens blijven beschikbaar voor referentie.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <nav className="border-b border-border mb-6" aria-label="Secties">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mb-px">
          {([
            { id: 'overview' as CustomerTabId, label: 'Overzicht', icon: User },
            { id: 'offerte' as CustomerTabId, label: 'Offerte', icon: FileText },
            { id: 'updates' as CustomerTabId, label: 'Updates', icon: TrendingUp },
            { id: 'activiteiten' as CustomerTabId, label: 'Activiteiten', icon: History },
            { id: 'bijlagen' as CustomerTabId, label: 'Bijlagen', icon: Paperclip },
          ]).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCustomerTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap text-sm ${
                  activeCustomerTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="space-y-6 min-w-0">
        {activeCustomerTab === 'overview' && (
        <div className="space-y-6">
          {/* Cursor Prompt Section */}
          {customer.cursor_prompt && (
            <section className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0" aria-label="Cursor AI Prompt">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Cursor AI Prompt</p>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 break-words">
                  <Code className="w-5 h-5 text-primary shrink-0" />
                  Prompt voor Cursor
                </h2>
                <Button
                  onClick={copyPromptToClipboard}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  {copiedPrompt ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Gekopieerd!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Kopieer
                    </>
                  )}
                </Button>
              </div>
              {customer.cursor_prompt_generated_at && (
                <p className="text-xs text-muted-foreground mb-4 break-words">
                  Gegenereerd op: {new Date(customer.cursor_prompt_generated_at).toLocaleString('nl-BE')}
                </p>
              )}
              <div className="bg-muted border border-border rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs sm:text-sm whitespace-pre-wrap break-words font-mono">
                  {customer.cursor_prompt}
                </pre>
              </div>
            </section>
          )}

          {/* Overzicht: Klant- en projectinfo (voorheen sidebar) */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold break-words">Klant Informatie</h3>
              {!showEditCompany ? (
                <Button variant="outline" size="sm" onClick={() => { setShowEditCompany(true); setEditCompany({ name: customer.name, email: customer.email, phone: customer.phone ?? '', company_name: customer.company_name ?? '', vat_number: customer.vat_number ?? '', company_address: customer.company_address ?? '', company_postal_code: customer.company_postal_code ?? '', company_city: customer.company_city ?? '', company_country: customer.company_country ?? '', company_website: customer.company_website ?? '', bank_account: customer.bank_account ?? '' }); }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Bewerken
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setShowEditCompany(false); setEditCompany({}); }} disabled={isSavingCompany}>
                    <X className="w-4 h-4 mr-2" />
                    Annuleren
                  </Button>
                  <Button size="sm" onClick={handleSaveCompany} disabled={isSavingCompany}>
                    {isSavingCompany ? 'Opslaan...' : 'Opslaan'}
                  </Button>
                </div>
              )}
            </div>
            {!showEditCompany ? (
              <div className="space-y-3 text-sm">
                <div className="min-w-0">
                  <p className="text-muted-foreground mb-1 break-words">Naam</p>
                  <p className="font-medium break-words">{customer.name}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground mb-1 break-words">E-mail</p>
                  <p className="font-medium break-words">{customer.email}</p>
                </div>
                {customer.phone && (
                  <div className="min-w-0">
                    <p className="text-muted-foreground mb-1 break-words">Telefoon</p>
                    <p className="font-medium break-words">{customer.phone}</p>
                  </div>
                )}
                {customer.company_name && (
                  <div className="min-w-0">
                    <p className="text-muted-foreground mb-1 break-words">Bedrijf</p>
                    <p className="font-medium break-words">{customer.company_name}</p>
                  </div>
                )}
                {customer.vat_number && (
                  <div className="min-w-0">
                    <p className="text-muted-foreground mb-1 break-words">BTW Nummer</p>
                    <p className="font-medium break-words">{customer.vat_number}</p>
                  </div>
                )}
                {customer.company_address && (
                  <div className="min-w-0">
                    <p className="text-muted-foreground mb-1 break-words">Adres</p>
                    <p className="font-medium break-words">
                      {customer.company_address}
                      {customer.company_postal_code && ` ${customer.company_postal_code}`}
                      {customer.company_city && ` ${customer.company_city}`}
                    </p>
                  </div>
                )}
                {customer.company_website && (
                  <div className="min-w-0">
                    <p className="text-muted-foreground mb-1 break-words">Website</p>
                    <a
                      href={customer.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline break-all"
                    >
                      {customer.company_website}
                    </a>
                  </div>
                )}
                {customer.bank_account && (
                  <div className="min-w-0">
                    <p className="text-muted-foreground mb-1 break-words">Rekeningnummer</p>
                    <p className="font-medium break-all font-mono text-xs sm:text-sm">{customer.bank_account}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-muted-foreground mb-1">Naam</label>
                  <input type="text" value={editCompany.name ?? ''} onChange={(e) => setEditCompany((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm" />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">E-mail</label>
                  <input type="email" value={editCompany.email ?? ''} onChange={(e) => setEditCompany((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm" />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Telefoon</label>
                  <input type="text" value={editCompany.phone ?? ''} onChange={(e) => setEditCompany((p) => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm" />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Bedrijf</label>
                  <input type="text" value={editCompany.company_name ?? ''} onChange={(e) => setEditCompany((p) => ({ ...p, company_name: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm" />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">BTW Nummer</label>
                  <input type="text" value={editCompany.vat_number ?? ''} onChange={(e) => setEditCompany((p) => ({ ...p, vat_number: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm" />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Adres</label>
                  <input type="text" value={editCompany.company_address ?? ''} onChange={(e) => setEditCompany((p) => ({ ...p, company_address: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm" placeholder="Straat en nummer" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-muted-foreground mb-1">Postcode</label>
                    <input type="text" value={editCompany.company_postal_code ?? ''} onChange={(e) => setEditCompany((p) => ({ ...p, company_postal_code: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm" />
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-1">Plaats</label>
                    <input type="text" value={editCompany.company_city ?? ''} onChange={(e) => setEditCompany((p) => ({ ...p, company_city: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Land</label>
                  <input type="text" value={editCompany.company_country ?? ''} onChange={(e) => setEditCompany((p) => ({ ...p, company_country: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm" />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Website</label>
                  <input type="url" value={editCompany.company_website ?? ''} onChange={(e) => setEditCompany((p) => ({ ...p, company_website: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm" />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Rekeningnummer (optioneel)</label>
                  <input type="text" value={editCompany.bank_account ?? ''} onChange={(e) => setEditCompany((p) => ({ ...p, bank_account: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm font-mono" placeholder="IBAN of rekeningnummer voor facturatie" />
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0">
            <h3 className="font-semibold mb-4 break-words">Project Informatie</h3>
            <div className="space-y-3 text-sm">
              {customer.package_interest && (
                <div className="min-w-0">
                  <p className="text-muted-foreground mb-1 break-words">Pakket</p>
                  <p className="font-medium break-words">{customer.package_interest}</p>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-muted-foreground mb-1 break-words">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(customer.project_status)}`}>
                  {getStatusLabel(customer.project_status)}
                </span>
              </div>
              {customer.assigned_to && (
                <div className="min-w-0">
                  <p className="text-muted-foreground mb-1 break-words">Toegewezen aan</p>
                  <p className="font-medium break-words">{customer.assigned_to}</p>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-muted-foreground mb-1 break-words">Geconverteerd</p>
                <p className="font-medium break-words">
                  {new Date(customer.converted_at).toLocaleDateString('nl-BE')}
                </p>
              </div>
            </div>
          </div>

          {customer.pain_points && customer.pain_points.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0">
              <h3 className="font-semibold mb-4 break-words">Uitdagingen</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {customer.pain_points.map((point, i) => (
                  <li key={i} className="break-words">{point}</li>
                ))}
              </ul>
            </div>
          )}

          {customer.message && (
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0">
              <h3 className="font-semibold mb-4 break-words">Bericht</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                {customer.message}
              </p>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0">
            <h3 className="font-semibold mb-4 flex items-center gap-2 break-words">
              <History className="w-4 h-4 text-primary shrink-0" />
              Voortgang Geschiedenis
            </h3>
            {progressHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 break-words">Geen geschiedenis</p>
            ) : (
              <div className="space-y-3">
                {progressHistory.map((history) => (
                  <div
                    key={history.id}
                    className="border-l-4 border-primary pl-3 sm:pl-4 py-2 sm:py-3 bg-muted/30 rounded-r min-w-0"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs sm:text-sm font-medium break-words">
                          {history.old_status ? `${getStatusLabel(history.old_status)} → ` : ''}
                          {getStatusLabel(history.new_status)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(history.created_at).toLocaleString('nl-BE')}
                      </span>
                    </div>
                    {history.notes && (
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                        {history.notes}
                      </p>
                    )}
                    {history.changed_by && (
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        Door: {history.changed_by}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {activeCustomerTab === 'offerte' && (
            <section className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0" aria-label="Offerte">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Offerte</p>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 break-words">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                {customer.approved_quote ? 'Goedgekeurde offerte' : 'Offerte'}
              </h2>
              {!customer.approved_quote ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">Er is nog geen goedgekeurde offerte voor deze klant.</p>
                  {customer.lead_id ? (
                    <Button asChild variant="default" size="sm">
                      <Link href={`/admin/leads/${customer.lead_id}/quote`}>
                        <FileText className="w-4 h-4 mr-2" />
                        Offerte aanmaken of bewerken
                      </Link>
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">Deze klant heeft geen gekoppelde lead. Converteer eerst een lead naar deze klant om een offerte te koppelen.</p>
                  )}
                </div>
              ) : (
                <>
              {customer.project_status === 'canceled' ? (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Totaal:</p>
                  <p className="text-2xl font-bold text-red-600 line-through">
                    {customer.quote_total ? `€${Number(customer.quote_total).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '€0,00'}
                  </p>
                  <p className="text-sm text-red-600 font-semibold mt-1">
                    Geannuleerd - telt niet mee in omzet
                  </p>
                </div>
              ) : customer.quote_total != null ? (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Totaal:</p>
                  <p className="text-2xl font-bold">
                    €{Number(customer.quote_total).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2 mb-4">
                {customer.lead_id && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/leads/${customer.lead_id}/quote`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Offerte aanpassen
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isGeneratingPdf}
                  onClick={async () => {
                    const q = customer.approved_quote as ApprovedQuoteData;
                    if (!q?.selectedPackage || customer.quote_total == null) return;
                    setIsGeneratingPdf(true);
                    try {
                      const blob = await generateQuotePdfBlob(
                        {
                          name: customer.name,
                          email: customer.email ?? undefined,
                          phone: customer.phone ?? undefined,
                          company_name: customer.company_name ?? undefined,
                          vat_number: customer.vat_number ?? undefined,
                          company_address: customer.company_address ?? undefined,
                          company_postal_code: customer.company_postal_code ?? undefined,
                          company_city: customer.company_city ?? undefined,
                          company_country: customer.company_country ?? undefined,
                          company_website: customer.company_website ?? undefined,
                        },
                        q,
                        Number(customer.quote_total)
                      );
                      const url = URL.createObjectURL(blob);
                      setPdfBlobUrl((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return url;
                      });
                    } catch (err) {
                      console.error('PDF genereren mislukt:', err);
                    } finally {
                      setIsGeneratingPdf(false);
                    }
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {pdfBlobUrl ? 'Vernieuw PDF' : isGeneratingPdf ? 'PDF genereren...' : 'Bekijk PDF'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isGeneratingPdf}
                  onClick={async () => {
                    const q = customer.approved_quote as ApprovedQuoteData;
                    if (!q?.selectedPackage || customer.quote_total == null) return;
                    setIsGeneratingPdf(true);
                    try {
                      const blob = await generateQuotePdfBlob(
                        {
                          name: customer.name,
                          email: customer.email ?? undefined,
                          phone: customer.phone ?? undefined,
                          company_name: customer.company_name ?? undefined,
                          vat_number: customer.vat_number ?? undefined,
                          company_address: customer.company_address ?? undefined,
                          company_postal_code: customer.company_postal_code ?? undefined,
                          company_city: customer.company_city ?? undefined,
                          company_country: customer.company_country ?? undefined,
                          company_website: customer.company_website ?? undefined,
                        },
                        q,
                        Number(customer.quote_total)
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Offerte_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error('PDF download mislukt:', err);
                    } finally {
                      setIsGeneratingPdf(false);
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
              {pdfBlobUrl && (
                <div className="bg-muted border border-border rounded-lg overflow-hidden min-h-[400px]">
                  <iframe
                    src={pdfBlobUrl}
                    title="Goedgekeurde offerte PDF"
                    className="w-full h-[500px] sm:h-[600px] border-0"
                  />
                </div>
              )}
                </>
              )}
            </section>
        )}

        {activeCustomerTab === 'updates' && (
          <section className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0" aria-label="Project updates">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Project updates</p>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold break-words">Updates</h2>
              <Button
                onClick={() => setShowUpdateForm(!showUpdateForm)}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nieuwe Update
              </Button>
            </div>

            {/* Update Form */}
            {showUpdateForm && (
              <div className="mb-6 p-4 bg-muted border border-border rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                      value={updateType}
                      onChange={(e) => setUpdateType(e.target.value as 'progress' | 'milestone' | 'issue' | 'change' | 'note')}
                      className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm"
                    >
                      <option value="progress">Voortgang</option>
                      <option value="milestone">Mijlpaal</option>
                      <option value="issue">Probleem</option>
                      <option value="change">Wijziging</option>
                      <option value="note">Notitie</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Titel *</label>
                    <input
                      type="text"
                      value={updateTitle}
                      onChange={(e) => setUpdateTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm"
                      placeholder="Bijv: Homepage design afgerond"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Beschrijving *</label>
                    <textarea
                      value={updateDescription}
                      onChange={(e) => setUpdateDescription(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm"
                      placeholder="Beschrijf de update in detail..."
                    />
                  </div>
                  {updateType === 'progress' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Voortgang (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={updateProgress || ''}
                        onChange={(e) => setUpdateProgress(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm"
                        placeholder="0-100"
                      />
                    </div>
                  )}
                  {updateType === 'milestone' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Mijlpaal</label>
                      <input
                        type="text"
                        value={updateMilestone}
                        onChange={(e) => setUpdateMilestone(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm"
                        placeholder="Bijv: MVP Launch"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddUpdate}
                      disabled={isSavingUpdate || !updateTitle.trim() || !updateDescription.trim()}
                      className="flex-1"
                    >
                      {isSavingUpdate ? 'Opslaan...' : 'Opslaan'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowUpdateForm(false);
                        setUpdateTitle('');
                        setUpdateDescription('');
                        setUpdateType('progress');
                        setUpdateProgress(undefined);
                        setUpdateMilestone('');
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Annuleren
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Updates List */}
            {updates.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 break-words">Geen updates</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {updates.map((update) => (
                  <div
                    key={update.id}
                    className={`border-l-4 pl-3 sm:pl-4 pr-2 sm:pr-4 py-2 sm:py-3 rounded-r min-w-0 ${getUpdateTypeColor(update.update_type)}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="shrink-0">{getUpdateTypeIcon(update.update_type)}</div>
                        <h3 className="font-semibold text-sm sm:text-base break-words">{update.title}</h3>
                        {update.progress_percentage !== null && update.progress_percentage !== undefined && (
                          <span className="text-xs font-medium shrink-0">
                            {update.progress_percentage}%
                          </span>
                        )}
                        {update.milestone && (
                          <span className="text-xs px-2 py-1 bg-white/50 rounded shrink-0">
                            {update.milestone}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(update.created_at).toLocaleString('nl-BE')}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                      {update.description}
                    </p>
                    {update.created_by && (
                      <p className="text-xs text-muted-foreground mt-2 break-words">
                        Door: {update.created_by}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeCustomerTab === 'activiteiten' && (
          <section className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0" aria-label="Activiteiten">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Activiteiten</p>
            <h2 className="text-lg font-bold mb-4 break-words">Activiteiten</h2>
            {activities.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 break-words">Geen activiteiten</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="border-l-4 border-primary pl-3 sm:pl-4 py-2 sm:py-3 bg-muted/30 rounded-r min-w-0"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base break-words">{activity.title}</h3>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(activity.created_at).toLocaleString('nl-BE')}
                      </span>
                    </div>
                    {activity.summary && (
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {activity.summary}
                      </p>
                    )}
                    {activity.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words mt-2">
                        {activity.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeCustomerTab === 'bijlagen' && (
          <section className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0" aria-label="Bijlagen">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Bijlagen</p>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold break-words">Bijlagen</h2>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="*"
                onChange={handleUploadAttachment}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={isUploadingAttachment}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploadingAttachment ? 'Uploaden...' : 'Bijlage toevoegen'}
              </Button>
            </div>
            {attachments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 break-words">Geen bijlagen</p>
            ) : (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-border rounded-lg hover:bg-accent transition-colors group min-w-0"
                  >
                    <a
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0"
                    >
                      {attachment.file_type?.startsWith('image/') ? (
                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                      ) : (
                        <File className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate break-words">{attachment.file_name}</p>
                        {attachment.description && (
                          <p className="text-xs text-muted-foreground truncate break-words">
                            {attachment.description}
                          </p>
                        )}
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>

      {/* Delete Customer Modal */}
      {showDeleteCustomerModal && customer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Klant verwijderen?</h3>
                <p className="text-sm text-muted-foreground">
                  Deze actie kan niet ongedaan worden gemaakt.
                </p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Weet je zeker dat je deze klant wilt verwijderen? De klant en eventuele bijbehorende lead worden permanent verwijderd.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Typ <strong>{customer.company_name || customer.name}</strong> om te bevestigen:
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={customer.company_name || customer.name}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isDeleting}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setShowDeleteCustomerModal(false);
                  setDeleteConfirmName('');
                }}
                variant="outline"
                disabled={isDeleting}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleDeleteCustomer}
                variant="destructive"
                disabled={isDeleting || deleteConfirmName !== (customer.company_name || customer.name)}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Verwijderen...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Verwijderen
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerDetailClient({ customerId }: { customerId: string }) {
  return <CustomerDetailClientInner customerId={customerId} />;
}
