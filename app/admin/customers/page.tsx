'use client';

import { useEffect, useState } from 'react';
import { type Customer } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { Search, Euro, TrendingUp, Briefcase, ArrowUpDown, LayoutGrid, CheckCircle, Wrench, Sparkles, ClipboardCheck, PauseCircle, XCircle } from 'lucide-react';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [tableError, setTableError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status' | 'revenue'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers', { credentials: 'include' });
      if (!res.ok) {
        setTableError('Fout bij ophalen klanten');
        setCustomers([]);
        return;
      }
      const data = await res.json();
      setTableError(null);
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error('Error loading customers:', error);
      setCustomers([]);
      setTableError('Fout bij ophalen klanten');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: customers.length,
    new: customers.filter(c => c.project_status === 'new').length,
    in_progress: customers.filter(c => c.project_status === 'in_progress').length,
    review: customers.filter(c => c.project_status === 'review').length,
    completed: customers.filter(c => c.project_status === 'completed').length,
    on_hold: customers.filter(c => c.project_status === 'on_hold').length,
    canceled: customers.filter(c => c.project_status === 'canceled').length,
    totalRevenue: customers.filter(c => c.project_status !== 'canceled').reduce((sum, c) => sum + (Number(c.quote_total) || 0), 0),
    averageDeal: customers.filter(c => c.project_status !== 'canceled').length > 0 
      ? customers.filter(c => c.project_status !== 'canceled').reduce((sum, c) => sum + (Number(c.quote_total) || 0), 0) / customers.filter(c => c.project_status !== 'canceled').length 
      : 0,
  };

  const filteredCustomers = customers
    .filter((customer) => {
      if (filter !== 'all' && customer.project_status !== filter) return false;
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        (customer.company_name && customer.company_name.toLowerCase().includes(searchLower)) ||
        (customer.vat_number && customer.vat_number.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.converted_at).getTime() - new Date(b.converted_at).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = a.project_status.localeCompare(b.project_status);
          break;
        case 'revenue':
          comparison = (Number(a.quote_total) || 0) - (Number(b.quote_total) || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

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
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
          <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
          Klantenbestand
        </h1>
        <p className="text-muted-foreground text-sm">
          Overzicht van alle geconverteerde leads en actieve projecten
        </p>
      </div>

      {/* Database Setup Warning */}
      {tableError && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Database Setup Vereist</h3>
          <p className="text-sm text-yellow-700 mb-2">
            De customers tabel bestaat nog niet in de database. Voer het volgende SQL script uit in je Supabase SQL Editor:
          </p>
          <code className="block bg-yellow-100 p-2 rounded text-xs mb-2 break-all">
            create-customers-table.sql
          </code>
          <p className="text-xs text-yellow-600">
            Zie CUSTOMER_CONVERSION.md voor instructies.
          </p>
        </div>
      )}

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
            onClick={() => setFilter('completed')}
            className={`rounded-xl p-3 sm:p-4 text-left transition-all duration-200 ${
              filter === 'completed'
                ? 'bg-green-500/10 border-2 border-green-500/50 ring-2 ring-green-500/20'
                : 'bg-card border border-border hover:border-green-500/30 hover:bg-green-500/5'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
              <CheckCircle className="w-3.5 h-3.5 shrink-0 text-green-600 dark:text-green-400" />
              Voltooid
            </div>
            <div className="text-xl font-bold tabular-nums text-green-600 dark:text-green-400">{stats.completed}</div>
          </button>
          <button
            type="button"
            onClick={() => setFilter('in_progress')}
            className={`rounded-xl p-3 sm:p-4 text-left transition-all duration-200 ${
              filter === 'in_progress'
                ? 'bg-violet-500/10 border-2 border-violet-500/50 ring-2 ring-violet-500/20'
                : 'bg-card border border-border hover:border-violet-500/30 hover:bg-violet-500/5'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
              <Wrench className="w-3.5 h-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
              In Uitvoering
            </div>
            <div className="text-xl font-bold tabular-nums text-violet-600 dark:text-violet-400">{stats.in_progress}</div>
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
            onClick={() => setFilter('review')}
            className={`rounded-lg p-2.5 sm:p-3 text-left transition-all duration-200 border ${
              filter === 'review'
                ? 'bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/20'
                : 'bg-muted/30 border-border/80 hover:bg-muted/50 hover:border-amber-500/20'
            }`}
          >
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ClipboardCheck className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              In Review
            </span>
            <span className="mt-1 block text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400">{stats.review}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('on_hold')}
            className={`rounded-lg p-2.5 sm:p-3 text-left transition-all duration-200 border ${
              filter === 'on_hold'
                ? 'bg-red-500/10 border-red-500/40 ring-2 ring-red-500/20'
                : 'bg-muted/30 border-border/80 hover:bg-muted/50 hover:border-red-500/20'
            }`}
          >
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <PauseCircle className="w-3.5 h-3.5 shrink-0 text-red-600 dark:text-red-400" />
              On Hold
            </span>
            <span className="mt-1 block text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">{stats.on_hold}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('canceled')}
            className={`rounded-lg p-2.5 sm:p-3 text-left transition-all duration-200 border ${
              filter === 'canceled'
                ? 'bg-gray-500/10 border-gray-500/40 ring-2 ring-gray-500/20 dark:bg-gray-400/10 dark:border-gray-400/40'
                : 'bg-muted/30 border-border/80 hover:bg-muted/50 hover:border-gray-500/20'
            }`}
          >
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <XCircle className="w-3.5 h-3.5 shrink-0 text-gray-600 dark:text-gray-400" />
              Geannuleerd
            </span>
            <span className="mt-1 block text-sm font-semibold tabular-nums text-gray-600 dark:text-gray-400">{stats.canceled}</span>
          </button>
        </div>
      </section>

      {/* Revenue Stats */}
      <section className="mb-8" aria-label="Omzet">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Omzet</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Totaal Omzet</div>
            <Euro className="w-5 h-5 text-primary shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold">
            €{stats.totalRevenue.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Van {stats.total} klant{stats.total !== 1 ? 'en' : ''}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Gemiddelde Deal</div>
            <TrendingUp className="w-5 h-5 text-green-600 shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-green-600">
            €{stats.averageDeal.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Per project
          </div>
        </div>
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
                placeholder="Zoek klanten..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {['all', 'new', 'in_progress', 'review', 'completed', 'on_hold', 'canceled'].map((status) => (
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
                 status === 'in_progress' ? 'In Uitvoering' :
                 status === 'review' ? 'In Review' :
                 status === 'completed' ? 'Voltooid' :
                 status === 'on_hold' ? 'On Hold' : 'Geannuleerd'}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'status' | 'revenue')}
              className="px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="date">Sorteer op datum</option>
              <option value="name">Sorteer op naam</option>
              <option value="status">Sorteer op status</option>
              <option value="revenue">Sorteer op omzet</option>
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

      {/* Customers Table */}
      <section aria-label="Overzicht klanten">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold">Overzicht klanten</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Klik op een rij om de klant te openen.</p>
          </div>
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-muted/30 text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">Klant</th>
                  <th className="text-left py-3 px-4 font-medium">Bedrijf</th>
                  <th className="text-left py-3 px-4 font-medium">Pakket</th>
                  <th className="text-left py-3 px-4 font-medium">Omzet</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Toegewezen</th>
                  <th className="text-left py-3 px-4 font-medium">Geconverteerd</th>
                  <th className="text-left py-3 px-4 font-medium">Acties</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 px-4 text-center text-muted-foreground text-sm">
                      Geen klanten gevonden
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const isCanceled = customer.project_status === 'canceled';
                    return (
                      <tr
                        key={customer.id}
                        className={`border-t border-border/80 hover:bg-muted/20 transition-colors cursor-pointer ${
                          isCanceled ? 'bg-muted/10 opacity-75' : ''
                        }`}
                        onClick={() => router.push(`/admin/customers/${customer.id}`)}
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className={`font-medium text-foreground ${isCanceled ? 'line-through text-muted-foreground' : ''}`}>
                            {customer.name}
                          </div>
                          <div className={`text-xs text-muted-foreground ${isCanceled ? 'line-through' : ''}`}>
                            {customer.email}
                          </div>
                        </td>
                        <td className={`py-3 px-4 whitespace-nowrap ${isCanceled ? 'line-through text-muted-foreground' : ''}`}>
                          {customer.company_name || '-'}
                        </td>
                        <td className={`py-3 px-4 whitespace-nowrap ${isCanceled ? 'line-through text-muted-foreground' : ''}`}>
                          {customer.package_interest || '-'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isCanceled ? (
                            <span className="text-muted-foreground text-sm italic">Geannuleerd</span>
                          ) : customer.quote_total ? (
                            <span className="tabular-nums font-medium">
                              € {customer.quote_total.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(customer.project_status)}`}>
                            {getStatusLabel(customer.project_status)}
                          </span>
                        </td>
                        <td className={`py-3 px-4 whitespace-nowrap ${isCanceled ? 'line-through text-muted-foreground' : ''}`}>
                          {customer.assigned_to || '-'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          <span className={isCanceled ? 'line-through' : ''}>
                            {customer.converted_at ? new Date(customer.converted_at).toLocaleDateString('nl-BE') : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                              —
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
            <span>Totaal: <strong className="text-foreground">{filteredCustomers.length}</strong> klant{filteredCustomers.length !== 1 ? 'en' : ''}</span>
          ) : (
            <span>
              {filteredCustomers.length} van {stats.total} klanten ({((filteredCustomers.length / stats.total) * 100).toFixed(1)}%)
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
