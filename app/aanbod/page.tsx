import type { Metadata } from 'next';
import { AanbodClient } from './AanbodClient';

export const metadata: Metadata = {
  title: 'Bekijk jouw aanbod - Nudge',
  description: 'Doe de korte check en ontvang je aanbevolen pakket met prijs en bonussen. Live in 14 dagen. Gegarandeerd.',
};

export default function AanbodPage() {
  return (
    <main className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Bekijk jouw aanbod</h1>
        <p className="text-lg text-muted-foreground">
          Beantwoord 3 korte vragen. We geven je direct een passend pakket met prijs en bonussen.
        </p>
      </div>
      <AanbodClient />
    </main>
  );
}
