/**
 * Script om een admin gebruiker aan te maken
 *
 * Gebruik: npx tsx scripts/create-admin.ts <email> <password> [rechten]
 *
 * Rechten: komma-gescheiden lijst: leads,customers,analytics,users
 *   - leads     = can_leads
 *   - customers = can_customers
 *   - analytics = can_analytics
 *   - users     = can_manage_users
 * Voorbeeld alleen leads + klanten: npx tsx scripts/create-admin.ts test@nudge.be Nudge2026!! leads,customers
 * Voorbeeld volle rechten:          npx tsx scripts/create-admin.ts admin@example.com wachtwoord leads,customers,analytics,users
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

// Laad .env.local
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase credentials ontbreken!');
  console.error('Zorg dat NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn ingesteld.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parsePermissions(permStr: string | undefined): {
  can_leads: boolean;
  can_customers: boolean;
  can_analytics: boolean;
  can_manage_users: boolean;
} {
  const list = (permStr ?? 'leads,customers,analytics').toLowerCase().split(',').map((s) => s.trim());
  return {
    can_leads: list.includes('leads'),
    can_customers: list.includes('customers'),
    can_analytics: list.includes('analytics'),
    can_manage_users: list.includes('users'),
  };
}

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

    const email = process.argv[2] || (await question('E-mailadres: '));
    const password = process.argv[3] || (await question('Wachtwoord: '));
    const permArg = process.argv[4];
    const permissions = parsePermissions(permArg);

    if (!email || !password) {
      console.error('E-mail en wachtwoord zijn verplicht');
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('admin_users')
        .update({
          password_hash: passwordHash,
          can_leads: permissions.can_leads,
          can_customers: permissions.can_customers,
          can_analytics: permissions.can_analytics,
          can_manage_users: permissions.can_manage_users,
        })
        .eq('email', email);

      if (error) {
        console.error('Fout bij updaten:', error.message);
        process.exit(1);
      }

      console.log('Admin gebruiker bijgewerkt!');
    } else {
      const { error } = await supabase.from('admin_users').insert({
        email,
        password_hash: passwordHash,
        can_leads: permissions.can_leads,
        can_customers: permissions.can_customers,
        can_analytics: permissions.can_analytics,
        can_manage_users: permissions.can_manage_users,
      });

      if (error) {
        console.error('Fout bij aanmaken:', error.message);
        console.error('\nTip: Zorg dat de admin_users tabel bestaat in Supabase (inclusief can_leads, can_customers, can_analytics, can_manage_users).');
        process.exit(1);
      }

      console.log('Admin gebruiker aangemaakt!');
    }

    console.log(`\nE-mail: ${email}`);
    console.log('Rechten: leads=%s, customers=%s, analytics=%s, manage_users=%s', permissions.can_leads, permissions.can_customers, permissions.can_analytics, permissions.can_manage_users);
    console.log('Login op: http://localhost:3000/admin\n');
  } catch (error) {
    console.error('Fout:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdmin();
