-- Uitbreiding admin_users met gegevens voor administratie en contracten (interim e.d.).
-- Run in Supabase SQL editor.

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS rijksregisternummer TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS gsm TEXT;

-- Optioneel: index voor lookup op rijksregisternummer (uniek per persoon)
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_rijksregisternummer
  ON admin_users (rijksregisternummer) WHERE rijksregisternummer IS NOT NULL AND rijksregisternummer != '';
