'use client';

import { Clock, AlertCircle, TrendingDown, BarChart3, Lock, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

const problems = [
  { icon: Clock, title: 'Tijdverlies', description: 'Manueel werk, Excel en losse tools. Elke dag opnieuw dezelfde handelingen.' },
  { icon: AlertCircle, title: 'Fouten', description: 'Verkeerde gegevens, gemiste afspraken, dubbele invoer. Het kost geld en vertrouwen.' },
  { icon: TrendingDown, title: 'Gemiste omzet', description: 'Online onderbenut. Je weet dat er meer in zit, maar het systeem schaalt niet mee.' },
  { icon: BarChart3, title: 'Geen inzicht', description: 'Geen helder beeld van leads, orders of processen. Beslissen op gevoel.' },
  { icon: Lock, title: 'Geen controle', description: 'Afhankelijk van personen of losse tools. Niet uitbreidbaar wanneer je groeit.' },
  { icon: Scale, title: 'Schaalprobleem', description: 'Groeien lukt niet zonder chaos. Meer klanten of orders betekent meer manueel werk.' },
];

export function ProblemSolution({ className }: { className?: string }) {
  return (
    <section id="problem-solution" className={cn('py-14 md:py-20', className)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="mb-12 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">
            Het is geen websiteprobleem. Het is een systeemprobleem.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Bestaande bedrijven met omzet die vastlopen. Herkenbaar?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {problems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="bg-white p-5 sm:p-6 rounded-lg border border-border text-center hover:border-border transition-colors"
              >
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-3 text-primary mx-auto">
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-base sm:text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-5 sm:p-6 rounded-lg border border-border bg-muted/40 text-center max-w-3xl mx-auto">
          <h3 className="font-semibold text-foreground mb-3 text-lg sm:text-xl">
            Wij verkopen controle, rust en groei, niet alleen een systeem.
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Eén dashboard, geen rompslomp. Binnen 14 dagen je eerste proces live. Met resultaatgarantie: eerste proces live binnen 30 dagen of je betaalt niets.
          </p>
        </div>
      </div>
    </section>
  );
}
