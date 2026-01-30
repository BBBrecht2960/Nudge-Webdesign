import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminPermission } from '@/lib/api-security';

// Types for generateCursorPrompt / generateBasicPrompt (DB records are loosely typed)
interface LeadRecord {
  name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  company_size?: string;
  vat_number?: string;
  company_address?: string;
  company_postal_code?: string;
  company_city?: string;
  company_country?: string;
  company_website?: string;
  package_interest?: string;
  pain_points?: string[];
  current_website_status?: string;
  message?: string;
  assigned_to?: string;
  [key: string]: unknown;
}
interface QuoteOption {
  name?: string;
  description?: string;
}
interface QuoteCustomItem {
  name?: string;
  price?: number;
}
interface QuoteMaintenance {
  name?: string;
  price?: number;
}
interface QuoteRecord {
  total_price?: number;
  selectedPackage?: { name?: string };
  selectedOptions?: QuoteOption[];
  extraPages?: number;
  contentPages?: string[] | number;
  customItems?: QuoteCustomItem[];
  customLineItems?: Array<{ name?: string; price?: number }>;
  selectedMaintenance?: QuoteMaintenance;
  [key: string]: unknown;
}
interface AttachmentRecord {
  file_name?: string;
  file_type?: string;
  file_url?: string;
  file_size?: number;
  description?: string;
  uploaded_by?: string;
  [key: string]: unknown;
}
interface ActivityRecord {
  title?: string;
  activity_type?: string;
  summary?: string;
  description?: string;
  duration_minutes?: number;
  created_by?: string;
  scheduled_at?: string;
  completed_at?: string;
  [key: string]: unknown;
}

