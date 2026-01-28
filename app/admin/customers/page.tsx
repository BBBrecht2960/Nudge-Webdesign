'use client';

import { useEffect, useState } from 'react';
import { supabase, type Customer } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { Users, Search, Filter, Euro, TrendingUp, Briefcase, ArrowUpDown, Clock, FileText } from 'lucide-react';

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
  }, [filter]);

  const loadCustomers = async () => {
    try {
      let query = supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('project_status', filter);
      }

      const { data, error } = await query;

      if (error) {
        // Check if table doesn't exist
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
          console.error('Customers tabel bestaat niet. Voer create-customers-table.sql uit in Supabase.');
          setTableError('Tabel bestaat niet');
          setCustomers([]);
          return;
        }
        throw error;
      }
      setTableError(null);
      setCustomers(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      const errorCode = (error as any)?.code;
      console.error('Error loading customers:', {
        error,
        message: errorMessage,
        code: errorCode,
      });
      
      // Set empty array on error so UI doesn't break
      setCustomers([]);
      // Check if it's a table missing error
      if (errorCode === '42P01' || errorMessage.includes('does not exist') || errorMessage.includes('schema cache')) {
        setTableError('Tabel bestaat niet');
      }
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 mb-6">
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
          onClick={() => setFilter('in_progress')}
        >
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">In Uitvoering</div>
          <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.in_progress}</div>
        </div>
        <div 
          className="bg-card border border-border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFilter('review')}
        >
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">In Review</div>
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.review}</div>
        </div>
        <div 
          className="bg-card border border-border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFilter('completed')}
        >
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Voltooid</div>
          <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.completed}</div>
        </div>
        <div 
          className="bg-card border border-border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFilter('on_hold')}
        >
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">On Hold</div>
          <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.on_hold}</div>
        </div>
        <div 
          className="bg-card border border-border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFilter('canceled')}
        >
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Geannuleerd</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-600">{stats.canceled}</div>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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

      {/* Filters and Search */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
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
              onChange={(e) => setSortBy(e.target.value as any)}
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

      {/* Customers Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 sm:p-4 text-left text-sm font-semibold">Klant</th>
                <th className="p-3 sm:p-4 text-left text-sm font-semibold">Bedrijf</th>
                <th className="p-3 sm:p-4 text-left text-sm font-semibold">Pakket</th>
                <th className="p-3 sm:p-4 text-left text-sm font-semibold">Omzet</th>
                <th className="p-3 sm:p-4 text-left text-sm font-semibold">Status</th>
                <th className="p-3 sm:p-4 text-left text-sm font-semibold">Toegewezen</th>
                <th className="p-3 sm:p-4 text-left text-sm font-semibold">Geconverteerd</th>
                <th className="p-3 sm:p-4 text-left text-sm font-semibold">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Geen klanten gevonden
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-border hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/customers/${customer.id}`)}
                  >
                    <td className="p-3 sm:p-4 break-words min-w-0">
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-muted-foreground break-all">{customer.email}</div>
                    </td>
                    <td className="p-3 sm:p-4 break-words min-w-0">
                      {customer.company_name || '-'}
                    </td>
                    <td className="p-3 sm:p-4 break-words min-w-0">
                      {customer.package_interest || '-'}
                    </td>
                    <td className="p-3 sm:p-4 min-w-0">
                      {customer.quote_total ? (
                        <div className="flex items-center gap-1">
                          <Euro className="w-3 h-3 text-primary shrink-0" />
                          <span className="font-semibold">
                            {customer.quote_total.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 min-w-0">
                      <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${getStatusColor(customer.project_status)}`}>
                        {getStatusLabel(customer.project_status)}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 break-words min-w-0">
                      {customer.assigned_to || <span className="text-muted-foreground text-sm">-</span>}
                    </td>
                    <td className="p-3 sm:p-4 text-sm text-muted-foreground whitespace-nowrap min-w-0">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        {new Date(customer.converted_at).toLocaleDateString('nl-BE')}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/customers/${customer.id}`);
                        }}
                        className="text-primary hover:underline text-sm whitespace-nowrap font-medium"
                      >
                        Openen →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
            Zoekresultaten voor: <strong className="text-foreground">"{search}"</strong>
          </div>
        )}
      </div>
    </div>
  );
}
