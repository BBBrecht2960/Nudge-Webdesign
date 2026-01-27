'use client';

import { useEffect, useState } from 'react';
import { Button } from './Button';
import { Phone } from 'lucide-react';
import { posthog } from '@/lib/posthog';

export function StickyMobileCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => {
      const mainEl = document.querySelector('main');
      if (!mainEl) return;
      
      const scrollTop = mainEl.scrollTop || 0;
      const windowHeight = window.innerHeight;
      
      if (scrollTop < 200) {
        setShow(false);
        return;
      }
      
      const form = document.getElementById('contact-form');
      if (form) {
        const rect = form.getBoundingClientRect();
        if (rect.top < windowHeight && rect.bottom > 0) {
          setShow(false);
          return;
        }
      }
      
      const cta = document.getElementById('final-cta');
      if (cta) {
        const rect = cta.getBoundingClientRect();
        if (rect.top < windowHeight && rect.bottom > 0) {
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
      if (mainEl) {
        mainEl.removeEventListener('scroll', check);
      }
      window.removeEventListener('resize', check);
    };
  }, []);

  const phoneNumber = process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+32494299633';

  const handleClick = () => {
    posthog?.capture('sticky_cta_click', {
      cta_type: 'primary',
      cta_text: 'Plan een gratis gesprek',
      section: 'sticky_mobile_bar',
    });
    const form = document.getElementById('contact-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePhoneClick = () => {
    posthog?.capture('phone_click', {
      source: 'sticky_mobile_bar',
    });
  };

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t-2 border-primary shadow-lg transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 p-4 max-w-7xl mx-auto">
        <Button
          onClick={handleClick}
          className="flex-1 text-sm min-h-[48px] font-semibold"
          size="lg"
        >
          Plan gratis gesprek
        </Button>
        <a
          href={`tel:${phoneNumber}`}
          onClick={handlePhoneClick}
          className="p-3.5 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shrink-0"
          aria-label="Bel ons"
        >
          <Phone className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}
