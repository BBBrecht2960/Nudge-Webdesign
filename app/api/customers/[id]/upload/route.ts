import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminPermission } from '@/lib/api-security';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminPermission('can_customers');
    if ('error' in authResult) return authResult.error;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Database niet geconfigureerd' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { id: customerId } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand geüpload' }, { status: 400 });
    }

    const bucketName = 'lead-attachments';
    const fileExt = file.name.split('.').pop();
    const filePath = `customers/${customerId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Customer upload error:', uploadError);
      return NextResponse.json(
        { error: uploadError.message || 'Fout bij uploaden' },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    const { data: attachmentData, error: attachmentError } = await supabase
      .from('customer_attachments')
      .insert({
        customer_id: customerId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        description: description || null,
        uploaded_by: 'Admin',
      })
      .select()
      .single();

    if (attachmentError) {
      console.error('Customer attachment insert error:', attachmentError);
      if (
        attachmentError.code === '42P01' ||
        attachmentError.message?.includes('does not exist') ||
        attachmentError.message?.includes('customer_attachments')
      ) {
        return NextResponse.json(
          { error: 'Database tabel "customer_attachments" bestaat niet of is niet bereikbaar.' },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: attachmentError.message }, { status: 500 });
    }

    return NextResponse.json({ attachment: attachmentData, message: 'Bijlage toegevoegd' });
  } catch (error) {
    console.error('Customer upload:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fout bij uploaden' },
      { status: 500 }
    );
  }
}
