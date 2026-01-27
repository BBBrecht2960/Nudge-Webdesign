import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('admin_session');
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  // Allow access to login page
  if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Protect admin routes
  if (isAdminRoute && !session) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
