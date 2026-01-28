import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Algemene voorwaarden - Nudge Webdesign',
  description: 'Algemene voorwaarden van Nudge Webdesign (Almost 3000 BV) voor websites, webshops en digitale diensten.',
};

export default function AlgemeneVoorwaardenPage() {
  return (
    <main className="min-h-screen py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-4xl mx-auto bg-white dark:bg-card rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 lg:p-10 w-full min-w-0 border border-border">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 break-words">Algemene voorwaarden</h1>
        <p className="text-sm text-muted-foreground mb-6 sm:mb-8">
          Laatst bijgewerkt: {new Date().toLocaleDateString('nl-BE', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="prose prose-sm sm:prose max-w-none dark:prose-invert">
          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">1. Toepassingsgebied en definities</h2>
            <p className="mb-3 break-words">
              Deze algemene voorwaarden zijn van toepassing op alle offertes, overeenkomsten en diensten van <strong>Almost 3000 BV</strong>, handelend onder de naam Nudge Webdesign (hierna: &quot;de Leverancier&quot;), met de opdrachtgever (hierna: &quot;de Opdrachtgever&quot;). Afwijkingen zijn alleen geldig indien schriftelijk overeengekomen.
            </p>
            <p className="mb-3 break-words">
              Onder &quot;diensten&quot; worden onder meer begrepen: het ontwerpen, ontwikkelen, hosten, onderhouden en beheren van websites, webshops, webapplicaties, SEO, content creatie en alle daarmee verband houdende diensten.
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">2. Offertes en totstandkoming overeenkomst</h2>
            <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
              <li className="break-words">Alle offertes zijn vrijblijvend tenzij uitdrukkelijk anders vermeld of een aanvaardingstermijn is gesteld.</li>
              <li className="break-words">Offertes zijn 30 dagen geldig tenzij anders vermeld.</li>
              <li className="break-words">De overeenkomst komt tot stand door schriftelijke (waaronder e-mail) aanvaarding van de offerte door de Opdrachtgever, of door het verrichten van werkzaamheden waartoe de Leverancier door de Opdrachtgever is gemandateerd.</li>
              <li className="break-words">Door opdrachtbevestiging of aanvaarding verklaart de Opdrachtgever deze algemene voorwaarden te hebben gelezen en te aanvaarden.</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">3. Uitvoering, levering en acceptatie</h2>
            <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
              <li className="break-words">De Leverancier voert de overeenkomst naar beste inzicht en vermogen uit. Genoemde termijnen zijn indicatief en niet fatale termijnen, tenzij uitdrukkelijk schriftelijk anders overeengekomen.</li>
              <li className="break-words">De Opdrachtgever verschaft tijdig alle informatie, materiaal en toegang (zoals inloggegevens, content, logo&apos;s) die voor de uitvoering nodig zijn. Vertraging door het ontbreken daarvan komt niet voor rekening van de Leverancier.</li>
              <li className="break-words">Levering geschiedt in onderling overleg (o.a. online, via staging-omgeving of overdracht van bestanden). De Opdrachtgever onderzoekt het geleverde binnen 14 dagen op overeenstemming met de overeenkomst. Gebrek aan (tijdige) reactie geldt als stilzwijgende acceptatie.</li>
              <li className="break-words">Kleine afwijkingen die de bruikbaarheid niet wezenlijk aantasten, geven geen recht op ontbinding of prijsvermindering.</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">4. Prijzen, betaling en betalingsverzuim</h2>
            <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
              <li className="break-words">Alle prijzen zijn in euro&apos;s en exclusief BTW tenzij uitdrukkelijk anders vermeld.</li>
              <li className="break-words">Facturen zijn binnen 14 dagen na factuurdatum betaalbaar, tenzij anders schriftelijk overeengekomen. Betaling geschiedt door overschrijving op de vermelde rekening.</li>
              <li className="break-words">Bij betalingsverzuim is de Opdrachtgever van rechtswege in gebreke. Vanaf de vervaldag zijn wettelijke interest verschuldigd. Daarnaast is een forfaitaire vergoeding van 10% van het openstaande bedrag verschuldigd, met een minimum van € 50, zonder voorrecht op het bewijs van hogere schade.</li>
              <li className="break-words">De Leverancier is gerechtigd voorschotten of tussentijdse facturatie te verlangen. Bij projecten kan een betalingsschema worden overeengekomen.</li>
              <li className="break-words">Kosten van incasso en gerechtelijke procedures komen voor rekening van de Opdrachtgever bij betalingsverzuim.</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">5. Intellectueel eigendom en licentie</h2>
            <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
              <li className="break-words">Alle intellectuele eigendomsrechten op door de Leverancier ontwikkelde of geleverde materialen (inclusief ontwerpen, code, documentatie) berusten bij de Leverancier, tenzij partijen uitdrukkelijk schriftelijk anders overeenkomen.</li>
              <li className="break-words">Na volledige betaling van alle verschuldigde bedragen verleent de Leverancier de Opdrachtgever een niet-exclusieve, wereldwijde licentie om het specifiek voor de Opdrachtgever gemaakte eindresultaat (website, webshop, applicatie) te gebruiken voor het beoogde doel. Voor open source, frameworks en door derden geleverde onderdelen blijven de respectievelijke licenties van toepassing.</li>
              <li className="break-words">De Leverancier behoudt het recht om algemene kennis en technieken te gebruiken voor andere opdrachten. Broncode wordt niet standaard overgedragen tenzij schriftelijk overeengekomen.</li>
              <li className="break-words">Door de Leverancier geleverde content (teksten, afbeeldingen) van derden blijft eigendom van de rechthebbenden; de Opdrachtgever zorgt voor de nodige rechten of licentie.</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">6. Aansprakelijkheid</h2>
            <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
              <li className="break-words">De aansprakelijkheid van de Leverancier is beperkt tot het bedrag dat in het betreffende geval door de aansprakelijkheidsverzekering wordt gedekt, en voor zover niet gedekt, tot het bedrag van de facturatie van de opdracht in de afgelopen 12 maanden (excl. BTW), met een maximum van € 5.000 per gebeurtenis.</li>
              <li className="break-words">De Leverancier is niet aansprakelijk voor indirecte schade, gevolgschade, gederfde winst, gemiste besparingen, schade aan gegevens of reputatieschade.</li>
              <li className="break-words">De Leverancier is niet aansprakelijk voor schade voortvloeiend uit handelingen of nalatigheden van de Opdrachtgever of derden, of uit het gebruik van door de Opdrachtgever of derden aangeleverde content of software.</li>
              <li className="break-words">Aansprakelijkheid voor schade als gevolg van veroudering, hacking, DDoS of andere externe invloeden op systemen en netwerken is uitgesloten voor zover de Leverancier redelijke maatregelen heeft getroffen.</li>
              <li className="break-words">Elke aansprakelijkheid vervalt 12 maanden na het ontstaan van de schade.</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">7. Overmacht</h2>
            <p className="mb-3 break-words">
              Noch de Leverancier noch de Opdrachtgever is gehouden tot nakoming van enige verplichting indien zij daarin verhinderd worden door overmacht. Onder overmacht wordt mede begrepen: oorlog, natuurrampen, stakingen, overheidsmaatregelen, uitval van netwerken of essentiële derden (hosting, domein, API&apos;s), en alle overige omstandigheden buiten de redelijke controle van de partij die zich op overmacht beroept.
            </p>
            <p className="break-words">
              Bij overmacht kunnen de verplichtingen worden opgeschort. Duurt de overmacht langer dan 90 dagen, dan is elk der partijen gerechtigd de overeenkomst te ontbinden zonder verplichting tot schadevergoeding.
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">8. Geheimhouding</h2>
            <p className="mb-3 break-words">
              Partijen zijn verplicht tot geheimhouding van alle vertrouwelijke informatie die zij in het kader van de overeenkomst verkrijgen. Deze verplichting blijft bestaan na beëindiging van de overeenkomst. Uitgezonderd is informatie die openbaar is of door de wederpartij schriftelijk vrijgegeven mag worden.
            </p>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">9. Duur, opzegging en ontbinding</h2>
            <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
              <li className="break-words">Eenmalige projecten eindigen na oplevering en acceptatie (of stilzwijgende acceptatie). Abonnementen (hosting, onderhoud) lopen voor onbepaalde tijd tenzij anders overeengekomen en kunnen worden opgezegd met inachtneming van een opzegtermijn van minimaal 30 dagen voor het einde van een facturatieperiode.</li>
              <li className="break-words">Ontbinding (ook wegens wanprestatie) geschiedt schriftelijk. Bij ontbinding door de Opdrachtgever zonder dat de Leverancier tekortschiet, is de Leverancier gerechtigd op reeds verrichte werkzaamheden te factureren en eventuele vooruitbetalingen te behouden voor zover redelijk.</li>
              <li className="break-words">Bij ontbinding door de Leverancier wegens wanprestatie van de Opdrachtgever (waaronder niet-betaling of niet-tijdig aanleveren van materiaal) is de Leverancier gerechtigd tot schadevergoeding over reeds verricht werk en gemaakte kosten.</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">10. Klachten en geschillen</h2>
            <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
              <li className="break-words">Klachten over geleverde prestaties moeten binnen 14 dagen na ontdekking schriftelijk worden gemeld. Na deze termijn worden klachten niet in behandeling genomen.</li>
              <li className="break-words">Op alle overeenkomsten is uitsluitend Belgisch recht van toepassing.</li>
              <li className="break-words">Geschillen worden voorgelegd aan de bevoegde rechtbank van het gerechtelijk arrondissement waar de Leverancier zijn zetel heeft, tenzij de wet dwingend een andere rechter aanwijst.</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">11. Overige bepalingen</h2>
            <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4">
              <li className="break-words">Indien een bepaling van deze voorwaarden nietig of niet-afdwingbaar is, blijven de overige bepalingen van kracht.</li>
              <li className="break-words">De Leverancier is gerechtigd deze algemene voorwaarden te wijzigen. De geldende versie is gepubliceerd op de website. Voor lopende overeenkomsten gelden de voorwaarden zoals die op het moment van opdrachtbevestiging golden, tenzij partijen anders overeenkomen.</li>
            </ul>
          </section>

          <section className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">12. Contact</h2>
            <div className="bg-muted/50 dark:bg-muted/30 p-3 sm:p-4 rounded-lg">
              <p className="font-semibold mb-2 break-words">Almost 3000 BV (Nudge Webdesign)</p>
              <p className="mb-1 break-words">Herkenrodesingel 19C/4.2, 3500 Hasselt, België</p>
              <p className="mb-1 break-words">E-mail: <a href="mailto:info@almost3000.be" className="text-primary hover:underline break-all">info@almost3000.be</a></p>
              <p className="break-words">BTW-nummer: BE 1007.673.513</p>
            </div>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-4">
          <Link href="/contact" className="inline-block text-primary hover:underline font-medium">
            ← Terug naar contact
          </Link>
          <Link href="/privacy" className="inline-block text-muted-foreground hover:text-foreground">
            Privacybeleid
          </Link>
          <Link href="/cookie-beleid" className="inline-block text-muted-foreground hover:text-foreground">
            Cookiebeleid
          </Link>
        </div>
      </div>
    </main>
  );
}
