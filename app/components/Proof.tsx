'use client';

import { ShoppingCart, Briefcase, UtensilsCrossed, Store, Handshake, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

const sectors = [
  { name: 'Retail & E-commerce', icon: ShoppingCart },
  { name: 'Professionele Diensten', icon: Briefcase },
  { name: 'Horeca & Toerisme', icon: UtensilsCrossed },
  { name: 'Lokale Diensten', icon: Store },
  { name: 'B2B Services', icon: Handshake },
  { name: 'Startups & scale-ups', icon: Rocket },
];

const guarantees = [
  'Levering gegarandeerd binnen 2 weken tot 2 maanden',
  'Tussentijdse checkpoints met je goedkeuring',
  'Oplevering zoals afgesproken, of je geld terug',
];

export function Proof({ className }: { className?: string }) {
  return (
    <section className={cn('py-12 md:py-16', className)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="mb-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Voor wie we bouwen</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">Bestaande bedrijven met omzet die willen schalen zonder chaos of afhankelijkheid</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {sectors.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="rounded-xl border border-border p-4 bg-white hover:border-primary/40 transition-colors text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary">
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <p className="font-medium text-sm text-foreground">{s.name}</p>
              </div>
            );
          })}
        </div>
        <div className="rounded-xl border border-border border-l-4 border-l-primary p-6 bg-muted/30 text-center max-w-2xl mx-auto">
          <h3 className="font-semibold text-foreground mb-4">Onze garanties</h3>
          <ul className="space-y-3 text-left max-w-md mx-auto">
            {guarantees.map((g, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </span>
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
