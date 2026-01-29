-- Profielgegevens voor brecht.leap@gmail.com bijwerken.
-- Voer uit in Supabase SQL Editor.
-- Voegt ontbrekende kolommen toe (als intentieverklaring-migratie nog niet gedraaid is), daarna UPDATE.

-- Ontbrekende kolommen toevoegen (zelfde als add-admin-user-profile-fields.sql + add-admin-user-intentieverklaring-fields.sql)
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS gsm TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS birth_place TEXT;

-- Profiel bijwerken
UPDATE admin_users
SET
  full_name = 'Brecht Sannen',
  gender = 'M',
  birth_date = '1995-07-14',
  birth_place = 'Diest',
  gsm = '+32494299633',
  updated_at = NOW()
WHERE email = 'brecht.leap@gmail.com';

-- Controleren
SELECT id, email, full_name, gender, birth_date, birth_place, gsm, updated_at
FROM admin_users
WHERE email = 'brecht.leap@gmail.com';
