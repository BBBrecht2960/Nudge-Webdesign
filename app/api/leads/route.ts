import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP, getRateLimitHeaders, isValidEmail, isValidPhone, sanitizeInput } from '@/lib/security';
import { requireAdminPermission } from '@/lib/api-security';
import * as z from 'zod';

// GET: List leads (admin only, requires can_leads). Query: status, assigned_to, source, sort, order, include_last_activity.
export async function GET(request: NextRequest) {
  const authResult = await requireAdminPermission('can_leads');
  if ('error' in authResult) return authResult.error;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') || '';
  const assignedTo = searchParams.get('assigned_to') || '';
  const sourceFilter = searchParams.get('source') || '';
  const sortBy = searchParams.get('sort') || 'created_at';
  const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
  const includeLastActivity = searchParams.get('include_last_activity') === '1';

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let query = supabase.from('leads').select('*');

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }
  if (assignedTo === '__none__') {
    query = query.or('assigned_to.is.null,assigned_to.eq.');
  } else if (assignedTo) {
    query = query.eq('assigned_to', assignedTo);
  }
  if (sourceFilter && sourceFilter !== 'all') {
    if (sourceFilter === 'website') {
      query = query.or('referrer.not.is.null,landing_path.not.is.null');
    } else if (sourceFilter === 'manual') {
      query = query.is('referrer', null).is('landing_path', null);
    }
  }

  const validSortColumns: Record<string, string> = {
    created_at: 'created_at',
    name: 'name',
    status: 'status',
    company_name: 'company_name',
    email: 'email',
  };
  const sortColumn = validSortColumns[sortBy] || 'created_at';
  query = query.order(sortColumn, { ascending: order === 'asc' });

  const { data: leads, error } = await query;

  if (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Fout bij ophalen leads' }, { status: 500 });
  }

  const list = leads ?? [];

  if (!includeLastActivity || list.length === 0) {
    return NextResponse.json(list);
  }

  const leadIds = list.map((l: { id: string }) => l.id);
  const { data: activities } = await supabase
    .from('lead_activities')
    .select('lead_id, title, created_at')
    .in('lead_id', leadIds)
    .order('created_at', { ascending: false });

  const lastByLead: Record<string, { title: string; created_at: string }> = {};
  for (const a of activities ?? []) {
    const lid = (a as { lead_id: string }).lead_id;
    if (!lastByLead[lid]) {
      lastByLead[lid] = {
        title: (a as { title: string | null }).title ?? '',
        created_at: (a as { created_at: string }).created_at,
      };
    }
  }

  const enriched = list.map((lead: { id: string }) => ({
    ...lead,
    last_activity: lastByLead[lead.id] ?? null,
  }));

  return NextResponse.json(enriched);
}

// Strict validation schema for lead submission
const leadSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().min(1).max(255).refine(isValidEmail, { message: 'Ongeldig e-mailadres' }),
  phone: z.string().optional().refine((val) => !val || isValidPhone(val), { message: 'Ongeldig telefoonnummer' }),
  company_name: z.string().max(255).optional().nullable(),
  company_size: z.string().max(50).optional().nullable(),
  package_interest: z.string().max(100).optional().nullable(),
  pain_points: z.array(z.string()).optional().default([]),
  current_website_status: z.string().max(100).optional().nullable(),
  message: z.string().max(5000).optional().nullable(),
  gdpr_consent: z.boolean().refine((val) => val === true, { message: 'GDPR toestemming is verplicht' }),
  utm_source: z.string().max(100).optional().nullable(),
  utm_medium: z.string().max(100).optional().nullable(),
  utm_campaign: z.string().max(100).optional().nullable(),
  utm_term: z.string().max(100).optional().nullable(),
  utm_content: z.string().max(100).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  landing_path: z.string().max(500).optional().nullable(),
}).strict();

export async function POST(request: NextRequest) {
  // Rate limiting: 10 submissions per 5 minutes per IP
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(`lead:${clientIP}`, 10, 5 * 60 * 1000);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Te veel aanvragen. Probeer het later opnieuw.' },
      { 
        status: 429,
        headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime),
      }
    );
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Database niet geconfigureerd' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parsing error:', error);
      return NextResponse.json(
        { error: 'Ongeldige data ontvangen. Controleer het formulier en probeer opnieuw.' },
        { status: 400 }
      );
    }

    // Validate with Zod (strict mode)
    const validationResult = leadSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Ongeldige invoer', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Sanitize all string inputs
    const sanitizedData = {
      ...validatedData,
      name: sanitizeInput(validatedData.name),
      email: sanitizeInput(validatedData.email.toLowerCase().trim()),
      phone: validatedData.phone ? sanitizeInput(validatedData.phone) : null,
      company_name: validatedData.company_name ? sanitizeInput(validatedData.company_name) : null,
      message: validatedData.message ? sanitizeInput(validatedData.message) : null,
    };

    // Insert lead into database
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        company_name: sanitizedData.company_name,
        company_size: sanitizedData.company_size,
        package_interest: sanitizedData.package_interest,
        pain_points: sanitizedData.pain_points || [],
        current_website_status: sanitizedData.current_website_status,
        message: sanitizedData.message,
        status: 'new',
        utm_source: sanitizedData.utm_source,
        utm_medium: sanitizedData.utm_medium,
        utm_campaign: sanitizedData.utm_campaign,
        utm_term: sanitizedData.utm_term,
        utm_content: sanitizedData.utm_content,
        referrer: sanitizedData.referrer,
        landing_path: sanitizedData.landing_path,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      
      // Provide more specific error messages based on error code
      let errorMessage = 'Er is iets misgegaan bij het opslaan van uw aanvraag';
      
      if (error.code === '23505') {
        // Unique constraint violation (duplicate email)
        errorMessage = 'Dit e-mailadres is al geregistreerd. Probeer een ander e-mailadres.';
      } else if (error.code === '23503') {
        // Foreign key violation
        errorMessage = 'Ongeldige data ontvangen. Controleer het formulier en probeer opnieuw.';
      } else if (error.code === '42P01') {
        // Table doesn't exist
        errorMessage = 'Database tabel niet gevonden. Neem contact op met de beheerder.';
      } else if (error.message) {
        errorMessage = `Database fout: ${error.message}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, lead_id: data.id },
      { 
        status: 201,
        headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime),
      }
    );
  } catch (error) {
    console.error('API error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Er is iets misgegaan';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError || (error as { name?: string }).name === 'SyntaxError') {
      errorMessage = 'Ongeldige data ontvangen';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
