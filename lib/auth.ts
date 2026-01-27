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
    if (!supabase) {
      console.error('[Auth] Supabase client niet beschikbaar');
      return false;
    }

    // Normalize email to lowercase and trim
    const normalizedEmail = email.toLowerCase().trim();

    const { data, error } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('email', normalizedEmail)
      .single();

    if (error) {
      console.error('[Auth] Database error:', error.message, error.code);
      return false;
    }

    if (!data || !data.password_hash) {
      console.error('[Auth] Geen data of password_hash gevonden voor:', email);
      return false;
    }

    const isValid = await verifyPassword(password, data.password_hash);
    if (!isValid) {
      console.error('[Auth] Wachtwoord verificatie mislukt voor:', email);
    }
    return isValid;
  } catch (error) {
    console.error('[Auth] Authentication error:', error);
    return false;
  }
}
