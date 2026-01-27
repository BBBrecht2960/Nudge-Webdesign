'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../components/Button';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDebug = searchParams.get('debug') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load saved credentials on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('admin_email');
      const savedPassword = localStorage.getItem('admin_password');
      const savedRememberMe = localStorage.getItem('admin_remember') === 'true';
      
      if (savedEmail) {
        setEmail(savedEmail);
      }
      if (savedPassword && savedRememberMe) {
        setPassword(savedPassword);
        setRememberMe(true);
      }
    }
  }, []);

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
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (isDebug) console.log('[Admin Login] submit', response.status, data);

      if (!response.ok) {
        setError(data.error || 'Inloggen mislukt');
        return;
      }

      // Save credentials if remember me is checked
      if (rememberMe && typeof window !== 'undefined') {
        localStorage.setItem('admin_email', email);
        localStorage.setItem('admin_password', password);
        localStorage.setItem('admin_remember', 'true');
      } else if (typeof window !== 'undefined') {
        // Clear saved credentials if remember me is unchecked
        localStorage.removeItem('admin_email');
        localStorage.removeItem('admin_password');
        localStorage.removeItem('admin_remember');
      }

      if (isDebug) console.log('[Admin Login] login ok -> redirect /admin/dashboard');
      router.replace('/admin/dashboard');
    } catch (error) {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
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
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-foreground cursor-pointer">
              Onthoud mij
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-3 text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading ? 'Inloggen...' : 'Inloggen'}
          </Button>
        </form>
      </div>
    </main>
  );
}
