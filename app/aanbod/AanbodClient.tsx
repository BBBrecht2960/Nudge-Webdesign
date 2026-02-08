'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/Button';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { track } from '@/lib/analytics';

type Sector = 'diensten' | 'retail' | 'productie' | 'coaching' | 'anders';
type TeamSize = '1-5' | '6-15' | '16+';
type Impact = 'een' | 'meerdere' | 'volledig';

const SECTOR_OPTIONS: { value: Sector; label: string }[] = [
  { value: 'diensten', label: 'Diensten (advies, zorg, creatief)' },
  { value: 'retail', label: 'Retail / webshop' },
  { value: 'productie', label: 'Productie / logistiek' },
  { value: 'coaching', label: 'Coaching / training' },
  { value: 'anders', label: 'Anders' },
];

const TEAM_OPTIONS: { value: TeamSize; label: string }[] = [
  { value: '1-5', label: '1–5 medewerkers' },
  { value: '6-15', label: '6–15 medewerkers' },
  { value: '16+', label: '16+ medewerkers' },
];

const IMPACT_OPTIONS: { value: Impact; label: string }[] = [
  { value: 'een', label: 'Eén proces op orde (offerte, planning, klantbeheer)' },
  { value: 'meerdere', label: 'Meerdere processen + inzicht in data' },
  { value: 'volledig', label: 'Volledig digitaal operationeel (franchise, platform)' },
];

type PackageId = 'nudge-flow' | 'nudge-ops' | 'nudge-os';

const PACKAGE_RESULTS: Record<
  PackageId,
  { name: string; price: string; features: string[]; bonussen: string[]; caseText?: string }
> = {
  'nudge-flow': {
    name: 'Nudge Flow',
    price: '€1.950 eenmalig',
    features: [
      '1 bedrijfsproces gedigitaliseerd (bv. offerteflow of klantbeheer)',
      'Live in 14 dagen',
      'Basic AI (mail, tekst, reminders)',
      '30 dagen launch success begeleiding',
    ],
    bonussen: [
      'Gratis AI-workshop (waarde €450)',
      'Lifetime Nudge Support Portal (waarde €650)',
      'Resultaatgarantie: 30 dagen eerste proces live of je betaalt niets',
    ],
    caseText: 'Een coachingsbedrijf in Gent bespaarde 9u/week met Nudge Flow.',
  },
  'nudge-ops': {
    name: 'Nudge Ops',
    price: '€4.950 of €850/maand × 6',
    features: [
      'Tot 3 processen geautomatiseerd',
      'Dashboard voor data & opvolging',
      'Koppeling boekhouding, CRM, planning of webshop',
      'AI-tooling voor offerte of klantcommunicatie',
      '60 dagen persoonlijke ondersteuning',
    ],
    bonussen: [
      'Gratis AI-workshop (waarde €450)',
      'Lifetime Nudge Support Portal (waarde €650)',
      'Resultaatgarantie: 30 dagen eerste proces live of je betaalt niets',
      'Aangepaste e-mailflow + AI-scripts voor leads of opvolging',
      'Gratis strategiecall met AI-expert (waarde €950)',
    ],
  },
  'nudge-os': {
    name: 'Nudge OS',
    price: 'Vanaf €15.000',
    features: [
      'Volledig digitaal operationsysteem op maat',
      'Automatiseringen + integraties + API-koppelingen',
      'AI-beslisflows en realtime dashboards',
      'UX/UI, branding indien nodig',
      'Dedicated productmanager',
    ],
    bonussen: [
      'Gratis AI-workshop (waarde €450)',
      'Lifetime Nudge Support Portal (waarde €650)',
      'Resultaatgarantie: 30 dagen eerste proces live of je betaalt niets',
      'Aangepaste e-mailflow + AI-scripts',
      'Gratis strategiecall met AI-expert (waarde €950)',
    ],
  },
};

function getRecommendedPackage(sector: Sector, teamSize: TeamSize, impact: Impact): PackageId {
  if (impact === 'volledig' || teamSize === '16+') return 'nudge-os';
  if (impact === 'meerdere' || teamSize === '6-15') return 'nudge-ops';
  return 'nudge-flow';
}

export function AanbodClient() {
  const [step, setStep] = useState(1);
  const [sector, setSector] = useState<Sector | null>(null);
  const [teamSize, setTeamSize] = useState<TeamSize | null>(null);
  const [impact, setImpact] = useState<Impact | null>(null);

  const canProceedStep1 = sector !== null;
  const canProceedStep2 = teamSize !== null;
  const canProceedStep3 = impact !== null;

  const handleNext = () => {
    if (step === 1 && canProceedStep1) {
      setStep(2);
    } else if (step === 2 && canProceedStep2) {
      setStep(3);
    } else if (step === 3 && canProceedStep3) {
      setStep(4);
      track('offer_builder_completed', {
        sector,
        team_size: teamSize,
        impact,
        recommended: getRecommendedPackage(sector!, teamSize!, impact!),
      });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  if (step === 4 && sector !== null && teamSize !== null && impact !== null) {
    const pkgId = getRecommendedPackage(sector, teamSize, impact);
    const result = PACKAGE_RESULTS[pkgId];
    const contactUrl = `/contact?aanbod=${pkgId}`;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-border rounded-lg p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Jouw aanbevolen aanbod</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Op basis van je antwoorden past dit pakket het best bij je situatie.
          </p>
          <div className="border border-primary rounded-lg p-5 mb-6 bg-primary/5">
            <h3 className="text-lg font-bold text-foreground mb-1">{result.name}</h3>
            <p className="text-2xl font-bold text-primary mb-4">{result.price}</p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              {result.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs font-medium text-foreground mb-2">Bonussen:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {result.bonussen.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          {result.caseText && (
            <p className="text-sm text-muted-foreground italic mb-6 border-l-2 border-primary pl-4">
              {result.caseText}
            </p>
          )}
          <Link href={contactUrl}>
            <Button size="lg" className="w-full sm:w-auto">
              Plan een gesprek <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-primary' : 'bg-muted'}`}
              aria-hidden
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Stap {step} van 3</p>
      </div>

      {step === 1 && (
        <>
          <h2 className="text-lg font-bold text-foreground mb-4">Wat voor soort bedrijf heb je?</h2>
          <div className="space-y-2">
            {SECTOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSector(opt.value)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  sector === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="font-medium text-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-lg font-bold text-foreground mb-4">Hoe groot is je team?</h2>
          <div className="space-y-2">
            {TEAM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTeamSize(opt.value)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  teamSize === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="font-medium text-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="text-lg font-bold text-foreground mb-4">Wat wil je bereiken?</h2>
          <div className="space-y-2">
            {IMPACT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setImpact(opt.value)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  impact === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="font-medium text-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {step > 1 && (
          <Button type="button" variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2 inline" /> Terug
          </Button>
        )}
        <Button
          type="button"
          onClick={handleNext}
          disabled={
            (step === 1 && !canProceedStep1) ||
            (step === 2 && !canProceedStep2) ||
            (step === 3 && !canProceedStep3)
          }
        >
          {step === 3 ? 'Bekijk mijn aanbod' : 'Volgende'} <ArrowRight className="w-4 h-4 ml-2 inline" />
        </Button>
      </div>
    </div>
  );
}
