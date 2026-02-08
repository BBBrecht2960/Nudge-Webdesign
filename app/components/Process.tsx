'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

const steps = [
  { title: 'Analyse & diagnose', description: 'We brengen je situatie, pijnpunten en doelen in kaart. Geen verkooppraatje, wel een heldere diagnose.', image: '/Intake:kennismaking gesprek Nudge Webdesign & Marketing.jpg' },
  { title: 'Digitale blueprint', description: 'Een concreet plan: wat we bouwen, in welke volgorde, en hoe het aansluit op je bedrijfsvoering.', image: '/Design 2 Nudge Webdesign Hasselt Limburg.jpg' },
  { title: 'Bouw & iteratie', description: 'We bouwen stap voor stap. Jij geeft goedkeuring op checkpoints. Tussentijds bijsturen kan.', image: '/programmeren ontwikkelen Nudge Webdesign Hasselt.jpg' },
  { title: 'Uitbreiden wanneer nodig', description: 'Het systeem is modulair. Groei of nieuwe behoeften? We breiden uit zonder alles over te doen.', image: '/oplevering handshake Nudge Webdesign & Marketing Hasselt.jpg' },
];

export function Process({ className }: { className?: string }) {
  return (
    <section id="process" className={cn('py-12 md:py-16', className)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="mb-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">De Nudge-methode</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">Van diagnose tot systeem dat meegroeit</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="rounded-lg border border-border overflow-hidden bg-white">
              <div className="relative h-40 w-full">
                <Image src={step.image} alt={step.title} fill className="object-cover" sizes="(max-width: 1024px) 50vw, 25vw" />
                <div className="absolute top-3 left-3 w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center font-semibold text-xs">
                  {i + 1}
                </div>
              </div>
              <div className="p-4 text-center">
                <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
