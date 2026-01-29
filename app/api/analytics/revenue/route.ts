import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminPermission } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminPermission('can_analytics');
    if ('error' in authResult) return authResult.error;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Database niet geconfigureerd' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day';

    let end: Date;
    let start: Date;
    
    if (endDate) {
      const [year, month, day] = endDate.split('-').map(Number);
      end = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }
    
    if (startDate) {
      const [year, month, day] = startDate.split('-').map(Number);
      start = new Date(year, month - 1, day, 0, 0, 0, 0);
    } else {
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }
    
    const startISO = start.toISOString().split('T')[0];
    const endISO = end.toISOString().split('T')[0];

    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, converted_at, quote_total, project_status')
      .gte('converted_at', `${startISO}T00:00:00.000Z`)
      .lte('converted_at', `${endISO}T23:59:59.999Z`)
      .not('quote_total', 'is', null)
      .neq('project_status', 'canceled')
      .order('converted_at', { ascending: true });

    if (customersError) {
      if (customersError.code === '42P01' || customersError.message?.includes('does not exist')) {
        return NextResponse.json({
          total: 0,
          trend: 0,
          timeline: [],
          dateRange: { start: startISO, end: endISO, groupBy },
        });
      }
      throw customersError;
    }

    const groupedData: Record<string, { date: string; total: number; count: number; byStatus: Record<string, number> }> = {};

    // Filter out canceled customers
    const activeCustomers = customers?.filter(c => c.project_status !== 'canceled') || [];

    activeCustomers.forEach((customer) => {
      const date = new Date(customer.converted_at);
      let key = '';
      
      switch (groupBy) {
        case 'day':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'week':
          const weekDate = new Date(date);
          const dayOfWeek = weekDate.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          weekDate.setDate(weekDate.getDate() - daysToMonday);
          weekDate.setHours(0, 0, 0, 0);
          key = `${weekDate.getFullYear()}-${String(weekDate.getMonth() + 1).padStart(2, '0')}-${String(weekDate.getDate()).padStart(2, '0')}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!groupedData[key]) {
        groupedData[key] = { date: key, total: 0, count: 0, byStatus: {} };
      }

      const revenue = Number(customer.quote_total) || 0;
      groupedData[key].total += revenue;
      groupedData[key].count += 1;
      
      const status = customer.project_status || 'new';
      groupedData[key].byStatus[status] = (groupedData[key].byStatus[status] || 0) + revenue;
    });

    // Bouw volledige tijdlijn: alle periodes in het bereik, ook met €0
    const timeline: { date: string; total: number; count: number }[] = [];

    if (groupBy === 'day') {
      const cursor = new Date(start);
      cursor.setHours(0, 0, 0, 0);
      while (cursor <= end) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        const bucket = groupedData[key];
        timeline.push({ date: key, total: bucket ? bucket.total : 0, count: bucket ? bucket.count : 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
    } else if (groupBy === 'week') {
      const weekStart = new Date(start);
      const dayOfWeek = weekStart.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(weekStart.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);
      const cursor = new Date(weekStart);
      while (cursor <= end) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        const bucket = groupedData[key];
        timeline.push({ date: key, total: bucket ? bucket.total : 0, count: bucket ? bucket.count : 0 });
        cursor.setDate(cursor.getDate() + 7);
      }
    } else {
      // month
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cursor <= end) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        const bucket = groupedData[key];
        timeline.push({ date: key, total: bucket ? bucket.total : 0, count: bucket ? bucket.count : 0 });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    const totalRevenue = activeCustomers.reduce((sum, customer) => sum + (Number(customer.quote_total) || 0), 0);

    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const previousEnd = new Date(start);
    previousEnd.setTime(start.getTime() - 1);
    previousEnd.setHours(23, 59, 59, 999);
    
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - periodDays + 1);
    previousStart.setHours(0, 0, 0, 0);

    const previousStartISO = previousStart.toISOString().split('T')[0];
    const previousEndISO = previousEnd.toISOString().split('T')[0];

    const { data: previousCustomers } = await supabase
      .from('customers')
      .select('quote_total, project_status')
      .gte('converted_at', `${previousStartISO}T00:00:00.000Z`)
      .lte('converted_at', `${previousEndISO}T23:59:59.999Z`)
      .not('quote_total', 'is', null)
      .neq('project_status', 'canceled');

    // Filter out canceled customers from previous period
    type CustomerRow = { project_status?: string; quote_total?: number };
    const previousActiveCustomers = previousCustomers?.filter((c: CustomerRow) => c.project_status !== 'canceled') || [];
    const previousTotal = previousActiveCustomers.reduce((sum: number, customer: CustomerRow) => sum + (Number(customer.quote_total) || 0), 0);
    const trend = previousTotal > 0 ? ((totalRevenue - previousTotal) / previousTotal) * 100 : (totalRevenue > 0 ? 100 : 0);
    const averageDealSize = activeCustomers.length > 0 ? totalRevenue / activeCustomers.length : 0;

    const byStatus: Record<string, number> = {};
    activeCustomers.forEach((customer) => {
      const status = customer.project_status || 'new';
      const revenue = Number(customer.quote_total) || 0;
      byStatus[status] = (byStatus[status] || 0) + revenue;
    });

    return NextResponse.json({
      total: Math.round(totalRevenue * 100) / 100,
      trend: Math.round(trend * 10) / 10,
      count: activeCustomers.length,
      averageDealSize: Math.round(averageDealSize * 100) / 100,
      timeline,
      byStatus,
      dateRange: { start: startISO, end: endISO, groupBy },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Fout bij ophalen omzet analytics';
    console.error('Error fetching revenue analytics:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
