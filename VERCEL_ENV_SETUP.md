# Vercel Environment Variables Setup

## Probleem: "Database niet geconfigureerd"

Deze foutmelding verschijnt wanneer de Supabase environment variables niet zijn ingesteld in Vercel.

## Oplossing: Environment Variables Toevoegen

### Stap 1: Ga naar Vercel Dashboard

1. Ga naar https://vercel.com
2. Log in met je account
3. Selecteer je project: **Nudge-Webdesign**
4. Ga naar **Settings** → **Environment Variables**

### Stap 2: Voeg de Verplichte Variabelen Toe

Voeg de volgende environment variables toe. Zorg dat je ze instelt voor **alle environments** (Production, Preview, Development):

#### 1. Supabase Database (VERPLICHT)

```
NEXT_PUBLIC_SUPABASE_URL=https://juaawxiokaqqyispedxz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw_anon_key_hier
SUPABASE_SERVICE_ROLE_KEY=jouw_service_role_key_hier
```

**Waar vind je deze keys?**
- Ga naar je Supabase project: https://supabase.com/dashboard
- Ga naar **Settings** → **API**
- Kopieer:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Geheim, nooit delen!)

#### 2. Email (Resend) - Voor Quote Verzending

```
RESEND_API_KEY=re_U2cxCjpn_BSJbmy1zb3bUiVTxdPowJt2s
RESEND_DOMAIN=onboarding.resend.dev
```

#### 3. Business Info

```
NEXT_PUBLIC_BUSINESS_PHONE=+32494299633
NEXT_PUBLIC_SITE_URL=https://nudge-webdesign.vercel.app
```

**Let op:** Update `NEXT_PUBLIC_SITE_URL` naar je echte domain als je die hebt.

#### 4. PostHog (Optioneel - voor analytics)

```
NEXT_PUBLIC_POSTHOG_KEY=jouw_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
POSTHOG_API_KEY=jouw_posthog_api_key
NEXT_PUBLIC_POSTHOG_PROJECT_ID=jouw_project_id
```

### Stap 3: Redeploy

Na het toevoegen van de environment variables:

1. Ga naar **Deployments** tab
2. Klik op de 3 dots (⋯) naast de laatste deployment
3. Klik **Redeploy**
4. Of push een nieuwe commit naar GitHub (Vercel deployt automatisch)

### Stap 4: Testen

Na de redeploy, test:
- [ ] Homepage laadt
- [ ] Contact formulier werkt (geen "Database niet geconfigureerd" error)
- [ ] Lead wordt opgeslagen in Supabase
- [ ] Admin login werkt

## Belangrijke Notities

1. **Environment Variables zijn case-sensitive** - typ ze exact zoals hierboven
2. **Zet ze voor alle environments** - Production, Preview, Development
3. **Geen spaties** rond de `=` in de waarden
4. **Service Role Key is geheim** - nooit delen of committen naar Git

## Troubleshooting

### Fout blijft bestaan na redeploy
- Controleer of de variabelen correct zijn getypt
- Controleer of ze zijn ingesteld voor de juiste environment (Production)
- Check de Vercel build logs voor errors

### Database connectie werkt niet
- Controleer of de Supabase URL correct is (zonder trailing slash)
- Controleer of de anon key correct is gekopieerd (geen extra spaties)
- Test de keys lokaal in `.env.local` eerst

### Email verzending werkt niet
- Controleer of `RESEND_API_KEY` correct is
- Check Resend dashboard voor API limits
- Test met een test email eerst
