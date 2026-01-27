import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// GET: Fetch all attachments for a lead
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
      .from('lead_attachments')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      // Check if table doesn't exist
      if (
        error.code === '42P01' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache') ||
        error.message?.includes('lead_attachments')
      ) {
        return NextResponse.json(
          {
            error: 'Database tabel "lead_attachments" bestaat niet. Voer het SQL script "supabase-schema-extensions.sql" uit in je Supabase database.',
            attachments: [],
          },
          { status: 200 } // Return 200 with empty array so UI doesn't break
        );
      }
      throw error;
    }

    return NextResponse.json({ attachments: data || [] });
  } catch (error: any) {
    console.error('Error fetching attachments:', {
      error,
      code: error?.code,
      message: error?.message,
    });
    return NextResponse.json(
      { error: error?.message || 'Fout bij ophalen bijlagen', attachments: [] },
      { status: 500 }
    );
  }
}

// POST: Create a new attachment (file URL should be uploaded separately to Supabase Storage)
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
      file_name,
      file_url,
      file_type,
      file_size,
      description,
      activity_id,
      uploaded_by,
    } = body;

    // Validate required fields
    if (!file_name || !file_url) {
      return NextResponse.json(
        { error: 'File name en URL zijn verplicht' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('lead_attachments')
      .insert({
        lead_id: leadId,
        file_name,
        file_url,
        file_type: file_type || null,
        file_size: file_size || null,
        description: description || null,
        activity_id: activity_id || null,
        uploaded_by: uploaded_by || null,
      })
      .select()
      .single();

    if (error) {
      // Check if table doesn't exist
      if (
        error.code === '42P01' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache') ||
        error.message?.includes('lead_attachments')
      ) {
        return NextResponse.json(
          {
            error: 'Database tabel "lead_attachments" bestaat niet. Voer het SQL script "supabase-schema-extensions.sql" uit in je Supabase database om de tabel aan te maken.',
          },
          { status: 500 }
        );
      }
      throw error;
    }

    return NextResponse.json({ attachment: data });
  } catch (error: any) {
    console.error('Error creating attachment:', {
      error,
      code: error?.code,
      message: error?.message,
    });
    return NextResponse.json(
      { error: error?.message || 'Fout bij aanmaken bijlage' },
      { status: 500 }
    );
  }
}
