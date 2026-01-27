'use client';

import { ShoppingCart, Briefcase, UtensilsCrossed, Store, Handshake, Rocket } from 'lucide-react';

export function Proof() {
  const sectors = [
    { name: 'Retail & E-commerce', icon: ShoppingCart },
    { name: 'Professionele Diensten', icon: Briefcase },
    { name: 'Horeca & Toerisme', icon: UtensilsCrossed },
    { name: 'Lokale Diensten', icon: Store },
    { name: 'B2B Services', icon: Handshake },
    { name: 'Startups & scale-ups', icon: Rocket },
  ];

  const guarantees = [
    'Levering gegarandeerd binnen 2 weken tot 2 maanden',
    'Tussentijdse checkpoints met je goedkeuring',
    'Oplevering zoals afgesproken, of je geld terug',
  ];

  return (
    <section className="py-14 sm:py-20 md:py-28 px-5 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-muted to-white relative overflow-hidden w-full min-w-0">
      {/* Decoratieve elementen */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="max-w-6xl mx-auto relative z-10 w-full min-w-0">
        <div className="mb-10 sm:mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 leading-tight px-1">
            Sectoren die we bedienen
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-1">
            Van retail tot professionele dienstverlening
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 mb-10 sm:mb-12 md:mb-16">
          {sectors.map((sector, index) => {
            const Icon = sector.icon;
            return (
              <div
                key={index}
                className="bg-white p-0 rounded-xl border-2 border-border overflow-hidden shadow-md hover:shadow-xl hover:border-primary/30 transition-all duration-200 group cursor-pointer min-w-0"
              >
                <div className="relative h-28 sm:h-32 w-full bg-gradient-to-br from-primary/15 via-secondary/10 to-muted flex items-center justify-center group-hover:from-primary/20 group-hover:via-secondary/15 transition-colors duration-300 min-h-[112px] sm:min-h-[128px]">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300 shadow-sm">
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} />
                  </div>
                </div>
                <div className="p-3 sm:p-4 min-w-0 overflow-hidden border-t border-border/50">
                  <p className="font-semibold text-sm text-center break-words leading-snug text-foreground">{sector.name}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-muted p-5 sm:p-8 md:p-12 rounded-2xl border border-primary/20 shadow-xl relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative min-w-0">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center break-words">Onze garanties</h3>
            <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto min-w-0">
              {guarantees.map((guarantee, index) => (
                <div key={index} className="flex items-start gap-3 sm:gap-4 bg-white/60 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/50 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-lg shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base font-medium pt-1 break-words min-w-0">{guarantee}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
