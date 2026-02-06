'use client';

import { useEffect, useState, useMemo } from 'react';
import { type Lead } from '@/lib/db';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  LayoutGrid,
  CheckCircle,
  XCircle,
  Sparkles,
  Phone,
  Award,
  Mail,
  PhoneCall,
  User,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/app/components/Button';

type LeadWithActivity = Lead & {
  last_activity?: { title: string; created_at: string } | null;
};

type AssignableUser = { id: string; email: string; full_name: string | null };

const STATUS_OPTIONS = [
  { value: 'all', label: 'Alle' },
  { value: 'new', label: 'Nieuw' },
  { value: 'contacted', label: 'Gecontacteerd' },
  { value: 'qualified', label: 'Gekwalificeerd' },
  { value: 'converted', label: 'Geconverteerd' },
  { value: 'lost', label: 'Verloren' },
];

const SORT_FIELDS: { key: 'created_at' | 'name' | 'status' | 'company_name' | 'email'; label: string }[] = [
  { key: 'created_at', label: 'Datum' },
  { key: 'name', label: 'Naam' },
  { key: 'company_name', label: 'Bedrijf' },
  { key: 'email', label: 'E-mail' },
  { key: 'status', label: 'Status' },
];

function getStatusColor(status: string) {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    case 'contacted':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    case 'qualified':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300';
    case 'converted':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    case 'lost':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    new: 'Nieuw',
    contacted: 'Gecontacteerd',
    qualified: 'Gekwalificeerd',
    converted: 'Geconverteerd',
    lost: 'Verloren',
  };
  return labels[status] || status;
}

function deriveSource(lead: Lead): 'website' | 'manual' {
  if ((lead as Lead & { referrer?: string; landing_path?: string }).referrer || (lead as Lead & { landing_path?: string }).landing_path) {
    return 'website';
  }
  return 'manual';
}

