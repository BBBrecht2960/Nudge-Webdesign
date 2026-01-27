'use client';

import Image from 'next/image';
import { FileText, Building2, Rocket } from 'lucide-react';
import { Button } from './Button';
import { posthog } from '@/lib/posthog';

export function PackagesPreview() {
  const handlePackageClick = (packageName: string) => {
    posthog?.capture('package_card_click', {
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
    posthog?.capture('cta_click', {
      cta_type: 'secondary',
      cta_text: 'Vergelijk alle pakketten',
      section: 'packages_preview',
      destination: '/pakketten',
    });
    window.location.href = '/pakketten';
  };

  return (
    <section id="packages" className="py-14 sm:py-20 md:py-24 px-5 sm:px-6 lg:px-8 bg-gradient-to-b from-muted to-white relative overflow-hidden w-full min-w-0">
      {/* Decoratieve achtergrond */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
      
      <div className="max-w-7xl mx-auto relative z-10 w-full min-w-0">
        <div className="mb-10 sm:mb-12 md:mb-16 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight px-1">
            Pakketten
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-1">
            Kies het pakket dat bij je bedrijf past
          </p>
        </div>

        {/* Variatie in card hoogtes met foto's */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8 mb-8 sm:mb-10 md:mb-12">
          <div className="bg-white border-2 border-border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group min-w-0">
            <div className="relative h-48 w-full hidden md:block">
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
            <div className="p-5 sm:p-6 md:p-8 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold mb-2 break-words">Mini Website</h3>
              <p className="text-xl sm:text-2xl font-bold text-primary mb-4">Vanaf €300</p>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground break-words">
                <li>• 1 pagina met alle essentiële info</li>
                <li>• Responsive (mobiel & desktop)</li>
                <li>• Contactformulier</li>
                <li>• Basis SEO</li>
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

          <div className="bg-white border-2 border-primary rounded-2xl overflow-hidden shadow-2xl hover:shadow-2xl transition-all group relative md:-mt-6 min-w-0 order-first md:order-none">
            <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg z-10">
              Populair
            </div>
            <div className="relative h-56 w-full hidden md:block">
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
            <div className="p-5 sm:p-6 md:p-8 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold mb-2 break-words">Standard Business</h3>
              <p className="text-xl sm:text-2xl font-bold text-primary mb-4">Vanaf €500</p>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground break-words">
                <li>• 5-10 pagina's</li>
                <li>• Responsive design</li>
                <li>• Contactformulier + Google Maps</li>
                <li>• SEO-optimalisatie</li>
                <li>• Blog mogelijkheid</li>
              </ul>
              <Button
                onClick={() => handlePackageClick('Standard Business')}
                className="w-full"
              >
                Meer info
              </Button>
            </div>
          </div>

          <div className="bg-white border-2 border-border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group min-w-0">
            <div className="relative h-48 w-full hidden md:block">
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
            <div className="p-5 sm:p-6 md:p-8 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold mb-2 break-words">Extended KMO</h3>
              <p className="text-xl sm:text-2xl font-bold text-primary mb-4">Vanaf €3.000</p>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground break-words">
                <li>• Onbeperkt aantal pagina's</li>
                <li>• Custom design op maat</li>
                <li>• Geavanceerde SEO</li>
                <li>• Integraties (CRM, boekingssysteem, AI)</li>
                <li>• Multi-language optie</li>
              </ul>
              <Button
                onClick={() => handlePackageClick('Extended KMO')}
                className="w-full"
                variant="outline"
              >
                Meer info
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-muted p-5 sm:p-6 rounded-xl border border-border text-center min-w-0 overflow-hidden">
          <p className="text-sm sm:text-base mb-4 break-words px-1">
            <strong className="text-foreground">Webshops</strong> vanaf €2.000 • <strong className="text-foreground">Webapps</strong> vanaf €5.000 (intake gesprek)
          </p>
          <Button onClick={handleViewAll} variant="outline" size="sm" className="w-full sm:w-auto">
            Vergelijk alle pakketten →
          </Button>
        </div>
      </div>
    </section>
  );
}
