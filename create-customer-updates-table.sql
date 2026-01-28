-- Customer updates/progress tracking table
CREATE TABLE IF NOT EXISTS customer_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Update content
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  update_type VARCHAR(50) DEFAULT 'progress' CHECK (update_type IN ('progress', 'milestone', 'issue', 'note', 'change')),
  
  -- Progress tracking
  progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  milestone VARCHAR(255),
  
  -- Metadata
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer progress history table (tracks status changes)
CREATE TABLE IF NOT EXISTS customer_progress_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  notes TEXT,
  changed_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_updates_customer_id ON customer_updates(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_updates_created_at ON customer_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_progress_history_customer_id ON customer_progress_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_progress_history_created_at ON customer_progress_history(created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_customer_updates_updated_at ON customer_updates;
CREATE TRIGGER update_customer_updates_updated_at BEFORE UPDATE ON customer_updates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
