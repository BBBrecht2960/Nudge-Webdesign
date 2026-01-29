import { cookies } from 'next/headers';
import { generateSessionToken } from './security';
import { createClient } from '@supabase/supabase-js';

export type AdminSessionCookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  maxAge: number;
  path: string;
};

/**
 * Create a secure admin session. Returns token and cookie options so the caller
 * can set the cookie on the response (ensures cookie is sent with the response).
 */
export async function createAdminSession(
  email: string,
  rememberMe: boolean = false
): Promise<{ token: string; cookieOptions: AdminSessionCookieOptions }> {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7)); // 30 days or 7 days

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const cookieOptions: AdminSessionCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
    path: '/',
  };

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Database not configured');
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase
    .from('admin_sessions')
    .insert({
      token,
      email: email.toLowerCase().trim(),
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    });

  if (error) {
    if (error.code === '42P01') {
      console.warn('[Auth] admin_sessions table does not exist. Run create-admin-sessions-table.sql');
      return { token, cookieOptions };
    }
    throw error;
  }

  return { token, cookieOptions };
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
