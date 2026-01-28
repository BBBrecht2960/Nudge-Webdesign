import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ons Proces - Nudge Webdesign',
  description: 'Hoe we samenwerken: transparant en in stappen. Van intake tot oplevering in 2 weken tot 2 maanden.',
};

export default function ProcesPage() {
  const steps = [
    {
      week: 'Week 1',
      title: 'Intake gesprek',
      description: 'We bespreken uw doelen, wensen en budget. U krijgt direct advies op maat. We stellen samen een plan op en bespreken de verwachtingen.',
    },
    {
      week: 'Week 2-3',
      title: 'Ontwerp & goedkeuring',
      description: 'We maken een ontwerpvoorstel op basis van uw wensen en onze expertise. U geeft feedback en goedkeuring voordat we starten met bouwen. Tussentijdse aanpassingen zijn mogelijk.',
    },
    {
      week: 'Week 3-6',
      title: 'Ontwikkeling',
      description: 'We bouwen uw website stap voor stap. U ziet tussentijds de voortgang en kunt bijsturen waar nodig. We houden u op de hoogte van de voortgang.',
    },
    {
      week: 'Week 6-8',
      title: 'Testen & oplevering',
      description: 'Alles wordt grondig getest op verschillende apparaten en browsers. U krijgt training en uw website gaat live. We zorgen voor een soepele overgang.',
    },
    {
      week: 'Week 8+',
      title: 'Launch & groei',
      description: 'Uw site staat online. Met onderhoud en optionele marketing blijven we zorgen voor groei. We monitoren de prestaties en optimaliseren waar nodig.',
    },
  ];

  return (
    <main className="min-h-screen py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto w-full min-w-0">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-3 sm:mb-4 break-words px-2">
          Ons Proces
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground text-center mb-8 sm:mb-12 break-words px-2">
          Transparant en in stappen. Van intake tot oplevering in 2 weken tot 2 maanden, met tussentijdse checkpoints waar u goedkeuring geeft.
        </p>

        <div className="space-y-6 sm:space-y-8 mb-8 sm:mb-12">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-4 sm:gap-6 min-w-0">
              <div className="flex-shrink-0 flex justify-center sm:justify-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl sm:text-2xl">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1 bg-card p-4 sm:p-6 lg:p-8 rounded-lg border border-border min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-primary bg-accent px-2 sm:px-3 py-1 rounded w-fit">
                    {step.week}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-semibold break-words">{step.title}</h3>
                </div>
                <p className="text-muted-foreground text-base sm:text-lg break-words">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-accent border border-border rounded-lg p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">Waarom dit proces?</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="min-w-0">
              <h3 className="font-semibold mb-2 break-words">Transparantie</h3>
              <p className="text-muted-foreground break-words">
                U weet altijd waar we staan en wat de volgende stap is. Geen verrassingen.
              </p>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold mb-2 break-words">Controle</h3>
              <p className="text-muted-foreground break-words">
                U geeft goedkeuring op elk checkpoint. Uw feedback is cruciaal.
              </p>
            </div>
            <div className="min-w-0 sm:col-span-2 md:col-span-1">
              <h3 className="font-semibold mb-2 break-words">Flexibiliteit</h3>
              <p className="text-muted-foreground break-words">
                Tussentijdse aanpassingen zijn mogelijk. We werken samen aan het beste resultaat.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words px-2">Klaar om te starten?</h2>
          <p className="text-muted-foreground mb-4 sm:mb-6 break-words px-2">
            Plan een gratis gesprek en ontdek hoe we samen kunnen werken.
          </p>
          <a
            href="/contact"
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-base sm:text-lg font-semibold break-words"
          >
            Plan een gratis gesprek
          </a>
        </div>
      </div>
    </main>
  );
}
