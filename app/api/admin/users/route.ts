import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminPermission } from '@/lib/api-security';
import { SUPER_ADMIN_EMAIL } from '@/lib/security';
import { hashPassword } from '@/lib/auth';
import * as z from 'zod';

// GET: Fetch all admin users (id, email, full_name, permissions). Requires can_manage_users.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by Next.js route signature
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminPermission('can_manage_users');
    if ('error' in authResult) return authResult.error;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Database niet geconfigureerd' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, gsm, can_leads, can_customers, can_analytics, can_manage_users')
      .order('email', { ascending: true });

    if (error) throw error;

    const userIds = (data || []).map((r) => r.id);
    const { data: ndaDocs } = userIds.length > 0
      ? await supabase
          .from('admin_user_documents')
          .select('admin_user_id')
          .eq('document_type', 'nda')
      : { data: [] };
    const ndaUserIds = new Set((ndaDocs ?? []).map((d) => d.admin_user_id));

    const users = (data || []).map((row) => {
      const isSuperAdmin = row.email === SUPER_ADMIN_EMAIL;
      return {
        id: row.id,
        email: row.email,
        full_name: row.full_name ?? null,
        gsm: row.gsm ?? null,
        can_leads: isSuperAdmin ? true : Boolean(row.can_leads),
        can_customers: isSuperAdmin ? true : Boolean(row.can_customers),
        can_analytics: isSuperAdmin ? true : Boolean(row.can_analytics),
        can_manage_users: isSuperAdmin ? true : Boolean(row.can_manage_users),
        is_super_admin: isSuperAdmin,
        has_nda: ndaUserIds.has(row.id),
      };
    });
    return NextResponse.json({ users });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Fout bij ophalen gebruikers';
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

const createUserSchema = z.object({
  email: z.string().email().max(255).transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8).max(256),
  full_name: z.string().max(255).optional(),
  first_name: z.string().max(100).optional(),
  gender: z.enum(['M', 'V', 'X']).optional(),
  birth_date: z.string().max(20).optional(),
  birth_place: z.string().max(255).optional(),
  nationality: z.string().max(100).optional(),
  rijksregisternummer: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  postal_code: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  gsm: z.string().max(50).optional(),
  phone: z.string().max(50).optional(),
  iban: z.string().max(34).optional(),
  bic: z.string().max(11).optional(),
  bank_name: z.string().max(255).optional(),
  account_holder: z.string().max(255).optional(),
  emergency_contact_name: z.string().max(255).optional(),
  emergency_contact_relation: z.string().max(100).optional(),
  emergency_contact_phone: z.string().max(50).optional(),
  can_leads: z.boolean().optional(),
  can_customers: z.boolean().optional(),
  can_analytics: z.boolean().optional(),
  can_manage_users: z.boolean().optional(),
}).strict();

// POST: Create new admin user. Requires can_manage_users.
export async function POST(request: NextRequest) {
  const authResult = await requireAdminPermission('can_manage_users');
  if ('error' in authResult) return authResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 });
  }
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ongeldige velden', details: parsed.error.issues }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const existing = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', parsed.data.email)
    .single();
  if (existing.data) {
    return NextResponse.json({ error: 'Er bestaat al een gebruiker met dit e-mailadres.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const insert: Record<string, unknown> = {
    email: parsed.data.email,
    password_hash: passwordHash,
    can_leads: parsed.data.can_leads ?? true,
    can_customers: parsed.data.can_customers ?? true,
    can_analytics: parsed.data.can_analytics ?? true,
    can_manage_users: parsed.data.can_manage_users ?? false,
  };
  const optionalStr = (v: string | undefined) => (v === undefined ? undefined : (v.trim() || null));
  if (parsed.data.full_name !== undefined) insert.full_name = optionalStr(parsed.data.full_name);
  if (parsed.data.first_name !== undefined) insert.first_name = optionalStr(parsed.data.first_name);
  if (parsed.data.gender !== undefined) insert.gender = parsed.data.gender || null;
  if (parsed.data.birth_date !== undefined) insert.birth_date = optionalStr(parsed.data.birth_date) || null;
  if (parsed.data.birth_place !== undefined) insert.birth_place = optionalStr(parsed.data.birth_place);
  if (parsed.data.nationality !== undefined) insert.nationality = optionalStr(parsed.data.nationality);
  if (parsed.data.rijksregisternummer !== undefined) insert.rijksregisternummer = optionalStr(parsed.data.rijksregisternummer);
  if (parsed.data.address !== undefined) insert.address = optionalStr(parsed.data.address);
  if (parsed.data.postal_code !== undefined) insert.postal_code = optionalStr(parsed.data.postal_code);
  if (parsed.data.city !== undefined) insert.city = optionalStr(parsed.data.city);
  if (parsed.data.country !== undefined) insert.country = optionalStr(parsed.data.country);
  if (parsed.data.gsm !== undefined) insert.gsm = optionalStr(parsed.data.gsm);
  if (parsed.data.phone !== undefined) insert.phone = optionalStr(parsed.data.phone);
  if (parsed.data.iban !== undefined) insert.iban = optionalStr(parsed.data.iban);
  if (parsed.data.bic !== undefined) insert.bic = optionalStr(parsed.data.bic);
  if (parsed.data.bank_name !== undefined) insert.bank_name = optionalStr(parsed.data.bank_name);
  if (parsed.data.account_holder !== undefined) insert.account_holder = optionalStr(parsed.data.account_holder);
  if (parsed.data.emergency_contact_name !== undefined) insert.emergency_contact_name = optionalStr(parsed.data.emergency_contact_name);
  if (parsed.data.emergency_contact_relation !== undefined) insert.emergency_contact_relation = optionalStr(parsed.data.emergency_contact_relation);
  if (parsed.data.emergency_contact_phone !== undefined) insert.emergency_contact_phone = optionalStr(parsed.data.emergency_contact_phone);

  const selectCols = 'id, email, full_name, gsm, can_leads, can_customers, can_analytics, can_manage_users';
  const { data, error } = await supabase
    .from('admin_users')
    .insert(insert)
    .select(selectCols)
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'E-mail of rijksregisternummer bestaat al.' }, { status: 409 });
    console.error('Error creating admin user:', error);
    const msg = error.message || '';
    const details: string[] = [];
    if (msg.includes('does not exist') || msg.includes('column') || msg.includes('undefined_column')) {
      details.push('Voer run-admin-users-migrations.sql uit in Supabase SQL Editor.');
    }
    // Toon echte foutmelding zodat je op productie kunt zien wat er misgaat (bv. RLS, ontbrekende env)
    return NextResponse.json(
      {
        error: details.length ? 'Databasekolommen ontbreken. Voer de admin_users-migraties uit in Supabase.' : 'Fout bij aanmaken gebruiker',
        details: details.length ? details : [msg],
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: data.id,
    email: data.email,
    full_name: data.full_name ?? null,
    gsm: data.gsm ?? null,
    can_leads: Boolean(data.can_leads),
    can_customers: Boolean(data.can_customers),
    can_analytics: Boolean(data.can_analytics),
    can_manage_users: Boolean(data.can_manage_users),
  }, { status: 201 });
}
