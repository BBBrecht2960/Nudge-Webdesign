'use client';

import { Button } from './Button';
import { track } from '@/lib/analytics';

export function FinalCTA() {
  const handleCTA = () => {
    track('cta_click', { cta_type: 'primary', cta_text: 'Plan een gesprek', section: 'final_cta', destination: 'contact_form' });
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="final-cta" className="bg-primary text-primary-foreground w-full min-w-0 overflow-hidden border-t border-primary/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full min-w-0 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-6">Klaar voor controle, rust en groei?</h2>
        <p className="text-primary-foreground/90 text-sm sm:text-base mb-6 max-w-lg mx-auto">Jouw eerste proces live in 14 dagen. Gegarandeerd.</p>
        <Button
          onClick={handleCTA}
          size="lg"
          variant="outline"
          className="border-2 border-white text-primary bg-white hover:bg-white/10 hover:text-white hover:border-white font-medium"
        >
          Plan een gesprek
        </Button>
      </div>
    </section>
  );
}
