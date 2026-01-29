import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, getAdminPermissions } from '@/lib/security';

/**
 * GET /api/auth/session
 * Verifieert admin-sessie (token tegen DB) en retourneert email + permissions voor de UI.
 */
export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  if (!session?.value) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const verified = await verifySessionToken(session.value);
  if (!verified.valid || !verified.email) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const permissions = await getAdminPermissions(verified.email);
  if (!permissions) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    email: verified.email,
    permissions,
  });
}
