'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, type Customer, type CustomerActivity, type CustomerAttachment, type CustomerUpdate, type CustomerProgressHistory } from '@/lib/db';
import { Button } from '@/app/components/Button';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  FileText,
  Image as ImageIcon,
  File,
  Code,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  PlayCircle,
  Plus,
  TrendingUp,
  Flag,
  AlertTriangle,
  Edit,
  History,
} from 'lucide-react';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [attachments, setAttachments] = useState<CustomerAttachment[]>([]);
  const [updates, setUpdates] = useState<CustomerUpdate[]>([]);
  const [progressHistory, setProgressHistory] = useState<CustomerProgressHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [projectStatus, setProjectStatus] = useState<string>('');
  
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
  }, [customerId]);

  useEffect(() => {
    if (customer) {
      setProjectStatus(customer.project_status);
    }
  }, [customer]);

  const loadCustomerData = async () => {
    try {
      setIsLoading(true);

      // Load customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;
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
    if (!customer || customer.project_status === newStatus) return;

    setIsSaving(true);
    
    try {
      const oldStatus = customer.project_status;
      
      const { error: updateError } = await supabase
        .from('customers')
        .update({ project_status: newStatus })
        .eq('id', customerId);

      if (updateError) throw updateError;

      // Add to progress history
      await supabase
        .from('customer_progress_history')
        .insert({
          customer_id: customerId,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: 'Admin',
        });

      setCustomer({ ...customer, project_status: newStatus as Customer['project_status'] });
      setProjectStatus(newStatus);
      
      // Reload progress history
      const { data: historyData } = await supabase
        .from('customer_progress_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      setProgressHistory(historyData || []);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Fout bij het bijwerken van de status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!updateTitle.trim() || !updateDescription.trim()) {
      alert('Titel en beschrijving zijn verplicht');
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
        } catch (parseError) {
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
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
      {/* Header */}
      <div className="mb-6">
        <Button
          onClick={() => router.push('/admin/customers')}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug naar Klanten
        </Button>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Cursor Prompt Section */}
          {customer.cursor_prompt && (
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2 break-words">
                  <Code className="w-5 h-5 text-primary shrink-0" />
                  Cursor AI Prompt
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
            </div>
          )}

          {/* Quote Information */}
          {customer.approved_quote && (
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 break-words">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                Goedgekeurde Offerte
              </h2>
              {customer.quote_total && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Totaal:</p>
                  <p className="text-2xl font-bold">
                    €{customer.quote_total.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              {customer.approved_quote && (
                <div className="bg-muted border border-border rounded-lg p-4">
                  <pre className="text-xs sm:text-sm whitespace-pre-wrap break-words overflow-x-auto">
                    {JSON.stringify(customer.approved_quote, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Project Updates */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold break-words">Project Updates</h2>
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
                      onChange={(e) => setUpdateType(e.target.value as any)}
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
          </div>

          {/* Activities */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0">
            <h2 className="text-xl font-bold mb-4 break-words">Activiteiten</h2>
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
          </div>

          {/* Attachments */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0">
            <h2 className="text-xl font-bold mb-4 break-words">Bijlagen</h2>
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
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 min-w-0">
          {/* Customer Info */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0">
            <h3 className="font-semibold mb-4 break-words">Klant Informatie</h3>
            <div className="space-y-3 text-sm">
              <div className="min-w-0">
                <p className="text-muted-foreground mb-1 break-words">Naam</p>
                <p className="font-medium break-words">{customer.name}</p>
              </div>
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
            </div>
          </div>

          {/* Project Info */}
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

          {/* Pain Points */}
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

          {/* Message */}
          {customer.message && (
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 min-w-0">
              <h3 className="font-semibold mb-4 break-words">Bericht</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                {customer.message}
              </p>
            </div>
          )}

          {/* Progress History */}
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
      </div>
    </div>
  );
}
