'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { Button } from './Button';

const navLinks = [
  { href: '/diensten', label: 'Diensten' },
  { href: '/pakketten', label: 'Pakketten' },
  { href: '/aanbod', label: 'Bekijk jouw aanbod' },
  { href: '/over-ons', label: 'Over ons' },
  { href: '/proces', label: 'Proces' },
];

export function HomeHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToForm = () => {
    const form = document.getElementById('contact-form');
    if (form) form.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center shrink-0" aria-label="Nudge - Home">
            <Image
              src="/Nudge Webdesign & Marketing logo no background.png"
              alt="Nudge"
              width={120}
              height={40}
              className="object-contain h-9 w-auto max-w-[140px]"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Button
              onClick={scrollToForm}
              className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 rounded-lg px-4 py-2 text-sm font-medium"
            >
              Plan een gesprek
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-foreground hover:bg-muted rounded-lg"
            aria-label={mobileOpen ? 'Menu sluiten' : 'Menu openen'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-white px-4 py-4">
          <nav className="flex flex-col gap-2">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-sm font-medium text-foreground hover:text-primary"
              >
                {label}
              </Link>
            ))}
            <button
              onClick={scrollToForm}
              className="mt-2 w-full py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90"
            >
              Plan een gesprek
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
