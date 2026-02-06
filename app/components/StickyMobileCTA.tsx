'use client';

import { useEffect, useState } from 'react';
import { Button } from './Button';
import { Phone } from 'lucide-react';
import { track } from '@/lib/analytics';

export function StickyMobileCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => {
      const mainEl = document.querySelector('main');
      if (!mainEl) return;
      const scrollTop = mainEl.scrollTop || 0;
      if (scrollTop < 200) {
        setShow(false);
        return;
      }
      const form = document.getElementById('contact-form');
      if (form) {
        const rect = form.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setShow(false);
          return;
        }
      }
      const cta = document.getElementById('final-cta');
      if (cta) {
        const rect = cta.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setShow(false);
          return;
        }
      }
      setShow(true);
    };
    check();
    const mainEl = document.querySelector('main');
    if (!mainEl) return;
    mainEl.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    return () => {
      mainEl.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  const phoneNumber = process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+32494299633';

  const handleClick = () => {
    track('sticky_cta_click', { cta_type: 'primary', cta_text: 'Plan een gratis gesprek', section: 'sticky_mobile_bar' });
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePhoneClick = () => track('phone_click', { source: 'sticky_mobile_bar' });

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-border/60 transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
        <Button onClick={handleClick} className="flex-1 text-sm font-medium" size="lg">
          Plan gratis gesprek
        </Button>
        <a
          href={`tel:${phoneNumber}`}
          onClick={handlePhoneClick}
          className="p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          aria-label="Bel ons"
        >
          <Phone className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}
