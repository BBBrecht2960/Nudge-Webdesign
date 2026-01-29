import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Over Ons - Nudge Webdesign',
  description: 'Leer meer over ons team en onze aanpak. Wij bouwen websites die écht werken voor Belgische KMO\'s.',
};

export default function OverOnsPage() {
  return (
    <main className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
          Over Ons
        </h1>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2>Wie zijn wij?</h2>
            <p>
              Nudge Webdesign is een webdesign agentschap, gespecialiseerd in het bouwen van moderne websites en webshops voor Belgische KMO&apos;s. Onze missie is om websites te maken die niet alleen mooi zijn, maar ook écht resultaat opleveren.
            </p>
          </section>

          <section>
            <h2>Onze Aanpak</h2>
            <p>
              We geloven in transparantie, kwaliteit en resultaat. Elke website die we bouwen is:
            </p>
            <ul>
              <li><strong>Modern en snel:</strong> Gebouwd met de nieuwste technologieën voor optimale prestaties</li>
              <li><strong>Conversie-gericht:</strong> Geoptimaliseerd om leads te genereren en verkoop te stimuleren</li>
              <li><strong>Onderhoudbaar:</strong> Onderhoud inbegrepen zodat je website altijd up-to-date blijft</li>
              <li><strong>Schalbaar:</strong> Klaar om mee te groeien met uw bedrijf</li>
            </ul>
          </section>

          <section>
            <h2>Waarom kiezen voor ons?</h2>
            <ul>
              <li>Transparante prijzen en processen</li>
              <li>Tussentijdse checkpoints met uw goedkeuring</li>
              <li>Levering gegarandeerd binnen 2 weken tot 2 maanden</li>
              <li>Onderhoud inbegrepen voor blijvende kwaliteit</li>
              <li>Optionele marketing- en groeidiensten</li>
            </ul>
          </section>

          <section>
            <h2>Onze Focus</h2>
            <p>
              We werken voornamelijk met Belgische KMO&apos;s (5-30 medewerkers) en B2B service bedrijven. We begrijpen de uitdagingen waar deze bedrijven voor staan: weinig tijd, beperkte kennis van marketing en technologie, en de behoefte aan resultaat.
            </p>
            <p>
              Daarom bieden we niet alleen websites, maar complete oplossingen met onderhoud en groei inbegrepen.
            </p>
          </section>

          <section className="bg-accent p-6 rounded-lg">
            <h2>Klaar om te starten?</h2>
            <p>
              Neem contact met ons op voor een gratis gesprek. We bespreken uw behoeften en geven direct advies op maat.
            </p>
            <a
              href="/contact"
              className="inline-block mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Plan een gratis gesprek
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
