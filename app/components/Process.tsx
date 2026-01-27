'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export function Process() {
  const steps = [
    {
      title: 'Intake',
      description: 'We bespreken je doelen en budget.',
      image: '/Intake:kennismaking gesprek Nudge Webdesign & Marketing.jpg',
    },
    {
      title: 'Ontwerp',
      description: 'Je geeft feedback en goedkeuring.',
      image: '/Design 2 Nudge Webdesign Hasselt Limburg.jpg',
    },
    {
      title: 'Ontwikkeling',
      description: 'We bouwen stap voor stap.',
      image: '/programmeren ontwikkelen Nudge Webdesign Hasselt.jpg',
    },
    {
      title: 'Oplevering',
      description: 'Testen en live gaan.',
      image: '/oplevering handshake Nudge Webdesign & Marketing Hasselt.jpg',
    },
  ];

  return (
    <section className="snap-start min-h-[70vh] flex items-center py-14 sm:py-20 md:py-24 px-5 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-muted relative overflow-hidden w-full min-w-0">
      {/* Decoratieve elementen */}
      <div className="absolute top-20 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl -ml-36" />
      <div className="absolute bottom-20 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -mr-36" />
      
      <div className="max-w-7xl mx-auto relative z-10 w-full min-w-0">
        <div className="mb-12 md:mb-16 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight px-1">
            Hoe het werkt
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-1">
            Van intake tot oplevering in duidelijke stappen
          </p>
        </div>

        {/* Desktop: Modern grid layout */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 transform -translate-y-1/2 z-0" />
          
          {steps.map((step, index) => (
            <div key={index} className="relative z-10 group">
              {/* Step number badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-lg border-4 border-white group-hover:scale-110 transition-transform duration-300">
                  {index + 1}
                </div>
              </div>

              {/* Card */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-border group-hover:border-primary/50 mt-6">
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Arrow between steps (except last) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-20">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile/Tablet: Vertical layout */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-border">
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="relative h-48 sm:h-64 sm:w-1/2 overflow-hidden">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-6 flex flex-col justify-center">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
