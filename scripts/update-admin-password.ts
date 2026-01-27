/**
 * Script om admin wachtwoorden te updaten
 * 
 * Gebruik: npx tsx scripts/update-admin-password.ts
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
  console.error('Supabase credentials ontbreken!');
  console.error('Zorg dat NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn ingesteld in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const admins = [
  { email: 'brecht.leap@gmail.com', password: 'Nudge2026!!' },
  { email: 'yinthe.gaens@gmail.com', password: 'Nudge2026!!' },
];

async function updateAdminPassword(email: string, password: string) {
  try {
    const passwordHash = await bcrypt.hash(password, 10);

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single();

    if (!existing) {
      console.error(`Admin gebruiker niet gevonden: ${normalizedEmail}`);
      return false;
    }

    // Update password
    const { error } = await supabase
      .from('admin_users')
      .update({ password_hash: passwordHash })
      .eq('email', normalizedEmail);

    if (error) {
      console.error(`Fout bij updaten ${normalizedEmail}:`, error.message);
      return false;
    }

    console.log(`Wachtwoord bijgewerkt voor: ${normalizedEmail}`);
    return true;
  } catch (error) {
    console.error(`Fout bij ${email}:`, error);
    return false;
  }
}

async function main() {
  console.log('\nAdmin wachtwoorden updaten\n');

  let successCount = 0;
  for (const admin of admins) {
    const success = await updateAdminPassword(admin.email, admin.password);
    if (success) successCount++;
  }

  console.log(`\n${successCount}/${admins.length} wachtwoorden succesvol bijgewerkt\n`);
}

main();
