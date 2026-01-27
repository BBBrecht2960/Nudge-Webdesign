import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** Supabase client met service role voor server-side admin_users (bypasst RLS). */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function authenticateAdmin(email: string, password: string): Promise<boolean> {
  try {
    const supabase = getAdminClient();
    if (!supabase) return false;

    const { data, error } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('email', email)
      .single();

    if (error || !data) {
      return false;
    }

    return verifyPassword(password, data.password_hash);
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}
