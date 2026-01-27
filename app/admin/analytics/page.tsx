'use client';

import { useEffect, useState } from 'react';
import { MetricCard } from '@/app/components/analytics/MetricCard';
import { EventChart } from '@/app/components/analytics/EventChart';
import { MousePointerClick, FileText, ShoppingCart, TrendingUp, Eye, Users } from 'lucide-react';

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

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

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
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'Fout bij ophalen analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Overzicht van website performance en gebruikersgedrag
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-medium">Periode:</label>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-3 py-2 border border-border rounded-md bg-card"
        >
          <option value="7">Laatste 7 dagen</option>
          <option value="30">Laatste 30 dagen</option>
          <option value="90">Laatste 90 dagen</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">
            {error}
            {error.includes('API key') && (
              <span className="block mt-2">
                Voeg <code className="bg-red-100 px-1 rounded">POSTHOG_API_KEY</code> toe aan je <code className="bg-red-100 px-1 rounded">.env.local</code>
              </span>
            )}
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Laden...</div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              title="Pageviews"
              value={data?.pageviews.count || 0}
              trend={data?.pageviews.trend}
              icon={<Eye className="w-5 h-5" />}
            />
            <MetricCard
              title="CTA Clicks"
              value={data?.events.cta_click.count || 0}
              trend={data?.events.cta_click.trend}
              icon={<MousePointerClick className="w-5 h-5" />}
            />
            <MetricCard
              title="Form Submissions"
              value={data?.events.form_submitted.count || 0}
              trend={data?.events.form_submitted.trend}
              subtitle="Leads gegenereerd"
              icon={<FileText className="w-5 h-5" />}
            />
            <MetricCard
              title="Package Views"
              value={data?.events.package_card_click.count || 0}
              trend={data?.events.package_card_click.trend}
              icon={<ShoppingCart className="w-5 h-5" />}
            />
          </div>

          {/* Event Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <EventChart
              title="CTA Clicks"
              eventName="cta_click"
              days={days}
            />
            <EventChart
              title="Form Submissions"
              eventName="form_submitted"
              days={days}
            />
            <EventChart
              title="Package Card Clicks"
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
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Conversie Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">CTA Click Rate</div>
                <div className="text-2xl font-bold">
                  {data?.pageviews.count && data?.events.cta_click.count
                    ? ((data.events.cta_click.count / data.pageviews.count) * 100).toFixed(1)
                    : '0'}
                  %
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Form Conversion</div>
                <div className="text-2xl font-bold">
                  {data?.pageviews.count && data?.events.form_submitted.count
                    ? ((data.events.form_submitted.count / data.pageviews.count) * 100).toFixed(2)
                    : '0'}
                  %
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Package Interest</div>
                <div className="text-2xl font-bold">
                  {data?.pageviews.count && data?.events.package_card_click.count
                    ? ((data.events.package_card_click.count / data.pageviews.count) * 100).toFixed(1)
                    : '0'}
                  %
                </div>
              </div>
            </div>
          </div>

          {/* Tracked Events Info */}
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Tracked Events</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Custom Events:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>cta_click - CTA button clicks</li>
                  <li>form_started - Form interactie gestart</li>
                  <li>form_submitted - Form succesvol verzonden</li>
                  <li>package_card_click - Package card interacties</li>
                  <li>faq_expanded - FAQ items uitgeklapt</li>
                  <li>scroll_depth - Scroll diepte tracking</li>
                  <li>sticky_cta_click - Mobile sticky CTA clicks</li>
                  <li>phone_click - Telefoon nummer clicks</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">User Properties:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>UTM parameters (source, medium, campaign, etc.)</li>
                  <li>Referrer</li>
                  <li>Landing path</li>
                  <li>Package interest</li>
                  <li>Company size</li>
                </ul>
              </div>
            </div>
          </div>

          {/* PostHog Link */}
          <div className="bg-muted border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Gedetailleerde Analytics</h2>
            <p className="text-muted-foreground mb-4">
              Voor uitgebreide analytics, session recordings, funnels en meer, open het PostHog dashboard.
            </p>
            <a
              href="https://app.posthog.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Open PostHog Dashboard →
            </a>
          </div>
        </>
      )}
    </div>
  );
}
