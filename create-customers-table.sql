-- Customers table - stores converted leads
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  
  -- Contact information
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  
  -- Company information
  company_name VARCHAR(255),
  company_size VARCHAR(50),
  vat_number VARCHAR(50),
  company_address TEXT,
  company_postal_code VARCHAR(20),
  company_city VARCHAR(100),
  company_country VARCHAR(100) DEFAULT 'België',
  company_website VARCHAR(500),
  
  -- Project information
  package_interest VARCHAR(100),
  pain_points TEXT[],
  current_website_status VARCHAR(100),
  message TEXT,
  
  -- Quote information (stored as JSON)
  approved_quote JSONB,
  quote_total DECIMAL(10, 2),
  quote_status VARCHAR(50) DEFAULT 'approved',
  
  -- AI generated prompt for Cursor
  cursor_prompt TEXT,
  cursor_prompt_generated_at TIMESTAMP,
  
  -- Assignment
  assigned_to VARCHAR(255),
  assigned_to_manager BOOLEAN DEFAULT false,
  assigned_to_coder BOOLEAN DEFAULT false,
  
  -- Status tracking
  project_status VARCHAR(50) DEFAULT 'new' CHECK (project_status IN ('new', 'in_progress', 'review', 'completed', 'on_hold')),
  
  -- UTM tracking (for analytics)
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  referrer TEXT,
  landing_path VARCHAR(500),
  
  -- Timestamps
  converted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer attachments table (migrated from lead attachments)
CREATE TABLE IF NOT EXISTS customer_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  original_lead_attachment_id UUID,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size BIGINT,
  description TEXT,
  uploaded_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer activities table (migrated from lead activities)
CREATE TABLE IF NOT EXISTS customer_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  original_lead_activity_id UUID,
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  summary TEXT,
  duration_minutes INTEGER,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_lead_id ON customers(lead_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(project_status);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers(assigned_to);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_attachments_customer_id ON customer_attachments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer_id ON customer_activities(customer_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
