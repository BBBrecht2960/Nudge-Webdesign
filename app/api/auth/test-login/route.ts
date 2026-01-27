import { NextRequest, NextResponse } from 'next/server';
import * as z from 'zod';
import { authenticateAdmin } from '@/lib/auth';
import { cookies } from 'next/headers';

const emptyBodySchema = z.object({}).strict();

/**
 * POST /api/auth/test-login
 * Logt in als test admin. Alleen beschikbaar als ENABLE_TEST_LOGIN=true of NODE_ENV=development.
 * Geen body; gebruikt TEST_ADMIN_EMAIL en TEST_ADMIN_PASSWORD uit env (server-side).
 */
export async function POST(request: NextRequest) {
  const isTestLoginAllowed =
    process.env.NODE_ENV === 'development' || process.env.ENABLE_TEST_LOGIN === 'true';

  if (!isTestLoginAllowed) {
    return NextResponse.json({ error: 'Niet beschikbaar' }, { status: 403 });
  }

  try {
    const raw = await request.json().catch(() => ({}));
    emptyBodySchema.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Test admin niet geconfigureerd. Zet TEST_ADMIN_EMAIL en TEST_ADMIN_PASSWORD in .env.local.' },
      { status: 500 }
    );
  }

  const isValid = await authenticateAdmin(email, password);

  if (!isValid) {
    return NextResponse.json(
      { error: 'Test admin niet gevonden of wachtwoord ongeldig. Run: npm run create-test-admin' },
      { status: 401 }
    );
  }

  const sessionToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
  const cookieStore = await cookies();
  cookieStore.set('admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ success: true });
}
