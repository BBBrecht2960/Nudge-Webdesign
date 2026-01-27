'use client';

import { Clock, AlertCircle, TrendingDown } from 'lucide-react';

export function ProblemSolution() {
  return (
    <section id="problem-solution" className="py-14 sm:py-20 md:py-28 px-5 sm:px-6 lg:px-8 bg-white relative overflow-hidden w-full min-w-0">
      {/* Decoratieve achtergrond elementen */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -ml-48 -mb-48" />
      
      <div className="max-w-6xl mx-auto relative z-10 w-full min-w-0">
        <div className="mb-10 sm:mb-12 md:mb-16 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight px-1">
            Herkenbaar?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-1">
            De meeste KMO's hebben hetzelfde probleem
          </p>
        </div>
        
        {/* Grid zonder foto's */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12">
          <div className="bg-white p-6 sm:p-8 rounded-xl border-2 border-border shadow-lg hover:shadow-xl transition-all duration-200 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 shadow-sm">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-3 break-words">Geen tijd of kennis</h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed break-words">
              Je hebt het druk. Marketing en website-onderhoud komen er niet van.
            </p>
          </div>
          
          <div className="bg-white p-6 sm:p-8 rounded-xl border-2 border-border shadow-lg hover:shadow-xl transition-all duration-200 md:mt-8 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4 shadow-sm">
              <AlertCircle className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-3 break-words">Verouderde website</h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed break-words">
              Je WordPress of Shopify-site is traag en brengt geen nieuwe klanten.
            </p>
          </div>
          
          <div className="bg-white p-6 sm:p-8 rounded-xl border-2 border-border shadow-lg hover:shadow-xl transition-all duration-200 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 shadow-sm">
              <TrendingDown className="w-6 h-6 text-accent-foreground" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-3 break-words">Geen leads</h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed break-words">
              Je website kost geld, maar levert niets op.
            </p>
          </div>
        </div>

        {/* Concrete oplossing */}
        <div className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-muted rounded-2xl overflow-hidden border-l-4 border-primary shadow-xl min-w-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative p-6 sm:p-8 md:p-12 min-w-0">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground break-words">
              Wij bouwen websites die werken
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed break-words">
              Modern, snel, en geoptimaliseerd om leads te genereren. Geen verouderde WordPress-sites, maar slimme oplossingen die resultaat opleveren.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
