'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, type Lead } from '@/lib/db';
import { Users, Mail, CheckCircle, XCircle, Clock, Briefcase, Euro, PlayCircle, PauseCircle } from 'lucide-react';
import { type Customer } from '@/lib/db';

interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  leadsByStatus: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
  };
  recentLeads: Lead[];
  customers: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
    canceled: number;
    inProgress: number;
    inReview: number;
    totalRevenue: number;
  };
  recentCustomers: Customer[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get all leads
      const { data: allLeads, error: allError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) throw allError;

      // Get all customers
      const { data: allCustomers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      // Don't fail if customers table doesn't exist
      if (customersError && customersError.code !== '42P01' && !customersError.message?.includes('does not exist')) {
        console.error('Error loading customers:', customersError);
      }

      // Calculate lead stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const newLeads = allLeads?.filter(
        (lead) => new Date(lead.created_at) >= startOfMonth
      ).length || 0;

      const leadsByStatus = {
        new: allLeads?.filter((l) => l.status === 'new').length || 0,
        contacted: allLeads?.filter((l) => l.status === 'contacted').length || 0,
        qualified: allLeads?.filter((l) => l.status === 'qualified').length || 0,
        converted: allLeads?.filter((l) => l.status === 'converted').length || 0,
        lost: allLeads?.filter((l) => l.status === 'lost').length || 0,
      };

      const recentLeads = allLeads?.slice(0, 10) || [];

      // Calculate customer stats
      const customers = {
        total: allCustomers?.length || 0,
        active: allCustomers?.filter((c) => 
          c.project_status === 'in_progress' || c.project_status === 'review'
        ).length || 0,
        completed: allCustomers?.filter((c) => c.project_status === 'completed').length || 0,
        onHold: allCustomers?.filter((c) => c.project_status === 'on_hold').length || 0,
        canceled: allCustomers?.filter((c) => c.project_status === 'canceled').length || 0,
        inProgress: allCustomers?.filter((c) => c.project_status === 'in_progress').length || 0,
        inReview: allCustomers?.filter((c) => c.project_status === 'review').length || 0,
        totalRevenue: allCustomers?.reduce((sum, c) => sum + (Number(c.quote_total) || 0), 0) || 0,
      };

      const recentCustomers = allCustomers?.slice(0, 5) || [];

      setStats({
        totalLeads: allLeads?.length || 0,
        newLeads,
        leadsByStatus,
        recentLeads,
        customers,
        recentCustomers,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground">Geen data beschikbaar</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8 break-words">Dashboard</h1>

      {/* Stats Cards - Leads */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-muted-foreground">Leads</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Totaal Leads</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.totalLeads}</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Nieuwe (deze maand)</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.newLeads}</p>
              </div>
              <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Customers */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-muted-foreground">Klanten</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Totaal</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.customers.total}</p>
              </div>
              <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Totaal Omzet</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  €{stats.customers.totalRevenue.toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
              <Euro className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
        {/* Leads Status Breakdown */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 break-words">Leads per Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Nieuw</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.leadsByStatus.new}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Gecontacteerd</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.leadsByStatus.contacted}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Gekwalificeerd</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.leadsByStatus.qualified}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Geconverteerd</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.leadsByStatus.converted}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Verloren</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.leadsByStatus.lost}</p>
            </div>
          </div>
        </div>

        {/* Customers Status Breakdown */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 break-words">Klanten per Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Nieuw</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.customers.total - stats.customers.active - stats.customers.completed - stats.customers.onHold - stats.customers.canceled}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">In Uitvoering</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.customers.inProgress}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">In Review</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.customers.inReview}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Voltooid</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.customers.completed}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">On Hold</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.customers.onHold}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Geannuleerd</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-600">{stats.customers.canceled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Leads & Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
        {/* Recent Leads */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 break-words">Recente Leads</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-sm font-semibold">Naam</th>
                  <th className="text-left p-2 text-sm font-semibold">Bedrijf</th>
                  <th className="text-left p-2 text-sm font-semibold">Status</th>
                  <th className="text-left p-2 text-sm font-semibold">Datum</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLeads.slice(0, 5).map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="border-b border-border hover:bg-accent cursor-pointer"
                    onClick={() => window.location.href = `/admin/leads/${lead.id}`}
                  >
                    <td className="p-2 break-words min-w-0 font-medium">{lead.name}</td>
                    <td className="p-2 break-words min-w-0 text-sm">{lead.company_name || '-'}</td>
                    <td className="p-2 min-w-0">
                      <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                        lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                        lead.status === 'lost' ? 'bg-red-100 text-red-800' :
                        lead.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground whitespace-nowrap min-w-0">
                      {new Date(lead.created_at).toLocaleDateString('nl-BE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Link
              href="/admin/leads"
              className="text-primary hover:underline text-sm"
            >
              Bekijk alle leads →
            </Link>
          </div>
        </div>

        {/* Recent Customers */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 break-words">Recente Klanten</h2>
          {stats.recentCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Geen klanten gevonden
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 text-sm font-semibold">Klant</th>
                      <th className="text-left p-2 text-sm font-semibold">Status</th>
                      <th className="text-left p-2 text-sm font-semibold">Omzet</th>
                      <th className="text-left p-2 text-sm font-semibold">Datum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentCustomers.map((customer) => (
                      <tr 
                        key={customer.id} 
                        className="border-b border-border hover:bg-accent cursor-pointer"
                        onClick={() => window.location.href = `/admin/customers/${customer.id}`}
                      >
                        <td className="p-2 break-words min-w-0">
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-xs text-muted-foreground break-all">{customer.email}</div>
                        </td>
                        <td className="p-2 min-w-0">
                          <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                            customer.project_status === 'completed' ? 'bg-green-100 text-green-800' :
                            customer.project_status === 'on_hold' ? 'bg-red-100 text-red-800' :
                            customer.project_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            customer.project_status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                            customer.project_status === 'canceled' ? 'bg-gray-100 text-gray-800 border-gray-300' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {customer.project_status === 'new' ? 'Nieuw' :
                             customer.project_status === 'in_progress' ? 'In Uitvoering' :
                             customer.project_status === 'review' ? 'In Review' :
                             customer.project_status === 'completed' ? 'Voltooid' :
                             customer.project_status === 'canceled' ? 'Geannuleerd' : 'On Hold'}
                          </span>
                        </td>
                        <td className="p-2 min-w-0">
                          {customer.quote_total ? (
                            <span className="text-sm font-semibold">
                              €{customer.quote_total.toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-2 text-xs text-muted-foreground whitespace-nowrap min-w-0">
                          {new Date(customer.converted_at).toLocaleDateString('nl-BE')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Link
                  href="/admin/customers"
                  className="text-primary hover:underline text-sm"
                >
                  Bekijk alle klanten →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
