-- Voorbeeld leads en klanten voor development/demo
-- Voer uit in Supabase SQL Editor (na supabase-schema.sql en create-customers-table.sql).
-- Werkt ook zonder add-company-fields.sql (leads gebruiken alleen basiskolommen).
-- Run eenmalig. Bij opnieuw runnen: DELETE FROM leads WHERE email LIKE 'demo-%@example.com'; idem voor customers.

INSERT INTO leads (name, email, phone, company_name, package_interest, message, status) VALUES
  ('Jan Peeters', 'demo-lead-new@example.com', '+32 470 12 34 56', 'Peeters Bakkerij', 'Standard Website', 'Graag een offerte voor een nieuwe website. We zijn een familiebakkerij met 3 vestigingen.', 'new'),
  ('Marie Dubois', 'demo-lead-contacted@example.com', '+32 498 76 54 32', 'Dubois & Co', 'Extended Website', 'Interesse in een uitgebreide bedrijfswebsite met meertalige ondersteuning.', 'contacted'),
  ('Thomas Janssens', 'demo-lead-qualified@example.com', NULL, 'Janssens Advocaten', 'Standard Website', 'Wij zoeken een professionele website voor ons advocatenkantoor.', 'qualified'),
  ('Sophie Willems', 'demo-lead-converted@example.com', '+32 3 123 45 67', 'Willems Design Studio', 'Mini Website', 'Akkoord met de offerte. Graag starten in maart.', 'converted'),
  ('Luc Vermeulen', 'demo-lead-lost@example.com', NULL, 'Vermeulen Transport', 'Basic Webshop', 'Helaas gaan we voorlopig niet verder. Budget te krap.', 'lost'),
  ('Anna Claes', 'demo-lead-extra@example.com', '+32 11 22 33 44', 'Claes Tuinarchitectuur', 'Extended Website', 'Op zoek naar een website met portfolio en contactformulier.', 'new');

-- Klanten: één gekoppeld aan de geconverteerde lead, twee standalone
INSERT INTO customers (
  lead_id,
  name, email, phone, company_name,
  vat_number, company_address, company_postal_code, company_city, company_country,
  package_interest, message, project_status, quote_total
)
SELECT
  (SELECT id FROM leads WHERE email = 'demo-lead-converted@example.com' LIMIT 1),
  'Sophie Willems',
  'demo-lead-converted@example.com',
  '+32 3 123 45 67',
  'Willems Design Studio',
  NULL,
  'Meir 50',
  '2000',
  'Antwerpen',
  'België',
  'Mini Website',
  'Klant na geconverteerde lead.',
  'in_progress',
  499.00
WHERE EXISTS (SELECT 1 FROM leads WHERE email = 'demo-lead-converted@example.com')
  AND NOT EXISTS (SELECT 1 FROM customers WHERE email = 'demo-lead-converted@example.com');

INSERT INTO customers (
  lead_id,
  name, email, phone, company_name,
  vat_number, company_address, company_postal_code, company_city, company_country,
  package_interest, message, project_status, quote_total
) VALUES
  (
    NULL,
    'Demo Klant BV',
    'demo-customer@example.com',
    '+32 2 555 00 01',
    'Demo Klant BV',
    'BE0555123456',
    'Demostraat 1',
    '1000',
    'Brussel',
    'België',
    'Standard Website',
    'Voorbeeldklant zonder gekoppelde lead.',
    'new',
    799.00
  ),
  (
    NULL,
    'Test Project NV',
    'demo-customer-2@example.com',
    NULL,
    'Test Project NV',
    NULL,
    'Testlaan 10',
    '3000',
    'Leuven',
    'België',
    'Extended Website',
    'Demo klant in review.',
    'review',
    2499.00
  );
