'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { posthog } from '@/lib/posthog';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'Hoe lang duurt het?',
    answer: '2 weken tot 2 maanden, afhankelijk van de scope. Een eenvoudige one-pager kan binnen 2 weken klaar zijn.',
  },
  {
    question: 'Wat kost een website?',
    answer: 'Vanaf €399 voor een Mini Website, €699 voor een Standard Website, en €2.499 voor een Extended Website. Webshops vanaf €1.499, webapps vanaf €4.999.',
  },
  {
    question: 'Moet ik een onderhoudsplan afnemen?',
    answer: 'Onderhoud is inbegrepen vanaf €19,99/maand. Dit omvat updates, backups, beveiliging en support.',
  },
  {
    question: 'Kunnen jullie mijn oude WordPress site overnemen?',
    answer: 'Ja, we kunnen bestaande WordPress-sites migreren naar een moderne oplossing.',
  },
  {
    question: 'Werken jullie met webshops?',
    answer: 'Ja, webshops vanaf €2.000. Van eenvoudig tot complex.',
  },
  {
    question: 'Wat is het verschil tussen de pakketten?',
    answer: 'Mini: 1 pagina. Standard: 5-10 pagina\'s. Extended: onbeperkt aantal pagina\'s met custom design.',
  },
  {
    question: 'Bieden jullie SEO/marketing aan?',
    answer: 'Ja, optioneel vanaf €99/maand voor SEO, content en online marketing.',
  },
  {
    question: 'Kunnen we later uitbreiden?',
    answer: 'Ja, je kunt later eenvoudig uitbreiden met extra pagina\'s of functionaliteiten.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    if (openIndex === index) {
      setOpenIndex(null);
    } else {
      setOpenIndex(index);
      posthog?.capture('faq_expanded', {
        faq_question: faqs[index].question,
      });
    }
  };

  return (
    <section className="snap-start min-h-[70vh] flex items-center py-14 sm:py-16 px-5 sm:px-6 lg:px-8 bg-muted w-full min-w-0 overflow-hidden">
      <div className="max-w-3xl mx-auto min-w-0">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 break-words px-0.5">
            Veelgestelde vragen
          </h2>
        </div>

        <div className="space-y-3 min-w-0">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-border rounded-xl overflow-hidden min-w-0 shadow-sm"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full p-4 min-h-[52px] sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-muted active:bg-muted/80 transition-colors group min-w-0 touch-manipulation"
              >
                <span className="font-medium text-sm sm:text-base pr-2 sm:pr-4 break-words text-left min-w-0">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-transform text-muted-foreground shrink-0',
                    openIndex === index && 'rotate-180'
                  )}
                />
              </button>
              {openIndex === index && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-muted-foreground leading-relaxed text-sm border-t border-border pt-4 break-words min-w-0">
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
