import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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
        package_interest: lead.package_interest,
        pain_points: lead.pain_points,
        current_website_status: lead.current_website_status,
        message: lead.message,
        approved_quote: approvedQuote,
        quote_total: quoteTotal,
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
      console.error('Error creating customer:', customerError);
      return NextResponse.json(
        { error: 'Fout bij aanmaken customer', details: customerError.message },
        { status: 500 }
      );
    }

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
  lead: any,
  quote: any,
  attachments: any[],
  activities: any[]
): Promise<string> {
  try {
    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      // Return a basic prompt if AI is not configured
      return generateBasicPrompt(lead, quote, attachments, activities);
    }

    // Analyze attachments (especially images/moodboards)
    let attachmentAnalysis = '';
    const imageAttachments = attachments?.filter((att: any) => 
      att.file_type?.startsWith('image/') || 
      att.file_name?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
    ) || [];

    if (imageAttachments.length > 0) {
      try {
        // Analyze images with Vision API
        const imageAnalyses = await Promise.all(
          imageAttachments.map(async (att: any) => {
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

        const validAnalyses = imageAnalyses.filter(a => a !== null);
        if (validAnalyses.length > 0) {
          attachmentAnalysis = '\n## Design Analyse (uit bijlagen)\n\n';
          validAnalyses.forEach((analysis: any) => {
            attachmentAnalysis += `### ${analysis.fileName}\n`;
            if (analysis.description) {
              attachmentAnalysis += `Beschrijving: ${analysis.description}\n\n`;
            }
            attachmentAnalysis += `${analysis.analysis}\n\n`;
          });
        }
      } catch (error) {
        console.error('Error analyzing attachments:', error);
      }
    }

    // Analyze text documents if any
    const textAttachments = attachments?.filter((att: any) => 
      att.file_type?.includes('text') || 
      att.file_type?.includes('pdf') ||
      att.file_name?.match(/\.(txt|md|pdf|doc|docx)$/i)
    ) || [];

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
      context += `- Totaal Budget: €${quote.total_price?.toLocaleString('nl-BE') || '0'}\n`;
      
      if (quote.selectedOptions && quote.selectedOptions.length > 0) {
        context += `\n### Functionaliteiten (Verplicht):\n`;
        quote.selectedOptions.forEach((opt: any) => {
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
        quote.customItems.forEach((item: any) => {
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
      attachments.forEach((att: any) => {
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
      activities.forEach((act: any) => {
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
            content: `Je bent een expert web developer die SUPER GEDETAILLEERDE, COMPLETE project prompts genereert voor Cursor AI.

De prompt die je genereert moet ZO COMPLEET zijn dat een developer in Cursor:
- Direct kan beginnen met coden zonder extra vragen te stellen
- Alle design details kent (kleuren, fonts, spacing, etc.)
- Alle functionaliteiten begrijpt
- De exacte tech stack weet
- Alle requirements heeft

De prompt MOET bevatten:
1. **Design Specificaties** (uit moodboards/designs):
   - Exacte kleuren (hex codes)
   - Typografie (fonts, sizes, weights)
   - Spacing en layout (padding, margins, grid)
   - Component stijlen (buttons, cards, forms)
   - Responsive breakpoints
   - Animations en transitions

2. **Technische Stack**:
   - Framework (Next.js, React, etc.)
   - Styling (Tailwind CSS, CSS modules, etc.)
   - Database (Supabase, etc.)
   - Authentication
   - Deployment

3. **Functionaliteiten** (uit offerte):
   - Alle features in detail
   - User flows
   - API endpoints nodig
   - Data modellen

4. **Project Structuur**:
   - Folder structuur
   - Component organisatie
   - File naming conventions

5. **Specifieke Requirements**:
   - Performance targets
   - SEO requirements
   - Accessibility
   - Security

Format: Markdown met duidelijke secties. De prompt moet direct copy-paste klaar zijn voor Cursor.`,
          },
          {
            role: 'user',
            content: `Genereer een SUPER GEDETAILLEERDE, COMPLETE Cursor AI prompt voor dit project. 

De prompt moet ALLES bevatten wat nodig is om direct te beginnen met coden. Analyseer alle informatie zorgvuldig en genereer een prompt die:
- Alle design details bevat (kleuren, fonts, spacing uit moodboards)
- Alle functionaliteiten specificeert
- De exacte tech stack definieert
- Complete project structuur beschrijft
- Geen vragen meer overlaat

Project informatie:\n\n${context}\n\nGenereer nu de complete, gedetailleerde Cursor prompt.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return generateBasicPrompt(lead, quote, attachments, activities);
    }

    const data = await response.json();
    const aiPrompt = data.choices?.[0]?.message?.content || '';

    if (aiPrompt) {
      return aiPrompt;
    }

    return generateBasicPrompt(lead, quote, attachments, activities);
  } catch (error) {
    console.error('Error generating AI prompt:', error);
    return generateBasicPrompt(lead, quote, attachments, activities);
  }
}

// Fallback: Generate basic prompt without AI
function generateBasicPrompt(
  lead: any,
  quote: any,
  attachments: any[],
  activities: any[]
): string {
  let prompt = `# Project Brief: ${lead.company_name || lead.name}\n\n`;
  
  prompt += `## Klant Informatie\n`;
  prompt += `- Naam: ${lead.name}\n`;
  prompt += `- Email: ${lead.email}\n`;
  prompt += `- Telefoon: ${lead.phone || 'Niet opgegeven'}\n`;
  prompt += `- Bedrijf: ${lead.company_name || 'Niet opgegeven'}\n`;
  prompt += `- Bedrijfsgrootte: ${lead.company_size || 'Niet opgegeven'}\n`;
  prompt += `- BTW: ${lead.vat_number || 'Niet opgegeven'}\n`;
  prompt += `- Adres: ${lead.company_address || ''} ${lead.company_postal_code || ''} ${lead.company_city || ''} ${lead.company_country || ''}\n`;
  prompt += `- Website: ${lead.company_website || 'Niet opgegeven'}\n`;
  if (lead.assigned_to) {
    prompt += `- Toegewezen aan: ${lead.assigned_to}\n`;
  }
  prompt += '\n';

  if (lead.package_interest) {
    prompt += `## Interesse in Pakket\n${lead.package_interest}\n\n`;
  }

  if (lead.current_website_status) {
    prompt += `## Huidige Website Status\n${lead.current_website_status}\n\n`;
  }

  if (lead.message) {
    prompt += `## Bericht van Klant\n${lead.message}\n\n`;
  }

  if (lead.pain_points && lead.pain_points.length > 0) {
    prompt += `## Uitdagingen & Pain Points\n${lead.pain_points.map((p: string) => `- ${p}`).join('\n')}\n\n`;
  }

  if (quote) {
    prompt += `## Goedgekeurde Offerte\n`;
    prompt += `- Pakket: ${quote.selectedPackage?.name || 'Niet gespecificeerd'}\n`;
    prompt += `- Totaal: €${quote.total_price?.toLocaleString('nl-BE') || '0'}\n`;
    
    if (quote.selectedOptions && quote.selectedOptions.length > 0) {
      prompt += `- Opties:\n`;
      quote.selectedOptions.forEach((opt: any) => {
        prompt += `  - ${opt.name}\n`;
      });
    }
    
    if (quote.extraPages && quote.extraPages > 0) {
      prompt += `- Extra pagina's: ${quote.extraPages}\n`;
    }
    
    if (quote.contentPages && quote.contentPages.length > 0) {
      prompt += `- Content pagina's: ${quote.contentPages.join(', ')}\n`;
    }
    
    if (quote.customItems && quote.customItems.length > 0) {
      prompt += `- Aangepaste items:\n`;
      quote.customItems.forEach((item: any) => {
        prompt += `  - ${item.name}: €${item.price}\n`;
      });
    }
    
    if (quote.selectedMaintenance) {
      prompt += `- Onderhoud: ${quote.selectedMaintenance.name} (€${quote.selectedMaintenance.price}/maand)\n`;
    }
    prompt += '\n';
  }

  if (attachments && attachments.length > 0) {
    prompt += `## Alle Bijlagen\n`;
    attachments.forEach((att: any) => {
      prompt += `- ${att.file_name}`;
      if (att.file_type) prompt += ` (${att.file_type})`;
      if (att.file_size) {
        const sizeMB = (att.file_size / (1024 * 1024)).toFixed(2);
        prompt += ` - ${sizeMB} MB`;
      }
      if (att.description) prompt += `: ${att.description}`;
      if (att.uploaded_by) prompt += ` (geüpload door: ${att.uploaded_by})`;
      prompt += '\n';
    });
    prompt += '\n';
  }

  if (activities && activities.length > 0) {
    prompt += `## Alle Activiteiten & Notities\n`;
    activities.forEach((act: any) => {
      prompt += `### ${act.title || act.activity_type || 'Activiteit'}\n`;
      prompt += `Type: ${act.activity_type || 'Niet gespecificeerd'}\n`;
      if (act.summary) prompt += `Samenvatting: ${act.summary}\n`;
      if (act.description) prompt += `Beschrijving: ${act.description}\n`;
      if (act.duration_minutes) prompt += `Duur: ${act.duration_minutes} minuten\n`;
      if (act.created_by) prompt += `Door: ${act.created_by}\n`;
      if (act.scheduled_at) prompt += `Gepland: ${new Date(act.scheduled_at).toLocaleString('nl-BE')}\n`;
      if (act.completed_at) prompt += `Voltooid: ${new Date(act.completed_at).toLocaleString('nl-BE')}\n`;
      prompt += '\n';
    });
  }

  prompt += `## Volgende Stappen\n`;
  prompt += `1. Review alle bijlagen en documenten\n`;
  prompt += `2. Setup project structuur volgens offerte\n`;
  prompt += `3. Implementeer core functionaliteiten\n`;
  prompt += `4. Test en deploy\n`;

  return prompt;
}
