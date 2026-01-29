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
  // Business/company information fields
  vat_number?: string;
  company_address?: string;
  company_postal_code?: string;
  company_city?: string;
  company_country?: string;
  company_website?: string;
  created_at: string;
  updated_at: string;
  /** E-mail van het admin-account dat deze lead heeft aangemaakt (alleen bij handmatig aanmaken). */
  created_by?: string;
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

export interface Customer {
  id: string;
  lead_id?: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  company_size?: string;
  vat_number?: string;
  company_address?: string;
  company_postal_code?: string;
  company_city?: string;
  company_country?: string;
  company_website?: string;
  package_interest?: string;
  pain_points?: string[];
  current_website_status?: string;
  message?: string;
  approved_quote?: any;
  quote_total?: number;
  quote_status?: string;
  cursor_prompt?: string;
  cursor_prompt_generated_at?: string;
  assigned_to?: string;
  assigned_to_manager?: boolean;
  assigned_to_coder?: boolean;
  project_status: 'new' | 'in_progress' | 'review' | 'completed' | 'on_hold' | 'canceled';
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landing_path?: string;
  converted_at: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerAttachment {
  id: string;
  customer_id: string;
  original_lead_attachment_id?: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  description?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface CustomerActivity {
  id: string;
  customer_id: string;
  original_lead_activity_id?: string;
  activity_type: string;
  title: string;
  description?: string;
  summary?: string;
  duration_minutes?: number;
  created_by?: string;
  created_at: string;
  scheduled_at?: string;
  completed_at?: string;
}

export interface CustomerUpdate {
  id: string;
  customer_id: string;
  title: string;
  description: string;
  update_type: 'progress' | 'milestone' | 'issue' | 'note' | 'change';
  progress_percentage?: number;
  milestone?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerProgressHistory {
  id: string;
  customer_id: string;
  old_status?: string;
  new_status: string;
  notes?: string;
  changed_by?: string;
  created_at: string;
}
