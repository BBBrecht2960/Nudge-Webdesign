# Vercel Deployment Checklist

## ✅ Stappen om naar Vercel te deployen

### 1. Git Commit & Push
```bash
# Alle changes committen
git add .
git commit -m "Add lead analytics, company fields, and improvements"
git push origin main
```

### 2. Vercel Project Aanmaken

**Optie A: Via Vercel Dashboard (Aanbevolen)**
1. Ga naar https://vercel.com
2. Log in met GitHub
3. Klik "Add New Project"
4. Selecteer je repository: `BBBrecht2960/Nudge-Webdesign`
5. Vercel detecteert automatisch Next.js
6. Klik "Deploy"

**Optie B: Via Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel
```

### 3. Environment Variables Instellen in Vercel

Ga naar je Vercel project → Settings → Environment Variables en voeg toe:

#### Verplicht:
```
NEXT_PUBLIC_SUPABASE_URL=https://juaawxiokaqqyispedxz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw_anon_key
SUPABASE_SERVICE_ROLE_KEY=jouw_service_role_key
```

#### Email (Resend):
```
RESEND_API_KEY=re_U2cxCjpn_BSJbmy1zb3bUiVTxdPowJt2s
RESEND_DOMAIN=onboarding.resend.dev
```


#### Business Info:
```
NEXT_PUBLIC_BUSINESS_PHONE=+32494299633
NEXT_PUBLIC_SITE_URL=https://jouw-domein.vercel.app
```

#### PostHog (optioneel, voor analytics):
```
NEXT_PUBLIC_POSTHOG_KEY=jouw_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
POSTHOG_API_KEY=jouw_posthog_api_key
NEXT_PUBLIC_POSTHOG_PROJECT_ID=jouw_project_id
```

**Belangrijk:** Zet deze voor alle environments (Production, Preview, Development)

### 4. Database Migrations Uitvoeren

Na de eerste deploy, voer deze SQL scripts uit in Supabase:

1. **Base schema** (als nog niet gedaan):
   - Run `supabase-schema.sql` in Supabase SQL Editor

2. **Extensions** (als nog niet gedaan):
   - Run `supabase-schema-extensions.sql`

3. **Quotes table** (als nog niet gedaan):
   - Run `supabase-quotes-table.sql`

4. **Company fields** (nieuw):
   - Run `add-company-fields.sql`

### 5. Supabase Storage Bucket Aanmaken

Voor file uploads:
1. Ga naar Supabase Dashboard → Storage
2. Maak bucket aan: `lead-attachments`
3. Zet op "Public" of "Private" (afhankelijk van je behoeften)
4. Configureer RLS policies indien nodig

### 6. Build Settings Controleren

Vercel detecteert automatisch:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### 7. Domain Configureren (optioneel)

1. Ga naar Settings → Domains
2. Voeg je custom domain toe
3. Volg de DNS instructies

### 8. Testen na Deploy

Na de eerste deploy, test:
- [ ] Homepage laadt
- [ ] Lead form werkt
- [ ] Admin login werkt
- [ ] Leads kunnen worden aangemaakt
- [ ] Analytics pagina werkt
- [ ] Quote builder werkt
- [ ] Email verzending werkt (test met test email)

### 9. Monitoring Setup

- Vercel Analytics (automatisch beschikbaar)
- Error tracking (overweeg Sentry)
- Uptime monitoring

## ⚠️ Belangrijke Notities

1. **Environment Variables:** Zorg dat alle env vars zijn ingesteld VOOR de eerste deploy
2. **Database:** Alle SQL scripts moeten zijn uitgevoerd
3. **Storage:** Bucket moet bestaan voor file uploads
4. **Email:** Resend API key moet geldig zijn
5. **Build Errors:** Check de build logs in Vercel als er errors zijn

## 🔧 Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Test lokaal: `npm run build`
- Check TypeScript errors: `npm run lint`

### Database Errors
- Check Supabase connection
- Verify environment variables
- Check RLS policies

### Email Not Working
- Verify Resend API key
- Check email domain settings
- Test in Resend dashboard

## 📝 Post-Deploy

Na succesvolle deploy:
1. Test alle functionaliteit
2. Check error logs
3. Monitor performance
4. Update `NEXT_PUBLIC_SITE_URL` met je echte domain
