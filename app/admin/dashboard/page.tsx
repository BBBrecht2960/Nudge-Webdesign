'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { type Lead } from '@/lib/db';
import { Users, Mail, Briefcase, Euro, TrendingUp, Target, Check } from 'lucide-react';
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

type Permissions = { can_leads?: boolean; can_customers?: boolean; can_manage_users?: boolean };

type SalesTargetData = {
  daily_target_eur: number;
  weekly_target_eur: number;
  revenue_today?: number;
  revenue_this_week?: number;
  progress_daily_pct?: number;
  progress_weekly_pct?: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [salesTarget, setSalesTarget] = useState<SalesTargetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingTarget, setSavingTarget] = useState(false);
  const [targetSavedFeedback, setTargetSavedFeedback] = useState(false);
  const [targetForm, setTargetForm] = useState({ daily: '', weekly: '' });

  const loadDashboardData = useCallback(async () => {
    try {
      const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
      const sessionData = sessionRes.ok ? await sessionRes.json() : null;
      const perms = sessionData?.permissions ?? null;
      setPermissions(perms);

      let allLeads: Lead[] = [];
      let allCustomers: Customer[] = [];

      if (perms?.can_leads) {
        const leadsRes = await fetch('/api/leads', { credentials: 'include' });
        if (leadsRes.ok) allLeads = await leadsRes.json();
      }
      if (perms?.can_customers) {
        const customersRes = await fetch('/api/customers', { credentials: 'include' });
        if (customersRes.ok) allCustomers = await customersRes.json();
        const targetRes = await fetch('/api/admin/sales-target', { credentials: 'include' });
        if (targetRes.ok) {
          const targetData = await targetRes.json();
          setSalesTarget(targetData);
          if (perms?.can_manage_users && (targetForm.daily === '' && targetForm.weekly === '')) {
            setTargetForm({
              daily: String(targetData.daily_target_eur ?? 0),
              weekly: String(targetData.weekly_target_eur ?? 0),
            });
          }
        }
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
        totalRevenue: allCustomers?.filter(c => c.project_status !== 'canceled').reduce((sum, c) => sum + (Number(c.quote_total) || 0), 0) || 0,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount; targetForm prefill is intentional once
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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

      {permissions?.can_leads && (
      <>
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

      </>
      )}

      {permissions?.can_customers && (
      <>
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

          {permissions?.can_manage_users && (
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Totaal Omzet</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  €{stats.customers.totalRevenue.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Euro className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
            </div>
          </div>
          )}

          {!permissions?.can_manage_users && salesTarget && (
            <>
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Dagdoel</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary">
                      {(salesTarget.progress_daily_pct ?? 0)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(salesTarget.daily_target_eur ?? 0) === 0 ? 'Stel een doel in op het dashboard (beheer)' : 'van streefdoel'}
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Weekdoel</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary">
                      {(salesTarget.progress_weekly_pct ?? 0)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(salesTarget.weekly_target_eur ?? 0) === 0 ? 'Stel een doel in op het dashboard (beheer)' : 'van streefdoel'}
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {permissions?.can_manage_users && (
      <div className="mb-6 sm:mb-8 bg-card border border-border rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Salesdoelen (team)</h2>
            <p className="text-sm text-muted-foreground">Het sales team ziet alleen het percentage van het doel, niet de exacte omzet.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl mt-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Dagdoel (€)</label>
            <input
              type="number"
              min={0}
              step={100}
              value={targetForm.daily}
              onChange={(e) => setTargetForm((f) => ({ ...f, daily: e.target.value }))}
              className="w-full rounded-lg border-2 border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1.5">Vandaag: €{(salesTarget?.revenue_today ?? 0).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (conversies vandaag, tijdzone België)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Weekdoel (€)</label>
            <input
              type="number"
              min={0}
              step={500}
              value={targetForm.weekly}
              onChange={(e) => setTargetForm((f) => ({ ...f, weekly: e.target.value }))}
              className="w-full rounded-lg border-2 border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1.5">Deze week: €{(salesTarget?.revenue_this_week ?? 0).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (conversies deze week, tijdzone België)</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={savingTarget}
            onClick={async () => {
              setTargetSavedFeedback(false);
              setSavingTarget(true);
              try {
                const res = await fetch('/api/admin/sales-target', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    daily_target_eur: Number(targetForm.daily) || 0,
                    weekly_target_eur: Number(targetForm.weekly) || 0,
                  }),
                });
                if (res.ok) {
                  const targetRes = await fetch('/api/admin/sales-target', { credentials: 'include' });
                  if (targetRes.ok) setSalesTarget(await targetRes.json());
                  setTargetSavedFeedback(true);
                  setTimeout(() => setTargetSavedFeedback(false), 3000);
                }
              } finally {
                setSavingTarget(false);
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
          >
            {savingTarget ? (
              <>Opslaan...</>
            ) : targetSavedFeedback ? (
              <>
                <Check className="w-4 h-4" />
                Opgeslagen
              </>
            ) : (
              <>Doelen opslaan</>
            )}
          </button>
          {targetSavedFeedback && (
            <span className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
              <Check className="w-4 h-4 shrink-0" />
              Doelen opgeslagen
            </span>
          )}
        </div>
      </div>
      )}

      </>
      )}

      {/* Status Breakdown - only show when we have at least one permission */}
      {(permissions?.can_leads || permissions?.can_customers) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
        {permissions?.can_leads && (
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
        )}
        {permissions?.can_customers && (
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 break-words">Klanten per Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            <div className="flex flex-col">
              <div className="min-h-[2.5rem] flex items-center">
                <p className="text-xs sm:text-sm text-muted-foreground">Nieuw</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold">{stats.customers.total - stats.customers.active - stats.customers.completed - stats.customers.onHold - stats.customers.canceled}</p>
            </div>
            <div className="flex flex-col">
              <div className="min-h-[2.5rem] flex items-center">
                <p className="text-xs sm:text-sm text-muted-foreground">In Uitvoering</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.customers.inProgress}</p>
            </div>
            <div className="flex flex-col">
              <div className="min-h-[2.5rem] flex items-center">
                <p className="text-xs sm:text-sm text-muted-foreground">In Review</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.customers.inReview}</p>
            </div>
            <div className="flex flex-col">
              <div className="min-h-[2.5rem] flex items-center">
                <p className="text-xs sm:text-sm text-muted-foreground">Voltooid</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.customers.completed}</p>
            </div>
            <div className="flex flex-col">
              <div className="min-h-[2.5rem] flex items-center">
                <p className="text-xs sm:text-sm text-muted-foreground">On Hold</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.customers.onHold}</p>
            </div>
            <div className="flex flex-col">
              <div className="min-h-[2.5rem] flex items-center">
                <p className="text-xs sm:text-sm text-muted-foreground">Geannuleerd</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-600">{stats.customers.canceled}</p>
            </div>
          </div>
        </div>
        )}
      </div>
      )}

      {/* Recent Leads & Customers */}
      {(permissions?.can_leads || permissions?.can_customers) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
        {permissions?.can_leads && (
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 break-words">Recente Leads</h2>
          <div className="w-full min-w-0 overflow-x-auto">
            <div className="rounded-lg border border-border/80">
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
        )}

        {permissions?.can_customers && (
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 break-words">Recente Klanten</h2>
          {stats.recentCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Geen klanten gevonden
            </div>
          ) : (
            <>
              <div className="w-full min-w-0 overflow-x-auto">
                <div className="rounded-lg border border-border/80">
                  <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 text-sm font-semibold">Klant</th>
                      <th className="text-left p-2 text-sm font-semibold">Status</th>
                      {permissions?.can_manage_users && (
                        <th className="text-left p-2 text-sm font-semibold">Omzet</th>
                      )}
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
                        {permissions?.can_manage_users && (
                          <td className="p-2 min-w-0">
                            {customer.quote_total ? (
                              <span className="text-sm font-semibold">
                                €{Number(customer.quote_total).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                        )}
                        <td className="p-2 text-xs text-muted-foreground whitespace-nowrap min-w-0">
                          {new Date(customer.converted_at).toLocaleDateString('nl-BE')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
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
        )}
      </div>
      )}
    </div>
  );
}
