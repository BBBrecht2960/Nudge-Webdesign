-- Extensions to the existing schema for enhanced lead tracking
-- Run this AFTER the base schema (supabase-schema.sql)

-- Add assigned_to field to leads table (for tracking who handles the lead)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255);

-- Lead activities table (for tracking all interactions: calls, emails, meetings, etc.)
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'status_change', 'task', 'quote_sent', 'contract_sent')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  summary TEXT, -- For call/meeting summaries
  duration_minutes INTEGER, -- For calls/meetings
  created_by VARCHAR(255), -- Email or name of person who created this
  created_at TIMESTAMP DEFAULT NOW(),
  scheduled_at TIMESTAMP, -- For scheduled activities
  completed_at TIMESTAMP -- For tasks
);

-- Lead attachments table (for screenshots, documents, etc.)
CREATE TABLE IF NOT EXISTS lead_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES lead_activities(id) ON DELETE CASCADE, -- Optional: link to specific activity
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL, -- URL to file in storage (Supabase Storage or external)
  file_type VARCHAR(100), -- MIME type
  file_size INTEGER, -- Size in bytes
  description TEXT, -- Optional description
  uploaded_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Status descriptions table (for clear status explanations)
CREATE TABLE IF NOT EXISTS lead_status_descriptions (
  status VARCHAR(50) PRIMARY KEY,
  name_nl VARCHAR(100) NOT NULL,
  description_nl TEXT NOT NULL,
  color VARCHAR(20) NOT NULL, -- For UI styling
  order_index INTEGER NOT NULL -- For ordering in UI
);

-- Insert default status descriptions
INSERT INTO lead_status_descriptions (status, name_nl, description_nl, color, order_index) VALUES
  ('new', 'Nieuw', 'Nieuwe lead die nog niet is gecontacteerd. Eerste contact moet nog plaatsvinden.', 'gray', 1),
  ('contacted', 'Gecontacteerd', 'Lead is gecontacteerd (telefoon, email of andere vorm). Wachten op reactie of follow-up gepland.', 'yellow', 2),
  ('qualified', 'Gekwalificeerd', 'Lead heeft interesse getoond en voldoet aan de criteria. Gesprek of offerte in voorbereiding.', 'blue', 3),
  ('converted', 'Geconverteerd', 'Lead heeft akkoord gegeven en is klant geworden. Project kan starten.', 'green', 4),
  ('lost', 'Verloren', 'Lead heeft afgehaakt of is niet meer geïnteresseerd. Kan later opnieuw worden benaderd.', 'red', 5)
ON CONFLICT (status) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_attachments_lead_id ON lead_attachments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_attachments_activity_id ON lead_attachments(activity_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
