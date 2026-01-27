'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
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
  name: z.string().min(2, 'Naam is verplicht'),
  email: z.string()
    .min(1, 'E-mailadres is verplicht')
    .refine((val) => validateEmail(val), { message: 'Voer een geldig e-mailadres in' }),
  phone: z.string()
    .min(1, 'Telefoonnummer is verplicht')
    .refine((val) => validatePhone(val), { message: 'Voer een geldig telefoonnummer in' }),
  company_name: z.string().optional(),
  company_size: z.string().optional(),
  package_interest: z.string().optional(),
  pain_points: z.array(z.string()).optional(),
  current_website_status: z.string().optional(),
  current_website_url: z.string().optional(),
  message: z.string().optional(),
  gdpr_consent: z.boolean().refine((val) => val === true, {
    message: 'U moet akkoord gaan met het privacybeleid',
  }),
});

type FormData = z.infer<typeof formSchema>;

const painPointOptions = [
  { id: 'no-customers', label: 'Mijn website trekt geen nieuwe klanten aan', emoji: '👥' },
  { id: 'losing-customers', label: 'Ik verlies klanten aan concurrenten', emoji: '😰' },
  { id: 'slow-website', label: 'Mijn website is traag of werkt niet goed op mobiel', emoji: '🐌' },
  { id: 'no-leads', label: 'Ik krijg geen leads of boekingen via mijn website', emoji: '📧' },
  { id: 'no-time', label: 'Ik heb geen tijd om mijn website te onderhouden', emoji: '⏰' },
  { id: 'no-seo', label: 'Ik weet niet hoe ik online gevonden kan worden', emoji: '🔍' },
  { id: 'costs-money', label: 'Mijn website kost geld maar levert niets op', emoji: '💰' },
];

const packageOptions = [
  { id: 'mini', label: 'Mini Website', price: 'vanaf €399', desc: 'Onepager - supersnel leverbaar' },
  { id: 'standard', label: 'Standard Website', price: 'vanaf €699', desc: '4-6 pagina\'s, standaard structuur' },
  { id: 'extended', label: 'Extended Website', price: 'vanaf €2.499', desc: 'Op maat voor KMO\'s, multi-language' },
  { id: 'basic-shop', label: 'Basic Webshop', price: 'vanaf €1.499', desc: 'Tot 50 producten' },
  { id: 'pro-shop', label: 'Pro Webshop', price: 'vanaf €3.499', desc: 'Onbeperkt producten, filters' },
  { id: 'enterprise-shop', label: 'Enterprise Webshop', price: 'vanaf €6.999', desc: 'Custom features, schaalbaar' },
  { id: 'webapp', label: 'Webapp op maat', price: 'vanaf €4.999', desc: 'AI, CRM, API-integratie' },
  { id: 'not-sure', label: 'Nog niet zeker', price: '', desc: 'Laten we samen kijken wat past' },
];

