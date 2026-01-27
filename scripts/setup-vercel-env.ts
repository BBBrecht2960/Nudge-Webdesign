/**
 * Script om environment variables automatisch naar Vercel te pushen
 * 
 * Gebruik: npx tsx scripts/setup-vercel-env.ts
 * 
 * Vereisten:
 * - Vercel CLI geïnstalleerd: npm i -g vercel
 * - Je moet ingelogd zijn: vercel login
 * - .env.local moet bestaan met alle variabelen
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const envPath = resolve(process.cwd(), '.env.local');

if (!existsSync(envPath)) {
  console.error('❌ .env.local bestand niet gevonden!');
  console.error('Maak eerst .env.local aan met alle environment variables.');
  process.exit(1);
}

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch {
  console.error('❌ Vercel CLI niet gevonden!');
  console.error('Installeer met: npm i -g vercel');
  console.error('Log in met: vercel login');
  process.exit(1);
}

// Read .env.local
const envContent = readFileSync(envPath, 'utf8');
const envVars: Record<string, string> = {};

// Parse .env.local
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  // Skip comments and empty lines
  if (!trimmed || trimmed.startsWith('#')) continue;
  
  const match = trimmed.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    
    // Remove quotes if present
    val = val.replace(/^["']|["']$/g, '');
    
    // Skip if value is empty or placeholder
    if (val && !val.includes('vul_') && !val.includes('jouw_')) {
      envVars[key] = val;
    }
  }
}

if (Object.keys(envVars).length === 0) {
  console.error('❌ Geen geldige environment variables gevonden in .env.local');
  process.exit(1);
}

console.log('\n📦 Environment variables gevonden:');
console.log(Object.keys(envVars).join(', '));
console.log('\n🚀 Push naar Vercel...\n');

// Push each variable to Vercel
let successCount = 0;
let failCount = 0;

for (const [key, value] of Object.entries(envVars)) {
  try {
    // Push to all environments (production, preview, development)
    const command = `vercel env add ${key} production preview development <<< "${value}"`;
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ ${key}`);
    successCount++;
  } catch (error) {
    console.error(`❌ ${key} - Fout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    failCount++;
  }
}

console.log(`\n✨ Klaar! ${successCount} variabelen toegevoegd, ${failCount} gefaald.\n`);

if (successCount > 0) {
  console.log('🔄 Redeploy je project in Vercel om de nieuwe variabelen te gebruiken.');
  console.log('   Of push een nieuwe commit naar GitHub.\n');
}
