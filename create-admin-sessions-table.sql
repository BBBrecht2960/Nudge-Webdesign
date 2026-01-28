-- Create admin_sessions table for secure session management
-- This table stores active admin sessions with secure tokens

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

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_email ON admin_sessions(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Auto-cleanup expired sessions (runs every hour)
-- Note: This requires pg_cron extension. If not available, run cleanup manually or via cron job.
-- CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM admin_sessions WHERE expires_at < NOW();
-- END;
-- $$ LANGUAGE plpgsql;

-- Grant permissions (adjust based on your RLS policies)
-- ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only service role can access (sessions are managed server-side)
-- CREATE POLICY "Service role only" ON admin_sessions
--   FOR ALL
--   USING (auth.role() = 'service_role');
