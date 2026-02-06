'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const faqs = [
  { question: 'Wat bedoelen jullie met een digitaal systeem?', answer: 'Een geïntegreerd geheel: front-end (wat klanten zien), back-end (logica, data), automatisering en waar nodig koppelingen. Niet alleen een website, maar iets waar je dagelijks op draait: verkoop, processen, overzicht.' },
  { question: 'Hoe lang duurt een project?', answer: 'Van 2 weken tot enkele maanden, afhankelijk van de scope. Na een intake of analyse geven we een concreet tijdsbeeld.' },
  { question: 'Werken jullie met bestaande systemen?', answer: 'Ja. We kunnen bestaande sites of tools migreren of koppelen. Geen lock-in: je data en processen blijven beheersbaar.' },
  { question: 'Wie is de eigenaar van de data?', answer: 'Jij. Klantdata wordt niet gebruikt voor training van AI of andere doeleinden. We bouwen volgens duidelijke afspraken over rechten en toegang.' },
  { question: 'Moet ik onderhoud afnemen?', answer: 'Voor veiligheid en updates raden we onderhoud aan (vanaf €19,99/maand). De exacte invulling stemmen we af op je situatie.' },
  { question: 'Hoe starten we?', answer: 'Met een gesprek: we luisteren naar je situatie en doelen, en geven aan wat mogelijk is. Geen verkooppraatje, wel een heldere diagnose en opties.' },
];

export function FAQ({ className }: { className?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    if (openIndex === index) setOpenIndex(null);
    else {
      setOpenIndex(index);
      track('faq_expanded', { faq_question: faqs[index].question });
    }
  };

  return (
    <section className={cn('py-12 md:py-16', className)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-8">Veelgestelde vragen</h2>
        <div className="space-y-3 max-w-2xl mx-auto">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-border bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(i)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-sm text-foreground">{faq.question}</span>
                <ChevronDown className={cn('w-5 h-5 shrink-0 text-muted-foreground transition-transform', openIndex === i && 'rotate-180')} />
              </button>
              {openIndex === i && (
                <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-border pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
