/**
 * Script to update customer revenue (quote_total) from their lead quotes
 * This fixes customers that were converted without a quote_total
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load environment variables (same method as create-admins.ts)
const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');
      process.env[key.trim()] = cleanValue;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials ontbreken! Zorg dat NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY zijn ingesteld in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateCustomerRevenue() {
  console.log('🔍 Zoeken naar customers zonder quote_total...\n');

  // Get all customers without quote_total or with quote_total = 0
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, lead_id, name, email, quote_total')
    .or('quote_total.is.null,quote_total.eq.0');

  if (customersError) {
    console.error('❌ Fout bij ophalen customers:', customersError);
    process.exit(1);
  }

  if (!customers || customers.length === 0) {
    console.log('✅ Alle customers hebben al een quote_total!');
    return;
  }

  console.log(`📊 Gevonden ${customers.length} customer(s) zonder quote_total:\n`);

  let updated = 0;
  let skipped = 0;

  for (const customer of customers) {
    if (!customer.lead_id) {
      console.log(`⏭️  Customer ${customer.name} (${customer.id}) heeft geen lead_id, overslaan...`);
      skipped++;
      continue;
    }

    console.log(`🔍 Zoeken naar quote voor customer ${customer.name} (lead: ${customer.lead_id})...`);

    // Try to find quote (same logic as convert route)
    let quote = null;

    // First try accepted
    let { data: acceptedQuote } = await supabase
      .from('lead_quotes')
      .select('*')
      .eq('lead_id', customer.lead_id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (acceptedQuote) {
      quote = acceptedQuote;
    } else {
      // Try sent
      const { data: sentQuote } = await supabase
        .from('lead_quotes')
        .select('*')
        .eq('lead_id', customer.lead_id)
        .eq('status', 'sent')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (sentQuote) {
        quote = sentQuote;
      } else {
        // Try latest non-rejected/expired
        const { data: latestQuote } = await supabase
          .from('lead_quotes')
          .select('*')
          .eq('lead_id', customer.lead_id)
          .neq('status', 'rejected')
          .neq('status', 'expired')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (latestQuote) {
          quote = latestQuote;
        } else {
          // Try absolute latest
          const { data: absoluteLatest } = await supabase
            .from('lead_quotes')
            .select('*')
            .eq('lead_id', customer.lead_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          quote = absoluteLatest || null;
        }
      }
    }

    if (quote && quote.total_price) {
      const quoteTotal = Number(quote.total_price);
      console.log(`  ✅ Quote gevonden: €${quoteTotal.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (status: ${quote.status})`);

      const { error: updateError } = await supabase
        .from('customers')
        .update({ quote_total: quoteTotal })
        .eq('id', customer.id);

      if (updateError) {
        console.error(`  ❌ Fout bij updaten: ${updateError.message}`);
      } else {
        console.log(`  ✅ Customer bijgewerkt!\n`);
        updated++;
      }
    } else {
      console.log(`  ⚠️  Geen quote gevonden voor deze customer\n`);
      skipped++;
    }
  }

  console.log(`\n📊 Samenvatting:`);
  console.log(`  ✅ Bijgewerkt: ${updated}`);
  console.log(`  ⏭️  Overgeslagen: ${skipped}`);
  console.log(`  📊 Totaal: ${customers.length}`);
}

updateCustomerRevenue()
  .then(() => {
    console.log('\n✅ Script voltooid!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fout:', error);
    process.exit(1);
  });
