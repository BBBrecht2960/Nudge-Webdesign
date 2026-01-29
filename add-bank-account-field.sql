-- Optioneel rekeningnummer (IBAN) voor facturatie
-- Voer uit in Supabase SQL Editor als de kolommen nog niet bestaan.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);

COMMENT ON COLUMN leads.bank_account IS 'Rekeningnummer/IBAN voor facturatie (optioneel)';
COMMENT ON COLUMN customers.bank_account IS 'Rekeningnummer/IBAN voor facturatie (optioneel)';
