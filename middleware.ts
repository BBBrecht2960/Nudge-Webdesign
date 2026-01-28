import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Note: verifySessionToken requires database access which may not work in Edge Runtime
// For now, we use basic cookie check in middleware and full validation in API routes

/**
 * Middleware for protecting admin routes with secure session validation
 * 
 * Note: Next.js 16 shows a deprecation warning about middleware file convention.
 * This is a known warning - the middleware functionality still works correctly.
 * The warning is about future Next.js versions potentially using a different approach.
 * 
 * For now, this middleware is the correct way to protect admin routes.
 * The warning can be safely ignored as it doesn't affect functionality.
 */
export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('admin_session');
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin');

  // Allow access to login page and static assets
  if (pathname === '/admin' || pathname === '/admin/login' || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Protect admin routes
  if (isAdminRoute) {
    // Check if session cookie exists
    // Full session validation happens in API routes (not in Edge Runtime)
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    // Note: Full session validation with database check happens in API routes
    // Middleware only checks for cookie presence (Edge Runtime limitation)
  }

  // Add security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Only add CSP in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
    );
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
