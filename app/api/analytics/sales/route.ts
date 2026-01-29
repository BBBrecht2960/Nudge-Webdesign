import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export interface SalesPersonStats {
  person: string;
  leadCount: number;
  quoteCount: number;
  totalQuoteAmount: number;
  avgQuoteAmount: number;
  convertedCount: number;
  convertedRevenue: number;
}

export interface SalesByPeriodItem {
  periodLabel: string;
  periodKey: string;
  persons: Record<string, Omit<SalesPersonStats, 'person'>>;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Database niet geconfigureerd' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = (searchParams.get('groupBy') || 'week') as 'day' | 'week' | 'month';

    let end: Date;
    let start: Date;
    if (endDate) {
      const [y, m, d] = endDate.split('-').map(Number);
      end = new Date(y, m - 1, d, 23, 59, 59, 999);
    } else {
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }
    if (startDate) {
      const [y, m, d] = startDate.split('-').map(Number);
      start = new Date(y, m - 1, d, 0, 0, 0, 0);
    } else {
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }
    const startISO = start.toISOString().split('T')[0];
    const endISO = end.toISOString().split('T')[0];

    type LeadRow = { id: string; created_at: string; created_by?: string | null; brought_in_by?: string | null };
    let leads: LeadRow[] | null = null;

    const res = await supabase
      .from('leads')
      .select('id, created_at, created_by, brought_in_by')
      .gte('created_at', `${startISO}T00:00:00.000Z`)
      .lte('created_at', `${endISO}T23:59:59.999Z`)
      .order('created_at', { ascending: true });
    let leadsError = res.error;

    if (leadsError?.code === 'PGRST204' || leadsError?.message?.includes('brought_in_by') || leadsError?.message?.includes('created_by')) {
      const fallback = await supabase
        .from('leads')
        .select('id, created_at, created_by')
        .gte('created_at', `${startISO}T00:00:00.000Z`)
        .lte('created_at', `${endISO}T23:59:59.999Z`)
        .order('created_at', { ascending: true });
      leads = fallback.data as LeadRow[] | null;
      leadsError = fallback.error;
    } else {
      leads = res.data as LeadRow[] | null;
    }

    if (leadsError) {
      const minimal = await supabase
        .from('leads')
        .select('id, created_at')
        .gte('created_at', `${startISO}T00:00:00.000Z`)
        .lte('created_at', `${endISO}T23:59:59.999Z`)
        .order('created_at', { ascending: true });
      if (minimal.error) {
        console.error('Sales analytics leads error:', minimal.error);
        return NextResponse.json(
          { error: 'Fout bij ophalen leads' },
          { status: 500 }
        );
      }
      leads = (minimal.data || []).map((r) => ({ ...r, created_by: null, brought_in_by: null }));
    }

    const leadIds = (leads || []).map((l) => l.id);
    const leadByPerson: Record<string, Array<{ id: string; created_at: string }>> = {};
    for (const l of leads || []) {
      const person = (l.brought_in_by?.trim() || l.created_by?.trim()) || 'Onbekend';
      if (!leadByPerson[person]) leadByPerson[person] = [];
      leadByPerson[person].push({ id: l.id, created_at: l.created_at });
    }

    const IN_CHUNK = 200;
    const idList = leadIds.length ? leadIds : ['00000000-0000-0000-0000-000000000000'];

