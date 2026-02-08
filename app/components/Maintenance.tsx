import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const inbegrepen = [
  { label: 'Bugfixing', uitleg: 'Kleine technische fouten oplossen die jouw fout zijn' },
  { label: 'Updates & compatibiliteit', uitleg: 'Aansluiting met browser- of API-wijzigingen' },
  { label: 'Hosting & monitoring', uitleg: 'Inclusief uptime-monitoring, backups' },
  { label: 'Kleine aanpassingen', uitleg: 'Max. 1u/maand kleine wijzigingen aan flow, labels, content' },
  { label: 'Support', uitleg: 'Reactie binnen 48u op vragen of storingen' },
];

const tiers = [
  {
    name: 'Basis',
    sub: 'Nudge Flow',
    price: '€85/maand',
    features: [
      'Hosting & monitoring',
      'Bugfixing',
      'Support (binnen 48u)',
      'Kleine aanpassingen (max. 1u/maand)',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    sub: 'Nudge Ops',
    price: '€150/maand',
    features: [
      'Alles uit Basis',
      'Updates & compatibiliteit',
      'Prioriteit support',
      'Advies bij uitbreidingen',
    ],
    popular: true,
  },
  {
    name: 'Elite',
    sub: 'Nudge OS',
    price: '€250/maand',
    features: [
      'Alles uit Pro',
      'Kwartaalcall',
      'Groeiplan',
      'SLA 24u',
    ],
    popular: false,
  },
];

export function Maintenance({ className }: { className?: string }) {
  return (
    <section id="onderhoud" className={cn('py-12 md:py-16', className)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="mb-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Onderhoud & support</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-6">
            NudgeCare: je systeem altijd up-to-date, veilig en klaar voor groei.
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Je systeem draait op een digitale motor. Zonder onderhoud begint het te haperen. Wij zorgen dat het blijft draaien, groeien en meegaat met je bedrijf, automatisch.
          </p>
        </div>

        <div className="mb-10">
          <h3 className="text-base font-semibold text-foreground mb-4 text-center">Wat zit er in onderhoud?</h3>
          <div className="rounded-lg border border-border bg-white overflow-hidden max-w-2xl mx-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Inbegrepen</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground hidden sm:table-cell">Uitleg</th>
                </tr>
              </thead>
              <tbody>
                {inbegrepen.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-3 px-4 font-medium text-foreground flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {row.label}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{row.uitleg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-sm font-medium text-foreground mt-4 max-w-xl mx-auto">
            Alles wat je systeem operationeel houdt, zonder verrassingen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={cn(
                'rounded-lg border p-5 bg-white text-center',
                tier.popular ? 'border-primary' : 'border-border'
              )}
            >
              {tier.popular && (
                <div className="text-xs font-semibold text-primary mb-2">Meest populair</div>
              )}
              <h3 className="font-semibold text-foreground mb-0.5">{tier.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{tier.sub}</p>
              <p className="text-xl font-bold text-primary mb-4">{tier.price}</p>
              <ul className="space-y-2 text-sm text-muted-foreground text-left max-w-[200px] mx-auto">
                {tier.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 max-w-xl mx-auto">
          3 maanden onderhoud gratis bij elk project, daarna automatische start.
        </p>
      </div>
    </section>
  );
}
