import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

/**
 * API route om een admin gebruiker aan te maken
 * 
 * POST /api/admin/create-user
 * Body: { email: string, password: string }
 * 
 * SECURITY: 
 * - Uitgeschakeld in productie
 * - Vereist geldige admin sessie (alleen ingelogde admins kunnen nieuwe admins aanmaken)
 * 
 * LET OP: In productie moeten admin accounts handmatig worden aangemaakt via scripts of database
 */
export async function POST(request: NextRequest) {
  // SECURITY: Deze route is uitgeschakeld voor productie
  // Admin accounts moeten handmatig worden aangemaakt via scripts of database
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Deze functionaliteit is niet beschikbaar in productie' },
      { status: 403 }
    );
  }

  const { requireAdminPermission } = await import('@/lib/api-security');
  const authResult = await requireAdminPermission('can_manage_users');
  if ('error' in authResult) {
    return authResult.error.status === 403
      ? NextResponse.json(
          { error: 'Geen toegang tot dit onderdeel. Alleen gebruikers met rechten voor gebruikersbeheer kunnen nieuwe admins aanmaken.' },
          { status: 403 }
        )
      : authResult.error;
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail en wachtwoord zijn verplicht' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .single();

    const passwordHash = await hashPassword(password);

    if (existing) {
      // Update existing user
      const { error } = await supabase
        .from('admin_users')
        .update({ password_hash: passwordHash })
        .eq('email', email);

      if (error) {
        console.error('Error updating admin user:', error);
        return NextResponse.json(
          { error: 'Fout bij updaten van gebruiker' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Admin gebruiker bijgewerkt',
        email 
      });
    } else {
      // Create new user
      const { error } = await supabase
        .from('admin_users')
        .insert({
          email,
          password_hash: passwordHash,
        });

      if (error) {
        console.error('Error creating admin user:', error);
        return NextResponse.json(
          { error: 'Fout bij aanmaken van gebruiker. Zorg dat de admin_users tabel bestaat.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Admin gebruiker aangemaakt',
        email 
      });
    }
  } catch (error) {
    console.error('Create admin user error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}
