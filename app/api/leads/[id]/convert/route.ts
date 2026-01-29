import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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
  contentPages?: string[];
  customItems?: QuoteCustomItem[];
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
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

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
      quoteTotal = quote.total_price;
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
    const cursorPrompt = await generateCursorPrompt(lead, approvedQuote, attachments || [], activities || []);

    // Ensure quote_total is a number (not null/undefined)
    const finalQuoteTotal = quoteTotal !== null && quoteTotal !== undefined ? Number(quoteTotal) : null;
    
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

// Generate AI prompt for Cursor based on lead data
async function generateCursorPrompt(
  lead: LeadRecord,
  quote: QuoteRecord | null,
  attachments: AttachmentRecord[],
  activities: ActivityRecord[],
  quoteTotal: number | null = null
): Promise<string> {
  try {
    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      // Return a basic prompt if AI is not configured
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

    // Build comprehensive context for AI
    let context = `# Project Brief: ${lead.company_name || lead.name}\n\n`;
    
    context += `## Contact Informatie\n`;
    context += `- Naam: ${lead.name}\n`;
    context += `- Email: ${lead.email}\n`;
    context += `- Telefoon: ${lead.phone || 'Niet opgegeven'}\n`;
    context += `- Bedrijf: ${lead.company_name || 'Niet opgegeven'}\n`;
    context += `- Bedrijfsgrootte: ${lead.company_size || 'Niet opgegeven'}\n`;
    context += `- BTW Nummer: ${lead.vat_number || 'Niet opgegeven'}\n`;
    context += `- Adres: ${lead.company_address || ''} ${lead.company_postal_code || ''} ${lead.company_city || ''} ${lead.company_country || ''}\n`;
    context += `- Website: ${lead.company_website || 'Niet opgegeven'}\n`;
    if (lead.assigned_to) {
      context += `- Toegewezen aan: ${lead.assigned_to}\n`;
    }
    context += '\n';

    if (lead.package_interest) {
      context += `## Interesse in Pakket\n${lead.package_interest}\n\n`;
    }

    if (lead.current_website_status) {
      context += `## Huidige Website Status\n${lead.current_website_status}\n\n`;
    }

    if (lead.message) {
      context += `## Bericht van Klant\n${lead.message}\n\n`;
    }

    if (lead.pain_points && lead.pain_points.length > 0) {
      context += `## Uitdagingen & Pain Points\n${lead.pain_points.map((p: string) => `- ${p}`).join('\n')}\n\n`;
    }

    if (quote) {
      context += `## Goedgekeurde Offerte - Technische Requirements\n`;
      context += `- Pakket Type: ${quote.selectedPackage?.name || 'Niet gespecificeerd'}\n`;
      // Use quoteTotal parameter if available, otherwise fallback to quote.total_price
      const contextTotal = quoteTotal !== null && quoteTotal !== undefined ? quoteTotal : (quote.total_price || 0);
      context += `- Totaal Budget: €${Number(contextTotal).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      
      if (quote.selectedOptions && quote.selectedOptions.length > 0) {
        context += `\n### Functionaliteiten (Verplicht):\n`;
        quote.selectedOptions.forEach((opt: QuoteOption) => {
          context += `- ${opt.name}`;
          if (opt.description) context += `: ${opt.description}`;
          context += `\n`;
        });
      }
      
      if (quote.extraPages && quote.extraPages > 0) {
        context += `\n- Extra pagina's: ${quote.extraPages}\n`;
      }
      
      if (quote.contentPages && quote.contentPages.length > 0) {
        context += `\n- Content pagina's: ${quote.contentPages.join(', ')}\n`;
      }
      
      if (quote.customItems && quote.customItems.length > 0) {
        context += `\n### Aangepaste Features:\n`;
        quote.customItems.forEach((item: QuoteCustomItem) => {
          context += `- ${item.name}: €${item.price}\n`;
        });
      }
      
      if (quote.selectedMaintenance) {
        context += `\n- Onderhoud: ${quote.selectedMaintenance.name} (€${quote.selectedMaintenance.price}/maand)\n`;
      }
      context += '\n';
    }

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

    // Call OpenAI API to generate comprehensive prompt
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
            content: `Je bent een expert web developer die DIRECT BRUIKBARE Cursor AI prompts genereert.

BELANGRIJK: Je genereert GEEN opsomming of project brief. Je genereert een DIRECTE PROMPT die een developer kan copy-pasten in Cursor om direct te beginnen met coden.

De prompt moet:
1. Direct instructies geven aan Cursor (gebruik "Maak...", "Implementeer...", "Creëer...")
2. Een complete project setup beschrijven
3. Alle technische details bevatten (tech stack, structuur, regels)
4. Design specificaties bevatten (kleuren, fonts, stijl)
5. Functionaliteiten in detail beschrijven
6. Code structuur en best practices definiëren

Format: Begin direct met instructies. Geen "Project Brief" of opsommingen. Directe, actieve instructies voor Cursor.`,
          },
          {
            role: 'user',
            content: `Genereer een DIRECTE, ACTIEVE Cursor prompt voor dit project. 

GEEN opsomming. GEEN project brief. DIRECTE instructies die Cursor kan uitvoeren.

De prompt moet beginnen met concrete instructies zoals:
"Maak een [project type] met de volgende specificaties:
- Tech stack: [exacte stack]
- Design: [kleuren, fonts, stijl]
- Functionaliteiten: [lijst met details]
- Project structuur: [folder layout]
- Code regels: [best practices]"

Analyseer deze project informatie en genereer een directe, actieve prompt:\n\n${context}`,
          },
        ],
        temperature: 0.7,
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

