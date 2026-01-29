-- Sales team targets: dagdoel en weekdoel (één rij voor het hele team)
-- Alleen beheerders (can_manage_users) kunnen doelen instellen.
-- Sales team ziet alleen voortgang (%), geen exacte omzet.

CREATE TABLE IF NOT EXISTS sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_target_eur NUMERIC(12,2) NOT NULL DEFAULT 0,
  weekly_target_eur NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Eén rij: insert als leeg
INSERT INTO sales_targets (id, daily_target_eur, weekly_target_eur, updated_at)
SELECT gen_random_uuid(), 0, 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM sales_targets LIMIT 1);
