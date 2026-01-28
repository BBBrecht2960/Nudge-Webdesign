'use client';

import { useEffect, useState } from 'react';
import { supabase, type Lead } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { Users, Mail, Phone, Search, Filter, Plus, TrendingUp, Clock, CheckCircle, XCircle, ArrowUpDown, FileText } from 'lucide-react';
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
  }, [filter]);

  const loadLeads = async () => {
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
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
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <div 
          className="bg-card border border-border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFilter('all')}
        >
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Totaal</div>
          <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
        </div>
        <div 
          className="bg-card border border-border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFilter('new')}
        >
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Nieuw</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.new}</div>
        </div>
        <div 
          className="bg-card border border-border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFilter('contacted')}
        >
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Gecontacteerd</div>
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.contacted}</div>
        </div>
        <div 
          className="bg-card border border-border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFilter('qualified')}
        >
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Gekwalificeerd</div>
          <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.qualified}</div>
        </div>
        <div 
          className="bg-card border border-border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFilter('converted')}
        >
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Geconverteerd</div>
          <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.converted}</div>
        </div>
        <div 
          className="bg-card border border-border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFilter('lost')}
        >
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Verloren</div>
          <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.lost}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
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
              onChange={(e) => setSortBy(e.target.value as any)}
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

      {/* Leads Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 sm:p-4 text-sm font-semibold">Naam</th>
                <th className="text-left p-3 sm:p-4 text-sm font-semibold">Contact</th>
                <th className="text-left p-3 sm:p-4 text-sm font-semibold">Bedrijf</th>
                <th className="text-left p-3 sm:p-4 text-sm font-semibold">Pakket</th>
                <th className="text-left p-3 sm:p-4 text-sm font-semibold">Status</th>
                <th className="text-left p-3 sm:p-4 text-sm font-semibold">Datum</th>
                <th className="text-left p-3 sm:p-4 text-sm font-semibold">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Geen leads gevonden
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isLost = lead.status === 'lost';
                  return (
                  <tr
                    key={lead.id}
                    className={`border-t border-border hover:bg-accent/50 cursor-pointer transition-colors ${
                      isLost ? 'bg-gray-50 dark:bg-gray-800/50 opacity-75' : ''
                    }`}
                    onClick={() => router.push(`/admin/leads/${lead.id}`)}
                  >
                    <td className="p-3 sm:p-4 break-words min-w-0">
                      <div className={`font-medium ${isLost ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                        {lead.name}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 break-words min-w-0">
                      <div className="flex flex-col gap-1">
                        <a
                          href={`mailto:${lead.email}`}
                          className={`hover:underline break-all text-sm flex items-center gap-1 ${
                            isLost ? 'line-through text-gray-400 dark:text-gray-500' : 'text-primary'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="w-3 h-3 shrink-0" />
                          {lead.email}
                        </a>
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            className={`hover:underline break-all text-sm flex items-center gap-1 ${
                              isLost ? 'line-through text-gray-400 dark:text-gray-500' : 'text-primary'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-3 h-3 shrink-0" />
                            {lead.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className={`p-3 sm:p-4 break-words min-w-0 ${isLost ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                      {lead.company_name || '-'}
                    </td>
                    <td className={`p-3 sm:p-4 break-words min-w-0 ${isLost ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                      {lead.package_interest || '-'}
                    </td>
                    <td className="p-3 sm:p-4 min-w-0">
                      <span className={`px-2 py-1 rounded text-xs whitespace-nowrap font-semibold ${getStatusColor(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </td>
                    <td className={`p-3 sm:p-4 text-sm whitespace-nowrap min-w-0 ${
                      isLost ? 'line-through text-gray-400 dark:text-gray-500' : 'text-muted-foreground'
                    }`}>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        {new Date(lead.created_at).toLocaleDateString('nl-BE')}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 min-w-0">
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/leads/${lead.id}`);
                          }}
                          className="text-primary hover:underline text-sm whitespace-nowrap font-medium"
                        >
                          Openen →
                        </button>
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
            Zoekresultaten voor: <strong className="text-foreground">"{search}"</strong>
          </div>
        )}
      </div>
    </div>
  );
}
