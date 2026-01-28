import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { secureAdminRoute } from '@/lib/api-security';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Security check: authentication, rate limiting, UUID validation
    const { id: leadId } = await params;
    const securityError = await secureAdminRoute(request, { id: leadId }, { maxRequests: 20, windowMs: 60000 });
    if (securityError) return securityError;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Database niet geconfigureerd' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
