'use client';

import { useEffect, useState } from 'react';
import { MetricCard } from '@/app/components/analytics/MetricCard';
import { EventChart } from '@/app/components/analytics/EventChart';
import { LeadChart } from '@/app/components/analytics/LeadChart';
import { RevenueChart } from '@/app/components/analytics/RevenueChart';
import { MousePointerClick, FileText, ShoppingCart, TrendingUp, Eye, Users, BarChart3, Calendar, Euro, DollarSign } from 'lucide-react';

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

type TabType = 'overview' | 'leads' | 'revenue' | 'info';

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

  useEffect(() => {
    const fetchData = async () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7f84300c-ac62-4dd7-94e2-7611dcdf26c7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'analytics/page.tsx:86',message:'Fetching analytics data',data:{days},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
      // #endregion
      
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/events?days=${days}`);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7f84300c-ac62-4dd7-94e2-7611dcdf26c7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'analytics/page.tsx:92',message:'Analytics response received',data:{status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
        // #endregion
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const result = await response.json();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7f84300c-ac62-4dd7-94e2-7611dcdf26c7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'analytics/page.tsx:98',message:'Analytics data loaded',data:{hasData:!!result,hasEvents:!!result?.events},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
        // #endregion
        setData(result);
        setError(null);
      } catch (err: unknown) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7f84300c-ac62-4dd7-94e2-7611dcdf26c7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'analytics/page.tsx:103',message:'Analytics fetch error',data:{error:err instanceof Error ? err.message : String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
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

  const tabs = [
    { id: 'overview' as TabType, label: 'Overzicht', icon: BarChart3 },
    { id: 'leads' as TabType, label: 'Leads', icon: Users },
    { id: 'revenue' as TabType, label: 'Omzet', icon: Euro },
    { id: 'info' as TabType, label: 'Informatie', icon: FileText },
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
              value={data?.pageviews.count || 0}
              trend={data?.pageviews.trend}
              icon={<Eye className="w-5 h-5" />}
            />
            <MetricCard
              title="CTA Klikken"
              value={data?.events.cta_click.count || 0}
              trend={data?.events.cta_click.trend}
              icon={<MousePointerClick className="w-5 h-5" />}
            />
            <MetricCard
              title="Formulierinzendingen"
              value={data?.events.form_submitted.count || 0}
              trend={data?.events.form_submitted.trend}
              subtitle="Leads gegenereerd"
              icon={<FileText className="w-5 h-5" />}
            />
            <MetricCard
              title="Pakketweergaven"
              value={data?.events.package_card_click.count || 0}
              trend={data?.events.package_card_click.trend}
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
                      {data?.pageviews.count && data?.events.cta_click.count
                        ? ((data.events.cta_click.count / data.pageviews.count) * 100).toFixed(1)
                        : '0'}
                      %
                    </div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-muted-foreground mb-1">Form Conversion</div>
                    <div className="text-xl sm:text-2xl font-bold">
                      {data?.pageviews.count && data?.events.form_submitted.count
                        ? ((data.events.form_submitted.count / data.pageviews.count) * 100).toFixed(2)
                        : '0'}
                      %
                    </div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-muted-foreground mb-1">Package Interest</div>
                    <div className="text-xl sm:text-2xl font-bold">
                      {data?.pageviews.count && data?.events.package_card_click.count
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
