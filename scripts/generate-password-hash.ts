/**
 * Script om een password hash te genereren voor SQL update
 * 
 * Gebruik: npx tsx scripts/generate-password-hash.ts <password>
 */

import bcrypt from 'bcryptjs';

const password = process.argv[2] || 'Nudge2026!!';

async function generateHash() {
  const hash = await bcrypt.hash(password, 10);
  console.log('\nPassword hash voor SQL:');
  console.log(hash);
  console.log('\nSQL statement:');
  console.log(`UPDATE admin_users SET password_hash = '${hash}' WHERE email = 'brecht.leap@gmail.com';`);
  console.log(`UPDATE admin_users SET password_hash = '${hash}' WHERE email = 'yinthe.gaens@gmail.com';`);
  console.log('\n');
}

generateHash();
