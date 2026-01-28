import { cookies } from 'next/headers';
import { generateSessionToken, verifySessionToken } from './security';
import { createClient } from '@supabase/supabase-js';

/**
 * Create a secure admin session
 */
export async function createAdminSession(email: string, rememberMe: boolean = false): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7)); // 30 days or 7 days

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Database not configured');
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

  // Store session in database
  const { error } = await supabase
    .from('admin_sessions')
    .insert({
      token,
      email: email.toLowerCase().trim(),
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    });

  if (error) {
    // If table doesn't exist, log warning but continue (sessions will be validated differently)
    if (error.code === '42P01') {
      console.warn('[Auth] admin_sessions table does not exist. Run create-admin-sessions-table.sql');
      // Fallback to simple token (less secure but functional)
      return token;
    }
    throw error;
  }

  // Set HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
    path: '/',
  });

  return token;
}

/**
 * Delete admin session
 */
export async function deleteAdminSession(token: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

  // Delete from database
  await supabase
    .from('admin_sessions')
    .delete()
    .eq('token', token);

  // Clear cookie
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    return 0;
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

  const { count } = await supabase
    .from('admin_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());

  return count || 0;
}
