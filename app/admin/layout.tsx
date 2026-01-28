'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '../components/Button';
import { LogOut, LayoutDashboard, Users, BarChart3, Menu, X, Briefcase } from 'lucide-react';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDebug = searchParams.get('debug') === '1';
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // httpOnly cookie is niet leesbaar via document.cookie → check via API
    const checkSession = async () => {
      if (pathname === '/admin') {
        if (isDebug) console.log('[Admin Layout] pathname=/admin -> skip session check');
        setIsLoading(false);
        return;
      }
      if (isDebug) console.log('[Admin Layout] pathname=', pathname, '-> check /api/auth/session');
      try {
        const res = await fetch('/api/auth/session');
        if (isDebug) console.log('[Admin Layout] session', res.status, res.ok ? 'ok' : '-> redirect /admin');
        if (!res.ok) {
          router.replace('/admin');
          return;
        }
      } catch (e) {
        if (isDebug) console.log('[Admin Layout] session error', e, '-> redirect /admin');
        router.replace('/admin');
        return;
      }
      setIsLoading(false);
    };
    checkSession();
  }, [router, pathname, isDebug]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin');
  };

  if (pathname === '/admin') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center min-w-0">
              <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 min-w-0">
                <Image
                  src="/Nudge websdesign & marketing Hasselt logo.png"
                  alt="Nudge Webdesign"
                  width={40}
                  height={40}
                  className="object-contain shrink-0"
                  style={{ background: 'transparent' }}
                />
                <h1 className="text-lg sm:text-xl font-bold break-words hidden sm:block">Admin Dashboard</h1>
                <h1 className="text-base font-bold break-words sm:hidden">Admin</h1>
              </div>
              <div className="hidden lg:ml-6 lg:flex lg:space-x-4 xl:space-x-8">
                <a
                  href="/admin/dashboard"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap ${
                    pathname === '/admin/dashboard'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2 shrink-0" />
                  Dashboard
                </a>
                <Link
                  href="/admin/leads"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap ${
                    pathname === '/admin/leads' || pathname?.startsWith('/admin/leads/')
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                  }`}
                >
                  <Users className="w-4 h-4 mr-2 shrink-0" />
                  Leads
                </Link>
                <Link
                  href="/admin/customers"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap ${
                    pathname === '/admin/customers' || pathname?.startsWith('/admin/customers/')
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                  }`}
                >
                  <Briefcase className="w-4 h-4 mr-2 shrink-0" />
                  Klanten
                </Link>
                <a
                  href="/admin/analytics"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap ${
                    pathname === '/admin/analytics'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2 shrink-0" />
                  Analytics
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                className="hidden lg:inline-flex"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Uitloggen
              </Button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-border py-4 space-y-2">
              <a
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-md text-sm font-medium ${
                  pathname === '/admin/dashboard'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </div>
              </a>
              <Link
                href="/admin/leads"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-md text-sm font-medium ${
                  pathname === '/admin/leads' || pathname?.startsWith('/admin/leads/')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Leads
                </div>
              </Link>
              <Link
                href="/admin/customers"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-md text-sm font-medium ${
                  pathname === '/admin/customers' || pathname?.startsWith('/admin/customers/')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Klanten
                </div>
              </Link>
              <a
                href="/admin/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-md text-sm font-medium ${
                  pathname === '/admin/analytics'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </div>
              </a>
              <div className="pt-2 border-t border-border mt-2">
                <Button 
                  onClick={handleLogout} 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Uitloggen
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
      <main className="w-full min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted flex items-center justify-center">
          <p className="text-muted-foreground">Laden...</p>
        </div>
      }
    >
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
