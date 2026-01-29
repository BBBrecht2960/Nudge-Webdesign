import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { secureAdminRoute } from '@/lib/api-security';
import * as z from 'zod';

const leadPatchSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  company_name: z.string().max(255).optional().nullable(),
  vat_number: z.string().max(50).optional().nullable(),
  company_address: z.string().max(500).optional().nullable(),
  company_postal_code: z.string().max(20).optional().nullable(),
  company_city: z.string().max(100).optional().nullable(),
  company_country: z.string().max(100).optional().nullable(),
  company_website: z.string().max(500).optional().nullable(),
  bank_account: z.string().max(100).optional().nullable(),
  assigned_to: z.string().max(255).optional().nullable(),
}).strict();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leadId } = await params;
  const securityError = await secureAdminRoute(request, { id: leadId }, { maxRequests: 100, windowMs: 60000 }, 'can_leads');
  if (securityError) return securityError;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.from('leads').select('*').eq('id', leadId).single();

  if (error || !data) {
    if (error?.code === 'PGRST116') return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 });
    console.error('Error fetching lead:', error);
    return NextResponse.json({ error: 'Fout bij ophalen lead' }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leadId } = await params;
  const securityError = await secureAdminRoute(request, { id: leadId }, { maxRequests: 30, windowMs: 60000 }, 'can_leads');
  if (securityError) return securityError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 });
  }
  const parsed = leadPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ongeldige velden', details: parsed.error.issues }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) updates[key] = value;
  }

  const { data, error } = await supabase.from('leads').update(updates).eq('id', leadId).select().single();
  if (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken lead' }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Security check: authentication, rate limiting, UUID validation
    const { id: leadId } = await params;
    const securityError = await secureAdminRoute(request, { id: leadId }, { maxRequests: 20, windowMs: 60000 }, 'can_leads');
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
