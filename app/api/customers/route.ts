import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminPermission } from '@/lib/api-security';

// GET: List customers (admin only, requires can_customers)
export async function GET(request: NextRequest) {
  const authResult = await requireAdminPermission('can_customers');
  if ('error' in authResult) return authResult.error;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json([]);
    }
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Fout bij ophalen klanten' }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
