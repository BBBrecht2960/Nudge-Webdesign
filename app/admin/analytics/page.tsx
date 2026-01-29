'use client';

import { useEffect, useMemo, useState } from 'react';
import { MetricCard } from '@/app/components/analytics/MetricCard';
import { EventChart } from '@/app/components/analytics/EventChart';
import { LeadChart } from '@/app/components/analytics/LeadChart';
import { RevenueChart } from '@/app/components/analytics/RevenueChart';
import { MousePointerClick, FileText, ShoppingCart, TrendingUp, Eye, Users, BarChart3, Calendar, Euro, UserCheck, ChevronDown, ChevronUp, ChevronRight, Target } from 'lucide-react';

interface AnalyticsData {
  events: {
    cta_click: { count: number; trend: number };
    form_submitted: { count: number; trend: number };
    package_card_click: { count: number; trend: number };
    scroll_depth: { count: number; trend: number };
  };
  pageviews: { count: number; trend: number };
  leads: { count: number; trend: number };
}

interface LeadAnalyticsData {
  total: number;
  trend: number;
  timeline: Array<{
    date: string;
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    byMedium: Record<string, number>;
    byCampaign: Record<string, number>;
  }>;
  statusBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  mediumBreakdown: Record<string, number>;
  dateRange: {
    start: string;
    end: string;
    groupBy: string;
  };
}

interface RevenueAnalyticsData {
  total: number;
  trend: number;
  count: number;
  averageDealSize: number;
  timeline: Array<{
    date: string;
    total: number;
    count: number;
    byStatus: Record<string, number>;
  }>;
  byStatus: Record<string, number>;
  dateRange: {
    start: string;
    end: string;
    groupBy: string;
  };
}

interface SalesPersonStats {
  person: string;
  leadCount: number;
  leadNew: number;
  leadQualified: number;
  leadLost: number;
  quoteCount: number;
  totalQuoteAmount: number;
  avgQuoteAmount: number;
  convertedCount: number;
  convertedRevenue: number;
  customerInReview: number;
  customerOnHold: number;
  customerCanceled: number;
}
interface SalesByPeriodItem {
  periodLabel: string;
  periodKey: string;
  persons: Record<string, Omit<SalesPersonStats, 'person'>>;
}
interface SalesTotals {
  totalLeads: number;
  totalQuoteAmount: number;
  totalConvertedRevenue: number;
  totalConvertedCount: number;
}
interface SalesData {
  summary: SalesPersonStats[];
  byPeriod: SalesByPeriodItem[];
  dateRange: { start: string; end: string; groupBy: string };
  totals?: SalesTotals;
}

type TabType = 'overview' | 'leads' | 'revenue' | 'sales' | 'info';

type PeriodSortKey = 'person' | 'leadCount' | 'quoteCount' | 'totalQuoteAmount' | 'convertedRevenue';

type GroupByOption = 'day' | 'week' | 'month' | 'quarter';

