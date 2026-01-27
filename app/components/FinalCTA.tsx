'use client';

import { Button } from './Button';
import { posthog } from '@/lib/posthog';

export function FinalCTA() {
  const handleCTA = () => {
    posthog?.capture('cta_click', {
      cta_type: 'primary',
      cta_text: 'Plan een gratis gesprek',
      section: 'final_cta',
      destination: 'contact_form',
    });
    const form = document.getElementById('contact-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="final-cta" className="py-14 sm:py-16 md:py-20 px-5 sm:px-6 lg:px-8 bg-primary text-white w-full min-w-0 overflow-hidden">
      <div className="max-w-3xl mx-auto text-center min-w-0">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-5 sm:mb-6 leading-tight break-words px-1">
          Klaar om te starten?
        </h2>
        <Button
          onClick={handleCTA}
          size="lg"
          variant="outline"
          className="text-sm sm:text-base px-6 sm:px-8 py-4 min-h-[48px] sm:py-5 border-white text-primary bg-white hover:text-white hover:bg-white/10 shadow-lg hover:shadow-xl font-semibold w-full sm:w-auto max-w-full touch-manipulation"
        >
          Plan een gratis gesprek
        </Button>
      </div>
    </section>
  );
}
