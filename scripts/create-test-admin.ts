/**
 * Maakt het test admin account aan (voor dev/test).
 *
 * Vereist in .env.local:
 *   TEST_ADMIN_EMAIL=test@example.com
 *   TEST_ADMIN_PASSWORD=TestAdmin123!
 *
 * Gebruik: npm run create-test-admin
 * Of: npx tsx scripts/create-test-admin.ts
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Laad .env.local (Next.js laadt dit niet bij standalone scripts)
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
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.TEST_ADMIN_EMAIL;
const password = process.env.TEST_ADMIN_PASSWORD;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials ontbreken. Zet NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY (of NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local');
  process.exit(1);
}

if (!email || !password) {
  console.error('❌ Test admin gegevens ontbreken. Zet in .env.local:');
  console.error('   TEST_ADMIN_EMAIL=test@example.com');
  console.error('   TEST_ADMIN_PASSWORD=TestAdmin123!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestAdmin(adminEmail: string, adminPassword: string) {
  try {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', adminEmail)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('admin_users')
        .update({ password_hash: passwordHash })
        .eq('email', adminEmail);

      if (error) {
        console.error('❌ Fout bij bijwerken test admin:', error.message);
        process.exit(1);
      }
      console.log('✅ Test admin bijgewerkt:', adminEmail);
    } else {
      const { error } = await supabase.from('admin_users').insert({
        email: adminEmail,
        password_hash: passwordHash,
      });

      if (error) {
        console.error('❌ Fout bij aanmaken test admin:', error.message);
        process.exit(1);
      }
      console.log('✅ Test admin aangemaakt:', adminEmail);
    }

    console.log('🔗 Login op: http://localhost:3000/admin');
    console.log('   Gebruik "Inloggen als test admin" of dit e-mailadres en wachtwoord.\n');
  } catch (err) {
    console.error('❌ Fout:', err);
    process.exit(1);
  }
}

createTestAdmin(email, password);
