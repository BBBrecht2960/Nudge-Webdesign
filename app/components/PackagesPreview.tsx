'use client';

import Image from 'next/image';
import { FileText, Building2, Rocket } from 'lucide-react';
import { Button } from './Button';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const packages = [
  {
    name: 'Mini Website',
    tagline: 'Onepager – supersnel leverbaar.',
    price: 'Vanaf €399',
    image: '/Design Nudge Webdesign Hasselt.jpg',
    icon: FileText,
    features: ['1 pagina', 'Responsive', 'Contactformulier', 'Basis SEO', '1 maand gratis onderhoud'],
    popular: false,
  },
  {
    name: 'Standard Website',
    tagline: '4–6 pagina\'s, veelgevraagd.',
    price: 'Vanaf €699',
    image: '/Business foto Nudge Webdesign & Marketing.jpg',
    icon: Building2,
    features: ['4-6 pagina\'s', 'Responsive', 'SEO', 'Blog mogelijkheid', '1 maand gratis onderhoud'],
    popular: true,
  },
  {
    name: 'Extended Website',
    tagline: 'Op maat voor KMO\'s.',
    price: 'Vanaf €2.499',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    icon: Rocket,
    features: ['Onbeperkt pagina\'s', 'Custom design', 'Multi-language', 'CRM-integratie', '2 maanden gratis onderhoud'],
    popular: false,
  },
];

export function PackagesPreview({ className }: { className?: string }) {
  const scrollToForm = () => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });

  const onPackageClick = (name: string) => {
    track('package_card_click', { package_name: name, package_type: 'website', section: 'packages_preview' });
    scrollToForm();
  };

  return (
    <section id="packages" className={cn('py-12 md:py-16', className)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="mb-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Waarmee we kunnen starten</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">Van eenvoudige presentatie tot volledig bedrijfssysteem, afhankelijk van je situatie</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg, i) => {
            const Icon = pkg.icon;
            return (
              <div
                key={i}
                className={cn(
                  'rounded-xl border overflow-hidden bg-white flex flex-col',
                  pkg.popular ? 'border-primary shadow-md' : 'border-border hover:border-primary/40'
                )}
              >
                {pkg.popular && (
                  <div className="bg-primary text-primary-foreground text-xs font-semibold py-1.5 text-center">Populair</div>
                )}
                <div className="relative h-36 w-full hidden md:block">
                  <Image
                    src={pkg.image}
                    alt={pkg.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute top-3 left-3 w-9 h-9 rounded-lg bg-white/90 flex items-center justify-center text-primary">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1 text-center">
                  <h3 className="font-semibold text-foreground mb-0.5">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{pkg.tagline}</p>
                  <p className="text-lg font-bold text-primary mb-3">{pkg.price}</p>
                  <ul className="space-y-1.5 mb-4 text-sm text-muted-foreground flex-1 text-left max-w-[200px] mx-auto">
                    {pkg.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <span className="text-primary shrink-0">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => onPackageClick(pkg.name)}
                    className="w-full"
                    variant={pkg.popular ? 'default' : 'outline'}
                  >
                    Meer info
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 p-4 rounded-xl border border-border bg-muted/30 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Webshops, webapps en maatwerk: we bepalen samen wat past bij een intake of analyse.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.assign('/pakketten')}>
            Bekijk mogelijkheden →
          </Button>
        </div>
      </div>
    </section>
  );
}
