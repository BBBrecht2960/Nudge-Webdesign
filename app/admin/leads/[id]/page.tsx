'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, type Lead, type LeadActivity, type LeadAttachment, type LeadStatusDescription } from '@/lib/db';
import { Button } from '../../../components/Button';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  Package,
  Plus,
  Upload,
  FileText,
  PhoneCall,
  MessageSquare,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Image as ImageIcon,
  File,
  Calculator,
  Quote,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

// Component to load and show saved quote info
function LoadSavedQuoteInfo({ leadId }: { leadId: string }) {
  const [hasQuote, setHasQuote] = useState(false);
  const [quoteTotal, setQuoteTotal] = useState<number | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkQuote = async () => {
      try {
        const response = await fetch(`/api/leads/${leadId}/quote`);
        if (response.ok) {
          const data = await response.json();
          if (data.quote) {
            setHasQuote(true);
            setQuoteTotal(data.quote.total_price);
            setQuoteStatus(data.quote.status || 'draft');
          }
        } else {
          // If there's an error but it's about missing table, just show no quote
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error?.includes('lead_quotes')) {
            console.warn('Quote table does not exist:', errorData.error);
          }
        }
      } catch (error) {
        console.error('Error checking quote:', error);
      } finally {
        setLoading(false);
      }
    };

    checkQuote();
  }, [leadId]);

  if (loading) {
    return (
      <div className="text-xs text-muted-foreground text-center py-2">
        Laden...
      </div>
    );
  }

  if (!hasQuote) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        Geen opgeslagen offerte
      </p>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: 'Concept',
    sent: 'Verzonden',
    accepted: 'Geaccepteerd',
    rejected: 'Afgewezen',
    expired: 'Verlopen',
  };

  return (
    <div className="bg-muted border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">Opgeslagen offerte:</p>
        <span className={`text-xs px-2 py-1 rounded ${
          quoteStatus === 'draft' ? 'bg-yellow-100 text-yellow-800' :
          quoteStatus === 'sent' ? 'bg-blue-100 text-blue-800' :
          quoteStatus === 'accepted' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {statusLabels[quoteStatus] || quoteStatus}
        </span>
      </div>
      <p className="text-lg font-bold">
        €{quoteTotal?.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
      </p>
    </div>
  );
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [attachments, setAttachments] = useState<LeadAttachment[]>([]);
  const [statusDescriptions, setStatusDescriptions] = useState<LeadStatusDescription[]>([]);
  const [adminUsers, setAdminUsers] = useState<{ email: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasQuote, setHasQuote] = useState(false);
  
  // Form states
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityType, setActivityType] = useState<LeadActivity['activity_type']>('note');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activitySummary, setActivitySummary] = useState('');
  const [activityDuration, setActivityDuration] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Company information form state
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [vatNumber, setVatNumber] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPostalCode, setCompanyPostalCode] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyCountry, setCompanyCountry] = useState('België');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  useEffect(() => {
    if (leadId) {
      loadLeadData();
      loadStatusDescriptions();
      loadAdminUsers();
    }
  }, [leadId]);

  const loadLeadData = async () => {
    try {
      // Load lead - use select('*') to get all columns
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) {
        // Better error logging
        const errorMessage = leadError.message || 
          leadError.code || 
          (typeof leadError === 'string' ? leadError : JSON.stringify(leadError));
        console.error('Error loading lead:', {
          error: leadError,
          message: errorMessage,
          code: leadError.code,
          details: leadError.details,
          hint: leadError.hint,
          leadId,
        });
        throw new Error(`Failed to load lead: ${errorMessage}`);
      }

      if (!leadData) {
        throw new Error('Lead not found');
      }

      setLead(leadData);
      setAssignedTo((leadData as Lead & { assigned_to?: string }).assigned_to || '');
      
      // Set company information form fields
      setVatNumber(leadData.vat_number || '');
      setCompanyAddress(leadData.company_address || '');
      setCompanyPostalCode(leadData.company_postal_code || '');
      setCompanyCity(leadData.company_city || '');
      setCompanyCountry(leadData.company_country || 'België');
      setCompanyWebsite(leadData.company_website || '');

      // Load activities (non-blocking)
      try {
        const activitiesRes = await fetch(`/api/leads/${leadId}/activities`);
        if (activitiesRes.ok) {
          const data = await activitiesRes.json();
          setActivities(data.activities || []);
        } else {
          const errorData = await activitiesRes.json().catch(() => ({}));
          console.warn('Failed to load activities:', errorData.error || activitiesRes.statusText);
        }
      } catch (err) {
        console.warn('Error loading activities:', err);
        // Don't throw - activities are optional
      }

      // Load attachments (non-blocking)
      try {
        const attachmentsRes = await fetch(`/api/leads/${leadId}/attachments`);
        if (attachmentsRes.ok) {
          const data = await attachmentsRes.json();
          setAttachments(data.attachments || []);
        } else {
          const errorData = await attachmentsRes.json().catch(() => ({}));
          console.warn('Failed to load attachments:', errorData.error || attachmentsRes.statusText);
        }
      } catch (err) {
        console.warn('Error loading attachments:', err);
        // Don't throw - attachments are optional
      }

      // Check if quote exists (non-blocking)
      try {
        const quoteRes = await fetch(`/api/leads/${leadId}/quote`);
        if (quoteRes.ok) {
          const data = await quoteRes.json();
          setHasQuote(!!data.quote);
        }
      } catch (err) {
        console.warn('Error checking quote:', err);
      }
    } catch (error: unknown) {
      // Enhanced error logging
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const errorDetails = {
        message: errorObj.message || 'Unknown error',
        name: errorObj.name,
        stack: errorObj.stack,
        leadId,
        errorObject: error,
      };
      console.error('Error loading lead data:', errorDetails);
      
      // Set error state so user can see something went wrong
      const errorMessage = errorObj.message || '';
      const errorCode = (error as { code?: string })?.code;
      if (errorMessage.includes('not found') || 
          errorCode === 'PGRST116' || 
          errorMessage.includes('No rows')) {
        // Lead doesn't exist
        setLead(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatusDescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_status_descriptions')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        // Table might not exist yet, use fallback
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          setStatusDescriptions([]);
          return;
        }
        throw error;
      }
      setStatusDescriptions(data || []);
    } catch (error) {
      // Silently fail and use fallback
      setStatusDescriptions([]);
    }
  };

  const loadAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const { users } = await res.json();
        setAdminUsers(users || []);
      }
    } catch (error) {
      console.error('Error loading admin users:', error);
    }
  };

  const getNextStatusHint = (currentStatus: string): string | null => {
    if (currentStatus === 'new') {
      const hasContact = activities.some(act => 
        ['call', 'email', 'meeting'].includes(act.activity_type)
      );
      if (!hasContact) {
        return 'Voeg eerst een telefoongesprek, e-mail of meeting toe';
      }
    }
    if (currentStatus === 'contacted') {
      const hasPositiveContact = activities.some(act => 
        ['call', 'meeting'].includes(act.activity_type) && 
        act.description && act.description.length > 20
      );
      if (!hasPositiveContact) {
        return 'Voeg een telefoongesprek of meeting toe met beschrijving';
      }
    }
    if (currentStatus === 'qualified') {
      const hasQuote = activities.some(act => 
        act.activity_type === 'quote_sent' || act.activity_type === 'contract_sent'
      );
      if (!hasQuote) {
        return 'Maak eerst een offerte via de "Offerte" knop';
      }
    }
    return null;
  };

  const canChangeToStatus = (currentStatus: string, newStatus: string, hasQuoteInDB: boolean = false): { allowed: boolean; reason?: string } => {
    // Always allow staying the same or going to lost
    if (newStatus === currentStatus || newStatus === 'lost') {
      return { allowed: true };
    }

    // Don't allow going backwards in workflow
    const statusOrder = ['new', 'contacted', 'qualified', 'converted'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newIndex = statusOrder.indexOf(newStatus);
    
    if (newIndex < currentIndex) {
      return { allowed: false, reason: 'Je kunt niet teruggaan naar een eerdere status' };
    }

    // Status-specific validations
    if (currentStatus === 'new' && newStatus === 'contacted') {
      const hasContact = activities.some(act => 
        ['call', 'email', 'meeting'].includes(act.activity_type)
      );
      if (!hasContact) {
        return {
          allowed: false,
          reason: 'Voeg eerst een telefoongesprek, e-mail of meeting toe'
        };
      }
    }

    if (currentStatus === 'contacted' && newStatus === 'qualified') {
      const hasPositiveContact = activities.some(act => 
        ['call', 'meeting'].includes(act.activity_type) && 
        act.description && act.description.length > 20
      );
      if (!hasPositiveContact) {
        return {
          allowed: false,
          reason: 'Voeg een telefoongesprek of meeting toe met beschrijving'
        };
      }
    }

    if (currentStatus === 'qualified' && newStatus === 'converted') {
      // Check if quote exists in database or if there's a quote_sent activity
      const hasQuoteActivity = activities.some(act => 
        act.activity_type === 'quote_sent' || act.activity_type === 'contract_sent'
      );
      if (!hasQuoteInDB && !hasQuoteActivity) {
        return {
          allowed: false,
          reason: 'Maak eerst een offerte via de "Offerte" knop'
        };
      }
    }

    return { allowed: true };
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!lead || lead.status === newStatus) return;

    // Validate status change
    const validation = canChangeToStatus(lead.status, newStatus, hasQuote);
    if (!validation.allowed) {
      alert(validation.reason || 'Deze statuswijziging is niet toegestaan.');
      return;
    }

    setIsSaving(true);
    
    try {
      // Update lead status
      const { error: updateError } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (updateError) throw updateError;

      // Update local state immediately
      setLead({ ...lead, status: newStatus as Lead['status'] });

      // Add to status history (fire and forget)
      supabase
        .from('lead_status_history')
        .insert({
          lead_id: leadId,
          old_status: lead.status,
          new_status: newStatus,
        });

      // Create activity for status change (fire and forget)
      fetch(`/api/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'status_change',
          title: `Status gewijzigd naar: ${newStatus}`,
          description: `Status veranderd van "${lead.status}" naar "${newStatus}"`,
        }),
      });

      // If status is "lost", also cancel related customer if exists
      if (newStatus === 'lost') {
        try {
          // Check if customer exists for this lead
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id, project_status')
            .eq('lead_id', leadId)
            .maybeSingle();

          if (existingCustomer && existingCustomer.project_status !== 'canceled') {
            const { error: customerUpdateError } = await supabase
              .from('customers')
              .update({ project_status: 'canceled' })
              .eq('id', existingCustomer.id);

            if (customerUpdateError) {
              console.warn('Error updating related customer to canceled:', customerUpdateError);
            } else {
              console.log('Related customer marked as canceled');
            }
          }
        } catch (customerErr) {
          console.warn('Error checking/updating related customer:', customerErr);
        }
      }

      // If status is "converted", automatically convert to customer
      if (newStatus === 'converted') {
        try {
          console.log(`[StatusChange] Converting lead ${leadId} to customer...`);
          const convertResponse = await fetch(`/api/leads/${leadId}/convert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (convertResponse.ok) {
            const convertData = await convertResponse.json();
            const revenue = convertData.customer?.quote_total 
              ? `€${Number(convertData.customer.quote_total).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'geen offerte';
            console.log(`[StatusChange] Conversion successful. Revenue: ${revenue}`);
            alert(`Lead succesvol geconverteerd naar customer! Omzet: ${revenue}. AI prompt is gegenereerd.`);
            // Optionally redirect to customer page
            // router.push(`/admin/customers/${convertData.customer.id}`);
          } else {
            const errorData = await convertResponse.json();
            // Check if customer already exists
            if (errorData.customer_id) {
              console.log(`[StatusChange] Customer already exists for lead ${leadId}`);
              alert(`Lead is al geconverteerd naar customer.`);
            } else {
              console.error('[StatusChange] Error converting to customer:', errorData);
              alert(`Status bijgewerkt, maar conversie naar customer mislukt: ${errorData.error || 'Onbekende fout'}`);
            }
          }
        } catch (convertError) {
          console.error('[StatusChange] Error converting to customer:', convertError);
          alert('Status bijgewerkt, maar conversie naar customer mislukt. Probeer handmatig te converteren.');
        }
      }

      // Reload to get fresh data
      loadLeadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Fout bij het bijwerken van de status');
      loadLeadData(); // Reload to revert
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddActivity = async () => {
    if (!activityTitle.trim()) {
      alert('Titel is verplicht');
      return;
    }

    if (!lead) {
      alert('Lead niet gevonden');
      return;
    }

    if (!leadId) {
      alert('Lead ID ontbreekt');
      return;
    }

    try {
      setIsSaving(true);
      
      const requestBody = {
        activity_type: activityType || 'note',
        title: activityTitle.trim(),
        description: activityDescription.trim() || null,
        summary: activitySummary.trim() || null,
        duration_minutes: activityDuration ? parseInt(activityDuration, 10) : null,
      };

      const response = await fetch(`/api/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = 'Fout bij het toevoegen van activiteit';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (!result || !result.activity) {
        throw new Error('Geen activiteit ontvangen van server');
      }

      // Reset form
      setActivityType('note');
      setActivityTitle('');
      setActivityDescription('');
      setActivitySummary('');
      setActivityDuration('');
      setShowActivityForm(false);
      
      // Reload activities
      await loadLeadData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Fout bij het toevoegen van activiteit';
      console.error('Error adding activity:', {
        error,
        message: errorMessage,
        leadId,
        activityType,
        title: activityTitle,
      });
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      alert('Selecteer eerst een bestand');
      return;
    }

    if (!lead) {
      alert('Lead niet gevonden');
      return;
    }

    if (!leadId) {
      alert('Lead ID ontbreekt');
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert('Bestand is te groot. Maximum grootte is 50MB.');
      e.target.value = '';
      return;
    }

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);
      if (activitySummary) formData.append('description', activitySummary);

      const res = await fetch(`/api/leads/${leadId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let errorMessage = 'Fout bij uploaden';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      
      if (!result || !result.attachment) {
        throw new Error('Geen bijlage ontvangen van server');
      }

      await loadLeadData();
      alert('Bestand succesvol geüpload');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Fout bij het uploaden van bestand';
      console.error('Error uploading file:', {
        error,
        message: errorMessage,
        leadId,
        fileName: file.name,
        fileSize: file.size,
      });
      alert(errorMessage);
    } finally {
      setUploadingFile(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!leadId) {
      alert('Lead ID ontbreekt');
      return;
    }

    try {
      setDeletingAttachmentId(attachmentId);
      
      const response = await fetch(`/api/leads/${leadId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMessage = 'Fout bij verwijderen';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Reload attachments
      await loadLeadData();
      setShowDeleteConfirm(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Fout bij verwijderen van bijlage';
      console.error('Error deleting attachment:', {
        error,
        message: errorMessage,
        attachmentId,
        leadId,
      });
      alert(errorMessage);
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const handleSaveCompanyInfo = async () => {
    if (!lead || !leadId) return;

    try {
      setIsSavingCompany(true);
      
      const { error } = await supabase
        .from('leads')
        .update({
          vat_number: vatNumber.trim() || null,
          company_address: companyAddress.trim() || null,
          company_postal_code: companyPostalCode.trim() || null,
          company_city: companyCity.trim() || null,
          company_country: companyCountry.trim() || null,
          company_website: companyWebsite.trim() || null,
        })
        .eq('id', leadId);

      if (error) {
        // Check if columns don't exist
        if (error.message?.includes('schema cache') || error.message?.includes('column')) {
          alert('De bedrijfsgegevens kolommen bestaan nog niet. Voer het SQL script uit: add-company-fields.sql');
          return;
        }
        throw error;
      }

      // Update local state
      setLead({
        ...lead,
        vat_number: vatNumber.trim() || undefined,
        company_address: companyAddress.trim() || undefined,
        company_postal_code: companyPostalCode.trim() || undefined,
        company_city: companyCity.trim() || undefined,
        company_country: companyCountry.trim() || undefined,
        company_website: companyWebsite.trim() || undefined,
      });

      setShowCompanyForm(false);
      alert('Bedrijfsgegevens opgeslagen');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error saving company info:', error);
      alert(`Fout bij opslaan: ${errorMessage}`);
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleAssignTo = async (email: string) => {
    if (!lead) return;

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('leads')
        .update({ assigned_to: email || null })
        .eq('id', leadId);

      if (error) {
        // Check if column doesn't exist
        if (error.message?.includes('assigned_to') || error.message?.includes('schema cache') || error.message?.includes('column')) {
          const sql = 'ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255);';
          const message = `De assigned_to kolom bestaat nog niet.\n\nVoer deze SQL uit in Supabase SQL Editor:\n\n${sql}\n\nKopieer de SQL hierboven en voer deze uit in je Supabase dashboard.`;
          alert(message);
          // Copy to clipboard if possible
          if (navigator.clipboard) {
            navigator.clipboard.writeText(sql).catch(() => {});
          }
          return;
        }
        throw error;
      }
      
      setAssignedTo(email);
      // Update local state immediately
      if (lead) {
        setLead({ ...lead, assigned_to: email || undefined } as Lead);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error updating assignment:', error);
      if (errorMessage.includes('assigned_to') || errorMessage.includes('schema cache')) {
        const sql = 'ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255);';
        alert(`De assigned_to kolom bestaat nog niet.\n\nVoer deze SQL uit:\n\n${sql}`);
      } else {
        alert(errorMessage || 'Fout bij het bijwerken van toewijzing');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusDescription = (status: string) => {
    return statusDescriptions.find((s) => s.status === status);
  };

  const getActivityIcon = (type: LeadActivity['activity_type']) => {
    switch (type) {
      case 'call':
        return <PhoneCall className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'meeting':
        return <Users className="w-4 h-4" />;
      case 'note':
        return <FileText className="w-4 h-4" />;
      case 'status_change':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'task':
        return <Clock className="w-4 h-4" />;
      case 'quote_sent':
        return <FileText className="w-4 h-4" />;
      case 'contract_sent':
        return <FileText className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    const desc = getStatusDescription(status);
    if (desc) {
      switch (desc.color) {
        case 'green':
          return 'bg-green-100 text-green-800 border-green-300';
        case 'red':
          return 'bg-red-100 text-red-800 border-red-300 font-semibold';
        case 'blue':
          return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'yellow':
          return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-300';
      }
    }
    // Fallback for lost status
    if (status === 'lost') {
      return 'bg-red-100 text-red-800 border-red-300 font-semibold';
    }
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

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

  const currentStatusDesc = getStatusDescription(lead.status);

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
      <Button
        onClick={() => router.push('/admin/leads')}
        variant="outline"
        className="mb-4 sm:mb-6 text-sm sm:text-base"
      >
        <ArrowLeft className="w-4 h-4 mr-2 shrink-0" />
        <span className="break-words">Terug naar leads</span>
      </Button>

      {/* Lost Warning Banner */}
      {lead.status === 'lost' && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                <span className="text-red-800 font-bold text-lg">✕</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-red-900 mb-1 break-words">
                Deze lead is verloren
              </h3>
              <p className="text-sm text-red-700 break-words">
                Deze lead telt niet meer mee in de conversie statistieken. Alle gegevens blijven beschikbaar voor referentie.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Header */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 w-full min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4 sm:mb-6 w-full min-w-0">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 break-words">{lead.name}</h1>
                {lead.company_name && (
                  <p className="text-base sm:text-lg text-muted-foreground flex items-center gap-2 break-words min-w-0">
                    <Building className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span className="break-words">{lead.company_name}</span>
                  </p>
                )}
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto min-w-0">
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isSaving}
                  className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary ${getStatusColor(lead.status)} ${
                    isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } min-w-0`}
                >
                  {(statusDescriptions.length > 0 ? statusDescriptions : [
                    { status: 'new', name_nl: 'Nieuw' },
                    { status: 'contacted', name_nl: 'Gecontacteerd' },
                    { status: 'qualified', name_nl: 'Gekwalificeerd' },
                    { status: 'converted', name_nl: 'Geconverteerd' },
                    { status: 'lost', name_nl: 'Verloren' },
                  ]).map((statusDesc) => {
                    const validation = canChangeToStatus(lead.status, statusDesc.status, hasQuote);
                    return (
                      <option 
                        key={statusDesc.status} 
                        value={statusDesc.status}
                        disabled={!validation.allowed && statusDesc.status !== lead.status}
                      >
                        {statusDesc.name_nl}
                        {!validation.allowed && statusDesc.status !== lead.status ? ' (niet beschikbaar)' : ''}
                      </option>
                    );
                  })}
                </select>
                {currentStatusDesc && (
                  <div className="text-xs text-muted-foreground max-w-xs text-left sm:text-right break-words">
                    <p>{currentStatusDesc.description_nl}</p>
                    {(() => {
                      const hint = getNextStatusHint(lead.status);
                      if (hint && lead.status !== 'converted' && lead.status !== 'lost') {
                        return (
                          <p className="mt-1 text-orange-600 font-medium">
                            💡 {hint}
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                <a href={`mailto:${lead.email}`} className="text-primary hover:underline break-all text-sm sm:text-base">
                  {lead.email}
                </a>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                  <a href={`tel:${lead.phone}`} className="text-primary hover:underline break-all text-sm sm:text-base">
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.company_size && (
                <div className="flex items-center gap-2 min-w-0">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm sm:text-base break-words">{lead.company_size} medewerkers</span>
                </div>
              )}
              {lead.package_interest && (
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm sm:text-base break-words">{lead.package_interest}</span>
                </div>
              )}
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                <span className="text-xs sm:text-sm break-words">{new Date(lead.created_at).toLocaleString('nl-BE')}</span>
              </div>
            </div>

            {lead.pain_points && lead.pain_points.length > 0 && (
              <div className="mb-4 sm:mb-6 min-w-0">
                <h3 className="font-semibold mb-2 text-sm sm:text-base break-words">Uitdagingen:</h3>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-muted-foreground">
                  {lead.pain_points.map((point, i) => (
                    <li key={i} className="break-words">{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {lead.message && (
              <div className="min-w-0">
                <h3 className="font-semibold mb-2 break-words">Bericht:</h3>
                <p className="text-muted-foreground whitespace-pre-wrap break-words">{lead.message}</p>
              </div>
            )}

            {/* Company Information Section */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mt-4 sm:mt-6 w-full min-w-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 w-full min-w-0">
                <h2 className="text-lg sm:text-xl font-bold break-words">Bedrijfsgegevens</h2>
                <Button
                  onClick={() => setShowCompanyForm(!showCompanyForm)}
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  {showCompanyForm ? 'Annuleren' : lead.vat_number ? 'Bewerken' : 'Toevoegen'}
                </Button>
              </div>

              {!showCompanyForm && (
                <div className="space-y-2 text-xs sm:text-sm min-w-0">
                  {lead.vat_number && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                      <span className="font-medium shrink-0">BTW-nummer:</span>
                      <span className="break-words">{lead.vat_number}</span>
                    </div>
                  )}
                  {lead.company_address && (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 min-w-0">
                      <span className="font-medium shrink-0">Adres:</span>
                      <span className="break-words">{lead.company_address}</span>
                    </div>
                  )}
                  {(lead.company_postal_code || lead.company_city) && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                      <span className="font-medium shrink-0">Postcode & Stad:</span>
                      <span className="break-words">{[lead.company_postal_code, lead.company_city].filter(Boolean).join(' ')}</span>
                    </div>
                  )}
                  {lead.company_country && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                      <span className="font-medium shrink-0">Land:</span>
                      <span className="break-words">{lead.company_country}</span>
                    </div>
                  )}
                  {lead.company_website && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                      <span className="font-medium shrink-0">Website:</span>
                      <a href={lead.company_website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                        {lead.company_website}
                      </a>
                    </div>
                  )}
                  {!lead.vat_number && !lead.company_address && !lead.company_postal_code && !lead.company_city && (
                    <p className="text-muted-foreground italic break-words">Geen bedrijfsgegevens ingevuld</p>
                  )}
                </div>
              )}

              {showCompanyForm && (
                <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4 w-full min-w-0">
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">BTW-nummer *</label>
                      <input
                        type="text"
                        value={vatNumber}
                        onChange={(e) => setVatNumber(e.target.value)}
                        placeholder="BE0123456789"
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-border rounded-md text-sm sm:text-base"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Website</label>
                      <input
                        type="url"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="https://www.example.com"
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-border rounded-md text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Adres</label>
                    <input
                      type="text"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Straat en nummer"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-border rounded-md text-sm sm:text-base"
                    />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Postcode</label>
                      <input
                        type="text"
                        value={companyPostalCode}
                        onChange={(e) => setCompanyPostalCode(e.target.value)}
                        placeholder="3500"
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-border rounded-md text-sm sm:text-base"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Stad</label>
                      <input
                        type="text"
                        value={companyCity}
                        onChange={(e) => setCompanyCity(e.target.value)}
                        placeholder="Hasselt"
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-border rounded-md text-sm sm:text-base"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Land</label>
                      <input
                        type="text"
                        value={companyCountry}
                        onChange={(e) => setCompanyCountry(e.target.value)}
                        placeholder="België"
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-border rounded-md text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      onClick={handleSaveCompanyInfo}
                      disabled={isSavingCompany || !vatNumber.trim()}
                      size="sm"
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      {isSavingCompany ? 'Opslaan...' : 'Opslaan'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCompanyForm(false);
                        // Reset to current values
                        if (lead) {
                          setVatNumber(lead.vat_number || '');
                          setCompanyAddress(lead.company_address || '');
                          setCompanyPostalCode(lead.company_postal_code || '');
                          setCompanyCity(lead.company_city || '');
                          setCompanyCountry(lead.company_country || 'België');
                          setCompanyWebsite(lead.company_website || '');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      Annuleren
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 w-full min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 w-full min-w-0">
              <h2 className="text-lg sm:text-xl font-bold break-words">Activiteiten & Geschiedenis</h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => router.push(`/admin/leads/${leadId}/quote`)}
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Calculator className="w-3 h-3 sm:w-4 sm:h-4 mr-2 shrink-0" />
                  <span className="break-words">Offerte</span>
                </Button>
                <Button
                  onClick={() => setShowActivityForm(!showActivityForm)}
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2 shrink-0" />
                  <span className="break-words">Activiteit toevoegen</span>
                </Button>
              </div>
            </div>

            {/* Activity Form */}
            {showActivityForm && (
              <div className="bg-muted border border-border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 w-full min-w-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Type</label>
                    <select
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value as LeadActivity['activity_type'])}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-border rounded-md text-sm sm:text-base"
                    >
                      <option value="note">Notitie</option>
                      <option value="call">Telefoongesprek</option>
                      <option value="email">E-mail</option>
                      <option value="meeting">Meeting</option>
                      <option value="task">Taak</option>
                      <option value="quote_sent">Offerte verstuurd</option>
                      <option value="contract_sent">Contract verstuurd</option>
                    </select>
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Titel *</label>
                    <input
                      type="text"
                      value={activityTitle}
                      onChange={(e) => setActivityTitle(e.target.value)}
                      placeholder="Bijv. 'Telefoongesprek met klant'"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-border rounded-md text-sm sm:text-base"
                    />
                  </div>
                  {(activityType === 'call' || activityType === 'meeting') && (
                    <>
                      <div className="min-w-0">
                        <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Duur (minuten)</label>
                        <input
                          type="number"
                          value={activityDuration}
                          onChange={(e) => setActivityDuration(e.target.value)}
                          placeholder="30"
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-border rounded-md text-sm sm:text-base"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Gesprekssamenvatting</label>
                        <textarea
                          value={activitySummary}
                          onChange={(e) => setActivitySummary(e.target.value)}
                          placeholder="Wat is er besproken? Belangrijke punten, afspraken, etc."
                          rows={4}
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-border rounded-md text-sm sm:text-base resize-none"
                        />
                      </div>
                    </>
                  )}
                  <div className="min-w-0">
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Beschrijving</label>
                    <textarea
                      value={activityDescription}
                      onChange={(e) => setActivityDescription(e.target.value)}
                      placeholder="Extra details..."
                      rows={3}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-border rounded-md text-sm sm:text-base resize-none"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleAddActivity}
                      disabled={!activityTitle.trim() || isSaving}
                      size="sm"
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      {isSaving ? 'Opslaan...' : 'Toevoegen'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowActivityForm(false);
                        setActivityTitle('');
                        setActivityDescription('');
                        setActivitySummary('');
                        setActivityDuration('');
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      Annuleren
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Activities List */}
            <div 
              className="max-h-[400px] sm:max-h-[600px] overflow-y-auto pr-2 space-y-3 sm:space-y-4 custom-scrollbar w-full min-w-0"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(144, 103, 198, 0.3) transparent'
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 8px;
                }
                div::-webkit-scrollbar-track {
                  background: transparent;
                }
                div::-webkit-scrollbar-thumb {
                  background-color: rgba(144, 103, 198, 0.3);
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background-color: rgba(144, 103, 198, 0.5);
                }
              `}</style>
              {activities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Geen activiteiten</p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="border-l-4 border-primary pl-3 sm:pl-4 py-2 sm:py-3 bg-muted/30 rounded-r min-w-0"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-primary shrink-0">{getActivityIcon(activity.activity_type)}</div>
                        <h3 className="font-semibold text-sm sm:text-base break-words">{activity.title}</h3>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(activity.created_at).toLocaleString('nl-BE')}
                      </span>
                    </div>
                    {activity.summary && (
                      <div className="mb-2 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 break-words">Samenvatting:</p>
                        <p className="text-xs sm:text-sm whitespace-pre-wrap bg-white p-2 rounded border border-border break-words">
                          {activity.summary}
                        </p>
                      </div>
                    )}
                    {activity.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {activity.description}
                      </p>
                    )}
                    {activity.duration_minutes && (
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        Duur: {activity.duration_minutes} minuten
                      </p>
                    )}
                    {activity.created_by && (
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        Door: {activity.created_by}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 w-full min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 w-full min-w-0">
              <h2 className="text-lg sm:text-xl font-bold break-words">Bijlagen</h2>
              <label className="cursor-pointer w-full sm:w-auto">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <Button size="sm" variant="outline" disabled={uploadingFile} className="w-full sm:w-auto text-xs sm:text-sm" asChild>
                  <span>
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2 shrink-0" />
                    <span className="break-words">{uploadingFile ? 'Uploaden...' : 'Upload bestand'}</span>
                  </span>
                </Button>
              </label>
            </div>
            {attachments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm break-words">Geen bijlagen</p>
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
                        <p className="text-xs text-muted-foreground">
                          {new Date(attachment.created_at).toLocaleDateString('nl-BE')}
                        </p>
                      </div>
                    </a>
                    <button
                      onClick={() => setShowDeleteConfirm(attachment.id)}
                      disabled={deletingAttachmentId === attachment.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 sm:p-2 hover:bg-destructive/10 rounded text-destructive hover:text-destructive/80 disabled:opacity-50 shrink-0"
                      title="Verwijder bijlage"
                    >
                      {deletingAttachmentId === attachment.id ? (
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6 w-full min-w-0">
          {/* Assignment */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 w-full min-w-0">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 break-words">Toegewezen aan</h2>
            <div className="space-y-3">
              <select
                value={assignedTo}
                onChange={(e) => handleAssignTo(e.target.value)}
                disabled={isSaving}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
              >
                <option value="">Niet toegewezen</option>
                {adminUsers.map((user) => (
                  <option key={user.email} value={user.email}>
                    {user.email}
                  </option>
                ))}
              </select>
              {(lead as Lead & { assigned_to?: string }).assigned_to && (
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  Huidig: <span className="font-medium break-all">{(lead as Lead & { assigned_to?: string }).assigned_to}</span>
                </p>
              )}
            </div>
          </div>

          {/* Quote Builder */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 w-full min-w-0">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 break-words">Offerte</h2>
            <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 break-words">
              Stel een offerte op maat samen voor deze lead.
            </p>
            <Button
              onClick={() => router.push(`/admin/leads/${leadId}/quote`)}
              className="w-full mb-3 text-xs sm:text-sm"
              variant="default"
            >
              <Quote className="w-3 h-3 sm:w-4 sm:h-4 mr-2 shrink-0" />
              <span className="break-words">Offerte Builder</span>
            </Button>
            <LoadSavedQuoteInfo leadId={leadId} />
          </div>

          {/* Attribution Data */}
          {(lead.utm_source || lead.referrer) && (
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 w-full min-w-0">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 break-words">Attributie Data</h2>
              <div className="space-y-2 text-xs sm:text-sm min-w-0">
                {lead.utm_source && (
                  <div className="min-w-0">
                    <span className="text-muted-foreground">UTM Source:</span>{' '}
                    <span className="font-medium break-words">{lead.utm_source}</span>
                  </div>
                )}
                {lead.utm_medium && (
                  <div className="min-w-0">
                    <span className="text-muted-foreground">UTM Medium:</span>{' '}
                    <span className="font-medium break-words">{lead.utm_medium}</span>
                  </div>
                )}
                {lead.utm_campaign && (
                  <div className="min-w-0">
                    <span className="text-muted-foreground">UTM Campaign:</span>{' '}
                    <span className="font-medium break-words">{lead.utm_campaign}</span>
                  </div>
                )}
                {lead.referrer && (
                  <div className="min-w-0">
                    <span className="text-muted-foreground">Referrer:</span>{' '}
                    <a
                      href={lead.referrer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {lead.referrer}
                    </a>
                  </div>
                )}
                {lead.landing_path && (
                  <div className="min-w-0">
                    <span className="text-muted-foreground">Landing Path:</span>{' '}
                    <span className="font-medium break-words">{lead.landing_path}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Bijlage verwijderen?</h3>
                <p className="text-sm text-muted-foreground">
                  Deze actie kan niet ongedaan worden gemaakt.
                </p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              Weet je zeker dat je deze bijlage wilt verwijderen? Het bestand wordt permanent verwijderd uit de opslag.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowDeleteConfirm(null)}
                variant="outline"
                disabled={deletingAttachmentId !== null}
              >
                Annuleren
              </Button>
              <Button
                onClick={() => handleDeleteAttachment(showDeleteConfirm)}
                variant="destructive"
                disabled={deletingAttachmentId !== null}
              >
                {deletingAttachmentId === showDeleteConfirm ? (
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
