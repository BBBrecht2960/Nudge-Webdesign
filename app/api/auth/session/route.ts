import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/auth/session
 * Controleert of er een geldige admin-sessie is (cookie aanwezig).
 * Gebruikt door de admin layout; document.cookie kan httpOnly niet lezen.
 */
export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  if (!session?.value) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
