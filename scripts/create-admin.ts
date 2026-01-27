/**
 * Script om een admin gebruiker aan te maken
 * 
 * Gebruik: npx tsx scripts/create-admin.ts <email> <password>
 * 
 * Voorbeeld: npx tsx scripts/create-admin.ts admin@example.com mijnwachtwoord
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase credentials ontbreken!');
  console.error('Zorg dat NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn ingesteld.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve);
    });
  };

  try {
    console.log('\nAdmin gebruiker aanmaken\n');

    const email = process.argv[2] || await question('E-mailadres: ');
    const password = process.argv[3] || await question('Wachtwoord: ');

    if (!email || !password) {
      console.error('E-mail en wachtwoord zijn verplicht');
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if user already exists
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      // Update existing user
      const { error } = await supabase
        .from('admin_users')
        .update({ password_hash: passwordHash })
        .eq('email', email);

      if (error) {
        console.error('Fout bij updaten:', error.message);
        process.exit(1);
      }

      console.log('Admin gebruiker bijgewerkt!');
    } else {
      // Create new user
      const { error } = await supabase
        .from('admin_users')
        .insert({
          email,
          password_hash: passwordHash,
        });

      if (error) {
        console.error('Fout bij aanmaken:', error.message);
        console.error('\nTip: Zorg dat de admin_users tabel bestaat in Supabase:');
        console.log(`
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
        `);
        process.exit(1);
      }

      console.log('Admin gebruiker aangemaakt!');
    }

    console.log(`\nE-mail: ${email}`);
    console.log('Login op: http://localhost:3000/admin\n');
  } catch (error) {
    console.error('Fout:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdmin();
