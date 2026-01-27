import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// GET: Fetch all activities for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const leadId = id;

    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ activities: data || [] });
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij ophalen activiteiten' },
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
    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

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
      console.error('Supabase error creating activity:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        leadId,
      });
      throw error;
    }

    if (!data) {
      throw new Error('Geen data teruggekregen van database');
    }

    return NextResponse.json({ activity: data });
  } catch (error: any) {
    console.error('Error creating activity:', {
      error,
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Fout bij aanmaken activiteit';
    if (error?.code === '23503') {
      errorMessage = 'Lead bestaat niet of is verwijderd';
    } else if (error?.code === '23505') {
      errorMessage = 'Deze activiteit bestaat al';
    } else if (error?.code === '23514') {
      errorMessage = 'Ongeldige waarde voor activity type';
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: error?.code === '23503' ? 404 : 500 }
    );
  }
}