function SalesPeriodBreakdown({
  byPeriod,
  groupBy,
  canSeeRevenue = true,
  defaultSortKey = 'leadCount',
  defaultSortDir = 'desc',
}: {
  byPeriod: SalesByPeriodItem[];
  groupBy: GroupByOption;
  canSeeRevenue?: boolean;
  defaultSortKey?: PeriodSortKey;
  defaultSortDir?: 'asc' | 'desc';
}) {
  const [expanded, setExpanded] = useState<string | null>(byPeriod[0]?.periodKey ?? null);
  const [periodSortBy, setPeriodSortBy] = useState<PeriodSortKey>(defaultSortKey);
  const [periodSortDir, setPeriodSortDir] = useState<'asc' | 'desc'>(defaultSortDir);
  const periodLabel = groupBy === 'day' ? 'dag' : groupBy === 'week' ? 'week' : groupBy === 'quarter' ? 'kwartaal' : 'maand';

  const handlePeriodSort = (key: PeriodSortKey) => {
    if (periodSortBy === key) {
      setPeriodSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setPeriodSortBy(key);
      setPeriodSortDir('desc');
    }
  };

  const sortEntries = (entries: [string, Omit<SalesPersonStats, 'person'>][]) => {
    const mult = periodSortDir === 'desc' ? 1 : -1;
    return [...entries].sort(([personA, a], [personB, b]) => {
      let av: number | string;
      let bv: number | string;
      if (periodSortBy === 'person') {
        av = personA;
        bv = personB;
        return mult * String(av).localeCompare(String(bv));
      }
      av = a[periodSortBy] as number;
      bv = b[periodSortBy] as number;
      return mult * (av === bv ? 0 : av > bv ? 1 : -1);
    });
  };

  const SortableTh = ({ sortKey, label, className = '' }: { sortKey: PeriodSortKey; label: string; className?: string }) => {
    const isActive = periodSortBy === sortKey;
    return (
      <th className={className}>
        <button
          type="button"
          onClick={() => handlePeriodSort(sortKey)}
          className={`flex items-center justify-end gap-1 w-full hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded ${sortKey === 'person' ? 'text-left justify-start' : 'ml-auto'}`}
        >
          {label}
          <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center">
            {isActive ? (periodSortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-40" />}
          </span>
        </button>
      </th>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold">Uitsplitsing per {periodLabel}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Klik op een periode om details te tonen. Klik op een kolomkop om te sorteren.</p>
      </div>
      <div className="divide-y divide-border/80">
        {byPeriod.map((period) => {
          const isOpen = expanded === period.periodKey;
          const entries = Object.entries(period.persons);
          const sortedEntries = sortEntries(entries);
          return (
            <div key={period.periodKey}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : period.periodKey)}
                className="w-full flex items-center justify-between gap-4 px-5 py-3 text-left hover:bg-muted/20 transition-colors"
              >
                <span className="font-medium text-sm">{period.periodLabel}</span>
                <span className="text-muted-foreground text-xs">{entries.length} personen</span>
                {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>
              {isOpen && sortedEntries.length > 0 && (
                <div className="min-w-0 overflow-x-auto">
                  <table className="w-full text-sm min-w-[42rem]">
                    <thead>
                      <tr className="bg-muted/30 text-muted-foreground">
                        <SortableTh sortKey="person" label="Persoon" className="text-left py-2 px-3 font-medium" />
                        <SortableTh sortKey="leadCount" label="Leads" className="text-right py-2 px-3 font-medium w-16" />
                        <SortableTh sortKey="quoteCount" label="Offertes" className="text-right py-2 px-3 font-medium w-16" />
                        {canSeeRevenue && <SortableTh sortKey="totalQuoteAmount" label="Totaal offerte" className="text-right py-2 px-3 font-medium" />}
                        {canSeeRevenue && <SortableTh sortKey="convertedRevenue" label="Omzet" className="text-right py-2 px-3 font-medium" />}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEntries.map(([person, t]) => (
                        <tr key={person} className="border-t border-border/80">
                          <td className="py-2 px-3 whitespace-nowrap" title={person}>{person}</td>
                          <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap">{t.leadCount}</td>
                          <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap">{t.quoteCount}</td>
                          {canSeeRevenue && <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap">€ {t.totalQuoteAmount.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>}
                          {canSeeRevenue && <td className="py-2 px-3 text-right tabular-nums font-medium whitespace-nowrap">€ {t.convertedRevenue.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Permissions = { can_manage_users?: boolean };

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [leadData, setLeadData] = useState<LeadAnalyticsData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [leadLoading, setLeadLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [leadDays, setLeadDays] = useState(30);
  const [leadGroupBy, setLeadGroupBy] = useState<GroupByOption>('day');
  const [revenueGroupBy, setRevenueGroupBy] = useState<GroupByOption>('day');
  const [customDateRange, setCustomDateRange] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  function getSalesPresetRange(preset: 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year') {
    const now = new Date();
    let start: Date;
    let end: Date;
    if (preset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (preset === 'this_quarter') {
      const q = Math.floor(now.getMonth() / 3) + 1;
      start = new Date(now.getFullYear(), (q - 1) * 3, 1);
      end = new Date(now.getFullYear(), q * 3, 0);
    } else if (preset === 'last_quarter') {
      const q = Math.floor(now.getMonth() / 3) + 1;
      const lastQ = q === 1 ? 4 : q - 1;
      const y = q === 1 ? now.getFullYear() - 1 : now.getFullYear();
      start = new Date(y, (lastQ - 1) * 3, 1);
      end = new Date(y, lastQ * 3, 0);
    } else if (preset === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    } else {
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31);
    }
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }
  type SalesPeriodPreset = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'custom';
  const [salesPeriodPreset, setSalesPeriodPreset] = useState<SalesPeriodPreset>('this_month');
  const [salesStartDate, setSalesStartDate] = useState(() => getSalesPresetRange('this_month').start);
  const [salesEndDate, setSalesEndDate] = useState(() => getSalesPresetRange('this_month').end);
  const [salesGroupBy, setSalesGroupBy] = useState<GroupByOption>('week');
  type TeamSortKey = 'person' | 'leadCount' | 'leadNew' | 'leadQualified' | 'leadLost' | 'quoteCount' | 'totalQuoteAmount' | 'avgQuoteAmount' | 'convertedCount' | 'conversion' | 'customerInReview' | 'customerOnHold' | 'customerCanceled' | 'convertedRevenue';
  const [teamSortBy, setTeamSortBy] = useState<TeamSortKey>('leadCount');
  const [teamSortDir, setTeamSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setPermissions(data?.permissions ?? null));
  }, []);

  useEffect(() => {
    if (permissions && !permissions.can_manage_users && activeTab === 'revenue') {
      setActiveTab('overview');
    }
  }, [permissions, activeTab]);

  useEffect(() => {
    if (permissions && !permissions.can_manage_users && ['totalQuoteAmount', 'avgQuoteAmount', 'convertedRevenue'].includes(teamSortBy)) {
      setTeamSortBy('leadCount');
    }
  }, [permissions, teamSortBy]);

  useEffect(() => {
    const fetchData = async () => {
      
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/events?days=${days}`);
        
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Fout bij ophalen analytics';
        console.error('Error fetching analytics:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        setLeadLoading(true);
        let url = '';
        
        if (customDateRange && startDate && endDate) {
          url = `/api/analytics/leads?startDate=${startDate}&endDate=${endDate}&groupBy=${leadGroupBy}`;
        } else {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - leadDays);
          url = `/api/analytics/leads?startDate=${start.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}&groupBy=${leadGroupBy}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch lead analytics');
        }
        const result = await response.json();
        setLeadData(result);
      } catch (err: unknown) {
        console.error('Error fetching lead analytics:', err);
      } finally {
        setLeadLoading(false);
      }
    };

    fetchLeadData();
  }, [leadDays, leadGroupBy, customDateRange, startDate, endDate]);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setRevenueLoading(true);
        let url = '';
        
        if (customDateRange && startDate && endDate) {
          url = `/api/analytics/revenue?startDate=${startDate}&endDate=${endDate}&groupBy=${revenueGroupBy}`;
        } else {
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - leadDays);
          url = `/api/analytics/revenue?startDate=${start.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}&groupBy=${revenueGroupBy}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch revenue analytics');
        }
        const result = await response.json();
        setRevenueData(result);
      } catch (err: unknown) {
        console.error('Error fetching revenue analytics:', err);
      } finally {
        setRevenueLoading(false);
      }
    };

    fetchRevenueData();
  }, [leadDays, revenueGroupBy, customDateRange, startDate, endDate]);

  const handleTeamSort = (key: TeamSortKey) => {
    if (teamSortBy === key) {
      setTeamSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setTeamSortBy(key);
      setTeamSortDir('desc');
    }
  };
  const sortedTeamSummary = useMemo(() => {
    if (!salesData?.summary?.length) return [];
    const key = teamSortBy;
    const dir = teamSortDir;
    const mult = dir === 'desc' ? 1 : -1;
    return [...salesData.summary].sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (key === 'person') {
        av = a.person;
        bv = b.person;
        return mult * (String(av).localeCompare(String(bv)));
      }
      if (key === 'conversion') {
        av = a.leadCount > 0 ? a.convertedCount / a.leadCount : 0;
        bv = b.leadCount > 0 ? b.convertedCount / b.leadCount : 0;
      } else {
        av = a[key] as number;
        bv = b[key] as number;
      }
      return mult * (av === bv ? 0 : av > bv ? 1 : -1);
    });
  }, [salesData?.summary, teamSortBy, teamSortDir]);

  useEffect(() => {
    if (activeTab !== 'sales') return;
    const fetchSalesData = async () => {
      try {
        setSalesLoading(true);
        const url = `/api/analytics/sales?startDate=${salesStartDate}&endDate=${salesEndDate}&groupBy=${salesGroupBy}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Fout bij ophalen sales');
        const result = await response.json();
        setSalesData(result);
      } catch (err) {
        console.error('Sales analytics:', err);
        setSalesData(null);
      } finally {
        setSalesLoading(false);
      }
    };
    fetchSalesData();
  }, [activeTab, salesStartDate, salesEndDate, salesGroupBy]);

  useEffect(() => {
    if (salesPeriodPreset !== 'custom') {
      const { start, end } = getSalesPresetRange(salesPeriodPreset);
      setSalesStartDate(start);
      setSalesEndDate(end);
    }
  }, [salesPeriodPreset]);

  const canSeeRevenue = permissions?.can_manage_users === true;
  const tabs = [
    { id: 'overview' as TabType, label: 'Overzicht', icon: BarChart3 },
    { id: 'leads' as TabType, label: 'Leads', icon: Users },
    ...(canSeeRevenue ? [{ id: 'revenue' as TabType, label: 'Omzet', icon: Euro }] : []),
    { id: 'sales' as TabType, label: 'Sales / Team', icon: UserCheck },
    { id: 'info' as TabType, label: 'Informatie', icon: FileText },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">Analyses Dashboard</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Overzicht van website performance en gebruikersgedrag
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6 sm:mb-8">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm break-words">
            {error}
            {error.includes('API key') && (
              <span className="block mt-2">
                Voeg <code className="bg-red-100 px-1 rounded">POSTHOG_API_KEY</code> toe aan je <code className="bg-red-100 px-1 rounded">.env.local</code>
              </span>
            )}
          </p>
        </div>
      )}

      {/* Overzicht Tab */}
      {activeTab === 'overview' && (
        <>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">Laden...</div>
            </div>
          ) : (
            <>
              {/* Date Range Selector */}
              <div className="mb-6 flex flex-wrap items-center gap-4">
                <label className="text-sm font-medium">Periode:</label>
                <select
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value))}
                  className="px-3 py-2 border border-border rounded-md bg-card text-sm"
                >
                  <option value="7">Laatste 7 dagen</option>
                  <option value="30">Laatste 30 dagen</option>
                  <option value="90">Laatste 90 dagen</option>
                </select>
              </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              title="Paginaweergaven"
              value={data?.pageviews?.count ?? 0}
              trend={data?.pageviews?.trend}
              icon={<Eye className="w-5 h-5" />}
            />
            <MetricCard
              title="CTA Klikken"
              value={data?.events?.cta_click?.count ?? 0}
              trend={data?.events?.cta_click?.trend}
              icon={<MousePointerClick className="w-5 h-5" />}
            />
            <MetricCard
              title="Formulierinzendingen"
              value={data?.events?.form_submitted?.count ?? 0}
              trend={data?.events?.form_submitted?.trend}
              subtitle="Leads gegenereerd"
              icon={<FileText className="w-5 h-5" />}
            />
            <MetricCard
              title="Pakketweergaven"
              value={data?.events?.package_card_click?.count ?? 0}
              trend={data?.events?.package_card_click?.trend}
              icon={<ShoppingCart className="w-5 h-5" />}
            />
          </div>

          {/* Event Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <EventChart
              title="CTA Klikken"
              eventName="cta_click"
              days={days}
            />
            <EventChart
              title="Formulierinzendingen"
              eventName="form_submitted"
              days={days}
            />
            <EventChart
              title="Pakket Kaart Klikken"
              eventName="package_card_click"
              days={days}
            />
            <EventChart
              title="Scroll Depth Events"
              eventName="scroll_depth"
              days={days}
            />
          </div>

              {/* Conversion Metrics */}
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Conversie Metrics
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs sm:text-sm text-muted-foreground mb-1">CTA Click Rate</div>
                    <div className="text-xl sm:text-2xl font-bold">
                      {data?.pageviews?.count && data?.events?.cta_click?.count
                        ? ((data.events.cta_click.count / data.pageviews.count) * 100).toFixed(1)
                        : '0'}
                      %
                    </div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-muted-foreground mb-1">Form Conversion</div>
                    <div className="text-xl sm:text-2xl font-bold">
                      {data?.pageviews?.count && data?.events?.form_submitted?.count
                        ? ((data.events.form_submitted.count / data.pageviews.count) * 100).toFixed(2)
                        : '0'}
                      %
                    </div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-muted-foreground mb-1">Package Interest</div>
                    <div className="text-xl sm:text-2xl font-bold">
                      {data?.pageviews?.count && data?.events?.package_card_click?.count
                        ? ((data.events.package_card_click.count / data.pageviews.count) * 100).toFixed(1)
                        : '0'}
                      %
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Leads Tab */}
      {activeTab === 'leads' && (
        <div>

            {/* Lead Date Range Selector */}
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="customRange"
                    checked={customDateRange}
                    onChange={(e) => setCustomDateRange(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="customRange" className="text-sm font-medium">
                    Aangepast datumbereik
                  </label>
                </div>

                {customDateRange ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-2 border border-border rounded-md bg-card text-sm"
                      />
                      <span className="text-muted-foreground">tot</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-2 border border-border rounded-md bg-card text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Periode:</label>
                      <select
                        value={leadDays}
                        onChange={(e) => setLeadDays(parseInt(e.target.value))}
                        className="px-3 py-2 border border-border rounded-md bg-card text-sm"
                      >
                        <option value="7">Laatste 7 dagen</option>
                        <option value="14">Laatste 14 dagen</option>
                        <option value="30">Laatste 30 dagen</option>
                        <option value="60">Laatste 60 dagen</option>
                        <option value="90">Laatste 90 dagen</option>
                        <option value="180">Laatste 6 maanden</option>
                        <option value="365">Laatste jaar</option>
                        <option value="730">Laatste 2 jaar</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Groeperen op:</label>
                  <select
                    value={leadGroupBy}
                    onChange={(e) => setLeadGroupBy(e.target.value as GroupByOption)}
                    className="px-3 py-2 border border-border rounded-md bg-card text-sm"
                  >
                    <option value="day">Dag</option>
                    <option value="week">Week</option>
                    <option value="month">Maand</option>
                    <option value="quarter">Kwartaal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lead Metrics */}
            {leadLoading ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Laden...</div>
              </div>
            ) : leadData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <MetricCard
                    title="Totaal Leads"
                    value={leadData.total}
                    trend={leadData.trend}
                    icon={<Users className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Nieuw"
                    value={leadData.statusBreakdown.new || 0}
                    icon={<FileText className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Gekwalificeerd"
                    value={leadData.statusBreakdown.qualified || 0}
                    icon={<TrendingUp className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Geconverteerd"
                    value={leadData.statusBreakdown.converted || 0}
                    icon={<ShoppingCart className="w-5 h-5" />}
                  />
                </div>

                {/* Lead Timeline Chart */}
                <div className="mb-6">
                  <LeadChart
                    title="Leads Over Tijd"
                    startDate={leadData.dateRange.start}
                    endDate={leadData.dateRange.end}
                    groupBy={leadGroupBy}
                  />
                </div>

                {/* Leads per periode — overzicht elke dag/week/maand */}
                {leadData.timeline.length > 0 && (
                  <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
                    <div className="px-5 py-4 border-b border-border">
                      <h3 className="text-base font-semibold">Leads per {leadGroupBy === 'day' ? 'dag' : leadGroupBy === 'week' ? 'week' : leadGroupBy === 'quarter' ? 'kwartaal' : 'maand'}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Volledige geschiedenis in het geselecteerde bereik.</p>
                    </div>
                    <div className="w-full min-w-0 overflow-x-auto max-h-[400px] overflow-y-auto">
                      <div className="px-5 pb-4">
                        <div className="rounded-lg border border-border/80">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/30">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium">Periode</th>
                            <th className="text-right py-3 px-4 font-medium w-24">Leads</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leadData.timeline.map((row) => {
                            let periodLabel = row.date;
                            try {
                              if (leadGroupBy === 'month' && row.date.length >= 7) {
                                const [y, m] = row.date.split('-');
                                const monthNames = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
                                periodLabel = `${monthNames[parseInt(m, 10) - 1]} ${y}`;
                              } else if (leadGroupBy === 'week') {
                                const d = new Date(row.date);
                                periodLabel = `Week ${d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                              } else {
                                const d = new Date(row.date);
                                periodLabel = d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' });
                              }
                            } catch {
                              periodLabel = row.date;
                            }
                            return (
                              <tr key={row.date} className="border-t border-border/80 hover:bg-muted/20">
                                <td className="py-2 px-4">{periodLabel}</td>
                                <td className="py-2 px-4 text-right tabular-nums font-medium">{row.total}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Breakdowns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Status Breakdown */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Per Status
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(leadData.statusBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([status, count]) => {
                          const percentage = (count / leadData.total) * 100;
                          const statusLabels: Record<string, string> = {
                            new: 'Nieuw',
                            contacted: 'Gecontacteerd',
                            qualified: 'Gekwalificeerd',
                            converted: 'Geconverteerd',
                            lost: 'Verloren',
                          };
                          return (
                            <div key={status}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">
                                  {statusLabels[status] || status}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {count} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Source Breakdown */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Per Bron
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(leadData.sourceBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([source, count]) => {
                          const percentage = (count / leadData.total) * 100;
                          return (
                            <div key={source}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium truncate">
                                  {source === 'direct' ? 'Direct' : source}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {count} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-secondary h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Medium Breakdown */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Per Medium
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(leadData.mediumBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([medium, count]) => {
                          const percentage = (count / leadData.total) * 100;
                          return (
                            <div key={medium}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium truncate">
                                  {medium === 'none' ? 'Geen' : medium}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {count} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-accent h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
        </div>
      )}

      {/* Omzet Tab */}
      {activeTab === 'revenue' && (
        <div>
          {/* Omzet Datumbereik Selector */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="customRangeRevenue"
                  checked={customDateRange}
                  onChange={(e) => setCustomDateRange(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="customRangeRevenue" className="text-sm font-medium">
                  Aangepast datumbereik
                </label>
              </div>

              {customDateRange ? (
                <>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 border border-border rounded-md bg-card text-sm"
                    />
                    <span className="text-muted-foreground">tot</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 border border-border rounded-md bg-card text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Periode:</label>
                    <select
                      value={leadDays}
                      onChange={(e) => setLeadDays(parseInt(e.target.value))}
                      className="px-3 py-2 border border-border rounded-md bg-card text-sm"
                    >
                      <option value="7">Laatste 7 dagen</option>
                      <option value="14">Laatste 14 dagen</option>
                      <option value="30">Laatste 30 dagen</option>
                      <option value="60">Laatste 60 dagen</option>
                      <option value="90">Laatste 90 dagen</option>
                      <option value="180">Laatste 6 maanden</option>
                      <option value="365">Laatste jaar</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Groeperen op:</label>
                <select
                  value={revenueGroupBy}
                  onChange={(e) => setRevenueGroupBy(e.target.value as GroupByOption)}
                  className="px-3 py-2 border border-border rounded-md bg-card text-sm"
                >
                  <option value="day">Dag</option>
                  <option value="week">Week</option>
                  <option value="month">Maand</option>
                  <option value="quarter">Kwartaal</option>
                </select>
              </div>
            </div>
          </div>

            {/* Omzet Metrieken */}
            {revenueLoading ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Laden...</div>
              </div>
            ) : revenueData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <MetricCard
                    title="Totaal Omzet"
                    value={`€${revenueData.total.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    trend={revenueData.trend}
                    icon={<Euro className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Aantal Klanten"
                    value={revenueData.count}
                    icon={<Users className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Gemiddelde Deal"
                    value={`€${revenueData.averageDealSize.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={<TrendingUp className="w-5 h-5" />}
                  />
                  <MetricCard
                    title="Conversiepercentage"
                    value={leadData && leadData.total > 0
                      ? `${((revenueData.count / leadData.total) * 100).toFixed(1)}%`
                      : '0%'}
                    icon={<BarChart3 className="w-5 h-5" />}
                  />
                </div>

                {/* Omzet Tijdlijn Grafiek */}
                <div className="mb-6">
                  <RevenueChart
                    title="Omzet Over Tijd"
                    startDate={revenueData.dateRange.start}
                    endDate={revenueData.dateRange.end}
                    groupBy={revenueGroupBy}
                  />
                </div>

                {/* Omzet per Status */}
                <div className="bg-card border border-border rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Omzet Per Project Status
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(revenueData.byStatus)
                      .sort(([, a], [, b]) => b - a)
                      .map(([status, revenue]) => {
                        const percentage = (revenue / revenueData.total) * 100;
                        const statusLabels: Record<string, string> = {
                          new: 'Nieuw',
                          in_progress: 'In Uitvoering',
                          review: 'In Review',
                          completed: 'Voltooid',
                          on_hold: 'On Hold',
                          canceled: 'Geannuleerd',
                        };
                        return (
                          <div key={status}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">
                                {statusLabels[status] || status}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                €{revenue.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            ) : null}
        </div>
      )}

      {/* Sales / Team Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <label htmlFor="sales-period-preset" className="sr-only">Periode</label>
              <select
                id="sales-period-preset"
                value={salesPeriodPreset}
                onChange={(e) => setSalesPeriodPreset(e.target.value as SalesPeriodPreset)}
                className="px-3 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="this_month">Deze maand</option>
                <option value="last_month">Vorige maand</option>
                <option value="this_quarter">Dit kwartaal</option>
                <option value="last_quarter">Vorig kwartaal</option>
                <option value="this_year">Dit jaar</option>
                <option value="last_year">Vorig jaar</option>
                <option value="custom">Specifieke selectie</option>
              </select>
            </div>
            {salesPeriodPreset === 'custom' && (
              <>
                <input
                  type="date"
                  value={salesStartDate}
                  onChange={(e) => setSalesStartDate(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-muted-foreground text-sm">t/m</span>
                <input
                  type="date"
                  value={salesEndDate}
                  onChange={(e) => setSalesEndDate(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </>
            )}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Groeperen</span>
              <select
                value={salesGroupBy}
                onChange={(e) => setSalesGroupBy(e.target.value as GroupByOption)}
                className="px-3 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="day">Per dag</option>
                <option value="week">Per week</option>
                <option value="month">Per maand</option>
                <option value="quarter">Per kwartaal</option>
              </select>
            </div>
          </div>

          {salesLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Laden…</div>
          ) : salesData ? (
            <>
              {salesData.totals && (
                <div className={`grid gap-4 ${canSeeRevenue ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
                  <MetricCard title="Leads" value={salesData.totals.totalLeads} icon={<Users className="w-4 h-4" />} />
                  {canSeeRevenue && (
                    <>
                      <MetricCard title="Offertewaarde" value={`€ ${salesData.totals.totalQuoteAmount.toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} icon={<FileText className="w-4 h-4" />} />
                      <MetricCard title="Omzet (gesloten)" value={`€ ${salesData.totals.totalConvertedRevenue.toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} icon={<Euro className="w-4 h-4" />} />
                    </>
                  )}
                  <MetricCard title="Deals" value={salesData.totals.totalConvertedCount} subtitle={salesData.totals.totalLeads > 0 ? `${Math.round((salesData.totals.totalConvertedCount / salesData.totals.totalLeads) * 100)}% van leads` : undefined} icon={<Target className="w-4 h-4" />} />
                </div>
              )}

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="text-base font-semibold">Teamoverzicht</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Per persoon: leads toegewezen via «Binnengebracht door» of «Aangemaakt door».</p>
                </div>

                <div className="min-w-0 overflow-x-auto">
                  <table className="w-full text-sm min-w-[42rem]">
                    <thead>
                      <tr className="bg-muted/30 text-muted-foreground">
                        <th className="text-left py-3 px-4 font-medium">
                          <button type="button" onClick={() => handleTeamSort('person')} className="flex items-center gap-1 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
                            Persoon
                            <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center">
                              {teamSortBy === 'person' ? (teamSortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-40" />}
                            </span>
                          </button>
                        </th>
                        <th className="text-right py-3 px-4 font-medium w-20">
                          <button type="button" onClick={() => handleTeamSort('leadCount')} className="ml-auto flex items-center justify-end gap-1 w-full hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
                            Leads
                            <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center">
                              {teamSortBy === 'leadCount' ? (teamSortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-40" />}
                            </span>
                          </button>
                        </th>
                        <th className="text-right py-3 px-4 font-medium w-16" title="Nieuw">
                          <button type="button" onClick={() => handleTeamSort('leadNew')} className="ml-auto flex items-center justify-end gap-1 w-full hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
                            Nieuw
                            <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center">
                              {teamSortBy === 'leadNew' ? (teamSortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-40" />}
                            </span>
                          </button>
                        </th>
                        <th className="text-right py-3 px-4 font-medium w-16" title="Gekwalificeerd">
                          <button type="button" onClick={() => handleTeamSort('leadQualified')} className="ml-auto flex items-center justify-end gap-1 w-full hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
                            Gekwal.
                            <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center">
                              {teamSortBy === 'leadQualified' ? (teamSortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-40" />}
                            </span>
                          </button>
                        </th>
                        <th className="text-right py-3 px-4 font-medium w-16" title="Verloren">
                          <button type="button" onClick={() => handleTeamSort('leadLost')} className="ml-auto flex items-center justify-end gap-1 w-full hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
                            Verloren
                            <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center">
                              {teamSortBy === 'leadLost' ? (teamSortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-40" />}
                            </span>
                          </button>
                        </th>
                        <th className="text-right py-3 px-4 font-medium w-20">
                          <button type="button" onClick={() => handleTeamSort('quoteCount')} className="ml-auto flex items-center justify-end gap-1 w-full hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
                            Offertes
                            <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center">
                              {teamSortBy === 'quoteCount' ? (teamSortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-40" />}
                            </span>
                          </button>
                        </th>
                        {canSeeRevenue && (
                        <th className="text-right py-3 px-4 font-medium">
                          <button type="button" onClick={() => handleTeamSort('totalQuoteAmount')} className="ml-auto flex items-center justify-end gap-1 w-full hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
                            Totaal offerte
                            <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center">
                              {teamSortBy === 'totalQuoteAmount' ? (teamSortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-40" />}
                            </span>
                          </button>
                        </th>
                        )}
                        {canSeeRevenue && (
                        <th className="text-right py-3 px-4 font-medium">
                          <button type="button" onClick={() => handleTeamSort('avgQuoteAmount')} className="ml-auto flex items-center justify-end gap-1 w-full hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
                            Gem. offerte
                            <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center">
                              {teamSortBy === 'avgQuoteAmount' ? (teamSortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-40" />}
                            </span>
                          </button>
                        </th>
                        )}
                        <th className="text-right py-3 px-4 font-medium w-20">
                          <button type="button" onClick={() => handleTeamSort('convertedCount')} className="ml-auto flex items-center justify-end gap-1 w-full hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
                            Deals
                            <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center">
                              {teamSortBy === 'convertedCount' ? (teamSortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-40" />}
                            </span>
                          </button>
                        </th>
                        <th className="text-right py-3 px-4 font-medium w-16" title="In review">
                          <button type="button" onClick={() => handleTeamSort('customerInReview')} className="ml-auto flex items-center justify-end gap-1 w-full hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
                            Review
                            <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center">
                              {teamSortBy === 'customerInReview' ? (teamSortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-40" />}
                            </span>
                          </button>
                        </th>
                        <th className="text-right py-3 px-4 font-medium w-16" title="In afwachting">
                          <button type="button" onClick={() => handleTeamSort('customerOnHold')} className="ml-auto flex items-center justify-end gap-1 w-full hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
                            Afwacht.
                            <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center">
                              {teamSortBy === 'customerOnHold' ? (teamSortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-40" />}
                            </span>
                          </button>
                        </th>
                        <th className="text-right py-3 px-4 font-medium w-16" title="Geannuleerd">
                          <button type="button" onClick={() => handleTeamSort('customerCanceled')} className="ml-auto flex items-center justify-end gap-1 w-full hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
                            Geannul.
                            <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center">
                              {teamSortBy === 'customerCanceled' ? (teamSortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-40" />}
                            </span>
                          </button>
                        </th>
                        <th className="text-right py-3 px-4 font-medium">
                          <button type="button" onClick={() => handleTeamSort('conversion')} className="ml-auto flex items-center justify-end gap-1 w-full hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
                            Conversie
                            <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center">
                              {teamSortBy === 'conversion' ? (teamSortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-40" />}
                            </span>
                          </button>
                        </th>
                        {canSeeRevenue && (
                          <th className="text-right py-3 px-4 font-medium">
                            <button type="button" onClick={() => handleTeamSort('convertedRevenue')} className="ml-auto flex items-center justify-end gap-1 w-full hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
                              Omzet
                              <span className="inline-flex w-4 h-4 shrink-0 items-center justify-center">
                                {teamSortBy === 'convertedRevenue' ? (teamSortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronDown className="w-4 h-4 opacity-40" />}
                              </span>
                            </button>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTeamSummary.length === 0 ? (
                        <tr>
                          <td colSpan={canSeeRevenue ? 14 : 11} className="py-12 px-4 text-center text-muted-foreground text-sm">
                            Geen leads in deze periode of geen attributie ingesteld. Vul bij een lead «Binnengebracht door» in voor correcte toewijzing.
                          </td>
                        </tr>
                      ) : (
                        sortedTeamSummary.map((row) => {
                          const convPct = row.leadCount > 0 ? Math.round((row.convertedCount / row.leadCount) * 100) : 0;
                          return (
                            <tr key={row.person} className="border-t border-border/80 hover:bg-muted/20 transition-colors">
                              <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap" title={row.person}>{row.person}</td>
                              <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">{row.leadCount}</td>
                              <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">{row.leadNew ?? 0}</td>
                              <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">{row.leadQualified ?? 0}</td>
                              <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">{row.leadLost ?? 0}</td>
                              <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">{row.quoteCount}</td>
                              {canSeeRevenue && (
                              <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">€ {row.totalQuoteAmount.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              )}
                              {canSeeRevenue && (
                              <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">€ {row.avgQuoteAmount.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              )}
                              <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">{row.convertedCount}</td>
                              <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">{row.customerInReview ?? 0}</td>
                              <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">{row.customerOnHold ?? 0}</td>
                              <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">{row.customerCanceled ?? 0}</td>
                              <td className="py-3 px-4 text-right tabular-nums text-muted-foreground whitespace-nowrap">{convPct}%</td>
                              {canSeeRevenue && (
                              <td className="py-3 px-4 text-right tabular-nums font-semibold whitespace-nowrap">€ {row.convertedRevenue.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {salesData.byPeriod.length > 0 && (
                <SalesPeriodBreakdown byPeriod={salesData.byPeriod} groupBy={salesGroupBy} canSeeRevenue={canSeeRevenue} defaultSortKey="leadCount" defaultSortDir="desc" />
              )}
            </>
          ) : (
            <div className="py-16 text-center text-muted-foreground text-sm">Geen data of fout bij laden.</div>
          )}
        </div>
      )}

      {/* Informatie Tab */}
      {activeTab === 'info' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Tracked Events Info */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4 break-words">Gevolgde Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Aangepaste Events:</h3>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-muted-foreground break-words">
                  <li>cta_click - CTA knop klikken</li>
                  <li>form_started - Form interactie gestart</li>
                  <li>form_submitted - Form succesvol verzonden</li>
                  <li>package_card_click - Pakket kaart interacties</li>
                  <li>faq_expanded - FAQ items uitgeklapt</li>
                  <li>scroll_depth - Scroll diepte tracking</li>
                  <li>sticky_cta_click - Mobiele sticky CTA klikken</li>
                  <li>phone_click - Telefoonnummer klikken</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Gebruikerseigenschappen:</h3>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-muted-foreground break-words">
                  <li>UTM parameters (source, medium, campaign, etc.)</li>
                  <li>Verwijzer</li>
                  <li>Landingspad</li>
                  <li>Pakket interesse</li>
                  <li>Bedrijfsgrootte</li>
                </ul>
              </div>
            </div>
          </div>

          {/* PostHog Link */}
          <div className="bg-muted border border-border rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4 break-words">Gedetailleerde Analytics</h2>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base break-words">
              Voor uitgebreide analytics, session recordings, funnels en meer, open het PostHog dashboard.
            </p>
            <a
              href="https://app.posthog.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm sm:text-base"
            >
              PostHog Dashboard openen →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
