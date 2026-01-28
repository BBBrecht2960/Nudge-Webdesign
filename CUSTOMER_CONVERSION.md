# Customer Conversion Feature

## Overzicht

Wanneer een lead wordt gemarkeerd als "converted", worden automatisch alle gegevens, offerte informatie, bijlagen en activiteiten doorgestuurd naar het klantenbestand. Een AI gegenereerde Cursor prompt wordt automatisch aangemaakt voor de developers.

## Database Setup

Voer eerst het SQL script uit om de customers tabellen aan te maken:

```sql
-- Run in Supabase SQL Editor
\i create-customers-table.sql
```

Of kopieer de inhoud van `create-customers-table.sql` naar de Supabase SQL Editor.

## Environment Variables

Voor AI prompt generatie (optioneel, maar aanbevolen):

```env
OPENAI_API_KEY=sk-...
```

Als `OPENAI_API_KEY` niet is ingesteld, wordt een basis prompt gegenereerd zonder AI.

## Functionaliteit

### Automatische Conversie

Wanneer een lead status wordt gewijzigd naar "converted":

1. **Lead Data** → Alle lead informatie wordt gekopieerd naar customer record
2. **Quote Data** → Goedgekeurde offerte wordt opgeslagen als JSON
3. **Attachments** → Alle bijlagen worden gemigreerd naar customer_attachments
4. **Activities** → Alle activiteiten worden gemigreerd naar customer_activities
5. **AI Prompt** → Automatisch gegenereerde Cursor prompt voor developers

### AI Prompt Generatie

De AI prompt bevat:
- Volledige klant informatie
- Bedrijfsgegevens
- Goedgekeurde offerte details
- Uitdagingen en pain points
- Bijlagen overzicht
- Belangrijke gesprekken/notities
- Technische requirements
- Design voorkeuren
- Functionaliteiten in detail

### Customer Management

- **Customers Pagina**: Overzicht van alle geconverteerde leads
- **Customer Detail**: Volledige project informatie, Cursor prompt, bijlagen, activiteiten
- **Project Status**: Tracking van project voortgang (new, in_progress, review, completed, on_hold)
- **Assignment**: Toewijzing aan manager en/of coder

## API Endpoints

### POST `/api/leads/[id]/convert`

Converteert een lead naar customer. Wordt automatisch aangeroepen wanneer status naar "converted" gaat.

**Response:**
```json
{
  "success": true,
  "customer": { ... },
  "message": "Lead succesvol geconverteerd naar customer"
}
```

## Database Tabellen

### `customers`
Hoofdtabel voor geconverteerde leads met alle project informatie.

### `customer_attachments`
Bijlagen gemigreerd van lead_attachments.

### `customer_activities`
Activiteiten gemigreerd van lead_activities.

## Gebruik

1. Markeer een lead als "converted" in de lead detail pagina
2. Systeem converteert automatisch naar customer
3. AI prompt wordt gegenereerd
4. Customer verschijnt in klantenbestand
5. Developers kunnen Cursor prompt gebruiken om project te starten

## Troubleshooting

### Customer wordt niet aangemaakt
- Controleer of lead status "converted" is
- Check database logs voor errors
- Verifieer dat customers tabel bestaat

### AI prompt is niet gegenereerd
- Check of `OPENAI_API_KEY` is ingesteld
- Zonder API key wordt basis prompt gebruikt
- Check console logs voor API errors

### Bijlagen/activiteiten ontbreken
- Check of lead attachments/activities bestaan
- Migratie faalt niet de hele conversie
- Check database logs voor specifieke errors
