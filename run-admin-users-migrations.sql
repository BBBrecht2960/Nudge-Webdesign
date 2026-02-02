-- Voer dit EÉN keer uit in Supabase: SQL Editor → New query → plak dit → Run.
-- Dit voegt alle ontbrekende kolommen toe aan admin_users (profile, rechten, uitgebreide velden).

-- 1. Profile-velden (naam, adres, gsm, rijksregisternummer)
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS rijksregisternummer TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS gsm TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_rijksregisternummer
  ON admin_users (rijksregisternummer) WHERE rijksregisternummer IS NOT NULL AND rijksregisternummer != '';

-- 2. Rechten (can_leads, can_customers, can_analytics, can_manage_users)
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS can_leads BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_customers BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_analytics BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_manage_users BOOLEAN NOT NULL DEFAULT false;

UPDATE admin_users
SET can_leads = true, can_customers = true, can_analytics = true, can_manage_users = true
WHERE true;

-- 3. Uitgebreide velden (formulier "Nieuwe gebruiker toevoegen")
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(1) CHECK (gender IN ('M', 'V', 'X')),
  ADD COLUMN IF NOT EXISTS birth_date VARCHAR(20),
  ADD COLUMN IF NOT EXISTS birth_place TEXT,
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS iban VARCHAR(34),
  ADD COLUMN IF NOT EXISTS bic VARCHAR(11),
  ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS account_holder VARCHAR(255),
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS emergency_contact_relation VARCHAR(100),
  ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);
