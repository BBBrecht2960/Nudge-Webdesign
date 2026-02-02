/**
 * Voegt Emiel Alfarano toe als admin met rechten: leads + klanten.
 * Gebruik: npx tsx scripts/seed-emiel-alfarano.ts [wachtwoord]
 * Standaard wachtwoord: Nudge2026!!
 * (Zorg dat run-admin-users-migrations.sql al in Supabase is uitgevoerd.)
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      if (val && !val.includes('vul_') && val !== '') process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Supabase credentials ontbreken. Zet NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

const EMAIL = 'emiclalferarano@gmail.com';
const DEFAULT_PASSWORD = 'Nudge2026!!';

async function main() {
  const password = process.argv[2] || DEFAULT_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 10);

  const { data: existing } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', EMAIL)
    .single();

  const row = {
    email: EMAIL,
    password_hash: passwordHash,
    full_name: 'Emiel',
    first_name: 'Alfarano',
    gender: 'M' as const,
    birth_date: '2004-04-23',
    birth_place: 'Hasselt',
    nationality: 'Belgische',
    rijksregisternummer: '04042317948',
    address: 'Weg naar Bijloos 16',
    postal_code: '3530',
    city: 'Houthalen',
    country: 'België',
    gsm: '+32487317229',
    phone: '011 23 45 67',
    iban: 'BE25303147880782',
    bic: 'BBAUBEBB',
    bank_name: 'ING',
    account_holder: 'Emiel Alfarano',
    emergency_contact_name: 'Test',
    emergency_contact_relation: 'Test',
    emergency_contact_phone: '044',
    can_leads: true,
    can_customers: true,
    can_analytics: false,
    can_manage_users: false,
  };

  if (existing) {
    const { error } = await supabase
      .from('admin_users')
      .update({ ...row, password_hash: passwordHash })
      .eq('email', EMAIL);
    if (error) {
      console.error('Fout bij bijwerken:', error.message);
      process.exit(1);
    }
    console.log('Emiel Alfarano bijgewerkt (rechten: leads + klanten).');
  } else {
    const { error } = await supabase.from('admin_users').insert(row);
    if (error) {
      console.error('Fout bij aanmaken:', error.message);
      console.error('Tip: Voer run-admin-users-migrations.sql uit in Supabase SQL Editor.');
      process.exit(1);
    }
    console.log('Emiel Alfarano toegevoegd als admin (rechten: leads + klanten).');
  }

  console.log('E-mail:', EMAIL);
  console.log('Wachtwoord:', password === DEFAULT_PASSWORD ? DEFAULT_PASSWORD : '(opgegeven)');
  console.log('Login: https://www.wearenudge.be/admin of lokaal http://localhost:3000/admin');
}

main();
