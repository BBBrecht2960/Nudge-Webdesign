import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  Globe,
  Building2,
  ShoppingCart,
  Package,
  Rocket,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/app/components/Button';

export const metadata: Metadata = {
  title: 'Pakketten & Prijzen - Nudge Webdesign',
  description: 'Bekijk onze website, webshop en webapp pakketten. Van eenvoudige one-pager tot uitgebreide KMO-website. Transparante prijzen vanaf €300.',
};

export default function PakkettenPage() {
  return (
    <main className="min-h-screen bg-muted/30">
      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 via-white to-muted/30 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Pakketten & Prijzen
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-2">
            Helder geprijsd. Geen verrassingen.
          </p>
          <p className="text-muted-foreground/90 max-w-2xl mx-auto">
            Kies het pakket dat bij je past – van eenvoudige one-pager tot uitgebreide webapp. Alle prijzen zijn vanaf-bedragen; wat je ziet is waar we op starten.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14 sm:space-y-20">
        {/* Website Pakketten */}
        <section>
          <div className="flex items-center gap-3 mb-8 sm:mb-10">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Website Pakketten</h2>
              <p className="text-muted-foreground text-sm sm:text-base">Websites die werken, zonder gedoe</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-white border-2 border-border rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-1">Mini Website</h3>
              <p className="text-2xl font-bold text-primary mb-4">
                <span className="text-sm font-medium text-muted-foreground">Vanaf </span>€399
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                Perfect voor starters of een eenvoudige online aanwezigheid.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground flex-1">
                {['1 pagina met essentiële info', 'Responsive (mobiel & desktop)', 'Contactformulier', 'Basis SEO', 'SSL-certificaat', '1 maand gratis onderhoud'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground/80 mt-auto">Starters, freelancers, lokale diensten</p>
            </div>

            <div className="bg-white border-2 border-primary rounded-2xl p-6 lg:p-8 shadow-xl relative flex flex-col">
              <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                Populair
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4 shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-1">Standard Website</h3>
              <p className="text-2xl font-bold text-primary mb-4">
                <span className="text-sm font-medium text-muted-foreground">Vanaf </span>€699
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                4–6 pagina&apos;s, standaard structuur, veelgevraagd.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground flex-1">
                {['4-6 pagina\'s (Home, Over ons, Diensten, Contact)', 'Responsive design', 'Contactformulier + Google Maps', 'SEO-optimalisatie', 'Blog mogelijkheid', 'Social media integratie', '1 maand gratis onderhoud'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground/80 mt-auto">KMO&apos;s, professionele diensten, lokale bedrijven</p>
            </div>

            <div className="bg-white border-2 border-border rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center mb-4 shrink-0">
                <Rocket className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-1">Extended Website</h3>
              <p className="text-2xl font-bold text-primary mb-4">
                <span className="text-sm font-medium text-muted-foreground">Vanaf </span>€2.499
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                Op maat voor KMO&apos;s, multi-language, CRM, blog inbegrepen.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground flex-1">
                {['Onbeperkt pagina\'s', 'Custom design op maat', 'Meerdere formulieren', 'Geavanceerde SEO', 'Blog met categorieën', 'Integraties (CRM, boekingssysteem, AI)', 'Multi-language (NL/FR/EN)', '2 maanden gratis onderhoud'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground/80 mt-auto">Grotere KMO&apos;s, complexe wensen</p>
            </div>
          </div>
        </section>

        {/* Webshop Pakketten */}
        <section>
          <div className="flex items-center gap-3 mb-8 sm:mb-10">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Webshop Pakketten</h2>
              <p className="text-muted-foreground text-sm sm:text-base">E-commerce die verkoopt</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { 
                name: 'Basic Webshop', 
                price: '€1.499', 
                icon: Package, 
                description: 'Tot 50 producten, Mollie, WooCommerce/Shopify Light.',
                items: ['Tot 50 producten', 'Betalingsintegratie (Mollie)', 'Verzendopties', 'Productcategorieën', 'Basis productbeheer'] 
              },
              { 
                name: 'Pro Webshop', 
                price: '€3.499', 
                icon: ShoppingCart, 
                description: 'Onbeperkt producten, filters, accounts, meertaligheid.',
                items: ['Onbeperkt producten', 'Geavanceerde filters', 'Klantaccounts', 'Bestelhistorie', 'Multi-language', 'Geavanceerde logistiek'] 
              },
              { 
                name: 'Enterprise Webshop', 
                price: '€6.999', 
                icon: Building2, 
                description: 'Custom features, schaalbaar, koppelingen, logistiek.',
                items: ['Custom features', 'Multi-channel', 'Geavanceerde logistiek', 'Volledige customisatie', 'Schaalbaarheid', 'API-koppelingen'] 
              },
            ].map((pkg, i) => {
              const Icon = pkg.icon;
              return (
              <div key={i} className="bg-white border-2 border-border rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                <p className="text-2xl font-bold text-primary mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Vanaf </span>{pkg.price}
                </p>
                {pkg.description && (
                  <p className="text-muted-foreground text-sm mb-4">{pkg.description}</p>
                )}
                <ul className="space-y-2 text-sm text-muted-foreground flex-1">
                  {pkg.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );})}
          </div>
        </section>

        {/* Webapp CTA-card */}
        <section>
          <div className="flex items-center gap-3 mb-8 sm:mb-10">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Webapp</h2>
              <p className="text-muted-foreground text-sm sm:text-base">Op maat gebouwde applicaties</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-muted border-2 border-primary/20 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-xl max-w-3xl">
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Custom Webapplicaties</h3>
            <p className="text-2xl font-bold text-primary mb-4">Vanaf €4.999</p>
            <p className="text-muted-foreground mb-4">
              Custom webapplicaties voor specifieke bedrijfsprocessen. Intake gesprek vereist voor offerte op maat.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Neem contact op voor een intake gesprek om uw behoeften te bespreken.
            </p>
            <Link href="/contact">
              <Button size="lg" className="w-full sm:w-auto">
                Plan intake gesprek <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Opties & Uitbreidingen */}
        <section>
          <div className="bg-white border-2 border-border rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg max-w-3xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-3">Extra opties beschikbaar</h2>
            <p className="text-muted-foreground mb-6">
              Wil je extra pagina&apos;s, een blog, multi-language, integraties of marketing? 
              We bespreken graag wat je nodig hebt en geven een offerte op maat.
            </p>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Vraag een offerte aan <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Eind-CTA */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20 rounded-2xl p-8 sm:p-10 lg:p-12 text-center">
          <h3 className="text-xl sm:text-2xl font-bold mb-2">Niet zeker welk pakket bij je past?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Plan een gratis gesprek. We denken graag met je mee – zonder verplichtingen.
          </p>
          <Link href="/contact">
            <Button size="lg">
              Plan een gratis gesprek <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
