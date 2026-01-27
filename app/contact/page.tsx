import type { Metadata } from 'next';
import { LeadForm } from '../components/LeadForm';

export const metadata: Metadata = {
  title: 'Contact - Almost 3000 BV',
  description: 'Neem contact met ons op voor een gratis gesprek over uw website of webshop project.',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Neem contact met ons op
          </h1>
          <p className="text-xl text-muted-foreground">
            Vul het formulier in en we nemen zo snel mogelijk contact met u op. Meestal reageren we binnen 24 uur.
          </p>
        </div>

        <LeadForm />
      </div>
    </main>
  );
}
