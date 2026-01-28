/**
 * Voert de ontbrekende kolommen op de leads-tabel uit.
 * Eenmalig uitvoeren: npm run migrate-leads
 * Vereist: DATABASE_URL in .env.local (Supabase → Settings → Database → Connection string)
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Client } from 'pg';

// .env.local laden als DATABASE_URL nog niet gezet is
if (!process.env.DATABASE_URL) {
  const envPath = resolve(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const idx = line.indexOf('=');
      if (idx > 0 && line.slice(0, idx).trim() === 'DATABASE_URL') {
        const val = line.slice(idx + 1).replace(/^["'\s]+|["'\s]+$/g, '').trim();
        if (val) process.env.DATABASE_URL = val;
        break;
      }
    }
  }
}

const MIGRATIONS = [
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50)`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_address TEXT`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_postal_code VARCHAR(20)`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_city VARCHAR(100)`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_country VARCHAR(100) DEFAULT 'België'`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_website VARCHAR(255)`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by VARCHAR(255)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_vat_number ON leads(vat_number)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by)`,
];

async function main() {
  let url = process.env.DATABASE_URL;
  if (!url || /JE_WACHTWOORD|xxxxx|YOUR_PASSWORD|your_password/i.test(url)) {
    console.error('DATABASE_URL moet je echte Supabase connection string zijn.');
    console.error('Vervang in .env.local de placeholder (postgres.xxxxx / JE_WACHTWOORD) door de echte waarden.');
    console.error('Supabase: Settings → Database → Connection string (URI) + Database password');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    for (const sql of MIGRATIONS) {
      await client.query(sql);
    }
    console.log('Leads-schema bijgewerkt. Kolommen company_address, vat_number, created_by, etc. zijn toegevoegd.');
  } catch (e) {
    console.error('Migratie mislukt:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
