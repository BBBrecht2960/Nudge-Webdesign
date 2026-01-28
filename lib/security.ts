import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

/**
 * Security utilities for authentication, rate limiting, and validation
 * 
 * Note: Some functions require Node.js runtime (crypto module)
 * These should not be used in Edge Runtime (middleware)
 */

// Rate limiting store (in-memory for now, should use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Generate a cryptographically secure session token
 * Uses Web Crypto API for Edge Runtime compatibility
 */
export function generateSessionToken(): string {
  // Use Web Crypto API (works in both Node.js and Edge Runtime)
  if (typeof globalThis !== 'undefined' && globalThis.crypto && 'getRandomValues' in globalThis.crypto) {
    const array = new Uint8Array(32);
    globalThis.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for Node.js (should not be needed in modern Node.js)
  if (typeof require !== 'undefined') {
    try {
      const nodeCrypto = require('crypto');
      return nodeCrypto.randomBytes(32).toString('hex');
    } catch {
      // Fallback if crypto module not available
    }
  }
  
  // Last resort: use Math.random (not cryptographically secure, but better than nothing)
  // This should never be reached in production
  console.warn('[Security] Using Math.random for token generation - not secure!');
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
}

/**
 * Verify if a session token is valid by checking the database
 */
export async function verifySessionToken(token: string): Promise<{ valid: boolean; email?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      return { valid: false };
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    // Check if sessions table exists and query it
    const { data, error } = await supabase
      .from('admin_sessions')
      .select('email, expires_at')
      .eq('token', token)
      .single();

    if (error || !data) {
      return { valid: false };
    }

    // Check if session is expired
    if (new Date(data.expires_at) < new Date()) {
      // Delete expired session
      await supabase
        .from('admin_sessions')
        .delete()
        .eq('token', token);
      return { valid: false };
    }

    return { valid: true, email: data.email };
  } catch (error) {
    console.error('[Security] Error verifying session:', error);
    return { valid: false };
  }
}

/**
 * Check if user is authenticated (has valid session)
 */
export async function requireAuth(): Promise<{ authenticated: boolean; email?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    
    if (!sessionCookie?.value) {
      return { authenticated: false };
    }

    const session = await verifySessionToken(sessionCookie.value);
    return {
      authenticated: session.valid,
      email: session.email,
    };
  } catch (error) {
    console.error('[Security] Auth check error:', error);
    return { authenticated: false };
  }
}

/**
 * Rate limiting middleware
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute default
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // New window or expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count += 1;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Check various headers for IP (respects proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate phone number format (basic)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\+\-\(\)\.]/g, '');
  return /^\d+$/.test(cleaned) && cleaned.length >= 9 && cleaned.length <= 15;
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
  };
}
