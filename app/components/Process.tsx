'use client';

import Image from 'next/image';

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
    <section className="py-14 sm:py-20 md:py-28 px-5 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-muted relative overflow-hidden w-full min-w-0">
      {/* Decoratieve elementen */}
      <div className="absolute top-20 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl -ml-36" />
      <div className="absolute bottom-20 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -mr-36" />
      
      <div className="max-w-6xl mx-auto relative z-10 w-full min-w-0">
        <div className="mb-10 sm:mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 leading-tight px-1">
            Hoe het werkt
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-1">
            Van intake tot oplevering in duidelijke stappen
          </p>
        </div>

        <div className="space-y-5 sm:space-y-8">
          {steps.map((step, index) => (
            <div key={index} className={`flex flex-col md:flex-row gap-5 sm:gap-6 items-stretch md:items-center min-w-0 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
              <div className="hidden md:block flex-shrink-0 w-full md:w-1/3 min-w-0">
                <div className="relative h-56 sm:h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized={false}
                  />
                  <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                </div>
              </div>
              <div className="flex-1 bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-border shadow-lg min-w-0 overflow-hidden flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 min-w-0">
                  <span className="md:hidden w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shrink-0" aria-hidden>{index + 1}</span>
                  <h3 className="text-xl sm:text-2xl font-bold break-words">{step.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed break-words">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
