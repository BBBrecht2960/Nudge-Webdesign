import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for protecting admin routes
 * 
 * Note: Next.js 16 shows a deprecation warning about middleware file convention.
 * This is a known warning - the middleware functionality still works correctly.
 * The warning is about future Next.js versions potentially using a different approach.
 * 
 * For now, this middleware is the correct way to protect admin routes.
 * The warning can be safely ignored as it doesn't affect functionality.
 */
export async function middleware(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin');

  // Allow access to login page
  if (pathname === '/admin' || pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Protect admin routes - redirect to login if no session
  if (isAdminRoute && !session) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
