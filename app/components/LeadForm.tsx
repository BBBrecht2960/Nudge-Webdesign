'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { track } from '@/lib/analytics';

const AANBOD_TO_PACKAGE: Record<string, string> = {
  'nudge-flow': 'Nudge Flow',
  'nudge-ops': 'Nudge Ops',
  'nudge-os': 'Nudge OS',
};

// Email validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Phone validation
const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\+\-\(\)\.]/g, '');
  if (!/^\d+$/.test(cleaned)) return false;
  return cleaned.length >= 9 && cleaned.length <= 15;
};

const formSchema = z.object({
  first_name: z.string().min(2, 'Voornaam is verplicht'),
  last_name: z.string().min(2, 'Naam is verplicht'),
  email: z.string()
    .min(1, 'E-mailadres is verplicht')
    .refine((val) => validateEmail(val), { message: 'Voer een geldig e-mailadres in' }),
  phone: z.string()
    .min(1, 'Telefoonnummer is verplicht')
    .refine((val) => validatePhone(val), { message: 'Voer een geldig telefoonnummer in' }),
  message: z.string().optional(),
  gdpr_consent: z.boolean().refine((val) => val === true, {
    message: 'U moet akkoord gaan met het privacybeleid',
  }),
});

type FormData = z.infer<typeof formSchema>;

export function LeadForm() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [utmData, setUtmData] = useState<Record<string, string>>({});
  const [packageInterest, setPackageInterest] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gdpr_consent: false,
    },
  });

  // Capture UTM and aanbod (package_interest) from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
        const value = params.get(key);
        if (value) utm[key] = value;
      });
      if (document.referrer) utm.referrer = document.referrer;
      utm.landing_path = window.location.pathname;
      setUtmData(utm);
    }
    const aanbod = searchParams.get('aanbod');
    if (aanbod && AANBOD_TO_PACKAGE[aanbod]) {
      setPackageInterest(AANBOD_TO_PACKAGE[aanbod]);
    }
  }, [searchParams]);

  const onSubmit = async (data: FormData) => {
    
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine first_name and last_name into name for API
      const fullName = `${data.first_name} ${data.last_name}`.trim();


      track('form_submitted', {
        form_type: 'lead_form_simple',
        ...utmData,
      });

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email: data.email,
          phone: data.phone,
          message: data.message || null,
          gdpr_consent: data.gdpr_consent,
          package_interest: packageInterest || undefined,
          ...utmData,
        }),
      });


      if (!response.ok) {
        let errorMessage = 'Er is iets misgegaan. Probeer het opnieuw.';
        try {
          const errorData = await response.json();
          if (errorData?.error) errorMessage = errorData.error;
        } catch {}
        throw new Error(errorMessage);
      }

      await response.json();

      setSubmitSuccess(true);
      setTimeout(() => {
        window.location.href = '/thanks';
      }, 2000);
    } catch (error) {
      console.error('Form submission error:', error);
      alert(error instanceof Error ? error.message : 'Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-white border border-border rounded-lg p-6 sm:p-8 text-center max-w-2xl mx-auto">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Bedankt!</h3>
        <p className="text-sm text-muted-foreground">
          We hebben je bericht ontvangen en nemen contact op voor een gesprek.
        </p>
      </div>
    );
  }

  return (
    <form
      id="contact-form"
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white border border-border rounded-lg p-5 sm:p-6 space-y-4 w-full max-w-2xl mx-auto"
    >
      <div className="text-center space-y-1 mb-5">
        {packageInterest && (
          <p className="text-sm font-medium text-primary mb-2">Jouw aanbeveling: {packageInterest}</p>
        )}
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Plan een gesprek</h2>
        <p className="text-sm text-muted-foreground">Vertel kort waar je vastloopt; we nemen contact op voor een intake of analyse</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium mb-1.5">
              Voornaam *
            </label>
            <input
              {...register('first_name')}
              type="text"
              id="first_name"
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm bg-white"
              placeholder="Jan"
            />
            {errors.first_name && (
              <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.first_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="last_name" className="block text-sm font-medium mb-1.5">
              Naam *
            </label>
            <input
              {...register('last_name')}
              type="text"
              id="last_name"
              className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm bg-white"
              placeholder="Janssen"
            />
            {errors.last_name && (
              <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            E-mailadres *
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm bg-white"
            placeholder="jan@voorbeeld.be"
          />
          {errors.email && (
            <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
            Telefoonnummer *
          </label>
          <input
            {...register('phone')}
            type="tel"
            id="phone"
            className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm bg-white"
            placeholder="0491234567"
          />
          {errors.phone && (
            <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1.5">
            Extra info (optioneel)
          </label>
          <textarea
            {...register('message')}
            id="message"
            rows={3}
            className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none text-sm bg-white"
            placeholder="Kort: je situatie, wat je wil bereiken of waar je vastloopt..."
          />
        </div>

        <div className="bg-muted/40 rounded-lg p-3 sm:p-4 border border-border">
          <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
            <input
              {...register('gdpr_consent')}
              type="checkbox"
              className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-primary focus:outline-none rounded border-2 border-border cursor-pointer"
            />
            <span className="text-xs sm:text-sm leading-relaxed">
              Ik ga akkoord met het{' '}
              <a href="/privacy" className="text-primary hover:underline font-medium" target="_blank">
                privacybeleid
              </a>{' '}
              en geef toestemming voor het verwerken van mijn gegevens. *
            </span>
          </label>
          {errors.gdpr_consent && (
            <p className="text-xs sm:text-sm text-red-600 mt-2">{errors.gdpr_consent.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold"
      >
        {isSubmitting ? 'Verzenden...' : 'Aanvraag versturen'}
      </Button>
    </form>
  );
}
