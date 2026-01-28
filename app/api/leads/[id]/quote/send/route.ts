import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// POST: Send quote via email
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

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service niet geconfigureerd. Voeg RESEND_API_KEY toe aan .env.local' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { id } = await params;
    const leadId = id;
    
    // Try to parse body, but don't require it
    let body = null;
    try {
      const bodyText = await request.text();
      if (bodyText) {
        body = JSON.parse(bodyText);
      }
    } catch {
      // Body is optional for this endpoint
      body = null;
    }

    // Get lead information
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

    // Get quote
    const { data: quote, error: quoteError } = await supabase
      .from('lead_quotes')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (quoteError) {
      // Check if table doesn't exist
      if (
        quoteError.code === '42P01' ||
        quoteError.message?.includes('does not exist') ||
        quoteError.message?.includes('schema cache') ||
        quoteError.message?.includes('lead_quotes')
      ) {
        return NextResponse.json(
          {
            error: 'Database tabel "lead_quotes" bestaat niet. Voer het SQL script "supabase-quotes-table.sql" uit in je Supabase database om de tabel aan te maken.',
          },
          { status: 500 }
        );
      }

      // PGRST116 = no rows found
      if (quoteError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Offerte niet gevonden. Sla eerst de offerte op.' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: `Fout bij ophalen offerte: ${quoteError.message || 'Onbekende fout'}` },
        { status: 500 }
      );
    }

    if (!quote) {
      return NextResponse.json(
        { error: 'Offerte niet gevonden. Sla eerst de offerte op.' },
        { status: 404 }
      );
    }

    // Build email HTML
    const quoteData = quote.quote_data;
    const businessEmail = 'brecht.leap@gmail.com';
    const businessPhone = '+32494299633';
    const businessName = 'Nudge Webdesign';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offerte - ${businessName}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #9067C6 0%, #8D86C9 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Offerte van ${businessName}</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
    <p style="margin-top: 0;">Beste ${lead.name},</p>
    
    <p>Bedankt voor uw interesse in onze diensten. Hierbij ontvangt u onze offerte op maat.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9067C6;">
      <h2 style="margin-top: 0; color: #9067C6;">Offerte Details</h2>
      
      ${quoteData.selectedPackage ? `
      <div style="margin-bottom: 15px;">
        <strong>Basis Pakket:</strong> ${quoteData.selectedPackage.name}<br>
        <span style="color: #666;">€${quoteData.selectedPackage.basePrice.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      ` : ''}
      
      ${quoteData.selectedOptions && quoteData.selectedOptions.length > 0 ? `
      <div style="margin-bottom: 15px;">
        <strong>Extra Opties:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${quoteData.selectedOptions.map((opt: { id: string; name: string; price: number }) => {
            const note = quoteData.optionNotes && quoteData.optionNotes[opt.id] ? quoteData.optionNotes[opt.id] : null;
            return `
            <li style="margin-bottom: ${note ? '8px' : '4px'};">
              ${opt.name} - €${opt.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              ${note ? `<br><span style="font-size: 11px; color: #666; font-style: italic; margin-left: 20px;">${note}</span>` : ''}
            </li>
          `;
          }).join('')}
        </ul>
      </div>
      ` : ''}
      
      ${quoteData.selectedMaintenance ? `
      <div style="margin-bottom: 15px;">
        <strong>Onderhoud:</strong> ${quoteData.selectedMaintenance.name}<br>
        <span style="color: #666;">€${quoteData.selectedMaintenance.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per maand</span>
      </div>
      ` : ''}
      
      ${quoteData.extraPages > 0 ? `
      <div style="margin-bottom: 15px;">
        <strong>Extra pagina's:</strong> ${quoteData.extraPages}x<br>
        <span style="color: #666;">€${(quoteData.extraPages * 50).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      ` : ''}
      
      ${quoteData.contentPages > 0 ? `
      <div style="margin-bottom: 15px;">
        <strong>Content creatie:</strong> ${quoteData.contentPages}x pagina's<br>
        <span style="color: #666;">€${(quoteData.contentPages * 75).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      ` : ''}
      
      <div style="border-top: 2px solid #9067C6; padding-top: 15px; margin-top: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-size: 18px;">Totaal (eenmalig):</strong>
          <strong style="font-size: 24px; color: #9067C6;">€${quote.total_price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>
        ${quoteData.selectedMaintenance ? `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
          <span>Onderhoud (per maand):</span>
          <strong>€${quoteData.selectedMaintenance.price.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>
        ` : ''}
      </div>
    </div>
    
    <p>Heeft u vragen over deze offerte? Neem gerust contact met ons op.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9067C6;">
      <h3 style="margin-top: 0; color: #9067C6;">Contactgegevens</h3>
      <p style="margin: 5px 0;">
        <strong>E-mail:</strong> <a href="mailto:${businessEmail}" style="color: #9067C6;">${businessEmail}</a>
      </p>
      <p style="margin: 5px 0;">
        <strong>Telefoon:</strong> <a href="tel:${businessPhone}" style="color: #9067C6;">${businessPhone}</a>
      </p>
    </div>
    
    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
      <strong>Let op:</strong> Dit is een automatisch gegenereerd bericht. Reageer niet direct op deze e-mail. 
      Voor vragen of opmerkingen, neem contact op via ${businessEmail} of ${businessPhone}.
    </p>
    
    <p style="font-size: 12px; color: #999; margin-top: 20px;">
      Met vriendelijke groet,<br>
      <strong>${businessName}</strong><br>
      <span style="color: #666;">Herkenrodesingel 19C/4.2, 3500 Hasselt, België</span>
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px; font-size: 11px; color: #666;">
    <p style="margin: 0;">
      <strong>Noreply E-mail</strong><br>
      Deze e-mail is automatisch verzonden vanaf een noreply-adres. 
      Reageer niet op deze e-mail. Gebruik de bovenstaande contactgegevens voor vragen.
    </p>
  </div>
</body>
</html>
    `;

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Nudge Webdesign <noreply@${process.env.RESEND_DOMAIN || 'onboarding.resend.dev'}>`,
        to: lead.email,
        reply_to: businessEmail,
        subject: `Offerte - ${businessName}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      let errorMessage = 'Fout bij verzenden e-mail';
      try {
        const responseText = await resendResponse.text();
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            errorMessage = responseText || `HTTP ${resendResponse.status}: ${resendResponse.statusText}`;
          }
        } else {
          errorMessage = `HTTP ${resendResponse.status}: ${resendResponse.statusText}`;
        }
        console.error('Resend API error:', {
          status: resendResponse.status,
          statusText: resendResponse.statusText,
          error: errorMessage,
        });
      } catch (parseError) {
        errorMessage = `HTTP ${resendResponse.status}: ${resendResponse.statusText}`;
        console.error('Error parsing Resend response:', parseError);
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    let emailData;
    try {
      const responseText = await resendResponse.text();
      if (responseText) {
        emailData = JSON.parse(responseText);
      } else {
        // Empty response but status is OK - assume success
        emailData = { id: 'unknown' };
      }
    } catch (parseError) {
      console.error('Error parsing successful Resend response:', parseError);
      // Continue anyway - email might have been sent
      emailData = { id: 'unknown' };
    }

    // Update quote status to 'sent'
    const { error: updateError } = await supabase
      .from('lead_quotes')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', quote.id);

    if (updateError) {
      console.error('Error updating quote status:', updateError);
      // Don't fail the request if status update fails - email was sent
    }

    // Create activity log (non-blocking)
    try {
      await supabase
        .from('lead_activities')
        .insert({
          lead_id: leadId,
          activity_type: 'email',
          title: 'Offerte verzonden via e-mail',
          description: `Offerte verzonden naar ${lead.email}`,
        });
    } catch (activityError) {
      console.error('Error creating activity log:', activityError);
      // Don't fail the request if activity log fails
    }

    return NextResponse.json({
      success: true,
      message: 'Offerte succesvol verzonden',
      emailId: emailData.id,
    });
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error('Error sending quote email:', {
      error,
      message: errorObj.message,
      code: (error as { code?: string })?.code,
      stack: errorObj.stack,
    });

    // Check if table doesn't exist
    const supabaseError = error as { code?: string; message?: string };
    if (
      supabaseError.code === '42P01' ||
      supabaseError.message?.includes('does not exist') ||
      supabaseError.message?.includes('schema cache') ||
      supabaseError.message?.includes('lead_quotes')
    ) {
      return NextResponse.json(
        {
          error: 'Database tabel "lead_quotes" bestaat niet. Voer het SQL script "supabase-quotes-table.sql" uit in je Supabase database om de tabel aan te maken.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: errorObj.message || 'Fout bij verzenden offerte' },
      { status: 500 }
    );
  }
}
