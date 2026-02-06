-- =============================================================================
-- Database up-to-date – Nudge Webdesign
-- =============================================================================
-- Voer dit EÉN keer uit in Supabase: SQL Editor → New query → plak → Run.
-- Zorgt dat alle tabellen en kolommen overeenkomen met de huidige app.
-- Vereist: base schema al aanwezig (supabase-schema.sql + create-customers-table.sql).
-- Veilig om meerdere keren te runnen (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- =============================================================================

-- ----- 1. Leads: extra velden -----
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255),
  ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS company_address TEXT,
  ADD COLUMN IF NOT EXISTS company_postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS company_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_website VARCHAR(500),
  ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

-- ----- 2. Customers: ontbrekende kolommen + status canceled -----
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS company_address TEXT,
  ADD COLUMN IF NOT EXISTS company_postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS company_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_website VARCHAR(500),
  ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_project_status_check;
ALTER TABLE customers ADD CONSTRAINT customers_project_status_check
  CHECK (project_status IN ('new', 'in_progress', 'review', 'completed', 'on_hold', 'canceled'));

-- ----- 3. Admin sessies -----
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_email ON admin_sessions(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- ----- 4. Lead activities -----
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'status_change', 'task', 'quote_sent', 'contract_sent')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  summary TEXT,
  duration_minutes INTEGER,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(activity_type);

-- ----- 5. Lead attachments -----
CREATE TABLE IF NOT EXISTS lead_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES lead_activities(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  description TEXT,
  uploaded_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_attachments_lead_id ON lead_attachments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_attachments_activity_id ON lead_attachments(activity_id);

-- ----- 6. Lead status descriptions -----
CREATE TABLE IF NOT EXISTS lead_status_descriptions (
  status VARCHAR(50) PRIMARY KEY,
  name_nl VARCHAR(100) NOT NULL,
  description_nl TEXT NOT NULL,
  color VARCHAR(20) NOT NULL,
  order_index INTEGER NOT NULL
);
INSERT INTO lead_status_descriptions (status, name_nl, description_nl, color, order_index) VALUES
  ('new', 'Nieuw', 'Nieuwe lead die nog niet is gecontacteerd.', 'gray', 1),
  ('contacted', 'Gecontacteerd', 'Lead is gecontacteerd. Wachten op reactie of follow-up.', 'yellow', 2),
  ('qualified', 'Gekwalificeerd', 'Lead heeft interesse getoond. Gesprek of offerte in voorbereiding.', 'blue', 3),
  ('converted', 'Geconverteerd', 'Lead is klant geworden. Project kan starten.', 'green', 4),
  ('lost', 'Verloren', 'Lead heeft afgehaakt of is niet meer geïnteresseerd.', 'red', 5)
ON CONFLICT (status) DO NOTHING;

-- ----- 7. Lead quotes -----
CREATE TABLE IF NOT EXISTS lead_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  quote_data JSONB NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  sent_at TIMESTAMP,
  expires_at TIMESTAMP,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lead_quotes_lead_id ON lead_quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_quotes_status ON lead_quotes(status);
CREATE INDEX IF NOT EXISTS idx_lead_quotes_created_at ON lead_quotes(created_at DESC);

CREATE OR REPLACE FUNCTION update_lead_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_lead_quotes_updated_at ON lead_quotes;
CREATE TRIGGER update_lead_quotes_updated_at
  BEFORE UPDATE ON lead_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_quotes_updated_at();

-- ----- 8. Admin users: profile, rechten, uitgebreide velden -----
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS rijksregisternummer TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS gsm TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_rijksregisternummer
  ON admin_users (rijksregisternummer) WHERE rijksregisternummer IS NOT NULL AND rijksregisternummer != '';

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS can_leads BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_customers BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_analytics BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_manage_users BOOLEAN NOT NULL DEFAULT false;

UPDATE admin_users
SET can_leads = true, can_customers = true, can_analytics = true, can_manage_users = true
WHERE true;

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

-- ----- 9. Sales targets -----
CREATE TABLE IF NOT EXISTS sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_target_eur NUMERIC(12,2) NOT NULL DEFAULT 0,
  weekly_target_eur NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO sales_targets (id, daily_target_eur, weekly_target_eur, updated_at)
SELECT gen_random_uuid(), 0, 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM sales_targets LIMIT 1);

-- ----- 10. Customer updates & progress history -----
CREATE TABLE IF NOT EXISTS customer_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  update_type VARCHAR(50) DEFAULT 'progress' CHECK (update_type IN ('progress', 'milestone', 'issue', 'note', 'change')),
  progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  milestone VARCHAR(255),
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_updates_customer_id ON customer_updates(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_updates_created_at ON customer_updates(created_at DESC);

CREATE TABLE IF NOT EXISTS customer_progress_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  notes TEXT,
  changed_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_progress_history_customer_id ON customer_progress_history(customer_id);

-- ----- 11. Admin user documents (paspoort + NDA) -----
CREATE TABLE IF NOT EXISTS admin_user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('passport_front', 'passport_back', 'nda')),
  storage_path TEXT NOT NULL,
  file_name TEXT,
  content_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(admin_user_id, document_type)
);
CREATE INDEX IF NOT EXISTS idx_admin_user_documents_admin_user_id ON admin_user_documents(admin_user_id);

-- Bestaande tabel: constraint bijwerken naar nda toestaan (app gebruikt document_type 'nda')
ALTER TABLE admin_user_documents DROP CONSTRAINT IF EXISTS admin_user_documents_document_type_check;
ALTER TABLE admin_user_documents ADD CONSTRAINT admin_user_documents_document_type_check
  CHECK (document_type IN ('passport_front', 'passport_back', 'nda'));

DROP TRIGGER IF EXISTS update_admin_user_documents_updated_at ON admin_user_documents;
CREATE TRIGGER update_admin_user_documents_updated_at
  BEFORE UPDATE ON admin_user_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Einde database-up-to-date.sql
-- =============================================================================
