import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// GET: Fetch all admin users
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    if (!sessionCookie) {
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

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('admin_users')
      .select('email')
      .order('email', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ users: data || [] });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Fout bij ophalen gebruikers';
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
