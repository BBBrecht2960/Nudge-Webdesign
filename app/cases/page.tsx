import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cases - Nudge',
  description: 'Voorbeelden en cases van digitale systemen die we hebben gebouwd voor bedrijven.',
};

export default function CasesPage() {
  return (
    <main className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Cases
        </h1>
        <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Binnenkort vind je hier voorbeelden van systemen die we hebben gebouwd, altijd in overleg met de klant over wat we wel en niet delen.
        </p>

        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-lg text-muted-foreground mb-6">
            We werken aan casebeschrijvingen die tonen hoe we te werk gaan, zonder gevoelige bedrijfsinformatie. Binnenkort meer.
          </p>
          <p className="text-muted-foreground mb-8">
            intussen:{' '}
            <a href="/proces" className="text-primary hover:underline">
              ons proces
            </a>
            {' · '}
            <a href="/diensten" className="text-primary hover:underline">
              diensten
            </a>
            {' · '}
            <a href="/contact" className="text-primary hover:underline">
              plan een gesprek
            </a>
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
