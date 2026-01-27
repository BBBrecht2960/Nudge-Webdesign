import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacybeleid - Almost 3000 BV',
  description: 'Privacybeleid en GDPR informatie voor onze website.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8">Privacyverklaring</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">1. Wie zijn wij?</h2>
          <p className="mb-4">
            Deze website wordt beheerd door:
          </p>
          <div className="bg-muted/50 p-4 rounded-lg mb-4">
            <p className="font-semibold mb-2">Almost 3000 BV</p>
            <p className="mb-1">Adres: Herkenrodesingel 19C/4.2, 3500 Hasselt, België</p>
            <p className="mb-1">E-mail: <a href="/contact" className="text-primary hover:underline">info@almost3000.be</a></p>
            <p>BTW-nummer: BE 1007.673.513</p>
          </div>
          <p>
            Wij hechten veel belang aan de bescherming van jouw persoonsgegevens en verwerken deze in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG / GDPR) en de Belgische privacywetgeving.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. Welke persoonsgegevens verwerken wij?</h2>
          <p className="mb-3">Wij kunnen de volgende persoonsgegevens verwerken:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Voor- en achternaam</li>
            <li>E-mailadres</li>
            <li>Telefoonnummer</li>
            <li>Bedrijfsnaam (indien opgegeven)</li>
            <li>Facturatie- en offertegegevens</li>
            <li>Communicatie via e-mail</li>
            <li>IP-adres en technische gegevens (bij websitebezoek)</li>
            <li>Website URL (indien opgegeven)</li>
            <li>Informatie over uw website behoeften en interesses</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">3. Waarom verwerken wij deze gegevens?</h2>
          <p className="mb-3">Wij verwerken jouw persoonsgegevens uitsluitend voor de volgende doeleinden:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Contact met jou opnemen naar aanleiding van een aanvraag</li>
            <li>Opstellen en versturen van offertes</li>
            <li>Uitvoeren van webdesign-, marketing- en/of SEO-diensten</li>
            <li>Administratie en facturatie</li>
            <li>Verbeteren van onze website en dienstverlening</li>
            <li>Wettelijke verplichtingen (boekhouding, fiscale verplichtingen)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">4. Rechtsgrond van de verwerking</h2>
          <p className="mb-3">Wij verwerken jouw gegevens op basis van één of meerdere van de volgende rechtsgronden:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Toestemming</strong> (bijvoorbeeld wanneer je ons contacteert via e-mail of een formulier)</li>
            <li><strong>Uitvoering van een overeenkomst</strong> (offertes, diensten)</li>
            <li><strong>Wettelijke verplichting</strong> (boekhouding, fiscale regelgeving)</li>
            <li><strong>Gerechtvaardigd belang</strong> (normale bedrijfsvoering en communicatie)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">5. Hoe lang bewaren wij jouw gegevens?</h2>
          <p className="mb-3">Wij bewaren jouw persoonsgegevens niet langer dan noodzakelijk:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Offerte- en klantgegevens:</strong> maximaal 7 jaar (boekhoudkundige verplichting)</li>
            <li><strong>E-mailcommunicatie:</strong> zolang dit relevant is voor de samenwerking</li>
            <li><strong>Websitegegevens:</strong> maximaal 26 maanden (analytics)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">6. Delen wij jouw gegevens met derden?</h2>
          <p className="mb-3">
            Jouw gegevens worden niet verkocht aan derden.
          </p>
          <p className="mb-3">
            Wij kunnen wel gebruikmaken van betrouwbare externe partijen (verwerkers), zoals:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Hostingproviders</li>
            <li>E-maildiensten</li>
            <li>Boekhoudsoftware</li>
            <li>Analytics tools (PostHog)</li>
          </ul>
          <p>
            Met deze partijen sluiten wij verwerkersovereenkomsten af zodat jouw gegevens beschermd blijven.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">7. Worden gegevens buiten de EU verwerkt?</h2>
          <p>
            Indien wij gebruikmaken van diensten buiten de Europese Economische Ruimte (bijv. Google of Meta), gebeurt dit enkel met passende waarborgen conform de AVG (zoals standaardcontractbepalingen).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">8. Jouw rechten</h2>
          <p className="mb-3">Je hebt het recht om:</p>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li>Inzage te vragen in jouw persoonsgegevens</li>
            <li>Je gegevens te laten corrigeren</li>
            <li>Je gegevens te laten verwijderen</li>
            <li>De verwerking te beperken</li>
            <li>Bezwaar te maken tegen verwerking</li>
            <li>Je toestemming in te trekken</li>
            <li>Je gegevens over te laten dragen</li>
          </ul>
          <p>
            Je kan hiervoor contact opnemen via <Link href="/contact" className="text-primary hover:underline">onze contactpagina</Link> of per e-mail.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">9. Cookies</h2>
          <p className="mb-3">Onze website maakt mogelijk gebruik van cookies.</p>
          <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
            <li><strong>Functionele cookies:</strong> noodzakelijk voor de werking van de website</li>
            <li><strong>Analytische cookies:</strong> om het gebruik van de website te analyseren</li>
            <li><strong>Marketingcookies:</strong> enkel mits jouw toestemming</li>
          </ul>
          <p>
            Meer informatie vind je in onze <Link href="/cookie-beleid" className="text-primary hover:underline">cookieverklaring</Link>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">10. Klachten</h2>
          <p className="mb-3">
            Heb je een klacht over de verwerking van jouw persoonsgegevens, dan kan je terecht bij:
          </p>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="font-semibold mb-2">Gegevensbeschermingsautoriteit (GBA)</p>
            <p className="mb-1">Drukpersstraat 35, 1000 Brussel</p>
            <p className="mb-1">
              📧 <a href="mailto:contact@apd-gba.be" className="text-primary hover:underline">contact@apd-gba.be</a>
            </p>
            <p>
              🌐 <a href="https://www.gegevensbeschermingsautoriteit.be" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.gegevensbeschermingsautoriteit.be</a>
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">11. Wijzigingen</h2>
          <p className="mb-4">
            Wij behouden ons het recht voor deze privacyverklaring aan te passen. De meest recente versie is steeds beschikbaar op deze website.
          </p>
          <p className="text-sm text-muted-foreground">
            Laatst bijgewerkt: {new Date().toLocaleDateString('nl-BE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </section>

        <div className="mt-10 pt-6 border-t border-border">
          <Link 
            href="/contact" 
            className="inline-block text-primary hover:underline font-medium"
          >
            ← Terug naar contact
          </Link>
        </div>
      </div>
    </main>
  );
}
