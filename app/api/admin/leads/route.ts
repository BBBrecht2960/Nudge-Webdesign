import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/security';
import * as z from 'zod';

const adminLeadSchema = z.object({
  name: z.string().min(2, 'Naam moet minstens 2 tekens zijn').max(255),
  email: z.string().min(1, 'E-mail is verplicht').max(255).email('Ongeldig e-mailadres'),
  phone: z.string().max(50).optional().nullable(),
  company_name: z.string().max(255).optional().nullable(),
  company_size: z.string().max(50).optional().nullable(),
  package_interest: z.string().max(100).optional().nullable(),
  pain_points: z.array(z.string()).optional().default([]),
  current_website_status: z.string().max(100).optional().nullable(),
  message: z.string().max(5000).optional().nullable(),
  vat_number: z.string().max(50).optional().nullable(),
  company_address: z.string().max(500).optional().nullable(),
  company_postal_code: z.string().max(20).optional().nullable(),
  company_city: z.string().max(100).optional().nullable(),
  company_country: z.string().max(100).optional().nullable(),
  company_website: z.string().max(500).optional().nullable(),
  assigned_to: z.string().max(255).optional().nullable(),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) {
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Ongeldige JSON' },
        { status: 400 }
      );
    }

    const parsed = adminLeadSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const message = first?.message || 'Ongeldige invoer';
      return NextResponse.json(
        { error: message, details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const insertPayload = {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone?.trim() || null,
      company_name: data.company_name?.trim() || null,
      company_size: data.company_size?.trim() || null,
      package_interest: data.package_interest?.trim() || null,
      pain_points: Array.isArray(data.pain_points) ? data.pain_points : [],
      current_website_status: data.current_website_status?.trim() || null,
      message: data.message?.trim() || null,
      vat_number: data.vat_number?.trim() || null,
      company_address: data.company_address?.trim() || null,
      company_postal_code: data.company_postal_code?.trim() || null,
      company_city: data.company_city?.trim() || null,
      company_country: data.company_country?.trim() || null,
      company_website: data.company_website && data.company_website.trim() ? data.company_website.trim() : null,
      assigned_to: data.assigned_to?.trim() || null,
      status: 'new' as const,
      created_by: auth.email?.trim() || null,
    };

    const { data: lead, error } = await supabase
      .from('leads')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error) {
      console.error('Admin create lead error:', error);
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Er bestaat al een lead met dit e-mailadres.' },
          { status: 409 }
        );
      }
      if (error.code === 'PGRST204') {
        return NextResponse.json(
          {
            error: 'Database-schema voor leads ontbreekt. Voer eenmalig uit: npm run migrate-leads (zie SETUP.md, DATABASE_URL in .env.local).',
            code: 'SCHEMA_MIGRATION_REQUIRED',
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: error.message || 'Fout bij aanmaken lead' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, lead_id: lead.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('API admin/leads POST error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}
