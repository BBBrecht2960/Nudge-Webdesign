import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/debug/auth
 * Alleen in development. Geeft auth-state zonder secrets te loggen.
 * Gebruik: open /api/debug/auth in een tab tijdens een debug-sessie.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Alleen in development' }, { status: 404 });
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session');

  return NextResponse.json(
    {
      cookiePresent: !!sessionCookie?.value,
      cookieLength: sessionCookie?.value?.length ?? 0,
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      nodeEnv: process.env.NODE_ENV,
      hint: 'Als cookiePresent true is maar je komt toch op login: controleer of /api/auth/session 200 geeft (zelfde domein/cookies).',
    },
    { status: 200 }
  );
}
