import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookiebeleid - Nudge',
  description: 'Cookiebeleid en informatie over het gebruik van cookies op onze website.',
};

export default function CookieBeleidPage() {
  return (
    <main className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto prose prose-lg">
        <h1>Cookiebeleid</h1>
        
        <section>
          <h2>1. Wat zijn cookies?</h2>
          <p>
            Cookies zijn kleine tekstbestanden die op uw computer of mobiele apparaat worden opgeslagen wanneer u een website bezoekt. Ze helpen websites om informatie te onthouden over uw bezoek.
          </p>
        </section>

        <section>
          <h2>2. Welke cookies gebruiken we?</h2>
          
          <h3>Analytische cookies</h3>
          <p>
            Wij gebruiken PostHog voor analytische doeleinden om te begrijpen hoe bezoekers onze website gebruiken. Deze cookies verzamelen informatie over:
          </p>
          <ul>
            <li>Welke pagina&apos;s u bezoekt</li>
            <li>Hoe lang u op elke pagina blijft</li>
            <li>Hoe u op onze website bent gekomen</li>
            <li>Welke acties u onderneemt (bijv. formulier invullen, knop klikken)</li>
          </ul>
          <p>
            Deze informatie helpt ons om onze website te verbeteren en een betere gebruikerservaring te bieden.
          </p>
        </section>

        <section>
          <h2>3. Uw keuzes</h2>
          <p>
            U kunt cookies beheren via de instellingen van uw browser. U kunt cookies blokkeren of verwijderen, maar dit kan de functionaliteit van onze website beïnvloeden.
          </p>
          <p>
            Voor meer informatie over het beheren van cookies, raadpleeg de helpfunctie van uw browser.
          </p>
        </section>

        <section>
          <h2>4. Cookies van derden</h2>
          <p>
            Onze website gebruikt PostHog voor analytics. Deze service kan cookies plaatsen op uw apparaat. Voor meer informatie over hoe PostHog cookies gebruikt, raadpleeg hun{' '}
            <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer">
              privacybeleid
            </a>.
          </p>
        </section>

        <section>
          <h2>5. Contact</h2>
          <p>
            Voor vragen over ons cookiebeleid, neem contact met ons op via{' '}
            <a href="/contact">onze contactpagina</a>.
          </p>
        </section>

        <section>
          <h2>6. Wijzigingen</h2>
          <p>
            Wij behouden ons het recht voor om dit cookiebeleid te wijzigen. Wijzigingen worden op deze pagina gepubliceerd.
          </p>
          <p className="text-sm text-muted-foreground">
            Laatst bijgewerkt: {new Date().toLocaleDateString('nl-BE')}
          </p>
        </section>
      </div>
    </main>
  );
}
