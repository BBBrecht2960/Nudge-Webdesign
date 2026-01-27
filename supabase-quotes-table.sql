-- Quotes table for storing offerte data
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS lead_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  quote_data JSONB NOT NULL, -- Stores the complete quote configuration
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  sent_at TIMESTAMP,
  expires_at TIMESTAMP,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_quotes_lead_id ON lead_quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_quotes_status ON lead_quotes(status);
CREATE INDEX IF NOT EXISTS idx_lead_quotes_created_at ON lead_quotes(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lead_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_lead_quotes_updated_at ON lead_quotes;
CREATE TRIGGER update_lead_quotes_updated_at
  BEFORE UPDATE ON lead_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_quotes_updated_at();
