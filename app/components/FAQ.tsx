'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const faqs = [
  { question: 'Wat bedoelen jullie met een digitaal systeem?', answer: 'Jouw groeiplan in softwarevorm: slimme bedrijfsflows die tijd vrijmaken en je bedrijf schaalbaar maken. Eén dashboard, rust in je hoofd, geen rompslomp. We bouwen en implementeren alles voor jou en trainen je team mee.' },
  { question: 'Hoe snel is mijn eerste proces live?', answer: 'Binnen 14 dagen je eerste proces live. We hebben een resultaatgarantie: binnen 30 dagen je eerste proces live of je betaalt niets.' },
  { question: 'Werken jullie met bestaande systemen?', answer: 'Ja. We kunnen bestaande sites of tools migreren of koppelen. Geen lock-in: je data en processen blijven beheersbaar.' },
  { question: 'Wie is de eigenaar van de data?', answer: 'Jij. Klantdata wordt niet gebruikt voor training van AI of andere doeleinden. We bouwen volgens duidelijke afspraken over rechten en toegang.' },
  { question: 'Moet ik onderhoud afnemen?', answer: 'Onderhoud is geen verplichting, wel een aanrader: we positioneren het als veiligheidsplan en groeiplan, niet als kostenpost. Met NudgeCare blijft je systeem up-to-date, veilig en klaar voor groei. Bij elk project bieden we 3 maanden onderhoud gratis; daarna kun je doorgaan met Basis (€85/maand), Pro (€150/maand) of Elite (€250/maand), passend bij je pakket.' },
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
            <div key={i} className="rounded-lg border border-border bg-white overflow-hidden">
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
