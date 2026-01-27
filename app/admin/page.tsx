'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../components/Button';

const isTestLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_TEST_LOGIN === 'true';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDebug = searchParams.get('debug') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestLoggingIn, setIsTestLoggingIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => {
        if (isDebug) console.log('[Admin Login] session check', res.status, res.ok ? '-> redirect dashboard' : '-> blijf op login');
        if (res.ok) router.replace('/admin/dashboard');
      })
      .catch((e) => {
        if (isDebug) console.log('[Admin Login] session check error', e);
      });
  }, [router, isDebug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (isDebug) console.log('[Admin Login] submit', response.status, data);

      if (!response.ok) {
        setError(data.error || 'Inloggen mislukt');
        return;
      }

      if (isDebug) console.log('[Admin Login] login ok -> redirect /admin/dashboard');
      router.replace('/admin/dashboard');
    } catch (error) {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setError('');
    setIsTestLoggingIn(true);
    try {
      const response = await fetch('/api/auth/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = await response.json();
      if (isDebug) console.log('[Admin Login] test-login', response.status, data);
      if (!response.ok) {
        setError(data.error || 'Test-inloggen mislukt');
        return;
      }
      if (isDebug) console.log('[Admin Login] test-login ok -> redirect /admin/dashboard');
      router.replace('/admin/dashboard');
    } catch {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setIsTestLoggingIn(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-muted via-white to-muted">
      <div className="w-full max-w-md bg-white border-2 border-border rounded-2xl p-8 md:p-10 shadow-2xl">
        {isDebug && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <strong>Debug-modus</strong>: open DevTools (F12) → Console voor logs. Of open{' '}
            <a href="/api/debug/auth" target="_blank" rel="noopener noreferrer" className="underline">
              /api/debug/auth
            </a>{' '}
            voor auth-status.
          </div>
        )}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">Admin Login</h1>
          <p className="text-muted-foreground text-sm">Log in op het admin dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2 text-foreground">
              E-mailadres
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-2 text-foreground">
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-3 text-base font-semibold"
            disabled={isLoading || isTestLoggingIn}
          >
            {isLoading ? 'Inloggen...' : 'Inloggen'}
          </Button>

          {isTestLoginEnabled && (
            <p className="text-center mt-4">
              <button
                type="button"
                onClick={handleTestLogin}
                disabled={isLoading || isTestLoggingIn}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                {isTestLoggingIn ? 'Bezig...' : 'Inloggen als test admin'}
              </button>
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
