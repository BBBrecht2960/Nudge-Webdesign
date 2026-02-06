'use client';

import { Button } from './Button';
import { track } from '@/lib/analytics';

export function Hero() {
  const handlePrimaryCTA = () => {
    track('cta_click', { cta_type: 'primary', cta_text: 'Plan een gesprek', section: 'hero', destination: 'contact_form' });
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSecondaryCTA = () => {
    track('cta_click', { cta_type: 'secondary', cta_text: 'Bekijk aanpak', section: 'hero', destination: 'packages' });
    document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-section relative bg-white min-h-screen flex flex-col overflow-hidden">
      <div className="relative flex-1 flex flex-col items-center justify-center text-center px-5 sm:px-8 pt-12 pb-14 md:pt-16 md:pb-20 max-w-5xl mx-auto w-full">
        <p className="hero-in hero-in-1 text-primary/90 text-base sm:text-lg mb-3 font-medium">
          Nudge, Hasselt, België
        </p>

        <div className="hero-in hero-in-2 relative w-full flex flex-col items-center min-h-[180px] md:min-h-[260px]">
          {/* Portrait achter de titel: op mobile gecentreerd, op desktop rechts */}
          <img
            src="/Brecht_Just_Russel_Foto-removebg-preview%20%282%29.png"
            alt="Brecht, Nudge"
            className="hero-portrait-fade absolute bottom-0 right-0 md:right-0 xl:right-8 w-auto max-h-[320px] md:max-h-none h-[300px] md:h-[300px] xl:h-[360px] object-contain object-bottom pointer-events-none z-0 opacity-95"
          />
          <h1 className="font-display leading-[1.06] tracking-tight w-full max-w-4xl mx-auto px-1 relative z-10 text-center">
            <span className="hero-fill block text-[48px] sm:text-[68px] md:text-[96px] font-extrabold">
              Digitale systemen
            </span>
            <span className="hero-outline hero-outline-gradient block mt-0.5 sm:mt-1 text-[48px] sm:text-[68px] md:text-[96px] font-extrabold">
              op maat
            </span>
          </h1>
        </div>

        <p className="hero-in hero-in-3 text-muted-foreground text-base sm:text-lg mt-6 mb-8 max-w-xl mx-auto text-center">
          Waar bedrijven op kunnen draaien. Niet alleen een website, maar een systeem dat meewerkt.
        </p>
        <div className="hero-in hero-in-4 flex flex-col sm:flex-row gap-3 justify-center items-center w-full max-w-sm sm:max-w-none mx-auto">
          <Button
            onClick={handlePrimaryCTA}
            size="lg"
            className="btn-hero bg-primary text-primary-foreground hover:bg-primary/90 border-0 rounded-lg px-6 py-4 text-sm font-medium w-full max-w-[280px] sm:max-w-none sm:w-auto min-w-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Plan een gesprek
          </Button>
          <Button
            onClick={handleSecondaryCTA}
            variant="outline"
            size="lg"
            className="btn-hero border-2 border-primary text-primary bg-white hover:bg-primary/5 rounded-lg px-6 py-4 text-sm font-medium w-full max-w-[280px] sm:max-w-none sm:w-auto min-w-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Bekijk aanpak
          </Button>
        </div>
      </div>
    </section>
  );
}