export function LeadForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [utmData, setUtmData] = useState<Record<string, string>>({});
  const totalSteps = 6;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gdpr_consent: false,
      pain_points: [],
    },
  });

  const selectedPainPoints = watch('pain_points') || [];
  const packageInterest = watch('package_interest');

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

  const nextStep = async () => {
    let isValid = false;
    
    if (currentStep === 1) {
      isValid = await trigger(['name', 'email', 'phone']);
    } else if (currentStep === 2) {
      // Step 2 is optional, always valid
      isValid = true;
    } else if (currentStep === 3) {
      // At least one pain point selected
      isValid = selectedPainPoints.length > 0;
      if (!isValid) {
        alert('Selecteer minimaal één uitdaging');
      }
    } else if (currentStep === 4) {
      // Package interest is optional but recommended
      isValid = true;
    } else if (currentStep === 5) {
      // Step 5 is optional
      isValid = true;
    }
    
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const togglePainPoint = (pointId: string) => {
    const current = selectedPainPoints;
    if (current.includes(pointId)) {
      setValue('pain_points', current.filter((p) => p !== pointId));
    } else {
      setValue('pain_points', [...current, pointId]);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      posthog?.capture('form_submitted', {
        form_type: 'lead_form_quiz',
        package_interest: data.package_interest,
        ...utmData,
      });

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          pain_points: selectedPainPoints.map(id => {
            const option = painPointOptions.find(p => p.id === id);
            return option ? option.label : id;
          }),
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
          name: data.name,
          company: data.company_name,
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

  const progress = (currentStep / totalSteps) * 100;

  return (
    <form
      id="contact-form"
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card border-2 border-border rounded-2xl p-5 sm:p-6 md:p-8 space-y-6 shadow-xl w-full max-w-2xl mx-auto"
    >
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-primary">Stap {currentStep} van {totalSteps}</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">Laten we beginnen! 👋</h2>
            <p className="text-muted-foreground">Vertel ons wie je bent</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Je naam *
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
                placeholder="Bijv. Jan Janssen"
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
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
                placeholder="jan@voorbeeld.be"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Telefoonnummer *
              </label>
              <input
                {...register('phone')}
                type="tel"
                id="phone"
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
                placeholder="0494299633"
              />
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Company Info (Optional) */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">Over je bedrijf 🏢</h2>
            <p className="text-muted-foreground">Optioneel - je kunt dit overslaan</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium mb-2">
                Bedrijfsnaam
              </label>
              <input
                {...register('company_name')}
                type="text"
                id="company_name"
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
                placeholder="Bijv. Mijn Bedrijf BV"
              />
            </div>

            <div>
              <label htmlFor="company_size" className="block text-sm font-medium mb-2">
                Bedrijfsgrootte
              </label>
              <select
                {...register('company_size')}
                id="company_size"
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
              >
                <option value="">Selecteer...</option>
                <option value="1-5">1-5 medewerkers</option>
                <option value="5-10">5-10 medewerkers</option>
                <option value="10-30">10-30 medewerkers</option>
                <option value="30+">30+ medewerkers</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Pain Points */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">Wat is je grootste uitdaging? 🤔</h2>
            <p className="text-muted-foreground">Selecteer alle problemen die op jou van toepassing zijn</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {painPointOptions.map((point) => (
              <button
                key={point.id}
                type="button"
                onClick={() => togglePainPoint(point.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedPainPoints.includes(point.id)
                    ? 'border-primary bg-primary/10 shadow-md scale-[1.02]'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{point.emoji}</span>
                  <span className="text-sm font-medium leading-relaxed">{point.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Package Interest */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">Wat wil je bereiken? 🎯</h2>
            <p className="text-muted-foreground">Kies wat het beste bij je past</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {packageOptions.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setValue('package_interest', pkg.label)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  packageInterest === pkg.label
                    ? 'border-primary bg-primary/10 shadow-md scale-[1.02]'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="font-semibold text-base mb-1">{pkg.label}</div>
                {pkg.price && <div className="text-sm text-primary font-medium mb-1">{pkg.price}</div>}
                <div className="text-xs text-muted-foreground">{pkg.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Current Website (Optional) */}
      {currentStep === 5 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">Huidige situatie 🌐</h2>
            <p className="text-muted-foreground">Optioneel - help ons je beter te begrijpen</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="current_website_status" className="block text-sm font-medium mb-2">
                Huidige website situatie
              </label>
              <select
                {...register('current_website_status')}
                id="current_website_status"
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
              >
                <option value="">Selecteer...</option>
                <option value="geen">Geen website</option>
                <option value="verouderd">Verouderde website</option>
                <option value="modern">Moderne website, maar geen resultaat</option>
                <option value="andere">Andere situatie</option>
              </select>
            </div>

            <div>
              <label htmlFor="current_website_url" className="block text-sm font-medium mb-2">
                Huidige website link (optioneel)
              </label>
              <input
                {...register('current_website_url')}
                type="url"
                id="current_website_url"
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
                placeholder="www.voorbeeld.be"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Extra info (optioneel)
              </label>
              <textarea
                {...register('message')}
                id="message"
                rows={3}
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none text-base"
                placeholder="Vertel ons meer over je project..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 6: GDPR & Submit */}
      {currentStep === 6 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right duration-300">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">Bijna klaar! ✨</h2>
            <p className="text-muted-foreground">Laatste stap: privacy toestemming</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                {...register('gdpr_consent')}
                type="checkbox"
                className="mt-1 w-5 h-5 shrink-0 text-primary focus:outline-none rounded border-2 border-border cursor-pointer"
              />
              <span className="text-sm leading-relaxed">
                Ik ga akkoord met het{' '}
                <a href="/privacy" className="text-primary hover:underline font-medium" target="_blank">
                  privacybeleid
                </a>{' '}
                en geef toestemming voor het verwerken van mijn gegevens. *
              </span>
            </label>
            {errors.gdpr_consent && (
              <p className="text-sm text-red-600 mt-2">{errors.gdpr_consent.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Vorige
        </Button>

        {currentStep < totalSteps ? (
          <Button
            type="button"
            onClick={nextStep}
            className="flex items-center gap-2"
          >
            Volgende
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? 'Verzenden...' : 'Verstuur aanvraag'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
