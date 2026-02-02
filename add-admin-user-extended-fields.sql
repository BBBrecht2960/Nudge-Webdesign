-- Uitbreiding admin_users met alle velden voor het formulier "Nieuwe gebruiker toevoegen".
-- Run in Supabase SQL editor na add-admin-user-profile-fields.sql en add-admin-permissions.sql.
-- Zorgt dat POST /api/admin/users geen 500 meer geeft door ontbrekende kolommen.

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
