import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Diensten - Nudge',
  description: 'Jouw groeiplan in softwarevorm: slimme bedrijfsflows die tijd vrijmaken en je bedrijf schaalbaar maken. Controle, rust en groei, live in 14 dagen.',
};

export default function DienstenPage() {
  return (
    <main className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Waar we in uitblinken
        </h1>
        <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Controle, rust en groei: slimme bedrijfsflows die tijd vrijmaken en je bedrijf schaalbaar maken. Eén dashboard, geen rompslomp.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Websites & presentatie</h2>
            <p className="text-muted-foreground mb-4">
              Van eenvoudige one-pagers tot uitgebreide bedrijfsites. Snel, helder, onderhoudbaar. Vaak het startpunt voor meer.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Responsive, SEO, formulieren</li>
              <li>• Multi-language waar nodig</li>
              <li>• Klaar om uit te breiden</li>
            </ul>
            <a href="/pakketten" className="inline-block mt-4 text-primary hover:underline">
              Bekijk mogelijkheden →
            </a>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Webshops & verkoop</h2>
            <p className="text-muted-foreground mb-4">
              Verkoopsystemen die schalen: catalogus, betalingen, verzending, klantaccounts. Geïntegreerd met je processen waar mogelijk.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Productcatalogus en bestelbeheer</li>
              <li>• Betalings- en verzendintegraties</li>
              <li>• Rapportage en overzicht</li>
            </ul>
            <a href="/contact" className="inline-block mt-4 text-primary hover:underline">
              Plan een gesprek →
            </a>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Webapps & bedrijfssystemen</h2>
            <p className="text-muted-foreground mb-4">
              Op maat gebouwde applicaties voor processen, data en automatisering. Geen lock-in; modulair en uitbreidbaar.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Custom logica en workflows</li>
              <li>• API- en systeemkoppelingen</li>
              <li>• Data-eigenaarschap bij jou</li>
            </ul>
            <a href="/contact" className="inline-block mt-4 text-primary hover:underline">
              Plan een gesprek →
            </a>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Onderhoud & support (NudgeCare)</h2>
            <p className="text-muted-foreground mb-4">
              Je systeem draait op een digitale motor. Zonder onderhoud begint het te haperen. NudgeCare houdt het operationeel, veilig en klaar voor groei, zonder verrassingen. 3 maanden gratis bij elk project.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Bugfixing, updates en hosting & monitoring</li>
              <li>• Kleine aanpassingen (max. 1u/maand), support binnen 48u</li>
              <li>• Drie niveaus: Basis (€85/m), Pro (€150/m), Elite (€250/m)</li>
            </ul>
            <a href="/#onderhoud" className="inline-block mt-4 text-primary hover:underline">
              Bekijk onderhoudsniveaus →
            </a>
          </div>
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold mb-4">Groei en zichtbaarheid</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Optioneel: SEO, content, advertenties of rapportage. Altijd in dienst van het systeem dat je wilt laten werken, niet als losse hype.
          </p>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Plan een gesprek
          </a>
        </div>
      </div>
    </main>
  );
}
