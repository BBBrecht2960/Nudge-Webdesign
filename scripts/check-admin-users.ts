/**
 * Script om te controleren of admin users bestaan
 * 
 * Gebruik: npx tsx scripts/check-admin-users.ts
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

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

const adminEmails = [
  'brecht.leap@gmail.com',
  'yinthe.gaens@gmail.com',
];

async function checkAdminUsers() {
  console.log('\nAdmin users controleren...\n');

  for (const email of adminEmails) {
    const normalizedEmail = email.toLowerCase().trim();
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, created_at')
      .eq('email', normalizedEmail)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`❌ ${email} - NIET GEVONDEN`);
        console.log(`   Maak aan met: npx tsx scripts/create-admins.ts\n`);
      } else {
        console.log(`❌ ${email} - ERROR: ${error.message}\n`);
      }
    } else if (data) {
      console.log(`✅ ${email} - GEVONDEN`);
      console.log(`   ID: ${data.id}`);
      console.log(`   Aangemaakt: ${new Date(data.created_at).toLocaleString('nl-BE')}\n`);
    }
  }

  // Check all admin users
  console.log('Alle admin users in database:');
  const { data: allUsers, error: allError } = await supabase
    .from('admin_users')
    .select('email, created_at')
    .order('email', { ascending: true });

  if (allError) {
    console.error('Fout bij ophalen users:', allError.message);
  } else if (allUsers && allUsers.length > 0) {
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${new Date(user.created_at).toLocaleString('nl-BE')})`);
    });
  } else {
    console.log('  Geen admin users gevonden in database.');
  }

  console.log('\n');
}

checkAdminUsers();
