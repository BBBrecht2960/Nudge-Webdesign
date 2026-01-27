'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '../components/Button';
import { LogOut, LayoutDashboard, Users, BarChart3 } from 'lucide-react';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDebug = searchParams.get('debug') === '1';
  const [isLoading, setIsLoading] = useState(true);

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
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a
                  href="/admin/dashboard"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === '/admin/dashboard'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </a>
                <a
                  href="/admin/leads"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === '/admin/leads'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                  }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Leads
                </a>
                <a
                  href="/admin/analytics"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === '/admin/analytics'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Uitloggen
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
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
