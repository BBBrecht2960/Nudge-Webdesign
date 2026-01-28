-- Add 'canceled' status to customers project_status CHECK constraint
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_project_status_check;
ALTER TABLE customers ADD CONSTRAINT customers_project_status_check 
  CHECK (project_status IN ('new', 'in_progress', 'review', 'completed', 'on_hold', 'canceled'));
