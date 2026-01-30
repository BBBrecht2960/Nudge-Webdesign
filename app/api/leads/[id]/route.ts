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

  if (parsed.data.status !== undefined) {
    const newStatus = parsed.data.status;
    const { data: currentLead, error: fetchError } = await supabase
      .from('leads')
      .select('status')
      .eq('id', leadId)
      .single();
    if (fetchError || !currentLead) {
      if (fetchError?.code === 'PGRST116') return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 });
      return NextResponse.json({ error: 'Fout bij ophalen lead' }, { status: 500 });
    }
    const currentStatus = currentLead.status as string;

    const statusOrder = ['new', 'contacted', 'qualified', 'converted'] as const;
    const currentIndex = statusOrder.indexOf(currentStatus as (typeof statusOrder)[number]);
    const newIndex = statusOrder.indexOf(newStatus as (typeof statusOrder)[number]);

    if (newStatus !== currentStatus && newStatus !== 'lost') {
      if (newIndex < 0 || currentIndex < 0) {
        return NextResponse.json({ error: 'Ongeldige status' }, { status: 400 });
      }
      if (newIndex < currentIndex) {
        return NextResponse.json({ error: 'Je kunt niet teruggaan naar een eerdere status.' }, { status: 400 });
      }
      if (newIndex > currentIndex + 1) {
        return NextResponse.json({
          error: 'Je kunt geen status overslaan. Volg de stappen: Nieuw → Gecontacteerd → Gekwalificeerd → Geconverteerd.',
        }, { status: 400 });
      }
      if (newStatus === 'contacted' && currentStatus !== 'new') {
        return NextResponse.json({ error: 'Status "Gecontacteerd" is alleen mogelijk vanuit "Nieuw".' }, { status: 400 });
      }
      if (newStatus === 'qualified' && currentStatus !== 'contacted') {
        return NextResponse.json({ error: 'Status "Gekwalificeerd" is alleen mogelijk vanuit "Gecontacteerd".' }, { status: 400 });
      }
      if (newStatus === 'converted') {
        if (currentStatus !== 'qualified') {
          return NextResponse.json({
            error: 'Status "Geconverteerd" is alleen mogelijk vanuit "Gekwalificeerd". Doorloop eerst Gecontacteerd en Gekwalificeerd.',
          }, { status: 400 });
        }
        const { data: quotes } = await supabase
          .from('lead_quotes')
          .select('id, status')
          .eq('lead_id', leadId)
          .in('status', ['sent', 'accepted']);
        const hasQuote = Array.isArray(quotes) && quotes.length > 0;
        if (!hasQuote) {
          return NextResponse.json({
            error: 'Er moet minimaal één offerte zijn (verzonden of geaccepteerd) voordat je naar Geconverteerd kunt gaan. Maak een offerte via de Offerte-tab en verstuur deze.',
          }, { status: 400 });
        }
      }
    }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) updates[key] = value;
  }

  const { data, error } = await supabase.from('leads').update(updates).eq('id', leadId).select().single();
  if (error) {
    console.error('Error updating lead:', error);
    const msg = (error as { message?: string }).message ?? '';
    const missingColumn = msg.includes('does not exist') || (msg.includes('column') && msg.includes('not exist'));
    if (missingColumn) {
      return NextResponse.json(
        {
          error:
            'Een veld ontbreekt in de database. Voer in Supabase SQL Editor het script add-company-fields.sql uit (en eventueel supabase-schema-extensions.sql voor toegewezen aan).',
        },
        { status: 500 }
      );
    }
    // Return actual error so user can see what fails (e.g. RLS, constraint, type)
    return NextResponse.json(
      { error: 'Fout bij bijwerken lead', details: msg || String(error) },
      { status: 500 }
    );
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
