'use client';

import Image from 'next/image';
import { Button } from './Button';
import { track } from '@/lib/analytics';

export function Hero() {
  const handlePrimaryCTA = () => {
    track('cta_click', {
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
    track('cta_click', {
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
    <section className="snap-start relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Achtergrond foto */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Nudge Webdesign Background Purple.jpg"
          alt="Nudge Webdesign - Moderne webdesign"
          fill
          className="object-cover"
          priority
          quality={90}
          sizes="100vw"
        />
        {/* Subtle overlay voor betere tekst leesbaarheid */}
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/30 via-foreground/20 to-primary/40" />
      </div>

      {/* Content - links uitgelijnd, verticaal gecentreerd en compacter */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 min-w-0">
        <div className="max-w-2xl min-w-0">
          {/* Badge */}
          <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mb-4 sm:mb-5 text-xs font-medium text-white border border-white/30 shadow-lg">
            <span>Hasselt, België</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-5 leading-[1.2] tracking-tight drop-shadow-lg break-words min-w-0">
            Je website kost geld, maar brengt niets op.
            <span className="block mt-2 sm:mt-3 text-primary-foreground bg-primary/90 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg break-words w-fit">Wij maken dat anders.</span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg text-white/95 mb-6 sm:mb-7 leading-relaxed max-w-xl drop-shadow-md min-w-0 break-words">
            Websites die écht voor jou werken. Op maat gemaakt, zonder onnodige kosten. Slimme technologie die je business laat groeien.
          </p>

          {/* Concrete cijfers */}
          <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-7 text-sm min-w-0">
            <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/30 shrink-0">
              <span className="font-bold text-white text-xs sm:text-sm">Vanaf €399</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/30 shrink-0">
              <span className="font-bold text-white text-xs sm:text-sm">2-8 weken</span>
              <span className="text-white/90 ml-1 text-xs sm:text-sm">oplevering</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto min-w-0">
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
