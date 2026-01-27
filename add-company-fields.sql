-- Add company/business information fields to leads table
-- Run this in your Supabase SQL editor

-- Add business information columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_postal_code VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_city VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_country VARCHAR(100) DEFAULT 'België';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_website VARCHAR(255);

-- Add index on VAT number for searching
CREATE INDEX IF NOT EXISTS idx_leads_vat_number ON leads(vat_number);

-- Add comment for documentation
COMMENT ON COLUMN leads.vat_number IS 'BTW-nummer van het bedrijf';
COMMENT ON COLUMN leads.company_address IS 'Adres van het bedrijf';
COMMENT ON COLUMN leads.company_postal_code IS 'Postcode van het bedrijf';
COMMENT ON COLUMN leads.company_city IS 'Stad van het bedrijf';
COMMENT ON COLUMN leads.company_country IS 'Land van het bedrijf';
COMMENT ON COLUMN leads.company_website IS 'Website URL van het bedrijf';
