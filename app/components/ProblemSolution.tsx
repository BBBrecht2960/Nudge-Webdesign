'use client';

import { Clock, AlertCircle, TrendingDown, BarChart3, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const problems = [
  { icon: Clock, title: 'Tijdverlies', description: 'Manueel werk, Excel en losse tools. Elke dag opnieuw dezelfde handelingen.' },
  { icon: AlertCircle, title: 'Fouten', description: 'Verkeerde gegevens, gemiste afspraken, dubbele invoer. Het kost geld en vertrouwen.' },
  { icon: TrendingDown, title: 'Gemiste omzet', description: 'Online onderbenut. Je weet dat er meer in zit, maar het systeem schaalt niet mee.' },
  { icon: BarChart3, title: 'Geen inzicht', description: 'Geen helder beeld van leads, orders of processen. Beslissen op gevoel.' },
  { icon: Lock, title: 'Geen controle', description: 'Afhankelijk van personen of losse tools. Niet uitbreidbaar wanneer je groeit.' },
];

export function ProblemSolution({ className }: { className?: string }) {
  return (
    <section id="problem-solution" className={cn('py-12 md:py-16', className)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="mb-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Het is geen websiteprobleem. Het is een systeemprobleem.</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">Bestaande bedrijven met omzet die vastlopen. Herkenbaar?</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {problems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white p-5 rounded-xl border border-border hover:border-primary/40 transition-colors text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 text-primary mx-auto">
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-8 p-5 rounded-xl border border-border border-l-4 border-l-primary bg-muted/30 text-center max-w-3xl mx-auto">
          <h3 className="font-semibold text-foreground mb-2">Nudge bouwt digitale systemen op maat waar bedrijven op kunnen draaien.</h3>
          <p className="text-sm text-muted-foreground">
            Front-end, back-end, logica, automatisatie en data. Extern (klanten, leads, verkoop) en intern (processen, overzicht, schaal). Modulair, uitbreidbaar, geen lock-in.
          </p>
        </div>
      </div>
    </section>
  );
}
