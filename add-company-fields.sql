-- Bedrijfsgegevens-kolommen voor leads (BTW, adres, website, rekeningnummer)
-- Voer uit in Supabase SQL Editor: SQL Editor → New query → plak dit script → Run

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS company_address TEXT,
  ADD COLUMN IF NOT EXISTS company_postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS company_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_website VARCHAR(500),
  ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);

-- Customers: zelfde kolommen toevoegen indien de tabel al bestaat maar kolommen ontbreken
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS company_address TEXT,
  ADD COLUMN IF NOT EXISTS company_postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS company_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_website VARCHAR(500),
  ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);
