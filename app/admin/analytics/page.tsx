'use client';

import { useEffect, useState } from 'react';
import { MetricCard } from '@/app/components/analytics/MetricCard';
import { EventChart } from '@/app/components/analytics/EventChart';
import { LeadChart } from '@/app/components/analytics/LeadChart';
import { RevenueChart } from '@/app/components/analytics/RevenueChart';
import { MousePointerClick, FileText, ShoppingCart, TrendingUp, Eye, Users, BarChart3, Calendar, Euro, DollarSign, UserCheck, ChevronDown, ChevronRight, Target } from 'lucide-react';

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
  quoteCount: number;
  totalQuoteAmount: number;
  avgQuoteAmount: number;
  convertedCount: number;
  convertedRevenue: number;
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

type TabType = 'overview' | 'leads' | 'revenue' | 'sales';

function SalesPeriodBreakdown({ byPeriod, groupBy }: { byPeriod: SalesByPeriodItem[]; groupBy: 'day' | 'week' | 'month' }) {
  const [expanded, setExpanded] = useState<string | null>(byPeriod[0]?.periodKey ?? null);
  const periodLabel = groupBy === 'day' ? 'dag' : groupBy === 'week' ? 'week' : 'maand';
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-base font-semibold">Uitsplitsing per {periodLabel}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Klik op een periode om details te tonen.</p>
      </div>
      <div className="divide-y divide-border/80">
        {byPeriod.map((period) => {
          const isOpen = expanded === period.periodKey;
          const entries = Object.entries(period.persons);
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
              {isOpen && entries.length > 0 && (
                <div className="px-5 pb-4">
                  <div className="overflow-x-auto rounded-lg border border-border/80">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/30 text-muted-foreground">
                          <th className="text-left py-2 px-3 font-medium">Persoon</th>
                          <th className="text-right py-2 px-3 font-medium w-16">Leads</th>
                          <th className="text-right py-2 px-3 font-medium w-16">Offertes</th>
                          <th className="text-right py-2 px-3 font-medium">Totaal offerte</th>
                          <th className="text-right py-2 px-3 font-medium">Omzet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map(([person, t]) => (
                          <tr key={person} className="border-t border-border/80">
                            <td className="py-2 px-3 break-all">{person}</td>
                            <td className="py-2 px-3 text-right tabular-nums">{t.leadCount}</td>
                            <td className="py-2 px-3 text-right tabular-nums">{t.quoteCount}</td>
                            <td className="py-2 px-3 text-right tabular-nums">€ {t.totalQuoteAmount.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-2 px-3 text-right tabular-nums font-medium">€ {t.convertedRevenue.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [leadData, setLeadData] = useState<LeadAnalyticsData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [leadLoading, setLeadLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [leadDays, setLeadDays] = useState(30);
  const [leadGroupBy, setLeadGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [revenueGroupBy, setRevenueGroupBy] = useState<'day' | 'week' | 'month'>('day');
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
  const [salesStartDate, setSalesStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [salesEndDate, setSalesEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [salesGroupBy, setSalesGroupBy] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    const fetchData = async () => {      
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/events?days=${days}`);        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const result = await response.json();        setData(result);
        setError(null);
      } catch (err: unknown) {        const errorMessage = err instanceof Error ? err.message : 'Fout bij ophalen analytics';
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

  const tabs = [
    { id: 'overview' as TabType, label: 'Overzicht', icon: BarChart3 },
    { id: 'leads' as TabType, label: 'Leads', icon: Users },
    { id: 'revenue' as TabType, label: 'Omzet', icon: Euro },
    { id: 'sales' as TabType, label: 'Sales / Team', icon: UserCheck },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 max-w-full overflow-x-hidden box-border">
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
          <p className="text-red-800 text-sm break-words">{error}</p>
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

              {/* Hint als er nog geen data is (tabel niet aangemaakt) */}
              {data && (data.pageviews?.count ?? 0) === 0 && (data.events?.cta_click?.count ?? 0) === 0 && (data.events?.form_submitted?.count ?? 0) === 0 && (
                <div className="bg-muted border border-border rounded-lg p-4 mb-6 text-sm text-muted-foreground">
                  Geen data? Voer eenmalig <code className="bg-background px-1 rounded">scripts/analytics-events-table.sql</code> uit in Supabase SQL Editor. Daarna verschijnen pageviews en events hier zodra bezoekers de site gebruiken.
                </div>
              )}

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
                      </select>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Groeperen op:</label>
                  <select
                    value={leadGroupBy}
                    onChange={(e) => setLeadGroupBy(e.target.value as 'day' | 'week' | 'month')}
                    className="px-3 py-2 border border-border rounded-md bg-card text-sm"
                  >
                    <option value="day">Dag</option>
                    <option value="week">Week</option>
                    <option value="month">Maand</option>
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
                  onChange={(e) => setRevenueGroupBy(e.target.value as 'day' | 'week' | 'month')}
                  className="px-3 py-2 border border-border rounded-md bg-card text-sm"
                >
                  <option value="day">Dag</option>
                  <option value="week">Week</option>
                  <option value="month">Maand</option>
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
          {/* Filters — one clean row */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
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
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Groeperen</span>
              <select
                value={salesGroupBy}
                onChange={(e) => setSalesGroupBy(e.target.value as 'day' | 'week' | 'month')}
                className="px-3 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="day">Per dag</option>
                <option value="week">Per week</option>
                <option value="month">Per maand</option>
              </select>
            </div>
          </div>

          {salesLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Laden…</div>
          ) : salesData ? (
            <>
              {/* Period totals — 4 KPI cards */}
              {salesData.totals && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Leads"
                    value={salesData.totals.totalLeads}
                    icon={<Users className="w-4 h-4" />}
                  />
                  <MetricCard
                    title="Offertewaarde"
                    value={`€ ${salesData.totals.totalQuoteAmount.toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                    icon={<FileText className="w-4 h-4" />}
                  />
                  <MetricCard
                    title="Omzet (gesloten)"
                    value={`€ ${salesData.totals.totalConvertedRevenue.toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                    icon={<Euro className="w-4 h-4" />}
                  />
                  <MetricCard
                    title="Deals"
                    value={salesData.totals.totalConvertedCount}
                    subtitle={salesData.totals.totalLeads > 0 ? `${Math.round((salesData.totals.totalConvertedCount / salesData.totals.totalLeads) * 100)}% van leads` : undefined}
                    icon={<Target className="w-4 h-4" />}
                  />
                </div>
              )}

              {/* Team overview table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="text-base font-semibold">Teamoverzicht</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Per persoon: leads toegewezen via «Binnengebracht door» of «Aangemaakt door».</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 text-muted-foreground">
                        <th className="text-left py-3 px-4 font-medium">Persoon</th>
                        <th className="text-right py-3 px-4 font-medium w-20">Leads</th>
                        <th className="text-right py-3 px-4 font-medium w-20">Offertes</th>
                        <th className="text-right py-3 px-4 font-medium">Totaal offerte</th>
                        <th className="text-right py-3 px-4 font-medium">Gem. offerte</th>
                        <th className="text-right py-3 px-4 font-medium w-20">Deals</th>
                        <th className="text-right py-3 px-4 font-medium">Conversie</th>
                        <th className="text-right py-3 px-4 font-medium">Omzet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.summary.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 px-4 text-center text-muted-foreground text-sm">
                            Geen leads in deze periode of geen attributie ingesteld. Vul bij een lead «Binnengebracht door» in voor correcte toewijzing.
                          </td>
                        </tr>
                      ) : (
                        salesData.summary.map((row, idx) => {
                          const convPct = row.leadCount > 0 ? Math.round((row.convertedCount / row.leadCount) * 100) : 0;
                          return (
                            <tr key={row.person} className="border-t border-border/80 hover:bg-muted/20 transition-colors">
                              <td className="py-3 px-4 font-medium text-foreground break-all">{row.person}</td>
                              <td className="py-3 px-4 text-right tabular-nums">{row.leadCount}</td>
                              <td className="py-3 px-4 text-right tabular-nums">{row.quoteCount}</td>
                              <td className="py-3 px-4 text-right tabular-nums">€ {row.totalQuoteAmount.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="py-3 px-4 text-right tabular-nums">€ {row.avgQuoteAmount.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="py-3 px-4 text-right tabular-nums">{row.convertedCount}</td>
                              <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">{convPct}%</td>
                              <td className="py-3 px-4 text-right tabular-nums font-semibold">€ {row.convertedRevenue.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Per-period breakdown — collapsible */}
              {salesData.byPeriod.length > 0 && (
                <SalesPeriodBreakdown
                  byPeriod={salesData.byPeriod}
                  groupBy={salesGroupBy}
                />
              )}
            </>
          ) : (
            <div className="py-16 text-center text-muted-foreground text-sm">Geen data of fout bij laden.</div>
          )}
        </div>
      )}
    </div>
  );
}
