# Lead Tracking Systeem

Een uitgebreid systeem voor het volgen en beheren van leads met activiteiten, bijlagen en duidelijke statusbeschrijvingen.

## Database Setup

Voer eerst de database extensies uit:

1. Run `supabase-schema.sql` (als je dat nog niet hebt gedaan)
2. Run `supabase-schema-extensions.sql` voor de nieuwe tabellen

## Supabase Storage Setup

Voor file uploads moet je een storage bucket aanmaken:

1. Ga naar Supabase Dashboard → Storage
2. Maak een nieuwe bucket aan genaamd `lead-attachments`
3. Zet de bucket op "Public" als je directe links wilt, of "Private" voor beveiligde toegang
4. Configureer RLS policies indien nodig

## Features

### 1. Activity Timeline
- **Telefoongesprekken**: Voeg gesprekssamenvattingen toe met duur
- **E-mails**: Track e-mail communicatie
- **Meetings**: Plan en documenteer meetings
- **Notities**: Algemene notities
- **Taken**: Taken met deadline tracking
- **Offerte/Contract**: Track wanneer offertes of contracten zijn verstuurd
- **Status wijzigingen**: Automatisch geregistreerd

### 2. File Attachments
- Upload screenshots van e-mails
- Upload documenten (PDF, Word, etc.)
- Link bijlagen aan specifieke activiteiten
- Alle bestanden worden opgeslagen in Supabase Storage

### 3. Status Management
- **Nieuw**: Nieuwe lead die nog niet is gecontacteerd
- **Gecontacteerd**: Lead is gecontacteerd, wachten op reactie
- **Gekwalificeerd**: Lead heeft interesse, gesprek/offerte in voorbereiding
- **Geconverteerd**: Lead is klant geworden
- **Verloren**: Lead heeft afgehaakt

Elke status heeft een duidelijke beschrijving zodat teamleden weten wat de status betekent.

### 4. Assignment
- Wijs leads toe aan specifieke teamleden
- Zie wie verantwoordelijk is voor follow-up

## Gebruik

### Activiteit Toevoegen

1. Ga naar een lead detail pagina
2. Klik op "Activiteit toevoegen"
3. Kies het type activiteit
4. Vul de details in:
   - **Titel**: Verplicht, korte beschrijving
   - **Beschrijving**: Optionele extra details
   - **Samenvatting**: Voor gesprekken/meetings - wat is er besproken?
   - **Duur**: Voor calls/meetings in minuten
5. Klik "Toevoegen"

### Bestand Uploaden

1. Klik op "Upload bestand" in de bijlagen sectie
2. Selecteer een bestand (afbeeldingen, PDF, Word, etc.)
3. Het bestand wordt automatisch geüpload en gekoppeld aan de lead

### Status Wijzigen

1. Kies een nieuwe status in de sidebar
2. De status wordt automatisch bijgewerkt
3. Een activiteit wordt automatisch aangemaakt voor de statuswijziging

### Lead Toewijzen

1. Vul de naam of e-mail in van de persoon die de lead volgt
2. Klik "Toewijzen"
3. De lead is nu toegewezen aan die persoon

## API Routes

- `GET /api/leads/[id]/activities` - Haal alle activiteiten op
- `POST /api/leads/[id]/activities` - Maak nieuwe activiteit aan
- `GET /api/leads/[id]/attachments` - Haal alle bijlagen op
- `POST /api/leads/[id]/attachments` - Maak bijlage record aan
- `POST /api/leads/[id]/upload` - Upload bestand naar storage

## Best Practices

1. **Documenteer alles**: Voeg altijd een samenvatting toe na een gesprek
2. **Upload bewijs**: Upload screenshots van belangrijke e-mails of berichten
3. **Update status**: Houd de status up-to-date zodat het team weet waar elke lead staat
4. **Wijs toe**: Wijs leads toe aan teamleden voor duidelijke verantwoordelijkheid
5. **Gebruik beschrijvingen**: Lees de status beschrijvingen om te weten wat elke status betekent

## Troubleshooting

### Files uploaden werkt niet
- Controleer of de `lead-attachments` bucket bestaat in Supabase Storage
- Controleer of de bucket public is of RLS policies correct zijn ingesteld
- Controleer of `SUPABASE_SERVICE_ROLE_KEY` is ingesteld in `.env.local`

### Activiteiten worden niet opgeslagen
- Controleer of de database tabellen correct zijn aangemaakt
- Controleer de browser console voor errors
- Controleer of je ingelogd bent als admin
