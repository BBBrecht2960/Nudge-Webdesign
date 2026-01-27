'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { posthog } from '@/lib/posthog';

// Email validation function
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Phone validation function
const validatePhone = (phone: string): boolean => {
  // Remove all non-digit characters for validation
  const cleaned = phone.replace(/[\s\+\-\(\)\.]/g, '');
  
  // Must contain only digits
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }
  
  // Must be between 9-15 digits (allows Belgian and international formats)
  if (cleaned.length < 9 || cleaned.length > 15) {
    return false;
  }
  
  // Belgian format: starts with 0 (10 digits) or 32 (11 digits)
  // International: any format with 9-15 digits
  return true;
};

const formSchema = z.object({
  name: z.string().min(2, 'Naam is verplicht'),
  email: z.string()
    .min(1, 'E-mailadres is verplicht')
    .refine(
      (val) => validateEmail(val),
      { message: 'Voer een geldig e-mailadres in (bijv. naam@voorbeeld.be)' }
    ),
  phone: z.string()
    .min(1, 'Telefoonnummer is verplicht')
    .refine(
      (val) => validatePhone(val),
      { message: 'Voer een geldig telefoonnummer in (bijv. 0494299633 of +32 494 29 96 33)' }
    ),
  company_name: z.string().optional(),
  company_size: z.string().optional(),
  package_interest: z.string().optional(),
  pain_points: z.array(z.string()).optional(),
  other_pain_point: z.string().optional(),
  current_website_status: z.string().optional(),
  current_website_url: z.string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true; // Optional field
        // Basic URL validation
        try {
          const url = new URL(val.startsWith('http') ? val : `https://${val}`);
          return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'Voer een geldige website URL in (bijv. www.voorbeeld.be of https://voorbeeld.be)' }
    ),
  message: z.string().optional(),
  gdpr_consent: z.boolean().refine((val) => val === true, {
    message: 'U moet akkoord gaan met het privacybeleid',
  }),
});

type FormData = z.infer<typeof formSchema>;

const painPointOptions = [
  'Mijn website trekt geen nieuwe klanten aan',
  'Ik verlies klanten aan concurrenten met betere websites',
  'Mijn website is traag, verouderd of werkt niet goed op mobiel',
  'Ik krijg geen leads of boekingen via mijn website',
  'Ik heb geen tijd om mijn website te onderhouden of te updaten',
  'Ik weet niet hoe ik online gevonden kan worden (SEO)',
  'Mijn website kost geld maar levert niets op',
  'Andere',
];

