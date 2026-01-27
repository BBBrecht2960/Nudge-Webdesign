'use client';

import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../components/Button';
import { posthog } from '@/lib/posthog';
import { useRouter } from 'next/navigation';

export default function ThanksPage() {
  const router = useRouter();

  useEffect(() => {
    posthog?.capture('thank_you_page_view');
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Bedankt voor je aanvraag!
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          We hebben je aanvraag ontvangen en nemen zo snel mogelijk contact met je op. Meestal reageren we binnen 24 uur.
        </p>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            In de tussentijd kunt u meer lezen over onze diensten en pakketten.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/pakketten')}
              variant="outline"
              size="lg"
            >
              Bekijk pakketten
            </Button>
            <Button
              onClick={() => router.push('/')}
              size="lg"
            >
              Terug naar home
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