function escapeCsvCell(str: string): string {
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preset = searchParams.get('preset') || '';

  const [leads, setLeads] = useState<LeadWithActivity[]>([]);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'status' | 'company_name' | 'email'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadLeads();
    loadUsers();
  }, []);

  // Apply URL preset (e.g. ?preset=mine or ?preset=new)
  useEffect(() => {
    if (preset === 'mine') {
      setAssignedFilter('__me__');
      setStatusFilter('all');
    } else if (preset === 'new') {
      setStatusFilter('new');
      setAssignedFilter('all');
    }
  }, [preset]);

  const loadLeads = async () => {
    try {
      const params = new URLSearchParams();
      params.set('include_last_activity', '1');
      const res = await fetch(`/api/leads?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Fout bij ophalen leads');
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/assignable-users', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error loading assignable users:', e);
    }
  };

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    converted: leads.filter((l) => l.status === 'converted').length,
    lost: leads.filter((l) => l.status === 'lost').length,
  }), [leads]);

  const filteredLeads = useMemo(() => {
    let list = leads;

    if (statusFilter !== 'all') {
      list = list.filter((l) => l.status === statusFilter);
    }
    if (assignedFilter === '__none__') {
      list = list.filter((l) => !(l.assigned_to && l.assigned_to.trim()));
    } else if (assignedFilter !== 'all' && assignedFilter !== '__me__') {
      list = list.filter((l) => l.assigned_to === assignedFilter);
    }
    if (sourceFilter !== 'all') {
      list = list.filter((l) => deriveSource(l) === sourceFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.company_name && l.company_name.toLowerCase().includes(q)) ||
          (l.phone && l.phone.includes(q)) ||
          (l.vat_number && l.vat_number.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'company_name':
          comparison = (a.company_name || '').localeCompare(b.company_name || '');
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [leads, statusFilter, assignedFilter, sourceFilter, search, sortBy, sortOrder]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const exportCsv = () => {
    const headers = ['Naam', 'Bedrijf', 'E-mail', 'Telefoon', 'Status', 'Toegewezen aan', 'Bron', 'Laatste activiteit', 'Datum'];
    const rows = filteredLeads.map((l) => [
      l.name,
      l.company_name || '',
      l.email,
      l.phone || '',
      getStatusLabel(l.status),
      l.assigned_to || '',
      deriveSource(l) === 'website' ? 'Website' : 'Handmatig',
      (l as LeadWithActivity).last_activity
        ? `${(l as LeadWithActivity).last_activity!.title} (${new Date((l as LeadWithActivity).last_activity!.created_at).toLocaleString('nl-BE')})`
        : '',
      new Date(l.created_at).toLocaleDateString('nl-BE'),
    ]);
    const csv = [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.map(escapeCsvCell).join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">Lead-pool</h1>
          <p className="text-muted-foreground text-sm">
            Alle potentiële leads op één plek. Sorteer, filter en exporteer.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={exportCsv} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button onClick={() => router.push('/admin/leads/new')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nieuwe lead
          </Button>
        </div>
      </div>

      <section className="mb-6" aria-label="Statistieken">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Statistieken</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-xl p-4 sm:p-5 text-left transition-all duration-200 sm:col-span-2 border ${
              statusFilter === 'all'
                ? 'bg-primary/10 border-primary ring-2 ring-primary/20'
                : 'bg-card border-border hover:border-primary/40 hover:bg-primary/5'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              <LayoutGrid className="w-4 h-4 shrink-0 opacity-70" />
              Totaal
            </div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">{stats.total}</div>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('converted')}
            className={`rounded-xl p-3 sm:p-4 text-left transition-all duration-200 border ${
              statusFilter === 'converted'
                ? 'bg-green-500/10 border-green-500/50 ring-2 ring-green-500/20'
                : 'bg-card border-border hover:border-green-500/30 hover:bg-green-500/5'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
              <CheckCircle className="w-3.5 h-3.5 shrink-0 text-green-600 dark:text-green-400" />
              Geconverteerd
            </div>
            <div className="text-xl font-bold tabular-nums text-green-600 dark:text-green-400">{stats.converted}</div>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('lost')}
            className={`rounded-xl p-3 sm:p-4 text-left transition-all duration-200 border ${
              statusFilter === 'lost'
                ? 'bg-red-500/10 border-red-500/50 ring-2 ring-red-500/20'
                : 'bg-card border-border hover:border-red-500/30 hover:bg-red-500/5'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
              <XCircle className="w-3.5 h-3.5 shrink-0 text-red-600 dark:text-red-400" />
              Verloren
            </div>
            <div className="text-xl font-bold tabular-nums text-red-600 dark:text-red-400">{stats.lost}</div>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('new')}
            className={`rounded-lg p-2.5 sm:p-3 text-left transition-all duration-200 border ${
              statusFilter === 'new'
                ? 'bg-blue-500/10 border-blue-500/40 ring-2 ring-blue-500/20'
                : 'bg-muted/30 border-border/80 hover:bg-muted/50 hover:border-blue-500/20'
            }`}
          >
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
              Nieuw
            </span>
            <span className="mt-1 block text-sm font-semibold tabular-nums text-blue-600 dark:text-blue-400">{stats.new}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('contacted')}
            className={`rounded-lg p-2.5 sm:p-3 text-left transition-all duration-200 border ${
              statusFilter === 'contacted'
                ? 'bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/20'
                : 'bg-muted/30 border-border/80 hover:bg-muted/50 hover:border-amber-500/20'
            }`}
          >
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              Gecontacteerd
            </span>
            <span className="mt-1 block text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400">{stats.contacted}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('qualified')}
            className={`rounded-lg p-2.5 sm:p-3 text-left transition-all duration-200 border ${
              statusFilter === 'qualified'
                ? 'bg-violet-500/10 border-violet-500/40 ring-2 ring-violet-500/20'
                : 'bg-muted/30 border-border/80 hover:bg-muted/50 hover:border-violet-500/20'
            }`}
          >
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Award className="w-3.5 h-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
              Gekwalificeerd
            </span>
            <span className="mt-1 block text-sm font-semibold tabular-nums text-violet-600 dark:text-violet-400">{stats.qualified}</span>
          </button>
        </div>
      </section>

      <section className="mb-6" aria-label="Zoeken en filteren">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Zoeken & filteren</h2>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex flex-col lg:flex-row gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Zoek op naam, e-mail, bedrijf of BTW..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-background"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <User className="w-4 h-4 text-muted-foreground" />
              <select
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[160px]"
              >
                <option value="all">Alle</option>
                <option value="__none__">Niet toegewezen</option>
                {users.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.full_name || u.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">Bron:</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Alle</option>
                <option value="website">Website</option>
                <option value="manual">Handmatig</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {SORT_FIELDS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                className="p-2 border border-border rounded-md hover:bg-accent text-sm"
                title={sortOrder === 'asc' ? 'Oplopend' : 'Aflopend'}
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Overzicht leads">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold">Overzicht leads</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Klik op een rij om de lead te openen. Gebruik de actieknoppen om te bellen of e-mailen.
            </p>
          </div>
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-muted/30 text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">
                    <button type="button" onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-foreground">
                      Naam {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium">
                    <button type="button" onClick={() => handleSort('company_name')} className="flex items-center gap-1 hover:text-foreground">
                      Bedrijf {sortBy === 'company_name' && (sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium">E-mail</th>
                  <th className="text-left py-3 px-4 font-medium">Telefoon</th>
                  <th className="text-left py-3 px-4 font-medium">
                    <button type="button" onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-foreground">
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Toegewezen aan</th>
                  <th className="text-left py-3 px-4 font-medium">Bron</th>
                  <th className="text-left py-3 px-4 font-medium">Laatste activiteit</th>
                  <th className="text-left py-3 px-4 font-medium">
                    <button type="button" onClick={() => handleSort('created_at')} className="flex items-center gap-1 hover:text-foreground">
                      Datum {sortBy === 'created_at' && (sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium w-32">Acties</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 px-4 text-center text-muted-foreground text-sm">
                      Geen leads gevonden
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const isLost = lead.status === 'lost';
                    const lastAct = (lead as LeadWithActivity).last_activity;
                    return (
                      <tr
                        key={lead.id}
                        className={`border-t border-border/80 hover:bg-muted/20 transition-colors cursor-pointer ${isLost ? 'bg-muted/10 opacity-75' : ''}`}
                        onClick={() => router.push(`/admin/leads/${lead.id}`)}
                      >
                        <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                          <span className={isLost ? 'line-through text-muted-foreground' : ''}>{lead.name}</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={isLost ? 'line-through text-muted-foreground' : ''}>{lead.company_name || '-'}</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <a
                            href={`mailto:${lead.email}`}
                            className={`hover:underline ${isLost ? 'line-through text-muted-foreground/80' : 'text-primary'}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.email}
                          </a>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {lead.phone ? (
                            <a href={`tel:${lead.phone}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                              {lead.phone}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(lead.status)}`}>
                            {getStatusLabel(lead.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {lead.assigned_to ? users.find((u) => u.email === lead.assigned_to)?.full_name || lead.assigned_to : '-'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {deriveSource(lead) === 'website' ? 'Website' : 'Handmatig'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap max-w-[180px] truncate" title={lastAct ? `${lastAct.title} – ${new Date(lastAct.created_at).toLocaleString('nl-BE')}` : ''}>
                          {lastAct ? `${lastAct.title} (${new Date(lastAct.created_at).toLocaleDateString('nl-BE')})` : '-'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {new Date(lead.created_at).toLocaleDateString('nl-BE')}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap relative" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                className="p-2 rounded-md hover:bg-primary/10 text-primary"
                                title="Bellen"
                              >
                                <PhoneCall className="w-4 h-4" />
                              </a>
                            )}
                            <a
                              href={`mailto:${lead.email}`}
                              className="p-2 rounded-md hover:bg-primary/10 text-primary"
                              title="E-mail"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                            {!isLost && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/admin/leads/${lead.id}/quote`);
                                }}
                                className="p-2 rounded-md hover:bg-primary/10 text-primary"
                                title="Offerte"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRowMenuId(rowMenuId === lead.id ? null : lead.id);
                              }}
                              className="p-2 rounded-md hover:bg-muted"
                              title="Meer"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                          {rowMenuId === lead.id && (
                            <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                onClick={() => {
                                  router.push(`/admin/leads/${lead.id}`);
                                  setRowMenuId(null);
                                }}
                              >
                                Open detail
                              </button>
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                onClick={() => {
                                  router.push(`/admin/leads/${lead.id}`);
                                  setRowMenuId(null);
                                }}
                              >
                                Status wijzigen
                              </button>
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                onClick={() => {
                                  router.push(`/admin/leads/${lead.id}`);
                                  setRowMenuId(null);
                                }}
                              >
                                Toewijzen
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground">
        <div>
          {statusFilter === 'all' && assignedFilter === 'all' && !sourceFilter && !search ? (
            <span>
              Totaal: <strong className="text-foreground">{filteredLeads.length}</strong> lead{filteredLeads.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span>
              {filteredLeads.length} van {stats.total} leads
            </span>
          )}
        </div>
        {search && (
          <div className="text-xs">
            Zoekresultaten voor: <strong className="text-foreground">&quot;{search}&quot;</strong>
          </div>
        )}
      </div>
    </div>
  );
}
