import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Diensten - Nudge Webdesign',
  description: 'Onze diensten: websites, webshops, webapps, AI-integraties, onderhoud en marketing. Alles wat u nodig heeft voor online succes.',
};

export default function DienstenPage() {
  return (
    <main className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Onze Diensten
        </h1>
        <p className="text-xl text-muted-foreground text-center mb-12">
          Van eenvoudige websites tot complexe webapplicaties. Alles wat u nodig heeft voor online succes.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Website Ontwikkeling</h2>
            <p className="text-muted-foreground mb-4">
              Moderne, snelle websites gebouwd met Next.js. Van eenvoudige one-pagers tot uitgebreide KMO-websites met alle functionaliteiten die u nodig heeft.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Responsive design (mobiel & desktop)</li>
              <li>• SEO-optimalisatie</li>
              <li>• Contactformulieren</li>
              <li>• Blog functionaliteit</li>
              <li>• Multi-language support</li>
            </ul>
            <a href="/pakketten" className="inline-block mt-4 text-primary hover:underline">
              Bekijk pakketten →
            </a>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Webshop Ontwikkeling</h2>
            <p className="text-muted-foreground mb-4">
              Professionele webshops die verkopen. Van eenvoudige shops tot complexe e-commerce oplossingen met geavanceerde functionaliteiten.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Productcatalogus</li>
              <li>• Betalingsintegratie</li>
              <li>• Verzendopties</li>
              <li>• Klantaccounts</li>
              <li>• Bestelbeheer</li>
            </ul>
            <a href="/pakketten" className="inline-block mt-4 text-primary hover:underline">
              Bekijk pakketten →
            </a>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Webapp Ontwikkeling</h2>
            <p className="text-muted-foreground mb-4">
              Custom webapplicaties voor specifieke bedrijfsprocessen. Van boekingssystemen tot volledige bedrijfssoftware.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Custom functionaliteiten</li>
              <li>• API- en AI-integraties</li>
              <li>• Database oplossingen</li>
              <li>• Automatisering</li>
              <li>• Schaalbaarheid</li>
            </ul>
            <a href="/contact" className="inline-block mt-4 text-primary hover:underline">
              Neem contact op →
            </a>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Onderhoud & Support</h2>
            <p className="text-muted-foreground mb-4">
              Onderhoud inbegrepen. Updates, backups, beveiliging en support.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Regelmatige updates</li>
              <li>• Automatische backups</li>
              <li>• Beveiliging & monitoring</li>
              <li>• Email & telefonische support</li>
              <li>• Performance monitoring</li>
            </ul>
            <a href="/pakketten" className="inline-block mt-4 text-primary hover:underline">
              Bekijk plannen →
            </a>
          </div>
        </div>

        <div className="bg-accent border border-border rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Marketing & Groei</h2>
          <p className="text-muted-foreground mb-6">
            Optionele marketing- en groeidiensten om uw website te laten groeien. SEO, content, Google Ads en meer.
          </p>
          <ul className="grid md:grid-cols-3 gap-4 text-left mb-6">
            <li>• SEO-optimalisatie</li>
            <li>• Content creatie</li>
            <li>• Google Ads beheer</li>
            <li>• Social media</li>
            <li>• Analytics & rapportage</li>
            <li>• Conversie-optimalisatie</li>
          </ul>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Vraag een offerte aan
          </a>
        </div>
      </div>
    </main>
  );
}
