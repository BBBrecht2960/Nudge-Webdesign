import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// GET: Fetch all updates for a customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const customerId = id;

    const { data, error } = await supabase
      .from('customer_updates')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ updates: [] });
      }
      throw error;
    }

    return NextResponse.json({ updates: data || [] });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    console.error('Error fetching customer updates:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Create a new update
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const customerId = id;
    const body = await request.json();

    const {
      title,
      description,
      update_type = 'progress',
      progress_percentage,
      milestone,
      created_by,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Titel en beschrijving zijn verplicht' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('customer_updates')
      .insert({
        customer_id: customerId,
        title,
        description,
        update_type,
        progress_percentage: progress_percentage !== undefined ? progress_percentage : null,
        milestone: milestone || null,
        created_by: created_by || 'Admin',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating update:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        return NextResponse.json(
          { error: 'Customer updates tabel bestaat niet. Voer create-customer-updates-table.sql uit in Supabase.' },
          { status: 500 }
        );
      }
      
      // Return more specific error
      return NextResponse.json(
        { 
          error: error.message || 'Fout bij opslaan update',
          code: error.code,
          details: error.details,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ update: data });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    console.error('Error creating customer update:', error);
    
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Ongeldige data ontvangen' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
