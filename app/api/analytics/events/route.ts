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
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({
        events: {
          cta_click: { count: 0, trend: 0 },
          form_submitted: { count: 0, trend: 0 },
          package_card_click: { count: 0, trend: 0 },
          scroll_depth: { count: 0, trend: 0 },
        },
        pageviews: { count: 0, trend: 0 },
        leads: { count: 0, trend: 0 },
      });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10)));
    const after = new Date();
    after.setDate(after.getDate() - days);
    const afterStr = after.toISOString();

    const supabase = createClient(supabaseUrl, serviceKey);

    const runCount = async (eventType: string) => {
      const { count, error } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', eventType)
        .gte('created_at', afterStr);
      return error ? 0 : (count ?? 0);
    };

    const [pageviewCount, ctaCount, formCount, packageCount, scrollCount] = await Promise.all([
      runCount('$pageview'),
      runCount('cta_click'),
      runCount('form_submitted'),
      runCount('package_card_click'),
      runCount('scroll_depth'),
    ]);

    return NextResponse.json({
      events: {
        cta_click: { count: ctaCount, trend: 0 },
        form_submitted: { count: formCount, trend: 0 },
        package_card_click: { count: packageCount, trend: 0 },
        scroll_depth: { count: scrollCount, trend: 0 },
      },
      pageviews: { count: pageviewCount, trend: 0 },
      leads: { count: 0, trend: 0 },
    });
  } catch (error: unknown) {
    console.error('Analytics events GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fout bij ophalen analytics' },
      { status: 500 }
    );
  }
}
