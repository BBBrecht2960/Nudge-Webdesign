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

    const isValid = await authenticateAdmin(email, password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Ongeldige inloggegevens' },
        { status: 401 }
      );
    }

    // Create session (simple approach - in production, use proper session management)
    const sessionToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    
    const cookieStore = await cookies();
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}
