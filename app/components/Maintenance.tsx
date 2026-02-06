import { cn } from '@/lib/utils';

const tiers = [
  {
    name: 'Starter',
    price: '€19,99/maand',
    features: ['Maandelijkse updates', 'Dagelijkse backups', 'Basis beveiliging', 'SSL-certificaat', 'Email support (48u)'],
  },
  {
    name: 'Business',
    price: '€49,99/maand',
    features: ['Alles uit Starter', 'Wekelijkse updates', 'Prioriteit support (24u)', 'Performance monitoring', 'Maandelijks rapport'],
    popular: true,
  },
  {
    name: 'Growth',
    price: '€99,99/maand',
    features: ['Alles uit Business', 'Dagelijkse updates', 'Premium beveiliging', 'Telefonische support', 'Kwartaalrapportage'],
  },
];

export function Maintenance({ className }: { className?: string }) {
  return (
    <section className={cn('py-12 md:py-16', className)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="mb-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Onderhoud & support</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">Je systeem blijft veilig en actueel. Updates, backups en beheer vanaf €19,99/maand</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl border p-5 bg-white text-center',
                tier.popular ? 'border-primary shadow-md' : 'border-border'
              )}
            >
              {tier.popular && (
                <div className="text-xs font-semibold text-primary mb-2">Meest populair</div>
              )}
              <h3 className="font-semibold text-foreground mb-1">{tier.name}</h3>
              <p className="text-xl font-bold text-primary mb-4">{tier.price}</p>
              <ul className="space-y-2 text-sm text-muted-foreground text-left max-w-[180px] mx-auto">
                {tier.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <span className="text-primary shrink-0">✓</span> {f}
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
