'use client';

import { Clock, AlertCircle, TrendingDown } from 'lucide-react';

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
    <section id="problem-solution" className="snap-start min-h-0 flex items-center py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-purple-50/30 to-white relative overflow-hidden w-full min-w-0">
      <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-purple-200/20 rounded-full blur-3xl -mr-32 sm:-mr-48 -mt-32 sm:-mt-48 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-200/20 rounded-full blur-3xl -ml-32 sm:-ml-48 -mb-32 sm:-mb-48 animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="max-w-6xl mx-auto relative z-10 w-full min-w-0">
        <div className="mb-6 sm:mb-8 md:mb-10 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-tight px-1 bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
            Herkenbaar?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-1">
            De meeste KMO&apos;s hebben hetzelfde probleem
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <div
                key={index}
                className={`group relative bg-white p-4 sm:p-6 rounded-xl border-2 ${problem.borderColor} ${problem.hoverBorder} shadow-lg hover:shadow-2xl transition-all duration-300 min-w-0 overflow-hidden hover:-translate-y-1 sm:hover:-translate-y-2`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${problem.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-white/50 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${problem.iconBg} flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 break-words text-gray-900 group-hover:text-gray-950 transition-colors">
                    {problem.title}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-snug break-words group-hover:text-gray-700 transition-colors">
                    {problem.description}
                  </p>
                </div>

                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            );
          })}
        </div>

        <div className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-muted rounded-xl overflow-hidden border-l-4 border-primary shadow-xl min-w-0">
          <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-primary/10 rounded-full blur-3xl -mr-24 sm:-mr-32 -mt-24 sm:-mt-32" />
          <div className="relative p-4 sm:p-6 md:p-8 min-w-0">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 text-foreground break-words">
              Websites die voor jou werken
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-snug break-words">
              Op maat gemaakt tegen een eerlijke prijs. Nieuwste technologie: websites die mooi zijn, zelfstandig werken en meegroeien met je business.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
