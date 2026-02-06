import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Proces - Nudge',
  description: 'De Nudge-methode: analyse en diagnose, digitale blueprint, bouw en iteratie, uitbreiden wanneer nodig. Transparant en met jouw goedkeuring.',
};

export default function ProcesPage() {
  const steps = [
    {
      week: 'Stap 1',
      title: 'Analyse & diagnose',
      description: 'We brengen je situatie, pijnpunten en doelen in kaart. Geen verkooppraatje, wel een heldere diagnose. Daarna weten we allebei waar we staan.',
    },
    {
      week: 'Stap 2',
      title: 'Digitale blueprint',
      description: 'Een concreet plan: wat we bouwen, in welke volgorde, en hoe het aansluit op je bedrijfsvoering. Je krijgt inzicht voordat we een regel code schrijven.',
    },
    {
      week: 'Stap 3',
      title: 'Bouw & iteratie',
      description: 'We bouwen stap voor stap. Jij geeft goedkeuring op vaste checkpoints. Tussentijdse aanpassingen zijn mogelijk. Geen verrassingen bij oplevering.',
    },
    {
      week: 'Stap 4',
      title: 'Oplevering & uitbreiding',
      description: 'Testen, oplevering en eventueel training. Daarna: onderhoud en uitbreiding wanneer je groeit of nieuwe behoeften hebt. Het systeem is modulair.',
    },
  ];

  return (
    <main className="min-h-screen py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto w-full min-w-0">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-3 sm:mb-4 break-words px-2">
          Ons proces
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground text-center mb-8 sm:mb-12 break-words px-2 max-w-2xl mx-auto">
          De Nudge-methode: van diagnose tot systeem dat meegroeit. Transparant, met jouw goedkeuring op elk moment.
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
                  <span className="text-xs sm:text-sm font-semibold text-primary bg-muted px-2 sm:px-3 py-1 rounded w-fit">
                    {step.week}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-semibold break-words">{step.title}</h3>
                </div>
                <p className="text-muted-foreground text-base sm:text-lg break-words">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">Waarom dit proces?</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="min-w-0">
              <h3 className="font-semibold mb-2 break-words">Transparantie</h3>
              <p className="text-muted-foreground break-words">
                Je weet altijd waar we staan en wat de volgende stap is.
              </p>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold mb-2 break-words">Controle</h3>
              <p className="text-muted-foreground break-words">
                Jij geeft goedkeuring op elk checkpoint. Geen oplevering zonder jouw akkoord.
              </p>
            </div>
            <div className="min-w-0 sm:col-span-2 md:col-span-1">
              <h3 className="font-semibold mb-2 break-words">Uitbreidbaar</h3>
              <p className="text-muted-foreground break-words">
                Later uitbreiden kan. Geen lock-in; we bouwen modulair.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words px-2">Klaar voor een gesprek?</h2>
          <p className="text-muted-foreground mb-4 sm:mb-6 break-words px-2">
            Plan een intake of analyse. We luisteren naar je situatie en geven aan wat mogelijk is.
          </p>
          <a
            href="/contact"
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-base sm:text-lg font-semibold break-words"
          >
            Plan een gesprek
          </a>
        </div>
      </div>
    </main>
  );
}
