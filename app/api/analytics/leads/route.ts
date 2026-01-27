import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
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

    // Get date range parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date();
    if (!startDate) {
      start.setDate(start.getDate() - 30);
    }

    // Format dates for PostgreSQL
    const startISO = start.toISOString().split('T')[0];
    const endISO = end.toISOString().split('T')[0];

    // Build date grouping SQL
    let dateGroupSQL = '';
    let dateFormat = '';
    switch (groupBy) {
      case 'day':
        dateGroupSQL = "DATE(created_at)";
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateGroupSQL = "DATE_TRUNC('week', created_at)";
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'month':
        dateGroupSQL = "DATE_TRUNC('month', created_at)";
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateGroupSQL = "DATE(created_at)";
        dateFormat = 'YYYY-MM-DD';
    }

    // Get leads grouped by date
    const { data: leadsByDate, error: leadsError } = await supabase
      .from('leads')
      .select('created_at, status, utm_source, utm_medium, utm_campaign')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: true });

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return NextResponse.json(
        { error: 'Fout bij ophalen leads' },
        { status: 500 }
      );
    }

    // Process data for grouping
    const groupedData: Record<string, {
      date: string;
      total: number;
      byStatus: Record<string, number>;
      bySource: Record<string, number>;
      byMedium: Record<string, number>;
      byCampaign: Record<string, number>;
    }> = {};

    leadsByDate?.forEach((lead) => {
      const date = new Date(lead.created_at);
      let key = '';
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          total: 0,
          byStatus: {},
          bySource: {},
          byMedium: {},
          byCampaign: {},
        };
      }

      groupedData[key].total++;
      
      // Count by status
      const status = lead.status || 'new';
      groupedData[key].byStatus[status] = (groupedData[key].byStatus[status] || 0) + 1;

      // Count by UTM source
      if (lead.utm_source) {
        groupedData[key].bySource[lead.utm_source] = (groupedData[key].bySource[lead.utm_source] || 0) + 1;
      }

      // Count by UTM medium
      if (lead.utm_medium) {
        groupedData[key].byMedium[lead.utm_medium] = (groupedData[key].byMedium[lead.utm_medium] || 0) + 1;
      }

      // Count by UTM campaign
      if (lead.utm_campaign) {
        groupedData[key].byCampaign[lead.utm_campaign] = (groupedData[key].byCampaign[lead.utm_campaign] || 0) + 1;
      }
    });

    // Convert to array and sort by date
    const timeline = Object.values(groupedData).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    // Get total statistics
    const totalLeads = leadsByDate?.length || 0;
    
    // Get status breakdown
    const statusBreakdown: Record<string, number> = {};
    leadsByDate?.forEach((lead) => {
      const status = lead.status || 'new';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    // Get source breakdown
    const sourceBreakdown: Record<string, number> = {};
    leadsByDate?.forEach((lead) => {
      const source = lead.utm_source || 'direct';
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
    });

    // Get medium breakdown
    const mediumBreakdown: Record<string, number> = {};
    leadsByDate?.forEach((lead) => {
      const medium = lead.utm_medium || 'none';
      mediumBreakdown[medium] = (mediumBreakdown[medium] || 0) + 1;
    });

    // Calculate trends (compare with previous period)
    const previousStart = new Date(start);
    const previousEnd = new Date(start);
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    previousStart.setDate(previousStart.getDate() - periodDays);
    previousEnd.setTime(start.getTime() - 1);

    const { data: previousLeads } = await supabase
      .from('leads')
      .select('id')
      .gte('created_at', previousStart.toISOString().split('T')[0])
      .lte('created_at', previousEnd.toISOString().split('T')[0]);

    const previousTotal = previousLeads?.length || 0;
    const trend = previousTotal > 0 
      ? ((totalLeads - previousTotal) / previousTotal) * 100 
      : (totalLeads > 0 ? 100 : 0);

    return NextResponse.json({
      total: totalLeads,
      trend: Math.round(trend * 10) / 10,
      timeline,
      statusBreakdown,
      sourceBreakdown,
      mediumBreakdown,
      dateRange: {
        start: startISO,
        end: endISO,
        groupBy,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Fout bij ophalen lead analytics';
    console.error('Error fetching lead analytics:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
