import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, checkRateLimit, getClientIP, getRateLimitHeaders, isValidUUID } from './security';

/**
 * Middleware to protect admin API routes
 * Returns null if authorized, or a NextResponse with error if not
 */
export async function requireAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const auth = await requireAuth();
  
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: 'Niet geautoriseerd. Log in om toegang te krijgen.' },
      { status: 401 }
    );
  }

  return null; // Authorized
}

/**
 * Validate UUID parameter
 */
export function validateUUID(id: string, paramName: string = 'id'): NextResponse | null {
  if (!isValidUUID(id)) {
    return NextResponse.json(
      { error: `Ongeldige ${paramName} formaat` },
      { status: 400 }
    );
  }
  return null;
}

/**
 * Rate limit check for admin routes
 */
export function checkAdminRateLimit(
  request: NextRequest,
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): NextResponse | null {
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(`admin:${identifier}:${clientIP}`, maxRequests, windowMs);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Te veel aanvragen. Probeer het later opnieuw.' },
      { 
        status: 429,
        headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime),
      }
    );
  }

  return null;
}

/**
 * Combined security check for admin routes
 */
export async function secureAdminRoute(
  request: NextRequest,
  params?: { id?: string },
  rateLimitConfig?: { maxRequests?: number; windowMs?: number }
): Promise<NextResponse | null> {
  // Check authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  // Check rate limiting
  const rateLimitError = checkAdminRateLimit(
    request,
    request.nextUrl.pathname,
    rateLimitConfig?.maxRequests,
    rateLimitConfig?.windowMs
  );
  if (rateLimitError) return rateLimitError;

  // Validate UUID if provided
  if (params?.id) {
    const uuidError = validateUUID(params.id);
    if (uuidError) return uuidError;
  }

  return null; // All checks passed
}
