'use client';

import Image from 'next/image';
import { Button } from './Button';
import { posthog } from '@/lib/posthog';

export function Hero() {
  const handlePrimaryCTA = () => {
    posthog?.capture('cta_click', {
      cta_type: 'primary',
      cta_text: 'Plan een gratis gesprek',
      section: 'hero',
      destination: 'contact_form',
    });
    const form = document.getElementById('contact-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSecondaryCTA = () => {
    posthog?.capture('cta_click', {
      cta_type: 'secondary',
      cta_text: 'Bekijk pakketten',
      section: 'hero',
      destination: 'packages',
    });
    const packages = document.getElementById('packages');
    if (packages) {
      packages.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center overflow-hidden">
      {/* Achtergrond foto */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Nudge Webdesign Background Purple.jpg"
          alt="Almost 3000 BV - Moderne webdesign"
          fill
          className="object-cover"
          priority
          quality={90}
          sizes="100vw"
        />
        {/* Subtle overlay voor betere tekst leesbaarheid */}
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/30 via-foreground/20 to-primary/40" />
      </div>

      {/* Content - niet perfect gecentreerd */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-32 min-w-0">
        <div className="max-w-3xl min-w-0">
          {/* Badge */}
          <div className="inline-flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 px-3 sm:px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6 sm:mb-8 text-xs sm:text-sm font-medium text-white border border-white/30 shadow-lg max-w-full">
            <span>📍 Hasselt, België</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.15] tracking-tight drop-shadow-lg break-words min-w-0">
            Je website kost geld, maar brengt niets op.
            <span className="block mt-3 w-fit max-w-full text-primary-foreground bg-primary/90 px-3 sm:px-4 py-2 rounded-lg break-words">Wij maken dat anders.</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-white/95 mb-8 sm:mb-10 leading-relaxed max-w-2xl drop-shadow-md min-w-0 break-words">
            Moderne websites die leads genereren. Binnen 2 weken tot 2 maanden online.
          </p>

          {/* Concrete cijfers */}
          <div className="flex flex-wrap gap-3 sm:gap-6 mb-8 sm:mb-10 text-sm min-w-0">
            <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-lg border border-white/30 shrink-0">
              <span className="font-bold text-white text-sm sm:text-base">Vanaf €300</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-lg border border-white/30 shrink-0">
              <span className="font-bold text-white text-sm sm:text-base">2-8 weken</span>
              <span className="text-white/90 ml-1">oplevering</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto min-w-0">
            <Button
              onClick={handlePrimaryCTA}
              size="lg"
              className="text-sm sm:text-base px-6 sm:px-8 py-4 min-h-[48px] sm:py-5 bg-white text-primary hover:bg-white/95 shadow-xl hover:shadow-2xl transition-all rounded-lg font-semibold w-full sm:w-auto"
            >
              Plan een gratis gesprek
            </Button>
            <button
              onClick={handleSecondaryCTA}
              className="text-sm sm:text-base text-white hover:text-white/80 underline underline-offset-4 transition-colors font-medium text-left sm:text-center backdrop-blur-sm px-5 py-3.5 min-h-[48px] rounded-lg hover:bg-white/10 w-full sm:w-auto touch-manipulation"
            >
              Bekijk pakketten →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
