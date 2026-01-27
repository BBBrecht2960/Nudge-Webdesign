'use client';

import { Clock, AlertCircle, TrendingDown, Sparkles, Zap, Target } from 'lucide-react';

export function ProblemSolution() {
  const problems = [
    {
      icon: Clock,
      title: 'Geen tijd of kennis',
      description: 'Je hebt het druk. Marketing en website-onderhoud komen er niet van.',
      gradient: 'from-purple-500/20 via-pink-500/20 to-purple-600/20',
      iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
      borderColor: 'border-purple-200',
      hoverBorder: 'hover:border-purple-400',
    },
    {
      icon: AlertCircle,
      title: 'Verouderde website',
      description: 'Je WordPress of Shopify-site is traag en brengt geen nieuwe klanten.',
      gradient: 'from-orange-500/20 via-red-500/20 to-orange-600/20',
      iconBg: 'bg-gradient-to-br from-orange-500 to-red-500',
      borderColor: 'border-orange-200',
      hoverBorder: 'hover:border-orange-400',
    },
    {
      icon: TrendingDown,
      title: 'Geen leads',
      description: 'Je website kost geld, maar levert niets op.',
      gradient: 'from-blue-500/20 via-cyan-500/20 to-blue-600/20',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
    },
  ];

  return (
    <section id="problem-solution" className="snap-start min-h-[70vh] flex items-center py-14 sm:py-20 md:py-24 px-5 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-purple-50/30 to-white relative overflow-hidden w-full min-w-0">
      {/* Decoratieve achtergrond elementen */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -ml-48 -mb-48 animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="max-w-6xl mx-auto relative z-10 w-full min-w-0">
        <div className="mb-10 sm:mb-12 md:mb-16 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight px-1 bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
            Herkenbaar?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-1">
            De meeste KMO&apos;s hebben hetzelfde probleem
          </p>
        </div>
        
        {/* Grid met verbeterde cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <div
                key={index}
                className={`group relative bg-white p-6 sm:p-8 rounded-2xl border-2 ${problem.borderColor} ${problem.hoverBorder} shadow-lg hover:shadow-2xl transition-all duration-300 min-w-0 overflow-hidden hover:-translate-y-2`}
              >
                {/* Gradient achtergrond bij hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${problem.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {/* Decoratieve elementen */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/50 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  {/* Icon met gradient */}
                  <div className={`w-16 h-16 rounded-2xl ${problem.iconBg} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 break-words text-gray-900 group-hover:text-gray-950 transition-colors">
                    {problem.title}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed break-words group-hover:text-gray-700 transition-colors">
                    {problem.description}
                  </p>
                </div>
                
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            );
          })}
        </div>

        {/* Concrete oplossing */}
        <div className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-muted rounded-2xl overflow-hidden border-l-4 border-primary shadow-xl min-w-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative p-6 sm:p-8 md:p-12 min-w-0">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground break-words">
              Wij bouwen websites die werken
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed break-words">
              Modern, snel, en geoptimaliseerd om leads of sales te genereren. Geen verouderde WordPress-sites, maar slimme oplossingen die resultaat opleveren.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
