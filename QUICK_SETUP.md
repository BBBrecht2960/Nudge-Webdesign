# 🚀 Snelle Setup voor Vercel

## Probleem: "Database niet geconfigureerd"

Als je deze fout ziet, zijn de environment variables niet ingesteld in Vercel.

## Oplossing in 2 stappen:

### 1️⃣ Zorg dat je `.env.local` compleet is

Zorg dat je `.env.local` alle variabelen heeft (kopieer van `env.local.template` en vul in).

### 3️⃣ Push automatisch naar Vercel

```bash
npm run vercel:env
```

**Klaar!** 🎉 

Het script pusht automatisch alle environment variables uit `.env.local` naar Vercel.

### 4️⃣ Redeploy

Ga naar Vercel Dashboard → Deployments → Redeploy (of push een nieuwe commit).

---

## Alternatief: Handmatig via Vercel Dashboard

Als je liever handmatig doet:

1. Ga naar https://vercel.com → je project → Settings → Environment Variables
2. Voeg deze toe (haal de waarden uit je `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_BUSINESS_PHONE`
   - `NEXT_PUBLIC_SITE_URL`

3. Zet ze voor **alle environments** (Production, Preview, Development)
4. Redeploy

---

## Troubleshooting

**Script werkt niet?**
- Eerste keer? Log in met: `npx vercel login`
- Check of `.env.local` bestaat en compleet is
- Check of je in de juiste directory bent

**Fout blijft bestaan?**
- Wacht even (Vercel heeft tijd nodig om variabelen te verwerken)
- Redeploy handmatig in Vercel dashboard
- Check Vercel logs voor errors
