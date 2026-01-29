import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminPermission } from '@/lib/api-security';
import { isValidUUID, SUPER_ADMIN_EMAIL } from '@/lib/security';
import * as z from 'zod';

const patchUserSchema = z.object({
  email: z.string().email().max(255).transform((v) => v.toLowerCase().trim()).optional(),
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

const userSelectFull = 'id, email, full_name, first_name, gender, birth_date, birth_place, nationality, rijksregisternummer, address, postal_code, city, country, gsm, phone, iban, bic, bank_name, account_holder, emergency_contact_name, emergency_contact_relation, emergency_contact_phone, can_leads, can_customers, can_analytics, can_manage_users';
const userSelectBase = 'id, email, full_name, rijksregisternummer, address, gsm, can_leads, can_customers, can_analytics, can_manage_users';
const userSelectMin = 'id, email, can_leads, can_customers, can_analytics, can_manage_users';

// GET: Single admin user (full profile + document flags). Requires can_manage_users.
// Werkt ook als niet alle migraties zijn uitgevoerd (fallback op minder kolommen).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminPermission('can_manage_users');
  if ('error' in authResult) return authResult.error;

  const { id: targetId } = await params;
  if (!isValidUUID(targetId)) {
    return NextResponse.json({ error: 'Ongeldige id' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let user: Record<string, unknown> | null = null;
  let selectError: { code?: string } | null = null;

  const { data: dataFull, error: errorFull } = await supabase
    .from('admin_users')
    .select(userSelectFull)
    .eq('id', targetId)
    .single();

  if (!errorFull && dataFull) {
    user = dataFull as Record<string, unknown>;
  } else {
    selectError = errorFull;
    const { data: dataBase, error: errorBase } = await supabase
      .from('admin_users')
      .select(userSelectBase)
      .eq('id', targetId)
      .single();
    if (!errorBase && dataBase) {
      user = dataBase as Record<string, unknown>;
    } else {
      const { data: dataMin, error: errorMin } = await supabase
        .from('admin_users')
        .select(userSelectMin)
        .eq('id', targetId)
        .single();
      if (!errorMin && dataMin) {
        user = dataMin as Record<string, unknown>;
      } else if (errorMin?.code === 'PGRST116' || errorBase?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
      } else {
        return NextResponse.json({ error: 'Fout bij ophalen gebruiker' }, { status: 500 });
      }
    }
  }

  if (!user) {
    if (selectError?.code === 'PGRST116') return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    return NextResponse.json({ error: 'Fout bij ophalen gebruiker' }, { status: 500 });
  }

  let docTypes: string[] = [];
  try {
    const { data: docs } = await supabase
      .from('admin_user_documents')
      .select('document_type')
      .eq('admin_user_id', targetId);
    if (docs) docTypes = docs.map((d: { document_type: string }) => d.document_type);
  } catch {
    // Tabel admin_user_documents bestaat mogelijk nog niet
  }
  const isSuperAdmin = (user.email as string) === SUPER_ADMIN_EMAIL;

  return NextResponse.json({
    id: user.id,
    email: user.email,
    full_name: user.full_name ?? null,
    first_name: user.first_name ?? null,
    gender: user.gender ?? null,
    birth_date: user.birth_date ?? null,
    birth_place: user.birth_place ?? null,
    nationality: user.nationality ?? null,
    rijksregisternummer: user.rijksregisternummer ?? null,
    address: user.address ?? null,
    postal_code: user.postal_code ?? null,
    city: user.city ?? null,
    country: user.country ?? null,
    gsm: user.gsm ?? null,
    phone: user.phone ?? null,
    iban: user.iban ?? null,
    bic: user.bic ?? null,
    bank_name: user.bank_name ?? null,
    account_holder: user.account_holder ?? null,
    emergency_contact_name: user.emergency_contact_name ?? null,
    emergency_contact_relation: user.emergency_contact_relation ?? null,
    emergency_contact_phone: user.emergency_contact_phone ?? null,
    can_leads: isSuperAdmin ? true : Boolean(user.can_leads),
    can_customers: isSuperAdmin ? true : Boolean(user.can_customers),
    can_analytics: isSuperAdmin ? true : Boolean(user.can_analytics),
    can_manage_users: isSuperAdmin ? true : Boolean(user.can_manage_users),
    is_super_admin: isSuperAdmin,
    has_passport_front: docTypes.includes('passport_front'),
    has_passport_back: docTypes.includes('passport_back'),
    has_nda: docTypes.includes('nda'),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminPermission('can_manage_users');
  if ('error' in authResult) return authResult.error;

  const { id: targetId } = await params;
  if (!isValidUUID(targetId)) {
    return NextResponse.json({ error: 'Ongeldige id formaat' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 });
  }
  const parsed = patchUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ongeldige velden', details: parsed.error.issues }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: targetUser } = await supabase
    .from('admin_users')
    .select('email')
    .eq('id', targetId)
    .single();
  if (targetUser?.email === SUPER_ADMIN_EMAIL) {
    return NextResponse.json(
      { error: 'Rechten van de superbeheerder kunnen niet worden gewijzigd.' },
      { status: 403 }
    );
  }

  if (parsed.data.can_manage_users === false) {
    const { data: managers } = await supabase
      .from('admin_users')
      .select('id')
      .eq('can_manage_users', true);

    const managerIds = (managers ?? []).map((r) => r.id);
    if (managerIds.length === 1 && managerIds[0] === targetId) {
      return NextResponse.json(
        { error: 'Er moet minstens één beheerder met rechten voor gebruikersbeheer overblijven.' },
        { status: 400 }
      );
    }
  }

  const opt = (v: string | undefined) => (v === undefined ? undefined : (v.trim() || null));
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.email !== undefined) updates.email = parsed.data.email;
  if (parsed.data.full_name !== undefined) updates.full_name = opt(parsed.data.full_name);
  if (parsed.data.first_name !== undefined) updates.first_name = opt(parsed.data.first_name);
  if (parsed.data.gender !== undefined) updates.gender = parsed.data.gender || null;
  if (parsed.data.birth_date !== undefined) updates.birth_date = opt(parsed.data.birth_date) || null;
  if (parsed.data.birth_place !== undefined) updates.birth_place = opt(parsed.data.birth_place);
  if (parsed.data.nationality !== undefined) updates.nationality = opt(parsed.data.nationality);
  if (parsed.data.rijksregisternummer !== undefined) updates.rijksregisternummer = opt(parsed.data.rijksregisternummer);
  if (parsed.data.address !== undefined) updates.address = opt(parsed.data.address);
  if (parsed.data.postal_code !== undefined) updates.postal_code = opt(parsed.data.postal_code);
  if (parsed.data.city !== undefined) updates.city = opt(parsed.data.city);
  if (parsed.data.country !== undefined) updates.country = opt(parsed.data.country);
  if (parsed.data.gsm !== undefined) updates.gsm = opt(parsed.data.gsm);
  if (parsed.data.phone !== undefined) updates.phone = opt(parsed.data.phone);
  if (parsed.data.iban !== undefined) updates.iban = opt(parsed.data.iban);
  if (parsed.data.bic !== undefined) updates.bic = opt(parsed.data.bic);
  if (parsed.data.bank_name !== undefined) updates.bank_name = opt(parsed.data.bank_name);
  if (parsed.data.account_holder !== undefined) updates.account_holder = opt(parsed.data.account_holder);
  if (parsed.data.emergency_contact_name !== undefined) updates.emergency_contact_name = opt(parsed.data.emergency_contact_name);
  if (parsed.data.emergency_contact_relation !== undefined) updates.emergency_contact_relation = opt(parsed.data.emergency_contact_relation);
  if (parsed.data.emergency_contact_phone !== undefined) updates.emergency_contact_phone = opt(parsed.data.emergency_contact_phone);
  if (parsed.data.can_leads !== undefined) updates.can_leads = parsed.data.can_leads;
  if (parsed.data.can_customers !== undefined) updates.can_customers = parsed.data.can_customers;
  if (parsed.data.can_analytics !== undefined) updates.can_analytics = parsed.data.can_analytics;
  if (parsed.data.can_manage_users !== undefined) updates.can_manage_users = parsed.data.can_manage_users;

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'Geen velden om bij te werken' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('admin_users')
    .update(updates)
    .eq('id', targetId)
    .select(userSelectFull)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    console.error('Error updating admin user:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken rechten' }, { status: 500 });
  }

  const d = data as Record<string, unknown>;
  return NextResponse.json({
    id: data.id,
    email: data.email,
    full_name: data.full_name ?? null,
    first_name: d.first_name ?? null,
    gender: d.gender ?? null,
    birth_date: d.birth_date ?? null,
    birth_place: d.birth_place ?? null,
    nationality: d.nationality ?? null,
    rijksregisternummer: data.rijksregisternummer ?? null,
    address: data.address ?? null,
    postal_code: d.postal_code ?? null,
    city: d.city ?? null,
    country: d.country ?? null,
    gsm: data.gsm ?? null,
    phone: d.phone ?? null,
    iban: d.iban ?? null,
    bic: d.bic ?? null,
    bank_name: d.bank_name ?? null,
    account_holder: d.account_holder ?? null,
    emergency_contact_name: d.emergency_contact_name ?? null,
    emergency_contact_relation: d.emergency_contact_relation ?? null,
    emergency_contact_phone: d.emergency_contact_phone ?? null,
    can_leads: Boolean(data.can_leads),
    can_customers: Boolean(data.can_customers),
    can_analytics: Boolean(data.can_analytics),
    can_manage_users: Boolean(data.can_manage_users),
  });
}
