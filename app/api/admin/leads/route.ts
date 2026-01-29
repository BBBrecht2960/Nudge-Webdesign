import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminPermission } from '@/lib/api-security';
import * as z from 'zod';

const adminLeadSchema = z.object({
  name: z.string().min(2, 'Naam moet minstens 2 tekens zijn').max(255),
  email: z.string().min(1, 'E-mail is verplicht').max(255).email('Ongeldig e-mailadres'),
  phone: z.string().min(1, 'Telefoon is verplicht').max(50),
  company_name: z.string().max(255).optional().nullable(),
  message: z.string().max(5000).optional().nullable(),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminPermission('can_leads');
    if ('error' in authResult) return authResult.error;

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
      phone: data.phone.trim(),
      company_name: data.company_name?.trim() || null,
      message: data.message?.trim() || null,
      status: 'new' as const,
      created_by: authResult.email?.trim() || null,
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
