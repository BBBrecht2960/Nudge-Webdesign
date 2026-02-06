import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminPermission } from '@/lib/api-security';

/**
 * GET: Lijst van gebruikers die als "toegewezen aan" / verkoper kunnen worden gekozen.
 * Vereist can_leads (niet can_manage_users), voor callagents en lead-detail dropdown.
 * Returns alleen email en full_name.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminPermission('can_leads');
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
      .select('id, email, full_name')
      .order('email', { ascending: true });

    if (error) throw error;

    const users = (data || []).map((row) => ({
      id: row.id,
      email: row.email,
      full_name: row.full_name ?? null,
    }));

    return NextResponse.json(users);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Fout bij ophalen gebruikers';
    console.error('GET assignable-users error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
