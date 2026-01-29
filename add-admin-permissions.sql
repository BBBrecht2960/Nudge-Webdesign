-- Add permission columns to admin_users for per-profile access control.
-- Run in Supabase SQL editor after admin_users exists.

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS can_leads BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_customers BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_analytics BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_manage_users BOOLEAN NOT NULL DEFAULT false;

-- Existing admins keep full access (no breaking change)
UPDATE admin_users
SET can_leads = true, can_customers = true, can_analytics = true, can_manage_users = true
WHERE true;
