'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '../components/Button';
import { LogOut, LayoutDashboard, Users, BarChart3, Menu, X, Briefcase, Moon, Sun, Plus, UserCog, Phone } from 'lucide-react';

type AdminPermissions = {
  can_leads: boolean;
  can_customers: boolean;
  can_analytics: boolean;
  can_manage_users: boolean;
};

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDebug = searchParams.get('debug') === '1';
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);

  // Sync dark mode preference from localStorage after mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('adminDarkMode') === 'true';
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    queueMicrotask(() => setDarkMode(savedDarkMode));
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('adminDarkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
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
        const data = await res.json();
        if (data.permissions) setPermissions(data.permissions);
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
              <div className="flex-shrink-0 flex items-center min-w-0">
                <Image
                  src="/Nudge Webdesign & Marketing logo no background.png"
                  loading="eager"
                  alt="Nudge Webdesign"
                  width={140}
                  height={44}
                  className="object-contain shrink-0 h-10 max-w-[160px]"
                  style={{ background: 'transparent', width: 'auto', height: 'auto' }}
                />
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
                  Overzicht
                </a>
                {permissions?.can_leads && (
                  <>
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
                      href="/admin/leads?preset=new"
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap ${
                        pathname === '/admin/leads' && searchParams.get('preset') === 'new'
                          ? 'border-primary text-foreground'
                          : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                      }`}
                    >
                      <Phone className="w-4 h-4 mr-2 shrink-0" />
                      Bellen
                    </Link>
                  </>
                )}
                {permissions?.can_customers && (
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
                )}
                {permissions?.can_analytics && (
                  <a
                    href="/admin/analytics"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap ${
                      pathname === '/admin/analytics'
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 mr-2 shrink-0" />
                    Analyses
                  </a>
                )}
                {permissions?.can_manage_users && (
                  <Link
                    href="/admin/users"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap ${
                      pathname === '/admin/users'
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                    }`}
                  >
                    <UserCog className="w-4 h-4 mr-2 shrink-0" />
                    Gebruikers
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Dark mode toggle"
                title={darkMode ? 'Licht modus' : 'Donkere modus'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
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
                aria-label="Menu openen/sluiten"
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
                  Overzicht
                </div>
              </a>
              {permissions?.can_leads && (
                <>
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
                    href="/admin/leads?preset=new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Bellen (nieuwe leads)
                    </div>
                  </Link>
                  <Link
                    href="/admin/leads/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 pl-10 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <div className="flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      Lead toevoegen
                    </div>
                  </Link>
                </>
              )}
              {permissions?.can_customers && (
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
              )}
              {permissions?.can_analytics && (
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
                    Analyses
                  </div>
                </a>
              )}
              {permissions?.can_manage_users && (
                <Link
                  href="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded-md text-sm font-medium ${
                    pathname === '/admin/users'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center">
                    <UserCog className="w-4 h-4 mr-2" />
                    Gebruikers
                  </div>
                </Link>
              )}
              <div className="pt-2 border-t border-border mt-2 space-y-2">
                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {darkMode ? (
                    <>
                      <Sun className="w-4 h-4 mr-2" />
                      Licht modus
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 mr-2" />
                      Donkere modus
                    </>
                  )}
                </button>
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
