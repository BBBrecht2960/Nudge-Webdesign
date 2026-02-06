import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { secureAdminRoute } from '@/lib/api-security';

const allowedLeadUpdateKeys = [
  'name',
  'email',
  'phone',
  'status',
  'company_name',
  'vat_number',
  'company_address',
  'company_postal_code',
  'company_city',
  'company_country',
  'company_website',
  'bank_account',
  'assigned_to',
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leadId } = await params;
  const securityError = await secureAdminRoute(
    request,
    { id: leadId },
    { maxRequests: 100, windowMs: 60000 },
    'can_leads'
  );
  if (securityError) return securityError;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !data) {
    if (error?.code === 'PGRST116') {
      return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 });
    }
    console.error('Error fetching lead:', error);
    return NextResponse.json({ error: 'Fout bij ophalen lead' }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const securityError = await secureAdminRoute(
      request,
      { id: leadId },
      { maxRequests: 30, windowMs: 60000 },
      'can_leads'
    );
    if (securityError) return securityError;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const key of allowedLeadUpdateKeys) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      console.error('Lead PATCH error:', error);
      const msg = error.message || '';
      const details: string[] = [];
      if (msg.includes("does not exist") || msg.includes("column") || msg.includes("schema cache")) {
        if (msg.includes("bank_account") || msg.includes("company_")) {
          details.push("Voer add-company-fields.sql uit in de Supabase SQL Editor.");
        }
        if (msg.includes("assigned_to")) {
          details.push("Voer supabase-schema-extensions.sql uit voor assigned_to.");
        }
      }
      return NextResponse.json(
        {
          error: details.length ? 'Kolom ontbreekt in de database.' : (msg || 'Fout bij bijwerken lead'),
          details: details.length ? details : undefined,
        },
        { status: 500 }
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error('Lead PATCH:', e);
    return NextResponse.json({ error: 'Fout bij bijwerken lead' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Security check: authentication, rate limiting, UUID validation
    const { id: leadId } = await params;
    const securityError = await secureAdminRoute(request, { id: leadId }, { maxRequests: 20, windowMs: 60000 });
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

    // First, check if there's a related customer
    const { data: relatedCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('lead_id', leadId)
      .maybeSingle();

    // Delete the lead (cascade will handle related records like activities, attachments)
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (deleteError) {
      console.error('Error deleting lead:', deleteError);
      return NextResponse.json(
        { error: 'Fout bij verwijderen lead' },
        { status: 500 }
      );
    }

    // If there was a related customer, delete it too
    if (relatedCustomer) {
      const { error: customerDeleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', relatedCustomer.id);

      if (customerDeleteError) {
        console.warn('Error deleting related customer:', customerDeleteError);
        // Lead is already deleted, so we continue
      }
    }

    return NextResponse.json({
      message: 'Lead en bijbehorende klant succesvol verwijderd',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Fout bij verwijderen lead';
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