// POST: Convert a lead to a customer when status is set to "converted"
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminPermission('can_leads');
    if ('error' in authResult) return authResult.error;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Database niet geconfigureerd' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { id } = await params;
    const leadId = id;

    // Fetch lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead niet gevonden' },
        { status: 404 }
      );
    }

    // Check if lead is already converted
    if (lead.status !== 'converted') {
      return NextResponse.json(
        { error: 'Lead moet eerst gemarkeerd worden als "converted"' },
        { status: 400 }
      );
    }

    // Check if customer already exists for this lead
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('lead_id', leadId)
      .maybeSingle();

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer bestaat al voor deze lead', customer_id: existingCustomer.id },
        { status: 400 }
      );
    }

    // Fetch quote for revenue calculation
    // Priority: accepted > sent > draft (exclude rejected/expired)
    let approvedQuote = null;
    let quoteTotal = null;
    
    // First try to get accepted quote
    let { data: quote } = await supabase
      .from('lead_quotes')
      .select('*')
      .eq('lead_id', leadId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // If no accepted quote, try sent
    if (!quote) {
      const { data: sentQuote } = await supabase
        .from('lead_quotes')
        .select('*')
        .eq('lead_id', leadId)
        .eq('status', 'sent')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      quote = sentQuote;
    }

    // If still no quote, get the latest quote that's not rejected or expired
    if (!quote) {
      const { data: latestQuote } = await supabase
        .from('lead_quotes')
        .select('*')
        .eq('lead_id', leadId)
        .neq('status', 'rejected')
        .neq('status', 'expired')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      quote = latestQuote;
    }

    // If still no quote, get the absolute latest quote (fallback)
    if (!quote) {
      const { data: latestQuote } = await supabase
        .from('lead_quotes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      quote = latestQuote;
    }

    if (quote) {
      approvedQuote = quote.quote_data;
      quoteTotal = quote.total_price ?? (typeof (approvedQuote as { pricing?: { total?: number } })?.pricing?.total === 'number'
        ? (approvedQuote as { pricing: { total: number } }).pricing.total
        : null);
      console.log(`[Convert] Found quote for lead ${leadId}: total_price = ${quoteTotal}, status = ${quote.status}`);
    } else {
      console.warn(`[Convert] No quote found for lead ${leadId}. Revenue will be 0.`);
    }

    // Fetch all attachments
    const { data: attachments } = await supabase
      .from('lead_attachments')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    // Fetch all activities
    const { data: activities } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    // Generate AI prompt for Cursor
    const finalQuoteTotal = quoteTotal !== null && quoteTotal !== undefined ? Number(quoteTotal) : null;
    const cursorPrompt = await generateCursorPrompt(lead, approvedQuote, attachments || [], activities || [], finalQuoteTotal);
    
    console.log(`[Convert] Creating customer for lead ${leadId} with quote_total: ${finalQuoteTotal}`);

    // Create customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        lead_id: leadId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company_name: lead.company_name,
        company_size: lead.company_size,
        vat_number: lead.vat_number,
        company_address: lead.company_address,
        company_postal_code: lead.company_postal_code,
        company_city: lead.company_city,
        company_country: lead.company_country || 'België',
        company_website: lead.company_website,
        bank_account: lead.bank_account,
        package_interest: lead.package_interest,
        pain_points: lead.pain_points,
        current_website_status: lead.current_website_status,
        message: lead.message,
        approved_quote: approvedQuote,
        quote_total: finalQuoteTotal,
        quote_status: quote ? quote.status : 'pending',
        cursor_prompt: cursorPrompt,
        cursor_prompt_generated_at: new Date().toISOString(),
        assigned_to: lead.assigned_to,
        utm_source: lead.utm_source,
        utm_medium: lead.utm_medium,
        utm_campaign: lead.utm_campaign,
        utm_term: lead.utm_term,
        utm_content: lead.utm_content,
        referrer: lead.referrer,
        landing_path: lead.landing_path,
        converted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (customerError) {
      console.error('[Convert] Error creating customer:', customerError);
      return NextResponse.json(
        { error: 'Fout bij aanmaken customer', details: customerError.message },
        { status: 500 }
      );
    }

    console.log(`[Convert] Customer created successfully: ${customer.id}, quote_total: ${customer.quote_total}`);

    // Migrate attachments
    if (attachments && attachments.length > 0) {
      const attachmentsToInsert = attachments.map(att => ({
        customer_id: customer.id,
        original_lead_attachment_id: att.id,
        file_name: att.file_name,
        file_url: att.file_url,
        file_type: att.file_type,
        file_size: att.file_size,
        description: att.description,
        uploaded_by: att.uploaded_by,
      }));

      const { error: attachError } = await supabase
        .from('customer_attachments')
        .insert(attachmentsToInsert);

      if (attachError) {
        console.error('Error migrating attachments:', attachError);
        // Don't fail the request, just log the error
      }
    }

    // Migrate activities
    if (activities && activities.length > 0) {
      const activitiesToInsert = activities.map(act => ({
        customer_id: customer.id,
        original_lead_activity_id: act.id,
        activity_type: act.activity_type,
        title: act.title,
        description: act.description,
        summary: act.summary,
        duration_minutes: act.duration_minutes,
        created_by: act.created_by,
        scheduled_at: act.scheduled_at,
        completed_at: act.completed_at,
      }));

      const { error: activityError } = await supabase
        .from('customer_activities')
        .insert(activitiesToInsert);

      if (activityError) {
        console.error('Error migrating activities:', activityError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      customer,
      message: 'Lead succesvol geconverteerd naar customer',
      revenue: finalQuoteTotal,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    console.error('Error converting lead to customer:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/** Cursor Build Prompt template die de generator moet vullen (sectie 4). */
const CURSOR_BUILD_PROMPT_TEMPLATE = `Je bent een senior full-stack engineer. Bouw dit project in dit repo.

CONTEXT
- ProductType: …
- Package: …
- Business: …
- Primary goal: …

NON-NEGOTIABLE RULES
- Volg .cursorrules + SECURITY_RULES.md (security + no emojis + admin table layout pattern).
- Geen gradients; zachte kleuren; geen AI-look.

TECH STACK
- …
- …

INFORMATION ARCHITECTURE
- Routes/pages:
  - …
- Components:
  - …
- Data model (Supabase):
  - Tables + RLS intent
- Roles & permissions:
  - …

FUNCTIONAL REQUIREMENTS
Must-have
- …
Nice-to-have
- …

ADMIN REQUIREMENTS
- Modules:
  - Producten / Bestellingen / Klanten / Content / …
- Tabellen: gebruik het vaste scroll→padding/rand→table patroon.

SECURITY & QUALITY CHECKLIST (implement + tests)
- Request validation: Zod .strict op alle endpoints
- Rate limiting op: …
- AuthZ tests per protected route: 3 tests (unauth / wrong role / correct)
- Secrets: alleen env, nooit client

EXAMPLES TO IMPLEMENT (edge cases)
1) Contact endpoint:
   - POST /api/contact met Zod strict schema, rate limit, spam protection (basis), server-side mail hook (stub)
2) Admin route:
   - /admin/* protected, deny by default, tests
3) Admin table:
   - Table layout pattern + responsive horizontal scroll

DEFINITION OF DONE
- Build runs
- Lint/typecheck ok
- Tests groen
- Core flows werken: …
- Deployment ready (Vercel)

OUT OF SCOPE
- …
OPEN QUESTIONS (als TODO in code + aparte lijst)
- …`;

/** Lead input velden die altijd gecapteerd moeten worden (intake/checklist). */
const LEAD_INPUT_CHECKLIST = [
  'Type: website / webshop / webapp',
  'Doel: leads / verkoop / bookings / info',
  'Doelgroep + landen',
  'Pagina\'s (min): Home, Over, Diensten/Product, Contact, Privacy',
  'Features: website (contactform, CMS, booking) | webshop (payments, shipping, returns, varianten, BTW) | webapp (accounts, rollen, dashboards, CRUD, notificaties)',
  'Admin modules: producten, orders, klanten, content, settings, users/roles',
  'Design: 3 woorden + 2 voorbeelden (urls); niet: gradients, AI-look',
  'Content status: teksten/foto\'s klaar?',
  'SEO: lokaal/landelijk, blog ja/nee',
  'Integraties: Mailchimp/Klaviyo, CRM, PayPal/Stripe/Payconiq/PayFast, boekingstool',
  'Onderhoud: Starter/Business/Growth (wat zit erin)',
  'Deadline + launch must-haves',
];

// Generate AI prompt for Cursor based on lead data
async function generateCursorPrompt(
  lead: LeadRecord,
  quote: QuoteRecord | null,
  attachments: AttachmentRecord[],
  activities: ActivityRecord[],
  quoteTotal: number | null = null
): Promise<string> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return generateBasicPrompt(lead, quote, attachments, activities, quoteTotal);
    }

    // Analyze attachments (especially images/moodboards)
    let attachmentAnalysis = '';
    const imageAttachments = attachments?.filter((att: AttachmentRecord) =>
      att.file_type?.startsWith('image/') ||
      att.file_name?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
    ) || [];

    if (imageAttachments.length > 0) {
      try {
        // Analyze images with Vision API
        const imageAnalyses = await Promise.all(
          imageAttachments.map(async (att: AttachmentRecord) => {
            try {
              const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${openaiApiKey}`,
                },
                body: JSON.stringify({
                  model: 'gpt-4o',
                  messages: [
                    {
                      role: 'user',
                      content: [
                        {
                          type: 'text',
                          text: `Analyseer deze afbeelding in detail. Als het een moodboard, design mockup, of website design is, beschrijf:
- Alle kleuren (hex codes indien mogelijk)
- Typografie en fonts
- Layout stijl en structuur
- Design elementen (buttons, cards, spacing, etc.)
- Algemene sfeer en stijl
- Specifieke design keuzes
- Functionaliteiten die zichtbaar zijn

Als het een andere afbeelding is, beschrijf wat je ziet en hoe het relevant is voor het project.`
                        },
                        {
                          type: 'image_url',
                          image_url: {
                            url: att.file_url,
                          },
                        },
                      ],
                    },
                  ],
                  max_tokens: 1000,
                }),
              });

              if (visionResponse.ok) {
                const visionData = await visionResponse.json();
                return {
                  fileName: att.file_name,
                  description: att.description || '',
                  analysis: visionData.choices?.[0]?.message?.content || '',
                };
              }
            } catch (error) {
              console.error(`Error analyzing image ${att.file_name}:`, error);
            }
            return null;
          })
        );

        const validAnalyses = imageAnalyses.filter((a): a is NonNullable<typeof a> => a !== null);
        if (validAnalyses.length > 0) {
          attachmentAnalysis = '\n## Design Analyse (uit bijlagen)\n\n';
          validAnalyses.forEach((analysis) => {
            attachmentAnalysis += `### ${analysis.fileName ?? 'Afbeelding'}\n`;
            if (analysis.description) {
              attachmentAnalysis += `Beschrijving: ${analysis.description}\n\n`;
            }
            attachmentAnalysis += `${analysis.analysis ?? ''}\n\n`;
          });
        }
      } catch (error) {
        console.error('Error analyzing attachments:', error);
      }
    }

    // Build context for AI: lead input velden + offerte (voor invullen template)
    const packageName = quote?.selectedPackage?.name || lead.package_interest || 'Website';
    const isWebshop = packageName.toLowerCase().includes('webshop') || packageName.toLowerCase().includes('e-commerce');
    const isWebapp = packageName.toLowerCase().includes('webapp') || packageName.toLowerCase().includes('web app');
    const productType = isWebapp ? 'webapp' : isWebshop ? 'webshop' : 'website';
    const contextTotal = quoteTotal !== null && quoteTotal !== undefined ? quoteTotal : (quote?.total_price || 0);

    let context = `# Lead input (gebruik dit om de Cursor Build Prompt template in te vullen)\n\n`;
    context += `## CONTEXT-velden\n`;
    context += `- ProductType: ${productType}\n`;
    context += `- Package: ${packageName}\n`;
    context += `- Business: ${lead.company_name || lead.name} | ${lead.company_website || '—'} | ${[lead.company_address, lead.company_postal_code, lead.company_city, lead.company_country].filter(Boolean).join(', ') || '—'}\n`;
    context += `- Primary goal: ${lead.package_interest || lead.message || '—'}\n\n`;

    context += `## Contact\n`;
    context += `- Naam: ${lead.name} | Email: ${lead.email} | Telefoon: ${lead.phone || '—'}\n`;
    context += `- BTW: ${lead.vat_number || '—'} | Bedrijfsgrootte: ${lead.company_size || '—'}\n\n`;

    context += `## Pagina's & features (uit offerte)\n`;
    context += `- Minimaal: Home, Over, Diensten/Product, Contact, Privacy\n`;
    if (quote?.extraPages && quote.extraPages > 0) context += `- Extra pagina's: ${quote.extraPages}\n`;
    if (quote?.contentPages && (Array.isArray(quote.contentPages) ? quote.contentPages.length > 0 : true)) context += `- Content pagina's: ${Array.isArray(quote.contentPages) ? quote.contentPages.join(', ') : String(quote.contentPages)}\n`;
    if (quote?.selectedOptions?.length) {
      context += `- Features:\n`;
      quote.selectedOptions.forEach((opt: QuoteOption) => {
        context += `  - ${opt.name}${opt.description ? `: ${opt.description}` : ''}\n`;
      });
    }
    const customItems = quote?.customItems ?? quote?.customLineItems;
    if (customItems?.length) {
      customItems.forEach((item: QuoteCustomItem & { name?: string }) => {
        context += `  - ${item.name ?? 'Custom item'} (custom)\n`;
      });
    }
    context += `\n`;

    context += `## Admin modules (concreet)\n`;
    if (isWebshop) context += `- producten, orders, klanten, content, settings\n`;
    else context += `- klanten, content, settings\n`;
    context += `\n`;

    context += `## Budget & onderhoud\n`;
    context += `- Totaal: €${Number(contextTotal).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    if (quote?.selectedMaintenance) {
      context += `- Onderhoud: ${quote.selectedMaintenance.name} (€${quote.selectedMaintenance.price}/maand)\n`;
    }
    context += `\n`;

    if (lead.message) context += `## Bericht klant\n${lead.message}\n\n`;
    if (lead.pain_points?.length) context += `## Pain points\n${lead.pain_points.map((p: string) => `- ${p}`).join('\n')}\n\n`;
    if (lead.current_website_status) context += `## Huidige website status\n${lead.current_website_status}\n\n`;

    // Add attachment analysis
    if (attachmentAnalysis) {
      context += attachmentAnalysis;
    }

    // Add ALL attachments info (not just text documents)
    if (attachments && attachments.length > 0) {
      context += `## Alle Bijlagen\n`;
      attachments.forEach((att: AttachmentRecord) => {
        context += `- ${att.file_name}`;
        if (att.file_type) context += ` (${att.file_type})`;
        if (att.file_size) {
          const sizeMB = (att.file_size / (1024 * 1024)).toFixed(2);
          context += ` - ${sizeMB} MB`;
        }
        if (att.description) context += `: ${att.description}`;
        if (att.uploaded_by) context += ` (geüpload door: ${att.uploaded_by})`;
        context += '\n';
      });
      context += '\n';
    }

    // Add ALL activities (not just important ones)
    if (activities && activities.length > 0) {
      context += `## Alle Activiteiten & Notities\n`;
      activities.forEach((act: ActivityRecord) => {
        context += `### ${act.title || act.activity_type || 'Activiteit'}\n`;
        context += `Type: ${act.activity_type || 'Niet gespecificeerd'}\n`;
        if (act.summary) context += `Samenvatting: ${act.summary}\n`;
        if (act.description) context += `Beschrijving: ${act.description}\n`;
        if (act.duration_minutes) context += `Duur: ${act.duration_minutes} minuten\n`;
        if (act.created_by) context += `Door: ${act.created_by}\n`;
        if (act.scheduled_at) context += `Gepland: ${new Date(act.scheduled_at).toLocaleString('nl-BE')}\n`;
        if (act.completed_at) context += `Voltooid: ${new Date(act.completed_at).toLocaleString('nl-BE')}\n`;
        context += '\n';
      });
    }

    // Lead input checklist (zodat prompt nooit leeg is)
    context += `## Lead input checklist (invullen waar van toepassing)\n`;
    context += LEAD_INPUT_CHECKLIST.map((item) => `- ${item}`).join('\n');
    context += '\n\n';

    // Call OpenAI API: output moet exact het Cursor Build Prompt template volgen
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Je bent een expert die Cursor Build Prompts genereert. Je output moet EXACT het onderstaande template volgen. Vul alle secties in op basis van de projectinformatie. Vervang "…" door concrete inhoud. Behoud de sectiekoppen en structuur letterlijk.

TEMPLATE die je moet vullen:

${CURSOR_BUILD_PROMPT_TEMPLATE}

Regels:
- Output is ALLEEN de ingevulde prompt (geen uitleg ervoor of erna).
- CONTEXT: ProductType (website/webshop/webapp), Package (naam uit offerte), Business (bedrijfsnaam + korte beschrijving), Primary goal (doel van de site).
- NON-NEGOTIABLE RULES: letterlijk overnemen ( .cursorrules + SECURITY_RULES.md; geen gradients, geen AI-look ).
- TECH STACK: Next.js, Tailwind, Supabase, Vercel; evt. next-intl bij meertaligheid.
- INFORMATION ARCHITECTURE: routes/pagina's, componenten, Supabase-tabellen + RLS, rollen.
- FUNCTIONAL REQUIREMENTS: must-have uit offerte + lead; nice-to-have waar relevant.
- ADMIN REQUIREMENTS: modules (producten/orders/klanten/content/settings); tabelpatroon: scroll→padding/rand→table.
- SECURITY & QUALITY CHECKLIST: Zod .strict, rate limiting, 3 AuthZ tests per route, secrets alleen in env.
- EXAMPLES TO IMPLEMENT: contact endpoint, admin route, admin table (zoals in template).
- DEFINITION OF DONE, OUT OF SCOPE, OPEN QUESTIONS: concreet invullen.`,
          },
          {
            role: 'user',
            content: `Vul het Cursor Build Prompt template volledig in op basis van deze projectinformatie. Output alleen de ingevulde prompt.\n\n${context}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return generateBasicPrompt(lead, quote, attachments, activities, quoteTotal);
    }

    const data = await response.json();
    const aiPrompt = data.choices?.[0]?.message?.content || '';

    if (aiPrompt) {
      return aiPrompt;
    }

    return generateBasicPrompt(lead, quote, attachments, activities, quoteTotal);
  } catch (error) {
    console.error('Error generating AI prompt:', error);
    return generateBasicPrompt(lead, quote, attachments, activities, quoteTotal);
  }
}

// Fallback: Generate Cursor Build Prompt template (zonder AI) – zelfde structuur als AI-output
function generateBasicPrompt(
  lead: LeadRecord,
  quote: QuoteRecord | null,
  _attachments: AttachmentRecord[],
  _activities: ActivityRecord[],
  quoteTotal: number | null = null
): string {
  const packageName = quote?.selectedPackage?.name || lead.package_interest || 'Website';
  const isWebshop = packageName.toLowerCase().includes('webshop') || packageName.toLowerCase().includes('e-commerce');
  const isWebapp = packageName.toLowerCase().includes('webapp') || packageName.toLowerCase().includes('web app');
  const productType = isWebapp ? 'webapp' : isWebshop ? 'webshop' : 'website';
  const totalPrice = quoteTotal !== null && quoteTotal !== undefined ? quoteTotal : (quote?.total_price || 0);
  const formattedPrice = Number(totalPrice).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const isMultiLang = quote?.selectedOptions?.some((opt: QuoteOption) => opt.name?.toLowerCase().includes('multi-language') || opt.name?.toLowerCase().includes('meertalig'));

  const mustHave: string[] = [];
  if (quote?.selectedOptions?.length) {
    quote.selectedOptions.forEach((opt: QuoteOption) => {
      mustHave.push(`${opt.name}${opt.description ? `: ${opt.description}` : ''}`);
    });
  }
  if (quote?.extraPages && quote.extraPages > 0) mustHave.push(`Extra pagina's: ${quote.extraPages}`);
  if (quote?.contentPages && (Array.isArray(quote.contentPages) ? quote.contentPages.length > 0 : true)) mustHave.push(`Content pagina's: ${Array.isArray(quote.contentPages) ? quote.contentPages.join(', ') : String(quote.contentPages)}`);
  const customItemsBasic = quote?.customItems ?? quote?.customLineItems;
  if (customItemsBasic?.length) {
    customItemsBasic.forEach((item: QuoteCustomItem & { name?: string }) => mustHave.push(`${item.name ?? 'Custom'} (custom)`));
  }
  if (isWebshop) mustHave.push('Product catalogus, winkelwagen, checkout, betaling');
  if (isMultiLang) mustHave.push('Meertaligheid NL/FR/EN');

  const adminModules = isWebshop ? 'Producten, Bestellingen, Klanten, Content, Settings' : 'Klanten, Content, Settings';

  let prompt = `Je bent een senior full-stack engineer. Bouw dit project in dit repo.

CONTEXT
- ProductType: ${productType}
- Package: ${packageName}
- Business: ${lead.company_name || lead.name} | ${lead.company_website || '—'}
- Primary goal: ${lead.package_interest || lead.message || 'Leads/verkoop/info'}

NON-NEGOTIABLE RULES
- Volg .cursorrules + SECURITY_RULES.md (security + no emojis + admin table layout pattern).
- Geen gradients; zachte kleuren; geen AI-look.

TECH STACK
- Next.js 16+ (App Router), TypeScript
- Tailwind CSS
- Supabase (PostgreSQL, Auth indien nodig)
${isMultiLang ? '- next-intl of i18next\n' : ''}- Vercel deployment

INFORMATION ARCHITECTURE
- Routes/pages: Home, Over, Diensten/Product, Contact, Privacy (+ evt. extra uit offerte)
- Components: Herbruikbare React componenten, Tailwind
- Data model (Supabase): tabellen voor leads/klanten/content; RLS per rol
- Roles & permissions: admin (full), public (read/contact)

FUNCTIONAL REQUIREMENTS
Must-have
${mustHave.length ? mustHave.map((m) => `- ${m}`).join('\n') : '- Contactformulier, basis pagina\'s, responsive'}
Nice-to-have
- SEO (metadata, sitemap), performance (images, lazy load)

ADMIN REQUIREMENTS
- Modules: ${adminModules}
- Tabellen: gebruik het vaste scroll→padding/rand→table patroon.

SECURITY & QUALITY CHECKLIST (implement + tests)
- Request validation: Zod .strict op alle endpoints
- Rate limiting op: contact, login, signup
- AuthZ tests per protected route: 3 tests (unauth / wrong role / correct)
- Secrets: alleen env, nooit client

EXAMPLES TO IMPLEMENT (edge cases)
1) Contact endpoint:
   - POST /api/contact met Zod strict schema, rate limit, spam protection (basis), server-side mail hook (stub)
2) Admin route:
   - /admin/* protected, deny by default, tests
3) Admin table:
   - Table layout pattern + responsive horizontal scroll

DEFINITION OF DONE
- Build runs
- Lint/typecheck ok
- Tests groen
- Core flows werken: contact, admin inlog, basis CRUD
- Deployment ready (Vercel)

OUT OF SCOPE
- (invullen indien van toepassing)

OPEN QUESTIONS (als TODO in code + aparte lijst)
- (invullen indien van toepassing)
`;

  if (totalPrice > 0) prompt += `\nBudget: €${formattedPrice}\n`;
  if (lead.message) prompt += `\nBericht klant: ${lead.message}\n`;
  if (lead.pain_points?.length) prompt += `\nPain points: ${lead.pain_points.join('; ')}\n`;

  return prompt;
}