    let quoteByLeadId: Record<string, number> = {};
    try {
      for (let i = 0; i < idList.length; i += IN_CHUNK) {
        const chunk = idList.slice(i, i + IN_CHUNK);
        const { data: quotes, error: quotesError } = await supabase
          .from('lead_quotes')
          .select('lead_id, total_price, status')
          .in('lead_id', chunk)
          .in('status', ['sent', 'accepted']);
        if (quotesError) {
          if (quotesError.code === '42P01' || quotesError.message?.includes('does not exist')) {
            break;
          }
          throw quotesError;
        }
        if (quotes?.length) {
          for (const q of quotes) {
            const price = Number(q.total_price) || 0;
            if (!quoteByLeadId[q.lead_id] || price > (quoteByLeadId[q.lead_id] ?? 0)) {
              quoteByLeadId[q.lead_id] = price;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Sales analytics lead_quotes:', e);
      quoteByLeadId = {};
    }

    let customerByLeadId: Record<string, number> = {};
    try {
      for (let i = 0; i < idList.length; i += IN_CHUNK) {
        const chunk = idList.slice(i, i + IN_CHUNK);
        const { data: customers, error: customersError } = await supabase
          .from('customers')
          .select('lead_id, quote_total')
          .in('lead_id', chunk)
          .not('lead_id', 'is', null);
        if (customersError) {
          if (customersError.code === '42P01' || customersError.message?.includes('does not exist')) {
            break;
          }
          throw customersError;
        }
        if (customers?.length) {
          for (const c of customers) {
            if (c.lead_id) customerByLeadId[c.lead_id] = Number(c.quote_total) || 0;
          }
        }
      }
    } catch (e) {
      console.warn('Sales analytics customers:', e);
      customerByLeadId = {};
    }

    function getPeriodKey(d: Date): string {
      if (groupBy === 'day') return d.toISOString().slice(0, 10);
      if (groupBy === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const w = new Date(d);
      w.setDate(w.getDate() - w.getDay() + 1);
      return w.toISOString().slice(0, 10);
    }
    function getPeriodLabel(key: string): string {
      if (groupBy === 'day') return key;
      if (groupBy === 'month') {
        const [y, m] = key.split('-');
        const names = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
        return `${names[parseInt(m, 10) - 1]} ${y}`;
      }
      return `Week ${key}`;
    }

    const totalsByPerson: Record<string, { leadCount: number; quoteCount: number; totalQuote: number; convertedCount: number; convertedRevenue: number }> = {};
    const byPeriod: Record<string, Record<string, { leadCount: number; quoteCount: number; totalQuote: number; convertedCount: number; convertedRevenue: number }>> = {};

    for (const [person, list] of Object.entries(leadByPerson)) {
      if (!totalsByPerson[person]) {
        totalsByPerson[person] = { leadCount: 0, quoteCount: 0, totalQuote: 0, convertedCount: 0, convertedRevenue: 0 };
      }
      for (const { id, created_at } of list) {
        const periodKey = getPeriodKey(new Date(created_at));
        if (!byPeriod[periodKey]) byPeriod[periodKey] = {};
        if (!byPeriod[periodKey][person]) {
          byPeriod[periodKey][person] = { leadCount: 0, quoteCount: 0, totalQuote: 0, convertedCount: 0, convertedRevenue: 0 };
        }
        totalsByPerson[person].leadCount += 1;
        byPeriod[periodKey][person].leadCount += 1;
        const quoteAmount = quoteByLeadId[id] ?? customerByLeadId[id];
        if (quoteAmount != null && quoteAmount > 0) {
          totalsByPerson[person].quoteCount += 1;
          totalsByPerson[person].totalQuote += quoteAmount;
          byPeriod[periodKey][person].quoteCount += 1;
          byPeriod[periodKey][person].totalQuote += quoteAmount;
        }
        if (customerByLeadId[id] != null && customerByLeadId[id] > 0) {
          totalsByPerson[person].convertedCount += 1;
          totalsByPerson[person].convertedRevenue += customerByLeadId[id];
          byPeriod[periodKey][person].convertedCount += 1;
          byPeriod[periodKey][person].convertedRevenue += customerByLeadId[id];
        }
      }
    }

    const totalLeads = (leads || []).length;
    const totalQuoteAmount = Object.values(quoteByLeadId).reduce((a, b) => a + b, 0);
    const totalConvertedRevenue = Object.values(customerByLeadId).reduce((a, b) => a + b, 0);
    const totalConvertedCount = Object.values(customerByLeadId).filter((v) => v > 0).length;

    const summary: SalesPersonStats[] = Object.entries(totalsByPerson).map(([person, t]) => ({
      person,
      leadCount: t.leadCount,
      quoteCount: t.quoteCount,
      totalQuoteAmount: Math.round(t.totalQuote * 100) / 100,
      avgQuoteAmount: t.quoteCount > 0 ? Math.round((t.totalQuote / t.quoteCount) * 100) / 100 : 0,
      convertedCount: t.convertedCount,
      convertedRevenue: Math.round(t.convertedRevenue * 100) / 100,
    })).sort((a, b) => b.convertedRevenue - a.convertedRevenue);

    const byPeriodList: SalesByPeriodItem[] = Object.entries(byPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periodKey, persons]) => ({
        periodKey,
        periodLabel: getPeriodLabel(periodKey),
        persons: Object.fromEntries(
          Object.entries(persons).map(([person, t]) => [
            person,
            {
              leadCount: t.leadCount,
              quoteCount: t.quoteCount,
              totalQuoteAmount: Math.round(t.totalQuote * 100) / 100,
              avgQuoteAmount: t.quoteCount > 0 ? Math.round((t.totalQuote / t.quoteCount) * 100) / 100 : 0,
              convertedCount: t.convertedCount,
              convertedRevenue: Math.round(t.convertedRevenue * 100) / 100,
            },
          ])
        ),
      }));

    return NextResponse.json({
      summary,
      byPeriod: byPeriodList,
      dateRange: { start: startISO, end: endISO, groupBy },
      totals: {
        totalLeads,
        totalQuoteAmount: Math.round(totalQuoteAmount * 100) / 100,
        totalConvertedRevenue: Math.round(totalConvertedRevenue * 100) / 100,
        totalConvertedCount,
      },
    });
  } catch (error: unknown) {
    console.error('Sales analytics error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fout bij ophalen sales analytics' },
      { status: 500 }
    );
  }
}
