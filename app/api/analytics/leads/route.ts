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

    // Get date range parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

    // Parse dates correctly - treat date strings as local dates, not UTC
    let end: Date;
    let start: Date;
    
    if (endDate) {
      // Parse as local date (YYYY-MM-DD format)
      const [year, month, day] = endDate.split('-').map(Number);
      end = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }
    
    if (startDate) {
      // Parse as local date (YYYY-MM-DD format)
      const [year, month, day] = startDate.split('-').map(Number);
      start = new Date(year, month - 1, day, 0, 0, 0, 0);
    } else {
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }
    
    // Format dates for PostgreSQL (use UTC for database queries)
    const startISO = start.toISOString().split('T')[0];
    const endISO = end.toISOString().split('T')[0];

    // Get leads grouped by date
    // Use gte for start (includes the day) and lte for end with full timestamp (includes entire end day)
    const { data: leadsByDate, error: leadsError } = await supabase
      .from('leads')
      .select('created_at, status, utm_source, utm_medium, utm_campaign')
      .gte('created_at', `${startISO}T00:00:00.000Z`)
      .lte('created_at', `${endISO}T23:59:59.999Z`)
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
      // Parse created_at as UTC timestamp from database
      const date = new Date(lead.created_at);
      let key = '';
      
      switch (groupBy) {
        case 'day':
          // Convert to local date for grouping (Belgian timezone)
          const localYear = date.getFullYear();
          const localMonth = date.getMonth();
          const localDay = date.getDate();
          key = `${localYear}-${String(localMonth + 1).padStart(2, '0')}-${String(localDay).padStart(2, '0')}`;
          break;
        case 'week':
          // Week starts on Monday (day 1) in Belgium
          // Get local date components
          const weekDate = new Date(date);
          const dayOfWeek = weekDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday-based week
          weekDate.setDate(weekDate.getDate() - daysToMonday);
          weekDate.setHours(0, 0, 0, 0);
          const weekYear = weekDate.getFullYear();
          const weekMonth = weekDate.getMonth();
          const weekDay = weekDate.getDate();
          key = `${weekYear}-${String(weekMonth + 1).padStart(2, '0')}-${String(weekDay).padStart(2, '0')}`;
          break;
        case 'month':
          // Use local month/year
          const monthYear = date.getFullYear();
          const monthMonth = date.getMonth();
          key = `${monthYear}-${String(monthMonth + 1).padStart(2, '0')}`;
          break;
        case 'quarter':
          key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
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

      // Count by UTM source (always count, use 'direct' if missing)
      const source = lead.utm_source || 'direct';
      groupedData[key].bySource[source] = (groupedData[key].bySource[source] || 0) + 1;

      // Count by UTM medium (always count, use 'none' if missing)
      const medium = lead.utm_medium || 'none';
      groupedData[key].byMedium[medium] = (groupedData[key].byMedium[medium] || 0) + 1;

      // Count by UTM campaign (only if present)
      if (lead.utm_campaign) {
        groupedData[key].byCampaign[lead.utm_campaign] = (groupedData[key].byCampaign[lead.utm_campaign] || 0) + 1;
      }
    });

    // Fill in all periods in range (so we show every day/week/month, also with 0 leads)
    const emptyEntry = (key: string) => ({
      date: key,
      total: 0,
      byStatus: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      byMedium: {} as Record<string, number>,
      byCampaign: {} as Record<string, number>,
    });
    const walk = new Date(start);
    walk.setHours(0, 0, 0, 0);
    while (walk <= end) {
      let key = '';
      if (groupBy === 'day') {
        key = `${walk.getFullYear()}-${String(walk.getMonth() + 1).padStart(2, '0')}-${String(walk.getDate()).padStart(2, '0')}`;
        if (!groupedData[key]) groupedData[key] = emptyEntry(key);
        walk.setDate(walk.getDate() + 1);
      } else if (groupBy === 'week') {
        const d = new Date(walk);
        const dayOfWeek = d.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        d.setDate(d.getDate() - daysToMonday);
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!groupedData[key]) groupedData[key] = emptyEntry(key);
        walk.setDate(walk.getDate() + 7);
      } else if (groupBy === 'quarter') {
        key = `${walk.getFullYear()}-Q${Math.floor(walk.getMonth() / 3) + 1}`;
        if (!groupedData[key]) groupedData[key] = emptyEntry(key);
        walk.setMonth(walk.getMonth() + 3);
      } else {
        key = `${walk.getFullYear()}-${String(walk.getMonth() + 1).padStart(2, '0')}`;
        if (!groupedData[key]) groupedData[key] = emptyEntry(key);
        walk.setMonth(walk.getMonth() + 1);
      }
    }

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
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const previousEnd = new Date(start);
    previousEnd.setTime(start.getTime() - 1); // One millisecond before start
    previousEnd.setHours(23, 59, 59, 999); // End of previous day
    
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - periodDays + 1); // Same length period before
    previousStart.setHours(0, 0, 0, 0); // Start of day

    const previousStartISO = previousStart.toISOString().split('T')[0];
    const previousEndISO = previousEnd.toISOString().split('T')[0];

    const { data: previousLeads } = await supabase
      .from('leads')
      .select('id')
      .gte('created_at', `${previousStartISO}T00:00:00.000Z`)
      .lte('created_at', `${previousEndISO}T23:59:59.999Z`);

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