export function LeadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [utmData, setUtmData] = useState<Record<string, string>>({});
  const [otherPainPointError, setOtherPainPointError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gdpr_consent: false,
      pain_points: [],
    },
  });

  // Capture UTM parameters and referrer
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
        const value = params.get(key);
        if (value) utm[key] = value;
      });

      if (document.referrer) {
        utm.referrer = document.referrer;
      }

      utm.landing_path = window.location.pathname;
      setUtmData(utm);

      // Track form started
      const firstField = document.querySelector('input');
      if (firstField) {
        const handleFocus = () => {
          posthog?.capture('form_started', {
            form_type: 'lead_form',
          });
        };
        firstField.addEventListener('focus', handleFocus, { once: true });
        
        // Cleanup on unmount
        return () => {
          firstField.removeEventListener('focus', handleFocus);
        };
      }
    }
  }, []);

  const onSubmit = async (data: FormData) => {
    // Validate other_pain_point if "Andere" is selected
    if (data.pain_points?.includes('Andere') && (!data.other_pain_point || data.other_pain_point.trim().length < 3)) {
      setOtherPainPointError('Beschrijf uw andere uitdaging (minimaal 3 tekens)');
      return;
    }
    
    setOtherPainPointError('');
    setIsSubmitting(true);

    try {
      posthog?.capture('form_submitted', {
        form_type: 'lead_form',
        package_interest: data.package_interest,
        company_size: data.company_size,
        ...utmData,
      });

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          ...utmData,
        }),
      });

      if (!response.ok) {
        throw new Error('Er is iets misgegaan. Probeer het opnieuw.');
      }

      // Identify user in PostHog
      if (data.email) {
        posthog?.identify(data.email, {
          name: data.name,
          company: data.company_name,
        });
      }

      setSubmitSuccess(true);
      
      // Redirect to thank you page after 2 seconds
      setTimeout(() => {
        window.location.href = '/thanks';
      }, 2000);
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Er is iets misgegaan. Probeer het opnieuw of neem contact op via e-mail.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPainPoints = watch('pain_points') || [];
  const otherPainPoint = watch('other_pain_point') || '';
  const hasOtherSelected = selectedPainPoints.includes('Andere');

  const togglePainPoint = (point: string) => {
    const current = selectedPainPoints;
    if (current.includes(point)) {
      setValue('pain_points', current.filter((p) => p !== point));
      // Clear other_pain_point if "Andere" is deselected
      if (point === 'Andere') {
        setValue('other_pain_point', '');
      }
    } else {
      setValue('pain_points', [...current, point]);
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 md:p-8 text-center min-w-0 overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold mb-2 break-words">Bedankt!</h3>
        <p className="text-muted-foreground text-sm sm:text-base break-words">
          We hebben je aanvraag ontvangen en nemen zo snel mogelijk contact met je op.
        </p>
      </div>
    );
  }

  return (
    <form
      id="contact-form"
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card border-2 border-border rounded-2xl p-5 sm:p-6 md:p-10 space-y-5 sm:space-y-6 shadow-2xl w-full min-w-0 overflow-hidden"
    >
      <div className="mb-4 sm:mb-6 min-w-0">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 break-words">
          Plan een gratis gesprek
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Naam *
          </label>
          <input
            {...register('name')}
            type="text"
            id="name"
            className="w-full min-w-0 px-3 sm:px-4 py-3 min-h-[48px] sm:py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            E-mailadres *
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className="w-full min-w-0 px-3 sm:px-4 py-3 min-h-[48px] sm:py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
        <div className="min-w-0">
          <label htmlFor="phone" className="block text-sm font-medium mb-2">
            Telefoonnummer *
          </label>
          <input
            {...register('phone')}
            type="tel"
            id="phone"
            className="w-full min-w-0 px-3 sm:px-4 py-3 min-h-[48px] sm:py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
          />
          {errors.phone && (
            <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div className="min-w-0">
          <label htmlFor="company_name" className="block text-sm font-medium mb-2">
            Bedrijfsnaam
          </label>
          <input
            {...register('company_name')}
            type="text"
            id="company_name"
            className="w-full min-w-0 px-3 sm:px-4 py-3 min-h-[48px] sm:py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
        <div>
          <label htmlFor="company_size" className="block text-sm font-medium mb-2">
            Bedrijfsgrootte
          </label>
          <select
            {...register('company_size')}
            id="company_size"
            className="w-full min-w-0 px-3 sm:px-4 py-3 min-h-[48px] sm:py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
          >
            <option value="">Selecteer...</option>
            <option value="1-5">1-5 medewerkers</option>
            <option value="5-10">5-10 medewerkers</option>
            <option value="10-30">10-30 medewerkers</option>
            <option value="30+">30+ medewerkers</option>
          </select>
        </div>

        <div>
          <label htmlFor="package_interest" className="block text-sm font-medium mb-2">
            Interesse in
          </label>
          <select
            {...register('package_interest')}
            id="package_interest"
            className="w-full min-w-0 px-3 sm:px-4 py-3 min-h-[48px] sm:py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
          >
            <option value="">Selecteer...</option>
            <option value="Mini Website">Mini Website (vanaf €399)</option>
            <option value="Standard Website">Standard Website (vanaf €699)</option>
            <option value="Extended Website">Extended Website (vanaf €2.499)</option>
            <option value="Basic Webshop">Basic Webshop (vanaf €1.499)</option>
            <option value="Pro Webshop">Pro Webshop (vanaf €3.499)</option>
            <option value="Enterprise Webshop">Enterprise Webshop (vanaf €6.999)</option>
            <option value="Webapp">Webapp (vanaf €4.999)</option>
            <option value="Andere">Andere / Nog niet zeker</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">
          Wat zijn uw belangrijkste uitdagingen? <span className="text-muted-foreground font-normal">(meerdere opties mogelijk)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 mb-4">
          {painPointOptions.map((point) => (
            <label 
              key={point} 
              className={`flex items-start gap-3 cursor-pointer p-3 sm:p-4 rounded-lg border-2 transition-all min-w-0 ${
                selectedPainPoints.includes(point)
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedPainPoints.includes(point)}
                onChange={() => togglePainPoint(point)}
                className="w-5 h-5 mt-0.5 shrink-0 text-primary focus:outline-none rounded border-2 border-border cursor-pointer"
              />
              <span className="text-sm sm:text-base break-words flex-1 leading-relaxed">{point}</span>
            </label>
          ))}
        </div>
        {hasOtherSelected && (
          <div className="mt-3">
            <label htmlFor="other_pain_point" className="block text-sm font-medium mb-2">
              Beschrijf uw andere uitdaging *
            </label>
            <input
              {...register('other_pain_point')}
              type="text"
              id="other_pain_point"
              placeholder="Bijv. Specifieke technische problemen, budgetbeperkingen, etc."
              className={`w-full min-w-0 px-3 sm:px-4 py-3 min-h-[48px] sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base ${
                otherPainPointError ? 'border-red-500' : 'border-border'
              }`}
              onChange={(e) => {
                register('other_pain_point').onChange(e);
                if (otherPainPointError) {
                  setOtherPainPointError('');
                }
              }}
            />
            {otherPainPointError && (
              <p className="text-sm text-red-600 mt-1">{otherPainPointError}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
        <div>
          <label htmlFor="current_website_status" className="block text-sm font-medium mb-2">
            Huidige website situatie
          </label>
          <select
            {...register('current_website_status')}
            id="current_website_status"
            className="w-full min-w-0 px-3 sm:px-4 py-3 min-h-[48px] border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
          >
            <option value="">Selecteer...</option>
            <option value="geen">Geen website</option>
            <option value="verouderd">Verouderde website (WordPress/Shopify)</option>
            <option value="modern">Moderne website, maar geen resultaat</option>
            <option value="andere">Andere situatie</option>
          </select>
        </div>

        <div>
          <label htmlFor="current_website_url" className="block text-sm font-medium mb-2">
            Huidige website link
          </label>
          <input
            {...register('current_website_url')}
            type="url"
            id="current_website_url"
            placeholder="bijv. www.voorbeeld.be of https://voorbeeld.be"
            className="w-full min-w-0 px-3 sm:px-4 py-3 min-h-[48px] sm:py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
          />
          {errors.current_website_url && (
            <p className="text-sm text-red-600 mt-1">{errors.current_website_url.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          Bericht (optioneel)
        </label>
          <textarea
            {...register('message')}
            id="message"
            rows={4}
            className="w-full min-w-0 px-3 sm:px-4 py-3 min-h-[120px] border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-y text-base"
          />
      </div>

      <div>
        <label className="flex items-start gap-2 cursor-pointer min-w-0">
          <input
            {...register('gdpr_consent')}
            type="checkbox"
            className="mt-1 w-4 h-4 shrink-0 focus:outline-none"
          />
          <span className="text-sm break-words">
            Ik ga akkoord met het{' '}
            <a href="/privacy" className="text-primary hover:underline" target="_blank">
              privacybeleid
            </a>{' '}
            en geef toestemming voor het verwerken van mijn gegevens. *
          </span>
        </label>
        {errors.gdpr_consent && (
          <p className="text-sm text-red-600 mt-1">{errors.gdpr_consent.message}</p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Verzenden...' : 'Verstuur aanvraag'}
      </Button>
    </form>
  );
}
