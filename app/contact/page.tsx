import type { Metadata } from 'next';
import { LeadForm } from '../components/LeadForm';

export const metadata: Metadata = {
  title: 'Contact - Nudge',
  description: 'Plan een gesprek voor een intake of analyse. We bespreken je situatie en geven aan wat mogelijk is.',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Plan een gesprek
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            Vertel kort waar je vastloopt of wat je wilt bereiken. We nemen contact op voor een intake of analyse.
          </p>
        </div>

        <LeadForm />
      </div>
    </main>
  );
}
