import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth';
import { createAdminSession } from '@/lib/auth-helpers';
import { checkRateLimit, getClientIP, getRateLimitHeaders, isValidEmail, sanitizeInput } from '@/lib/security';
import * as z from 'zod';

// Strict validation schema
const loginSchema = z.object({
  email: z.string().min(1).max(255).refine(isValidEmail, { message: 'Ongeldig e-mailadres' }),
  password: z.string().min(1).max(100),
  rememberMe: z.boolean().optional().default(false),
}).strict();

export async function POST(request: NextRequest) {
  // Rate limiting: 10 attempts per 15 minutes per IP
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(`login:${clientIP}`, 10, 15 * 60 * 1000);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Te veel inlogpogingen. Probeer het later opnieuw.' },
      { 
        status: 429,
        headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime),
      }
    );
  }

  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Ongeldige JSON data' },
        { status: 400 }
      );
    }

    // Validate with Zod (strict mode)
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Ongeldige invoer', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = validationResult.data;

    // Sanitize email input
    const normalizedEmail = sanitizeInput(email.toLowerCase().trim());

    // Authenticate
    const isValid = await authenticateAdmin(normalizedEmail, password);

    if (!isValid) {
      // Don't reveal whether email exists (security best practice)
      return NextResponse.json(
        { error: 'Ongeldige inloggegevens. Controleer je e-mail en wachtwoord.' },
        { 
          status: 401,
          headers: getRateLimitHeaders(rateLimit.remaining - 1, rateLimit.resetTime),
        }
      );
    }

    let sessionToken: string | null = null;
    let cookieOptions: { httpOnly: boolean; secure: boolean; sameSite: 'lax'; maxAge: number; path: string } | null = null;
    try {
      const session = await createAdminSession(normalizedEmail, rememberMe);
      sessionToken = session.token;
      cookieOptions = session.cookieOptions;
    } catch (sessionError) {
      console.error('[Login] Session creation error:', sessionError);
    }

    console.log('[Login] Succesvol ingelogd:', normalizedEmail, rememberMe ? '(onthouden)' : '');
    const response = NextResponse.json(
      { success: true },
      { headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime) }
    );
    if (sessionToken && cookieOptions) {
      response.cookies.set('admin_session', sessionToken, cookieOptions);
    }
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}
