import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Create client with placeholder values if credentials are missing (for build time)
// In runtime, API routes will handle missing credentials gracefully
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

// Database types
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  company_size?: string;
  package_interest?: string;
  pain_points?: string[];
  current_website_status?: string;
  message?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  assigned_to?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landing_path?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  note: string;
  created_at: string;
}

export interface LeadStatusHistory {
  id: string;
  lead_id: string;
  old_status?: string;
  new_status: string;
  created_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: 'call' | 'email' | 'meeting' | 'note' | 'status_change' | 'task' | 'quote_sent' | 'contract_sent';
  title: string;
  description?: string;
  summary?: string;
  duration_minutes?: number;
  created_by?: string;
  created_at: string;
  scheduled_at?: string;
  completed_at?: string;
}

export interface LeadAttachment {
  id: string;
  lead_id: string;
  activity_id?: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  description?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface LeadStatusDescription {
  status: string;
  name_nl: string;
  description_nl: string;
  color: string;
  order_index: number;
}
