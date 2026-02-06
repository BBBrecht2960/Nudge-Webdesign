import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Diensten - Nudge',
  description: 'Digitale systemen op maat: van presentatie tot volledig bedrijfssysteem. Websites, webshops, webapps, koppelingen en onderhoud.',
};

export default function DienstenPage() {
  return (
    <main className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Waar we in uitblinken
        </h1>
        <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Geen losse producten, maar bouwstenen van een systeem waar je op kunt draaien. Capabilities gekoppeld aan jouw problemen.
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
            <h2 className="text-2xl font-bold mb-4">Onderhoud & support</h2>
            <p className="text-muted-foreground mb-4">
              Je systeem blijft veilig en actueel. Updates, backups, beveiliging en support op een afgesproken niveau.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Updates en backups</li>
              <li>• Beveiliging en monitoring</li>
              <li>• Duidelijke supportafspraken</li>
            </ul>
            <a href="/pakketten" className="inline-block mt-4 text-primary hover:underline">
              Bekijk plannen →
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
