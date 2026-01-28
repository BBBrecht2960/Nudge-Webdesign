import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cases - Nudge Webdesign',
  description: 'Bekijk onze projecten en case studies. Websites en webshops die we hebben gebouwd voor Belgische KMO\'s.',
};

export default function CasesPage() {
  return (
    <main className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Cases & Projecten
        </h1>
        <p className="text-xl text-muted-foreground text-center mb-12">
          Binnenkort beschikbaar: case studies van onze projecten.
        </p>

        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-lg text-muted-foreground mb-6">
            We zijn momenteel bezig met het verzamelen van case studies van onze projecten. 
            Binnenkort vindt u hier voorbeelden van websites en webshops die we hebben gebouwd.
          </p>
          <p className="text-muted-foreground mb-8">
            In de tussentijd kunt u meer lezen over onze{' '}
            <a href="/pakketten" className="text-primary hover:underline">
              pakketten
            </a>{' '}
            en{' '}
            <a href="/proces" className="text-primary hover:underline">
              proces
            </a>.
          </p>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Neem contact op
          </a>
        </div>
      </div>
    </main>
  );
}
