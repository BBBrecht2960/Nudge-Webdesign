'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { posthog } from '@/lib/posthog';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [utmData, setUtmData] = useState<Record<string, string>>({});

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

  // Capture UTM parameters
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
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Combine first_name and last_name into name for API
      const fullName = `${data.first_name} ${data.last_name}`.trim();

      posthog?.capture('form_submitted', {
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

      if (data.email) {
        posthog?.identify(data.email, {
          name: fullName,
        });
      }

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
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Bedankt!</h3>
        <p className="text-muted-foreground">
          We hebben je aanvraag ontvangen en nemen zo snel mogelijk contact met je op.
        </p>
      </div>
    );
  }

  return (
    <form
      id="contact-form"
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card border-2 border-border rounded-2xl p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 shadow-xl w-full max-w-2xl mx-auto"
    >
      <div className="text-center space-y-1 sm:space-y-2 mb-4 sm:mb-5">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Neem contact op</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Vul je gegevens in en we nemen zo snel mogelijk contact met je op</p>
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
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm sm:text-base"
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
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm sm:text-base"
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
            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm sm:text-base"
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
            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm sm:text-base"
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
            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none text-sm sm:text-base"
            placeholder="Vertel ons meer over je project of vraag..."
          />
        </div>

        <div className="bg-muted/50 rounded-xl p-3 sm:p-4">
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
        {isSubmitting ? 'Verzenden...' : 'Verstuur aanvraag'}
      </Button>
    </form>
  );
}
