import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

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

    customers?.forEach((customer) => {
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

    const timeline = Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date));
    const totalRevenue = customers?.reduce((sum, customer) => sum + (Number(customer.quote_total) || 0), 0) || 0;

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
      .select('quote_total')
      .gte('converted_at', `${previousStartISO}T00:00:00.000Z`)
      .lte('converted_at', `${previousEndISO}T23:59:59.999Z`)
      .not('quote_total', 'is', null);

    const previousTotal = previousCustomers?.reduce((sum, customer) => sum + (Number(customer.quote_total) || 0), 0) || 0;
    const trend = previousTotal > 0 ? ((totalRevenue - previousTotal) / previousTotal) * 100 : (totalRevenue > 0 ? 100 : 0);
    const averageDealSize = customers && customers.length > 0 ? totalRevenue / customers.length : 0;

    const byStatus: Record<string, number> = {};
    customers?.forEach((customer) => {
      const status = customer.project_status || 'new';
      const revenue = Number(customer.quote_total) || 0;
      byStatus[status] = (byStatus[status] || 0) + revenue;
    });

    return NextResponse.json({
      total: Math.round(totalRevenue * 100) / 100,
      trend: Math.round(trend * 10) / 10,
      count: customers?.length || 0,
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
