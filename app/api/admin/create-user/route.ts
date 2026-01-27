import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

/**
 * API route om een admin gebruiker aan te maken
 * 
 * POST /api/admin/create-user
 * Body: { email: string, password: string }
 * 
 * Let op: In productie moet je deze route beveiligen!
 */
export async function POST(request: NextRequest) {
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
