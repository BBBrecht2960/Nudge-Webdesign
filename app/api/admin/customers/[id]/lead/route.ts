import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { secureAdminRoute } from '@/lib/api-security';

/**
 * GET: Return lead_id for this customer (for offerte builder).
 * If the customer has no lead_id, creates a lead from customer data and links it.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const securityError = await secureAdminRoute(request, { id: customerId }, { maxRequests: 30, windowMs: 60000 });
    if (securityError) return securityError;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Database niet geconfigureerd' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Klant niet gevonden' },
        { status: 404 }
      );
    }

    if (customer.lead_id) {
      return NextResponse.json({ lead_id: customer.lead_id });
    }

    // Create a lead from customer data and link it
    const now = new Date().toISOString();
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        name: customer.name,
        email: customer.email,
        phone: customer.phone ?? null,
        company_name: customer.company_name ?? null,
        company_size: customer.company_size ?? null,
        vat_number: customer.vat_number ?? null,
        company_address: customer.company_address ?? null,
        company_postal_code: customer.company_postal_code ?? null,
        company_city: customer.company_city ?? null,
        company_country: customer.company_country ?? 'België',
        company_website: customer.company_website ?? null,
        package_interest: customer.package_interest ?? null,
        pain_points: customer.pain_points ?? null,
        current_website_status: customer.current_website_status ?? null,
        message: customer.message ?? null,
        status: 'converted',
        utm_source: customer.utm_source ?? null,
        utm_medium: customer.utm_medium ?? null,
        utm_campaign: customer.utm_campaign ?? null,
        utm_term: customer.utm_term ?? null,
        utm_content: customer.utm_content ?? null,
        referrer: customer.referrer ?? null,
        landing_path: customer.landing_path ?? null,
        assigned_to: customer.assigned_to ?? null,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();

    if (leadError || !newLead) {
      console.error('[Customers/Lead] Error creating lead:', leadError);
      return NextResponse.json(
        { error: 'Kon geen lead aanmaken voor deze klant' },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from('customers')
      .update({
        lead_id: newLead.id,
        updated_at: now,
      })
      .eq('id', customerId);

    if (updateError) {
      console.error('[Customers/Lead] Error linking lead to customer:', updateError);
      // Lead was created; we still return it so the UI can redirect
    }

    return NextResponse.json({ lead_id: newLead.id });
  } catch (error) {
    console.error('[Customers/Lead] Error:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen of aanmaken lead' },
      { status: 500 }
    );
  }
}
