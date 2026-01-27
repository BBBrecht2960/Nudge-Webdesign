/**
 * Script om meerdere admin gebruikers aan te maken
 * 
 * Gebruik: npx tsx scripts/create-admins.ts
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Laad .env.local
const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials ontbreken!');
  console.error('Zorg dat NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn ingesteld in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const admins = [
  { email: 'brecht.leap@gmail.com', password: 'Nudge2026!!$' },
  { email: 'yinthe.gaens@gmail.com', password: 'Nudge2026!!$' },
];

async function createAdmin(email: string, password: string) {
  try {
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
        console.error(`❌ Fout bij updaten ${email}:`, error.message);
        return false;
      }

      console.log(`✅ Admin gebruiker bijgewerkt: ${email}`);
      return true;
    } else {
      // Create new user
      const { error } = await supabase
        .from('admin_users')
        .insert({
          email,
          password_hash: passwordHash,
        });

      if (error) {
        console.error(`❌ Fout bij aanmaken ${email}:`, error.message);
        return false;
      }

      console.log(`✅ Admin gebruiker aangemaakt: ${email}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Fout bij ${email}:`, error);
    return false;
  }
}

async function main() {
  console.log('\n🔐 Admin gebruikers aanmaken\n');

  let successCount = 0;
  for (const admin of admins) {
    const success = await createAdmin(admin.email, admin.password);
    if (success) successCount++;
  }

  console.log(`\n✅ ${successCount}/${admins.length} admin gebruikers succesvol verwerkt\n`);
  console.log('🔗 Login op: http://localhost:3000/admin\n');
}

main();
