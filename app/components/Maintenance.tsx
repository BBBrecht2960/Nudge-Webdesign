export function Maintenance() {
  const tiers = [
    {
      name: 'Starter',
      price: '€19,99/maand',
      features: [
        'Maandelijkse updates',
        'Dagelijkse backups',
        'Basis beveiliging',
        'SSL-certificaat',
        'Email support (48u)',
        'Uptime monitoring',
      ],
    },
    {
      name: 'Business',
      price: '€49,99/maand',
      features: [
        'Alles uit Starter',
        'Wekelijkse updates',
        'Real-time backups',
        'Geavanceerde beveiliging',
        'Prioriteit support (24u)',
        'Performance monitoring',
        'Maandelijks rapport',
      ],
      popular: true,
    },
    {
      name: 'Growth',
      price: '€99,99/maand',
      features: [
        'Alles uit Business',
        'Dagelijkse updates',
        'Onbeperkte backups',
        'Premium beveiliging + malware scanning',
        'Telefonische support (werkdagen)',
        'Real-time monitoring & alerts',
        'Kwartaalrapportage',
      ],
    },
  ];

  return (
    <section className="snap-start min-h-[70vh] flex items-center py-14 sm:py-20 md:py-24 px-5 sm:px-6 lg:px-8 bg-gradient-to-b from-muted to-white relative overflow-hidden w-full min-w-0">
      {/* Decoratieve achtergrond */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -ml-48" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -mr-48" />
      
      <div className="max-w-6xl mx-auto relative z-10 w-full min-w-0">
        <div className="mb-10 sm:mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 leading-tight px-1">
            Onderhoud
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-1">
            Updates, backups en beveiliging inbegrepen vanaf €19,99/maand
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`bg-white border-2 ${tier.popular ? 'border-primary shadow-xl md:scale-105' : 'border-border shadow-lg'} rounded-2xl p-5 sm:p-6 md:p-8 transition-all hover:shadow-2xl relative overflow-hidden min-w-0`}
            >
              {tier.popular && (
                <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                  Meest Populair
                </div>
              )}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary opacity-20" />
              <h3 className="text-lg sm:text-xl font-bold mb-2 mt-2 break-words">{tier.name}</h3>
              <p className="text-2xl sm:text-3xl font-bold text-primary mb-4 break-words">{tier.price}</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {tier.features.slice(0, 4).map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 min-w-0">
                    <span className="text-primary mt-1 shrink-0">✓</span>
                    <span className="break-words">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
