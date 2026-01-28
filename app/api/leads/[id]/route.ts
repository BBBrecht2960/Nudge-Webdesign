import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(
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
    const { id: leadId } = await params;

    // First, check if there's a related customer
    const { data: relatedCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('lead_id', leadId)
      .maybeSingle();

    // Delete the lead (cascade will handle related records like activities, attachments)
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (deleteError) {
      console.error('Error deleting lead:', deleteError);
      return NextResponse.json(
        { error: 'Fout bij verwijderen lead' },
        { status: 500 }
      );
    }

    // If there was a related customer, delete it too
    if (relatedCustomer) {
      const { error: customerDeleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', relatedCustomer.id);

      if (customerDeleteError) {
        console.warn('Error deleting related customer:', customerDeleteError);
        // Lead is already deleted, so we continue
      }
    }

    return NextResponse.json({
      message: 'Lead en bijbehorende klant succesvol verwijderd',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Fout bij verwijderen lead';
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
