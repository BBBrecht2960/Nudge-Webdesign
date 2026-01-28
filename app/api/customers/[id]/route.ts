import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { secureAdminRoute } from '@/lib/api-security';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Security check: authentication, rate limiting, UUID validation
    const { id: customerId } = await params;
    const securityError = await secureAdminRoute(request, { id: customerId }, { maxRequests: 20, windowMs: 60000 });
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

    // First, get the customer to find the related lead_id
    const { data: customer, error: customerFetchError } = await supabase
      .from('customers')
      .select('lead_id')
      .eq('id', customerId)
      .maybeSingle();

    if (customerFetchError) {
      console.error('Error fetching customer:', customerFetchError);
      return NextResponse.json(
        { error: 'Fout bij ophalen klant' },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        { error: 'Klant niet gevonden' },
        { status: 404 }
      );
    }

    // Delete the customer (cascade will handle related records like activities, attachments, updates)
    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (deleteError) {
      console.error('Error deleting customer:', deleteError);
      return NextResponse.json(
        { error: 'Fout bij verwijderen klant' },
        { status: 500 }
      );
    }

    // If there was a related lead, delete it too
    if (customer.lead_id) {
      const { error: leadDeleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', customer.lead_id);

      if (leadDeleteError) {
        console.warn('Error deleting related lead:', leadDeleteError);
        // Customer is already deleted, so we continue
      }
    }

    return NextResponse.json({
      message: 'Klant en bijbehorende lead succesvol verwijderd',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Fout bij verwijderen klant';
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
