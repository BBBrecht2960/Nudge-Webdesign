-- Verwijder alle leads en klanten BEHALVE "Roosens Horse Food".
-- Voer EÉN keer uit in Supabase SQL Editor. Niet ongedaan te maken.

-- 1. Verwijder alle klanten behalve "Roosens Horse Food"
--    (cascade verwijdert customer_attachments, customer_activities, customer_updates)
DELETE FROM customers
WHERE NOT (
  COALESCE(TRIM(company_name), '') ILIKE '%roosens horse food%'
  OR COALESCE(TRIM(name), '') ILIKE '%roosens horse food%'
);

-- 2. Verwijder alle leads behalve "Roosens Horse Food"
--    (cascade verwijdert lead_notes, lead_status_history, lead_activities, lead_attachments, lead_quotes)
DELETE FROM leads
WHERE NOT (
  COALESCE(TRIM(company_name), '') ILIKE '%roosens horse food%'
  OR COALESCE(TRIM(name), '') ILIKE '%roosens horse food%'
);
