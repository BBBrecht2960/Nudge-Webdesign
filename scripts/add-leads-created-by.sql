-- Add created_by to leads: email of admin who created the lead (for admin-created leads only)
-- Run in Supabase SQL Editor

ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

COMMENT ON COLUMN leads.created_by IS 'E-mail van het admin-account dat deze lead heeft aangemaakt (alleen bij handmatig aanmaken).';

CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
