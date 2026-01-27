import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Database niet geconfigureerd' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const body = await request.json();

    const {
      name,
      email,
      phone,
      company_name,
      company_size,
      package_interest,
      pain_points,
      current_website_status,
      message,
      gdpr_consent,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      referrer,
      landing_path,
    } = body;

    // Validate required fields
    if (!name || !email || !gdpr_consent) {
      return NextResponse.json(
        { error: 'Naam, e-mail en GDPR toestemming zijn verplicht' },
        { status: 400 }
      );
    }

    // Insert lead into database
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone: phone || null,
        company_name: company_name || null,
        company_size: company_size || null,
        package_interest: package_interest || null,
        pain_points: pain_points || [],
        current_website_status: current_website_status || null,
        message: message || null,
        status: 'new',
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_term: utm_term || null,
        utm_content: utm_content || null,
        referrer: referrer || null,
        landing_path: landing_path || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Er is iets misgegaan bij het opslaan van uw aanvraag' },
        { status: 500 }
      );
    }

    // Track in PostHog (server-side if needed)
    // Note: Client-side tracking is already done in the form component

    return NextResponse.json(
      { success: true, lead_id: data.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}
