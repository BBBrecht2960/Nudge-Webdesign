# Setup Instructies

## Stap 1: Database Setup

### Supabase (Aanbevolen)

1. Maak een account aan op [supabase.com](https://supabase.com)
2. Maak een nieuw project aan
3. Ga naar **SQL Editor** → New query
4. Kopieer de volledige inhoud van `supabase-schema.sql` en plak die in de query
5. Klik **Run** om alle tabellen (leads, admin_users, enz.) aan te maken
6. Ga naar **Settings** (icoon onderaan) → **API**
7. Kopieer deze waarden voor `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (onder “Project API keys”) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (onder “Project API keys”, verborgen – klik “Reveal”) → `SUPABASE_SERVICE_ROLE_KEY` *(nodig voor admin-login en het aanmaken van admin-gebruikers)*

### Neon (Alternatief)

1. Maak een account aan op [neon.tech](https://neon.tech)
2. Maak een nieuw project aan
3. Gebruik de connection string als `DATABASE_URL`
4. Voer `supabase-schema.sql` uit in de SQL editor

## Stap 2: PostHog Setup

1. Maak een account aan op [posthog.com](https://posthog.com)
2. Maak een nieuw project aan
3. Ga naar Project Settings
4. Kopieer de Project API Key → `NEXT_PUBLIC_POSTHOG_KEY`
5. Noteer de host (standaard: `https://us.i.posthog.com`) → `NEXT_PUBLIC_POSTHOG_HOST`

## Stap 3: Admin User Aanmaken

### Optie 1: Via Supabase SQL Editor

```sql
-- Vervang 'your_password' met een wachtwoord en hash het met bcrypt
-- Gebruik een online bcrypt tool of Node.js:

-- In Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('your_password', 10);
-- console.log(hash);

INSERT INTO admin_users (email, password_hash)
VALUES ('admin@example.com', 'your_bcrypt_hash_here');
```

### Optie 2: Via Node.js Script

Maak een tijdelijk script `create-admin.js`:

```javascript
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const email = 'admin@example.com';
  const password = 'your_secure_password';
  const hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('admin_users')
    .insert({ email, password_hash: hash });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Admin user created:', email);
  }
}

createAdmin();
```

Run: `node create-admin.js`

### Optie 3: Test admin (voor development)

Voor snelle inlog tijdens development:

1. Voeg toe aan `.env.local`:

```env
TEST_ADMIN_EMAIL=test@example.com
TEST_ADMIN_PASSWORD=TestAdmin123!
ENABLE_TEST_LOGIN=true
NEXT_PUBLIC_ENABLE_TEST_LOGIN=true
```

2. Maak het test account aan:

```bash
npm run create-test-admin
```

3. Start de dev server. Op `/admin` verschijnt onder de inlogknop de link **"Inloggen als test admin"**. Eén klik logt in zonder handmatig e-mail/wachtwoord in te vullen.

**Let op:** Zet `ENABLE_TEST_LOGIN` en `NEXT_PUBLIC_ENABLE_TEST_LOGIN` nooit op `true` in productie. De test-login is automatisch uitgeschakeld wanneer `NODE_ENV=production`.

## Stap 4: Environment Variables

Maak in de **projectroot** een bestand `.env.local` (deze staat in `.gitignore` en wordt nooit gecommit):

```env
# Supabase (verplicht voor database én admin-login)
NEXT_PUBLIC_SUPABASE_URL=https://jouw-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=jouw_service_role_key

# PostHog (optioneel)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Authentication (voor NextAuth, indien gebruikt)
NEXTAUTH_SECRET=generate_a_random_secret_here
NEXTAUTH_URL=http://localhost:3000

# Test admin (alleen voor development – optioneel)
# TEST_ADMIN_EMAIL=test@example.com
# TEST_ADMIN_PASSWORD=TestAdmin123!
# ENABLE_TEST_LOGIN=true
# NEXT_PUBLIC_ENABLE_TEST_LOGIN=true

# KBO / Kruispuntbank – bedrijfsgegevens ophalen op BTW-nummer (optioneel)
# Zonder deze key werkt de knop "Ophalen uit KBO" niet; met key wel. Key nooit committen.
# KBO_PARTY_API_KEY=jouw_key_van_kbo_party
# Of: CBEAPI_KEY=jouw_key_van_cbeapi_be
```

**Belangrijk:** `SUPABASE_SERVICE_ROLE_KEY` is nodig om in te loggen als admin. Zet deze alleen in `.env.local`, nooit in code of in Git.

### KBO-key (optioneel): hoe laat je het werken zonder de key te committen?

- **Lokaal:** Zet in `.env.local` de regel `KBO_PARTY_API_KEY=jouw_key` (of `CBEAPI_KEY=...`). Dit bestand staat in `.gitignore` en wordt nooit gecommit, dus de key blijft alleen op jouw machine.
- **Productie (bijv. Vercel):** Ga naar je project → **Settings** → **Environment Variables** → voeg toe: naam `KBO_PARTY_API_KEY`, waarde = jouw key. Dan werkt "Ophalen uit KBO" ook na deploy.
- **Andere machine / team:** Na `git clone` kopieer `env.local.template` naar `.env.local` en vul daar de keys in (inclusief optioneel `KBO_PARTY_API_KEY`). De code staat in Git; de keys alleen lokaal en in de hosting-omgeving.

### NEXTAUTH_SECRET genereren

```bash
openssl rand -base64 32
```

Of gebruik een online random string generator (minimaal 32 karakters).

## Stap 5: Business Information Updaten

Update de volgende bestanden met uw bedrijfsgegevens:

1. **`app/components/StructuredData.tsx`**
   - Bedrijfsnaam
   - Adres
   - Telefoonnummer
   - E-mailadres
   - Website URL

2. **`app/components/StickyMobileCTA.tsx`**
   - Telefoonnummer in `href="tel:+32XXXXXXXXX"`

3. **`app/layout.tsx`**
   - OpenGraph URL
   - Twitter card URL

4. **`app/sitemap.ts`**
   - Base URL

5. **`app/robots.ts`**
   - Sitemap URL

## Stap 6: Development Server Starten

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Stap 7: Testen

1. **Lead Form**: Vul het formulier in op de homepage
2. **Admin Login**: Ga naar `/admin` en log in
3. **Leads Dashboard**: Controleer of de lead zichtbaar is
4. **PostHog**: Controleer of events worden getracked

## Stap 8: Production Deployment

### Vercel

1. Push code naar GitHub
2. Import project in Vercel
3. Voeg alle environment variables toe
4. Update `NEXTAUTH_URL` naar uw productie URL
5. Deploy

### Environment Variables voor Productie

Zorg ervoor dat alle environment variables zijn ingesteld:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (uw productie URL, bijv. `https://yourwebsite.com`)

## Troubleshooting

### Database connectie problemen
- Controleer of de Supabase URL en key correct zijn
- Controleer of de database tables zijn aangemaakt
- Controleer Supabase logs voor errors

### PostHog tracking werkt niet
- Controleer of `NEXT_PUBLIC_POSTHOG_KEY` is ingesteld
- Open browser console en controleer voor errors
- Controleer PostHog dashboard voor events

### Admin login werkt niet
- Controleer of admin user is aangemaakt in database
- Controleer of wachtwoord hash correct is
- Controleer browser cookies (admin_session)

### Form submission faalt
- Controleer database connectie
- Controleer browser console voor errors
- Controleer API route logs
