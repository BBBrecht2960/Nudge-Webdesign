'use client';

import { useEffect, useState } from 'react';
import { type Lead } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { Search, Plus, ArrowUpDown, FileText, LayoutGrid, CheckCircle, XCircle, Sparkles, Phone, Award } from 'lucide-react';
import { Button } from '@/app/components/Button';

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const res = await fetch('/api/leads', { credentials: 'include' });
      if (!res.ok) throw new Error('Fout bij ophalen leads');
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length,
  };

  const filteredLeads = leads
    .filter((lead) => {
      if (filter !== 'all' && lead.status !== filter) return false;
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        lead.name.toLowerCase().includes(searchLower) ||
        lead.email.toLowerCase().includes(searchLower) ||
        (lead.company_name && lead.company_name.toLowerCase().includes(searchLower)) ||
        (lead.vat_number && lead.vat_number.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'converted':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 font-semibold';
      case 'qualified':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'Nieuw',
      contacted: 'Gecontacteerd',
      qualified: 'Gekwalificeerd',
      converted: 'Geconverteerd',
      lost: 'Verloren',
    };
    return labels[status] || status;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">Leads</h1>
          <p className="text-muted-foreground text-sm">
            Beheer en volg alle leads
          </p>
        </div>
        <Button onClick={() => router.push('/admin/leads/new')} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe lead
        </Button>
      </div>

      {/* Quick Stats — belangrijkste groot, rest compact en mooi */}
      <section className="mb-8" aria-label="Statistieken">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Statistieken</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-xl p-4 sm:p-5 text-left transition-all duration-200 sm:col-span-2 ${
              filter === 'all'
                ? 'bg-primary/10 border-2 border-primary shadow-sm ring-2 ring-primary/20'
                : 'bg-card border border-border hover:border-primary/40 hover:bg-primary/5'
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
            onClick={() => setFilter('converted')}
            className={`rounded-xl p-3 sm:p-4 text-left transition-all duration-200 ${
              filter === 'converted'
                ? 'bg-green-500/10 border-2 border-green-500/50 ring-2 ring-green-500/20'
                : 'bg-card border border-border hover:border-green-500/30 hover:bg-green-500/5'
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
            onClick={() => setFilter('lost')}
            className={`rounded-xl p-3 sm:p-4 text-left transition-all duration-200 ${
              filter === 'lost'
                ? 'bg-red-500/10 border-2 border-red-500/50 ring-2 ring-red-500/20'
                : 'bg-card border border-border hover:border-red-500/30 hover:bg-red-500/5'
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
            onClick={() => setFilter('new')}
            className={`rounded-lg p-2.5 sm:p-3 text-left transition-all duration-200 border ${
              filter === 'new'
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
            onClick={() => setFilter('contacted')}
            className={`rounded-lg p-2.5 sm:p-3 text-left transition-all duration-200 border ${
              filter === 'contacted'
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
            onClick={() => setFilter('qualified')}
            className={`rounded-lg p-2.5 sm:p-3 text-left transition-all duration-200 border ${
              filter === 'qualified'
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

      {/* Filters and Search */}
      <section className="mb-6" aria-label="Zoeken en filteren">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Zoeken & filteren</h2>
        <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Zoek op naam, e-mail, bedrijf of BTW-nummer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {['all', 'new', 'contacted', 'qualified', 'converted', 'lost'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-accent'
                }`}
              >
                {status === 'all' ? 'Alle' : 
                 status === 'new' ? 'Nieuw' :
                 status === 'contacted' ? 'Gecontacteerd' :
                 status === 'qualified' ? 'Gekwalificeerd' :
                 status === 'converted' ? 'Geconverteerd' : 'Verloren'}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'status')}
              className="px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="date">Sorteer op datum</option>
              <option value="name">Sorteer op naam</option>
              <option value="status">Sorteer op status</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-2 border border-border rounded-md hover:bg-accent text-sm"
              title={sortOrder === 'asc' ? 'Oplopend' : 'Aflopend'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        </div>
      </section>

      {/* Leads Table */}
      <section aria-label="Overzicht leads">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold">Overzicht leads</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Klik op een rij om de lead te openen.</p>
          </div>
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-muted/30 text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">Naam</th>
                  <th className="text-left py-3 px-4 font-medium">Contact</th>
                  <th className="text-left py-3 px-4 font-medium">Bedrijf</th>
                  <th className="text-left py-3 px-4 font-medium">Pakket</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Datum</th>
                  <th className="text-left py-3 px-4 font-medium">Acties</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center text-muted-foreground text-sm">
                      Geen leads gevonden
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const isLost = lead.status === 'lost';
                    return (
                      <tr
                        key={lead.id}
                        className={`border-t border-border/80 hover:bg-muted/20 transition-colors cursor-pointer ${
                          isLost ? 'bg-muted/10 opacity-75' : ''
                        }`}
                        onClick={() => router.push(`/admin/leads/${lead.id}`)}
                      >
                        <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                          <span className={isLost ? 'line-through text-muted-foreground' : ''}>{lead.name}</span>
                        </td>
                        <td className="py-3 px-4 text-sm whitespace-nowrap">
                          <a
                            href={`mailto:${lead.email}`}
                            className={`hover:underline ${isLost ? 'line-through text-muted-foreground/80' : 'text-primary'}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.email}
                          </a>
                          {lead.phone && (
                            <span className="text-muted-foreground"> · <a href={`tel:${lead.phone}`} className="hover:underline text-primary" onClick={(e) => e.stopPropagation()}>{lead.phone}</a></span>
                          )}
                        </td>
                        <td className={`py-3 px-4 whitespace-nowrap ${isLost ? 'line-through text-muted-foreground' : ''}`}>
                          {lead.company_name || '-'}
                        </td>
                        <td className={`py-3 px-4 whitespace-nowrap ${isLost ? 'line-through text-muted-foreground' : ''}`}>
                          {lead.package_interest || '-'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(lead.status)}`}>
                            {getStatusLabel(lead.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {new Date(lead.created_at).toLocaleDateString('nl-BE')}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {!isLost && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/admin/leads/${lead.id}/quote`);
                                    }}
                                    className="text-primary hover:bg-primary/10 px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors whitespace-nowrap"
                                    title="Offerte maken"
                                  >
                                    <FileText className="w-3 h-3" />
                                    Offerte
                                  </button>
                                )}
                              </div>
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

      {/* Footer Stats */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground">
        <div>
          {filter === 'all' ? (
            <span>Totaal: <strong className="text-foreground">{filteredLeads.length}</strong> lead{filteredLeads.length !== 1 ? 's' : ''}</span>
          ) : (
            <span>
              {filteredLeads.length} van {stats.total} leads ({((filteredLeads.length / stats.total) * 100).toFixed(1)}%)
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
