import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Over ons - Nudge',
  description: 'Nudge bouwt digitale systemen op maat waar bedrijven op kunnen draaien. Geen agency, geen templatefabriek. Wel een partner die begrijpt hoe bedrijven werken.',
};

export default function OverOnsPage() {
  return (
    <main className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
          Over Nudge
        </h1>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2>Wat we doen</h2>
            <p>
              Nudge bouwt digitale systemen op maat waar bedrijven op kunnen draaien. Niet alleen een website, maar een systeem dat meewerkt: front-end, back-end, logica, automatisatie en data. Extern (klanten, leads, verkoop) en intern (processen, overzicht, schaal). Modulair en uitbreidbaar, zonder lock-in.
            </p>
          </section>

          <section>
            <h2>Onze aanpak</h2>
            <p>
              We geloven in heldere diagnose, een concreet plan en bouwen in stappen met jouw goedkeuring. Geen verkooppraatje; we willen begrijpen waar je vastloopt en wat je wilt bereiken.
            </p>
            <ul>
              <li><strong>Analyse & diagnose:</strong> Situatie en doelen in kaart, geen verrassingen</li>
              <li><strong>Digitale blueprint:</strong> Wat we bouwen en in welke volgorde</li>
              <li><strong>Bouw & iteratie:</strong> Stap voor stap, met checkpoints</li>
              <li><strong>Uitbreiden wanneer nodig:</strong> Modulair, geen alles-of-niets</li>
            </ul>
          </section>

          <section>
            <h2>Waarom Nudge</h2>
            <ul>
              <li>Transparante processen en afspraken</li>
              <li>Tussentijdse goedkeuring op vaste momenten</li>
              <li>Levering zoals afgesproken</li>
              <li>Jij blijft eigenaar van je data</li>
              <li>Onderhoud en uitbreiding mogelijk zonder herbouw</li>
            </ul>
          </section>

          <section>
            <h2>Voor wie we bouwen</h2>
            <p>
              Bestaande bedrijven met omzet en echte producten of diensten, die vastlopen door manueel werk, Excel, losse tools of gebrek aan overzicht. Die willen groeien maar niet kunnen schalen. We richten ons niet op eenmalige “websitejes” of branches waar we geen meerwaarde bieden.
            </p>
          </section>

          <section className="bg-muted/50 p-6 rounded-lg">
            <h2>Klaar voor een gesprek?</h2>
            <p>
              Plan een intake of analyse. We bespreken je situatie en geven aan wat mogelijk is.
            </p>
            <a
              href="/contact"
              className="inline-block mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Plan een gesprek
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
