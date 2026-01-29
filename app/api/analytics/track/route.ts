import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VALID_EVENTS = ['$pageview', 'cta_click', 'form_submitted', 'package_card_click', 'scroll_depth', 'sticky_cta_click', 'phone_click', 'thank_you_page_view', 'faq_expanded'] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const eventType = typeof body.event === 'string' ? body.event.trim() : '';
    const properties = typeof body.properties === 'object' && body.properties !== null ? body.properties : {};

    if (!eventType || !VALID_EVENTS.includes(eventType as (typeof VALID_EVENTS)[number])) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { error } = await supabase.from('analytics_events').insert({
      event_type: eventType,
      properties: Object.keys(properties).length ? properties : {},
    });

    if (error) {
      console.warn('Analytics track insert error:', error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
