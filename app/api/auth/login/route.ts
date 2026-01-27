import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail en wachtwoord zijn verplicht' },
        { status: 400 }
      );
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();

    const isValid = await authenticateAdmin(normalizedEmail, password);

    if (!isValid) {
      console.error('[Login] Authenticatie mislukt voor:', normalizedEmail);
      return NextResponse.json(
        { error: 'Ongeldige inloggegevens. Controleer je e-mail en wachtwoord.' },
        { status: 401 }
      );
    }

    // Create session (simple approach - in production, use proper session management)
    const sessionToken = Buffer.from(`${normalizedEmail}:${Date.now()}`).toString('base64');
    
    const cookieStore = await cookies();
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log('[Login] Succesvol ingelogd:', normalizedEmail);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}
