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
    
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parsing error:', error);
      return NextResponse.json(
        { error: 'Ongeldige data ontvangen. Controleer het formulier en probeer opnieuw.' },
        { status: 400 }
      );
    }

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Ongeldig e-mailadres formaat' },
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
      
      // Provide more specific error messages based on error code
      let errorMessage = 'Er is iets misgegaan bij het opslaan van uw aanvraag';
      
      if (error.code === '23505') {
        // Unique constraint violation (duplicate email)
        errorMessage = 'Dit e-mailadres is al geregistreerd. Probeer een ander e-mailadres.';
      } else if (error.code === '23503') {
        // Foreign key violation
        errorMessage = 'Ongeldige data ontvangen. Controleer het formulier en probeer opnieuw.';
      } else if (error.code === '42P01') {
        // Table doesn't exist
        errorMessage = 'Database tabel niet gevonden. Neem contact op met de beheerder.';
      } else if (error.message) {
        errorMessage = `Database fout: ${error.message}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
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
    
    // Provide more specific error messages
    let errorMessage = 'Er is iets misgegaan';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError || (error as { name?: string }).name === 'SyntaxError') {
      errorMessage = 'Ongeldige data ontvangen';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