// Fallback: Generate basic prompt without AI
function generateBasicPrompt(
  lead: LeadRecord,
  quote: QuoteRecord | null,
  attachments: AttachmentRecord[],
  activities: ActivityRecord[],
  quoteTotal: number | null = null
): string {
  // Determine project type from package
  const packageName = quote?.selectedPackage?.name || lead.package_interest || 'Website';
  const isWebshop = packageName.toLowerCase().includes('webshop') || packageName.toLowerCase().includes('e-commerce');
  const isMultiLang = quote?.selectedOptions?.some((opt: QuoteOption) => opt.name?.toLowerCase().includes('multi-language') || opt.name?.toLowerCase().includes('meertalig'));
  
  // Get total price - prioritize quoteTotal from database, fallback to quote.total_price
  const totalPrice = quoteTotal !== null && quoteTotal !== undefined ? quoteTotal : (quote?.total_price || 0);
  const formattedPrice = Number(totalPrice).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  let prompt = `Maak een ${isWebshop ? 'webshop' : 'website'} project voor ${lead.company_name || lead.name} met de volgende specificaties:\n\n`;

  // Tech Stack
  prompt += `## Tech Stack\n`;
  prompt += `- Framework: Next.js 16+ (App Router)\n`;
  prompt += `- Styling: Tailwind CSS\n`;
  prompt += `- Database: Supabase (PostgreSQL)\n`;
  prompt += `- Authentication: Supabase Auth (indien nodig)\n`;
  prompt += `- Deployment: Vercel\n`;
  if (isMultiLang) {
    prompt += `- Internationalisatie: next-intl of i18next\n`;
  }
  prompt += `\n`;

  // Design & Stijl
  prompt += `## Design & Stijl\n`;
  prompt += `- Kleuren: Gebruik een modern, professioneel kleurenschema\n`;
  prompt += `- Typografie: System fonts (Inter, -apple-system, sans-serif)\n`;
  prompt += `- Layout: Responsive, mobile-first design\n`;
  prompt += `- Componenten: Herbruikbare React componenten met Tailwind CSS\n`;
  if (attachments && attachments.some((att: AttachmentRecord) => att.file_type?.startsWith('image/'))) {
    prompt += `- Design referenties: Zie bijgevoegde moodboards/designs voor specifieke kleuren en stijl\n`;
  }
  prompt += `\n`;

  // Functionaliteiten
  prompt += `## Functionaliteiten\n`;
  if (quote?.selectedPackage) {
    prompt += `- Basis pakket: ${quote.selectedPackage.name}\n`;
  }
  
  if (quote?.selectedOptions && quote.selectedOptions.length > 0) {
    prompt += `- Extra features:\n`;
    quote.selectedOptions.forEach((opt: QuoteOption) => {
      prompt += `  - ${opt.name}`;
      if (opt.description) prompt += `: ${opt.description}`;
      prompt += `\n`;
    });
  }
  
  if (quote?.extraPages && quote.extraPages > 0) {
    prompt += `- Extra pagina's: ${quote.extraPages} extra pagina's\n`;
  }
  
  if (quote?.contentPages && quote.contentPages.length > 0) {
    prompt += `- Content pagina's: ${quote.contentPages.join(', ')}\n`;
  }
  
  if (quote?.customItems && quote.customItems.length > 0) {
    prompt += `- Aangepaste features:\n`;
    quote.customItems.forEach((item: QuoteCustomItem) => {
      prompt += `  - ${item.name}\n`;
    });
  }
  
  if (isWebshop) {
    prompt += `- Webshop functionaliteiten: Product catalogus, winkelwagen, checkout, betaling integratie\n`;
  }
  
  if (isMultiLang) {
    prompt += `- Meertaligheid: Nederlands, Frans, Engels\n`;
  }
  prompt += `\n`;

  // Project Structuur
  prompt += `## Project Structuur\n`;
  prompt += `\`\`\`\n`;
  prompt += `/\n`;
  prompt += `├── app/              # Next.js App Router\n`;
  prompt += `│   ├── (routes)/     # Route groepen\n`;
  prompt += `│   ├── api/          # API routes\n`;
  prompt += `│   └── components/   # React componenten\n`;
  prompt += `├── lib/              # Utilities en helpers\n`;
  prompt += `├── public/           # Static assets\n`;
  prompt += `└── types/            # TypeScript types\n`;
  prompt += `\`\`\`\n\n`;

  // Code Regels
  prompt += `## Code Regels & Best Practices\n`;
  prompt += `- Gebruik TypeScript voor type safety\n`;
  prompt += `- Componenten: Function components met TypeScript\n`;
  prompt += `- Styling: Tailwind CSS utility classes\n`;
  prompt += `- State management: React hooks (useState, useEffect)\n`;
  prompt += `- API calls: Server-side in API routes, client-side met fetch\n`;
  prompt += `- Error handling: Try-catch blocks, user-friendly error messages\n`;
  prompt += `- Responsive: Mobile-first, breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)\n`;
  prompt += `- Performance: Image optimization, code splitting, lazy loading\n`;
  prompt += `- SEO: Metadata per pagina, structured data, sitemap\n`;
  prompt += `\n`;

  // Klant Specifieke Info
  if (lead.message) {
    prompt += `## Klant Specifieke Requirements\n`;
    prompt += `${lead.message}\n\n`;
  }

  if (lead.pain_points && lead.pain_points.length > 0) {
    prompt += `## Uitdagingen & Focus Punten\n`;
    lead.pain_points.forEach((p: string) => {
      prompt += `- ${p}\n`;
    });
    prompt += `\n`;
  }

  // Budget
  if (totalPrice > 0) {
    prompt += `## Budget & Scope\n`;
    prompt += `- Totaal budget: €${formattedPrice}\n`;
    prompt += `- Focus op core functionaliteiten binnen budget\n`;
    prompt += `\n`;
  }

  // Volgende Stappen
  prompt += `## Start Instructies\n`;
  prompt += `1. Initialiseer Next.js project met TypeScript en Tailwind CSS\n`;
  prompt += `2. Setup Supabase database en configuratie\n`;
  prompt += `3. Creëer basis project structuur\n`;
  prompt += `4. Implementeer core functionaliteiten volgens offerte\n`;
  prompt += `5. Test alle features en responsive design\n`;
  prompt += `6. Deploy naar Vercel\n`;

  return prompt;
}
