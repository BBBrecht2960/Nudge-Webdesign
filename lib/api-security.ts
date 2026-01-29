import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAuthWithPermissions, checkRateLimit, getClientIP, getRateLimitHeaders, isValidUUID, type AdminPermissionKey, type AdminPermissions } from './security';

/** Result of requireAdminPermission: either an error response or auth data. */
export type RequireAdminPermissionResult =
  | { error: NextResponse }
  | { email: string; permissions: AdminPermissions };

/**
 * Require admin session and a specific permission.
 * Returns { error: NextResponse } on 401/403, or { email, permissions } on success.
 */
export async function requireAdminPermission(
  permission: AdminPermissionKey
): Promise<RequireAdminPermissionResult> {
  const auth = await requireAuthWithPermissions();
  if (!auth.authenticated || !auth.email) {
    return {
      error: NextResponse.json(
        { error: 'Niet geautoriseerd. Log in om toegang te krijgen.' },
        { status: 401 }
      ),
    };
  }
  if (!auth.permissions) {
    return {
      error: NextResponse.json(
        { error: 'Geen toegang tot dit onderdeel.' },
        { status: 403 }
      ),
    };
  }
  if (!auth.permissions[permission]) {
    return {
      error: NextResponse.json(
        { error: 'Geen toegang tot dit onderdeel.' },
        { status: 403 }
      ),
    };
  }
  return { email: auth.email, permissions: auth.permissions };
}

/**
 * Middleware to protect admin API routes
 * Returns null if authorized, or a NextResponse with error if not
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by middleware signature
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
 * Combined security check for admin routes.
 * If permission is provided, also checks that the admin has that permission.
 */
export async function secureAdminRoute(
  request: NextRequest,
  params?: { id?: string },
  rateLimitConfig?: { maxRequests?: number; windowMs?: number },
  permission?: AdminPermissionKey
): Promise<NextResponse | null> {
  if (permission) {
    const auth = await requireAuthWithPermissions();
    if (!auth.authenticated || !auth.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd. Log in om toegang te krijgen.' },
        { status: 401 }
      );
    }
    if (!auth.permissions || !auth.permissions[permission]) {
      return NextResponse.json(
        { error: 'Geen toegang tot dit onderdeel.' },
        { status: 403 }
      );
    }
  } else {
    const authError = await requireAdminAuth(request);
    if (authError) return authError;
  }

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

