import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ons Proces - Almost 3000 BV',
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
    <main className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Ons Proces
        </h1>
        <p className="text-xl text-muted-foreground text-center mb-12">
          Transparant en in stappen. Van intake tot oplevering in 2 weken tot 2 maanden, met tussentijdse checkpoints waar u goedkeuring geeft.
        </p>

        <div className="space-y-8 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1 bg-card p-8 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-semibold text-primary bg-accent px-3 py-1 rounded">
                    {step.week}
                  </span>
                  <h3 className="text-2xl font-semibold">{step.title}</h3>
                </div>
                <p className="text-muted-foreground text-lg">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-accent border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Waarom dit proces?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Transparantie</h3>
              <p className="text-muted-foreground">
                U weet altijd waar we staan en wat de volgende stap is. Geen verrassingen.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Controle</h3>
              <p className="text-muted-foreground">
                U geeft goedkeuring op elk checkpoint. Uw feedback is cruciaal.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Flexibiliteit</h3>
              <p className="text-muted-foreground">
                Tussentijdse aanpassingen zijn mogelijk. We werken samen aan het beste resultaat.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Klaar om te starten?</h2>
          <p className="text-muted-foreground mb-6">
            Plan een gratis gesprek en ontdek hoe we samen kunnen werken.
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-lg font-semibold"
          >
            Plan een gratis gesprek
          </a>
        </div>
      </div>
    </main>
  );
}
