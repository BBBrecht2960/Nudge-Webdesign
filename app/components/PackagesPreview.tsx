'use client';

import Image from 'next/image';
import { FileText, Building2, Rocket } from 'lucide-react';
import { Button } from './Button';
import { track } from '@/lib/analytics';

export function PackagesPreview() {
  const handlePackageClick = (packageName: string) => {
    track('package_card_click', {
      package_name: packageName,
      package_type: 'website',
      section: 'packages_preview',
    });
    const form = document.getElementById('contact-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewAll = () => {
    track('cta_click', {
      cta_type: 'secondary',
      cta_text: 'Vergelijk alle pakketten',
      section: 'packages_preview',
      destination: '/pakketten',
    });
    window.location.href = '/pakketten';
  };

  return (
    <section id="packages" className="snap-start min-h-0 flex items-center py-10 sm:py-12 md:py-16 px-5 sm:px-6 lg:px-8 bg-gradient-to-b from-muted to-white relative overflow-visible w-full min-w-0">
      {/* Decoratieve achtergrond */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
      
      <div className="max-w-7xl mx-auto relative z-10 w-full min-w-0">
        <div className="mb-6 sm:mb-8 md:mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 leading-tight px-1">
            Pakketten
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-1">
            Kies het pakket dat bij je bedrijf past
          </p>
        </div>

        {/* Variatie in card hoogtes met foto's */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8 items-stretch">
          <div className="bg-white border-2 border-border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group min-w-0 flex flex-col">
            <div className="relative h-28 sm:h-32 w-full hidden md:block">
              <Image
                src="/Design Nudge Webdesign Hasselt.jpg"
                alt="Mini website – één pagina, helder en simpel"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
              <div className="absolute top-4 left-4 w-10 h-10 rounded-lg bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="p-4 sm:p-5 md:p-6 min-w-0 flex flex-col flex-1 overflow-visible">
              <h3 className="text-lg font-bold mb-1.5 break-words">Mini Website</h3>
              <p className="text-sm text-muted-foreground mb-1.5 break-words">Onepager – supersnel leverbaar, ideaal voor starters.</p>
              <p className="text-lg sm:text-xl font-bold text-primary mb-3">Vanaf €399</p>
              <ul className="space-y-1.5 mb-4 text-sm text-muted-foreground break-words flex-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>1 pagina met essentiële info</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>Responsive (mobiel & desktop)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>Contactformulier</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>Basis SEO</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>SSL-certificaat</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>1 maand gratis onderhoud</span>
                </li>
              </ul>
              <Button
                onClick={() => handlePackageClick('Mini Website')}
                className="w-full"
                variant="outline"
              >
                Meer info
              </Button>
            </div>
          </div>

          <div className="bg-white border-2 border-primary rounded-2xl overflow-visible shadow-2xl hover:shadow-2xl transition-all group relative md:-mt-4 min-w-0 order-first md:order-none flex flex-col h-full">
            <div className="absolute top-2.5 right-2.5 bg-primary text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg z-10">
              Populair
            </div>
            <div className="relative h-28 sm:h-32 w-full hidden md:block shrink-0">
              <Image
                src="/Business foto Nudge Webdesign & Marketing.jpg"
                alt="Standard business website – professionele uitstraling"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
              <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="p-4 sm:p-5 md:p-6 min-w-0 flex flex-col flex-1 overflow-visible">
              <h3 className="text-lg font-bold mb-1.5 break-words">Standard Website</h3>
              <p className="text-sm text-muted-foreground mb-1.5 break-words">4–6 pagina&apos;s, standaard structuur, veelgevraagd.</p>
              <p className="text-lg sm:text-xl font-bold text-primary mb-3">Vanaf €699</p>
              <ul className="space-y-1.5 mb-4 text-sm text-muted-foreground break-words flex-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>4-6 pagina&apos;s (Home, Over ons, Diensten, Contact)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>Responsive design</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>Contactformulier + Google Maps</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>SEO-optimalisatie</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>Blog mogelijkheid</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>Social media integratie</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>1 maand gratis onderhoud</span>
                </li>
              </ul>
              <Button
                onClick={() => handlePackageClick('Standard Website')}
                className="w-full"
              >
                Meer info
              </Button>
            </div>
          </div>

          <div className="bg-white border-2 border-border rounded-2xl overflow-visible shadow-lg hover:shadow-2xl transition-all group min-w-0 flex flex-col h-full">
            <div className="relative h-28 sm:h-32 w-full hidden md:block shrink-0">
              <Image
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="Extended KMO – custom website op maat"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
              <div className="absolute top-4 left-4 w-10 h-10 rounded-lg bg-secondary/20 backdrop-blur-sm flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="p-4 sm:p-5 md:p-6 min-w-0 flex flex-col flex-1 overflow-visible">
              <h3 className="text-lg font-bold mb-1.5 break-words">Extended Website</h3>
              <p className="text-sm text-muted-foreground mb-1.5 break-words">Op maat voor KMO&apos;s, multi-language, CRM, blog inbegrepen.</p>
              <p className="text-lg sm:text-xl font-bold text-primary mb-3">Vanaf €2.499</p>
              <ul className="space-y-1.5 mb-4 text-sm text-muted-foreground break-words flex-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>Onbeperkt pagina&apos;s</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>Custom design op maat</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>Meerdere formulieren</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>Geavanceerde SEO</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>Blog met categorieën</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>Multi-language (NL/FR/EN)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>CRM-integratie</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary shrink-0">✓</span>
                  <span>2 maanden gratis onderhoud</span>
                </li>
              </ul>
              <Button
                onClick={() => handlePackageClick('Extended Website')}
                className="w-full"
                variant="outline"
              >
                Meer info
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-muted p-4 sm:p-5 rounded-xl border border-border text-center min-w-0 overflow-hidden">
          <p className="text-sm sm:text-base mb-3 break-words px-1">
            <strong className="text-foreground">Webshops</strong> vanaf €1.499 • <strong className="text-foreground">Webapps</strong> vanaf €4.999 (intake gesprek)
          </p>
          <Button onClick={handleViewAll} variant="outline" size="sm" className="w-full sm:w-auto">
            Vergelijk alle pakketten →
          </Button>
        </div>
      </div>
    </section>
  );
}
