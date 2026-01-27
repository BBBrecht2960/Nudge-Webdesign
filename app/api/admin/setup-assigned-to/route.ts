import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// POST: Add assigned_to column if it doesn't exist
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database niet geconfigureerd' },
        { status: 500 }
      );
    }

    // Use service role key to execute SQL
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Try to add the column
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255);',
    });

    // If RPC doesn't work, try direct query (this might not work with Supabase client)
    // The best approach is to tell user to run SQL manually
    if (error) {
      // Column might already exist or RPC not available
      // Check if column exists by trying to select it
      const { error: selectError } = await supabase
        .from('leads')
        .select('assigned_to')
        .limit(1);

      if (selectError && selectError.message?.includes('assigned_to')) {
        return NextResponse.json({
          error: 'Kolom bestaat niet. Voer deze SQL uit in Supabase SQL Editor:',
          sql: 'ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255);',
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Kolom bestaat of is toegevoegd' });
  } catch (error: unknown) {
    console.error('Error setting up assigned_to column:', error);
    return NextResponse.json(
      {
        error: 'Voer deze SQL uit in Supabase SQL Editor:',
        sql: 'ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255);',
      },
      { status: 200 } // Return 200 so we can show the SQL
    );
  }
}
