-- Create lead_attachments table if it doesn't exist
-- Run this in your Supabase SQL Editor if you get an error that the table doesn't exist

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_attachments_lead_id ON lead_attachments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_attachments_activity_id ON lead_attachments(activity_id);
