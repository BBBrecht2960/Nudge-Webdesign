-- Interne analytics: events opslaan voor Admin-dashboard
-- Voer uit in Supabase SQL Editor (eenmalig)

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- RLS: alleen backend (service role) mag lezen/schrijven; anon heeft geen directe toegang
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
