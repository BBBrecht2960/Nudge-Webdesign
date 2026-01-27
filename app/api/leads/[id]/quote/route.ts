import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// GET: Fetch the latest quote for a lead
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
    const leadId = id;

    const { data, error } = await supabase
      .from('lead_quotes')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // PGRST116 = no rows found, which is OK
      if (error.code === 'PGRST116') {
        return NextResponse.json({ quote: null });
      }

      const supabaseError = error as { code?: string; message?: string };
      // Check if table doesn't exist
      if (
        supabaseError.code === '42P01' ||
        supabaseError.message?.includes('does not exist') ||
        supabaseError.message?.includes('schema cache') ||
        supabaseError.message?.includes('lead_quotes')
      ) {
        return NextResponse.json(
          {
            error: 'Database tabel "lead_quotes" bestaat niet. Voer het SQL script "supabase-quotes-table.sql" uit in je Supabase database.',
            quote: null,
          },
          { status: 200 } // Return 200 with null quote so UI doesn't break
        );
      }

      throw error;
    }

    return NextResponse.json({ quote: data || null });
  } catch (error: unknown) {
    const supabaseError = error as { code?: string; message?: string; details?: string; hint?: string };
    console.error('Error fetching quote:', {
      error,
      code: supabaseError.code,
      message: supabaseError.message,
      details: supabaseError.details,
      hint: supabaseError.hint,
    });
    return NextResponse.json(
      { error: supabaseError.message || 'Fout bij ophalen offerte', quote: null },
      { status: 500 }
    );
  }
}

// POST: Save or update a quote
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
    const leadId = id;
    const body = await request.json();

    const {
      quote_data,
      total_price,
      status = 'draft',
      notes,
    } = body;

    if (!quote_data || !total_price) {
      return NextResponse.json(
        { error: 'Quote data en total_price zijn verplicht' },
        { status: 400 }
      );
    }

    // Check if a draft quote already exists
    const { data: existingQuote, error: checkError } = await supabase
      .from('lead_quotes')
      .select('id')
      .eq('lead_id', leadId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check if table doesn't exist
    if (checkError && (
      checkError.code === '42P01' ||
      checkError.message?.includes('does not exist') ||
      checkError.message?.includes('schema cache') ||
      checkError.message?.includes('lead_quotes')
    )) {
      return NextResponse.json(
        {
          error: 'Database tabel "lead_quotes" bestaat niet. Voer het SQL script "supabase-quotes-table.sql" uit in je Supabase database om de tabel aan te maken.',
        },
        { status: 500 }
      );
    }

    let result;
    if (existingQuote) {
      // Update existing draft
      const { data, error } = await supabase
        .from('lead_quotes')
        .update({
          quote_data,
          total_price,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingQuote.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new quote
      const { data, error } = await supabase
        .from('lead_quotes')
        .insert({
          lead_id: leadId,
          quote_data,
          total_price,
          status,
          notes: notes || null,
          created_by: 'Admin User', // TODO: Replace with actual logged-in user
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ quote: result });
  } catch (error: unknown) {
    const supabaseError = error as { code?: string; message?: string; details?: string; hint?: string };
    console.error('Error saving quote:', {
      error,
      code: supabaseError.code,
      message: supabaseError.message,
      details: supabaseError.details,
      hint: supabaseError.hint,
    });

    // Check if table doesn't exist
    if (
      supabaseError.code === '42P01' ||
      supabaseError.message?.includes('does not exist') ||
      supabaseError.message?.includes('schema cache') ||
      supabaseError.message?.includes('lead_quotes')
    ) {
      return NextResponse.json(
        {
          error: 'Database tabel "lead_quotes" bestaat niet. Voer het SQL script "supabase-quotes-table.sql" uit in je Supabase database om de tabel aan te maken.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: supabaseError.message || 'Fout bij opslaan offerte' },
      { status: 500 }
    );
  }
}
