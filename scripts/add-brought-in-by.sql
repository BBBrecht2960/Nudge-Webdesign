-- Binnengebracht door: attributie voor Sales/Team (ook voor website-leads)
-- Voer uit in Supabase SQL Editor (eenmalig)

ALTER TABLE leads ADD COLUMN IF NOT EXISTS brought_in_by VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_leads_brought_in_by ON leads(brought_in_by);
COMMENT ON COLUMN leads.brought_in_by IS 'Lead binnengebracht door (sales/team); gebruikt in Sales-tab. Bij leeg: created_by of Onbekend.';
