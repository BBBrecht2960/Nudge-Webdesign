import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminPermission } from '@/lib/api-security';
import { isValidUUID } from '@/lib/security';

// GET: Fetch all activities for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminPermission('can_leads');
    if ('error' in authResult) return authResult.error;
    const { id: leadId } = await params;
    if (!isValidUUID(leadId)) return NextResponse.json({ error: 'Ongeldige id formaat' }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Database niet geconfigureerd' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ activities: data || [] });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Fout bij ophalen activiteiten';
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Create a new activity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminPermission('can_leads');
    if ('error' in authResult) return authResult.error;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Database niet geconfigureerd' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { id } = await params;
    const leadId = id;
    const body = await request.json();

    const {
      activity_type,
      title,
      description,
      summary,
      duration_minutes,
      created_by,
      scheduled_at,
    } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Titel is verplicht en mag niet leeg zijn' },
        { status: 400 }
      );
    }

    if (!activity_type || typeof activity_type !== 'string') {
      return NextResponse.json(
        { error: 'Activity type is verplicht' },
        { status: 400 }
      );
    }

    // Validate activity_type is in allowed list
    const allowedTypes = ['call', 'email', 'meeting', 'note', 'status_change', 'task', 'quote_sent', 'contract_sent'];
    if (!allowedTypes.includes(activity_type)) {
      return NextResponse.json(
        { error: `Ongeldig activity type. Toegestaan: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate duration if provided
    if (duration_minutes !== null && duration_minutes !== undefined) {
      const duration = parseInt(String(duration_minutes), 10);
      if (isNaN(duration) || duration < 0) {
        return NextResponse.json(
          { error: 'Duur moet een positief getal zijn' },
          { status: 400 }
        );
      }
    }

    // Check if lead exists
    const { data: leadCheck, error: leadCheckError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', leadId)
      .single();

    if (leadCheckError || !leadCheck) {
      return NextResponse.json(
        { error: 'Lead niet gevonden' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        activity_type: activity_type.trim(),
        title: title.trim(),
        description: description && typeof description === 'string' ? description.trim() || null : null,
        summary: summary && typeof summary === 'string' ? summary.trim() || null : null,
        duration_minutes: duration_minutes ? parseInt(String(duration_minutes), 10) : null,
        created_by: created_by && typeof created_by === 'string' ? created_by.trim() || null : null,
        scheduled_at: scheduled_at || null,
      })
      .select()
      .single();

    if (error) {
      const supabaseError = error as { code?: string; message?: string; details?: string; hint?: string };
      console.error('Supabase error creating activity:', {
        error,
        code: supabaseError.code,
        message: supabaseError.message,
        details: supabaseError.details,
        hint: supabaseError.hint,
        leadId,
      });
      throw error;
    }

    if (!data) {
      throw new Error('Geen data teruggekregen van database');
    }

    return NextResponse.json({ activity: data });
  } catch (error: unknown) {
    const supabaseError = error as { code?: string; message?: string; details?: string; hint?: string };
    console.error('Error creating activity:', {
      error,
      message: supabaseError.message,
      code: supabaseError.code,
      details: supabaseError.details,
      hint: supabaseError.hint,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Fout bij aanmaken activiteit';
    if (supabaseError.code === '23503') {
      errorMessage = 'Lead bestaat niet of is verwijderd';
    } else if (supabaseError.code === '23505') {
      errorMessage = 'Deze activiteit bestaat al';
    } else if (supabaseError.code === '23514') {
      errorMessage = 'Ongeldige waarde voor activity type';
    } else if (supabaseError.message) {
      errorMessage = supabaseError.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: supabaseError.code === '23503' ? 404 : 500 }
    );
  }
}
