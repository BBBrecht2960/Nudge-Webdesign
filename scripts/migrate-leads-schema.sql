-- Leads-schema: ontbrekende kolommen toevoegen (voor admin "Lead aanmaken").
-- In Supabase: SQL Editor → plak deze inhoud → Run.
-- Of in de terminal: npm run migrate-leads (met DATABASE_URL in .env.local).

ALTER TABLE leads ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_postal_code VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_city VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_country VARCHAR(100) DEFAULT 'België';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_website VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_leads_vat_number ON leads(vat_number);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
