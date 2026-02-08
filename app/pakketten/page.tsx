import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  Globe,
  Building2,
  Rocket,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/app/components/Button';

export const metadata: Metadata = {
  title: 'Pakketten & Prijzen - Nudge',
  description: 'Jouw groeiplan in softwarevorm: Nudge Flow, Nudge Ops, Nudge OS. Drie duidelijke instapniveaus. Live in 14 dagen. Gegarandeerd.',
};

export default function PakkettenPage() {
  return (
    <main className="min-h-screen bg-muted/30">
      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 via-white to-muted/30 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Jouw groeiplan in softwarevorm
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-2">
            Drie duidelijke instapniveaus. Live in 14 dagen. Gegarandeerd.
          </p>
          <p className="text-muted-foreground/90 max-w-2xl mx-auto">
            Wij bouwen jouw digitale groeisysteem, zodat je geen tijd meer verliest aan chaos, maar focus houdt op groei.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14 sm:space-y-20">
        {/* Nudge Pakketten */}
        <section>
          <div className="flex items-center gap-3 mb-8 sm:mb-10">
            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Nudge Pakketten</h2>
              <p className="text-muted-foreground text-sm sm:text-base">Controle, rust en groei, zonder extra kopzorgen</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-white border border-border rounded-lg p-6 lg:p-8 flex flex-col">
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-4 shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-1">Nudge Flow</h3>
              <p className="text-2xl font-bold text-primary mb-4">€1.950 eenmalig</p>
              <p className="text-muted-foreground text-sm mb-4">
                Voor bedrijven met chaos in administratie, sales of planning. Eén proces op orde, live in 14 dagen.
              </p>
              <ul className="space-y-2 mb-4 text-sm text-muted-foreground flex-1">
                {['1 bedrijfsproces gedigitaliseerd (bv. offerteflow of klantbeheer)', 'Live in 14 dagen', 'Basic AI (mail, tekst, reminders)', '30 dagen launch success begeleiding'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs font-medium text-foreground mb-2 mt-2">Bonussen bij elk pakket:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {['Gratis AI-workshop (waarde €450)', 'Lifetime Nudge Support Portal (waarde €650)', 'Resultaatgarantie: 30 dagen eerste proces live of je betaalt niets'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="mt-6 block">
                <Button className="w-full" variant="outline">Plan een gesprek</Button>
              </Link>
            </div>

            <div className="bg-white border border-primary rounded-lg p-6 lg:p-8 relative flex flex-col">
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-2.5 py-1 rounded text-xs font-medium z-10">
                Populair
              </div>
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-4 shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-1">Nudge Ops</h3>
              <p className="text-2xl font-bold text-primary mb-4">€4.950 of €850/maand × 6</p>
              <p className="text-muted-foreground text-sm mb-4">
                Voor bedrijven die van 5 naar 15 medewerkers willen schalen. Schaal, controle en inzicht.
              </p>
              <ul className="space-y-2 mb-4 text-sm text-muted-foreground flex-1">
                {['Tot 3 processen geautomatiseerd', 'Dashboard voor data & opvolging', 'Koppeling boekhouding, CRM, planning of webshop', 'AI-tooling offertecreatie of klantcommunicatie', 'Onboarding & training team', '60 dagen persoonlijke ondersteuning'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs font-medium text-foreground mb-2 mt-2">Extra bonussen:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {['Aangepaste e-mailflow + AI-scripts voor leads of opvolging', 'Gratis strategiecall met AI-expert (waarde €950)'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="mt-6 block">
                <Button className="w-full">Plan een gesprek</Button>
              </Link>
            </div>

            <div className="bg-white border border-border rounded-lg p-6 lg:p-8 flex flex-col">
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-4 shrink-0">
                <Rocket className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-1">Nudge OS</h3>
              <p className="text-2xl font-bold text-primary mb-4">Vanaf €15.000</p>
              <p className="text-muted-foreground text-sm mb-4">
                Voor bedrijven die echt next-level willen: franchise, platform, MKB+. Wij bouwen je digitale backbone.
              </p>
              <ul className="space-y-2 mb-4 text-sm text-muted-foreground flex-1">
                {['Volledig digitaal operationsysteem op maat', 'Automatiseringen + integraties + API-koppelingen', 'AI-beslisflows en realtime dashboards', 'UX/UI, branding indien nodig', 'Dedicated productmanager'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs font-medium text-foreground mb-2 mt-2">Extra bonussen:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {['Aangepaste e-mailflow + AI-scripts', 'Gratis strategiecall met AI-expert (waarde €950)'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="mt-6 block">
                <Button className="w-full" variant="outline">Plan een gesprek</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Bekijk jouw aanbod */}
        <section>
          <div className="bg-muted/40 border border-border rounded-lg p-6 sm:p-8 lg:p-10 max-w-3xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-3">Niet zeker welk pakket bij je past?</h2>
            <p className="text-muted-foreground mb-6">
              Doe de korte check en ontvang je aanbevolen aanbod met prijs en bonussen.
            </p>
            <Link href="/aanbod">
              <Button size="lg" className="w-full sm:w-auto">
                Bekijk jouw aanbod <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Ook mogelijk */}
        <section>
          <div className="bg-white border border-border rounded-lg p-6 sm:p-8 lg:p-10 max-w-3xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-3">Ook mogelijk: website of webshop op maat</h2>
            <p className="text-muted-foreground mb-6">
              Wil je een presentatiesite, webshop of custom webapp? We bepalen samen scope en prijs na een intake.
            </p>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Plan een gesprek <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Eind-CTA */}
        <div className="bg-muted/40 border border-border rounded-lg p-8 sm:p-10 lg:p-12 text-center">
          <h3 className="text-xl sm:text-2xl font-bold mb-2">Klaar voor controle, rust en groei?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Plan een gesprek. We luisteren naar je situatie en geven aan wat mogelijk is, zonder verplichtingen.
          </p>
          <Link href="/contact">
            <Button size="lg">
              Plan een gesprek <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
