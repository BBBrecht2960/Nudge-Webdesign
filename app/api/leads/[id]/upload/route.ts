import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// POST: Upload file to Supabase Storage and create attachment record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database niet geconfigureerd' },
        { status: 500 }
      );
    }

    // Use service role key for storage operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { id } = await params;
    const leadId = id;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string | null;
    const activityId = formData.get('activity_id') as string | null;
    const uploadedBy = formData.get('uploaded_by') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Geen bestand geüpload' },
        { status: 400 }
      );
    }

    // Check if bucket exists, create if it doesn't
    const bucketName = 'lead-attachments';
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return NextResponse.json(
        {
          error: 'Fout bij controleren storage buckets. Controleer je Supabase configuratie.',
        },
        { status: 500 }
      );
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);
    
    if (!bucketExists) {
      // Try to create the bucket
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: null, // Allow all file types
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return NextResponse.json(
          {
            error: `Storage bucket "${bucketName}" bestaat niet en kon niet automatisch worden aangemaakt. Maak deze handmatig aan in Supabase Dashboard → Storage.`,
          },
          { status: 500 }
        );
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${leadId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = fileName;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', {
        error: uploadError,
        message: uploadError.message,
        bucketName,
        filePath,
      });
      
      // Provide specific error messages
      if (uploadError.message?.includes('Bucket') || uploadError.message?.includes('not found')) {
        return NextResponse.json(
          {
            error: `Storage bucket "${bucketName}" niet gevonden. Maak deze aan in Supabase Dashboard → Storage → New bucket.`,
          },
          { status: 500 }
        );
      }
      
      if (uploadError.message?.includes('duplicate') || uploadError.message?.includes('already exists')) {
        return NextResponse.json(
          {
            error: 'Dit bestand bestaat al. Probeer een ander bestand of hernoem het bestand.',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: `Fout bij uploaden: ${uploadError.message || 'Onbekende fout'}`,
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Create attachment record
    const { data: attachmentData, error: attachmentError } = await supabase
      .from('lead_attachments')
      .insert({
        lead_id: leadId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        description: description || null,
        activity_id: activityId || null,
        uploaded_by: uploadedBy || null,
      })
      .select()
      .single();

    if (attachmentError) {
      console.error('Error creating attachment record:', {
        error: attachmentError,
        code: attachmentError.code,
        message: attachmentError.message,
        details: attachmentError.details,
        hint: attachmentError.hint,
      });

      // Check if table doesn't exist
      if (
        attachmentError.code === '42P01' ||
        attachmentError.message?.includes('does not exist') ||
        attachmentError.message?.includes('schema cache') ||
        attachmentError.message?.includes('lead_attachments')
      ) {
        return NextResponse.json(
          {
            error: 'Database tabel "lead_attachments" bestaat niet. Voer het SQL script "supabase-schema-extensions.sql" uit in je Supabase database om de tabel aan te maken.',
          },
          { status: 500 }
        );
      }

      throw attachmentError;
    }

    return NextResponse.json({
      attachment: attachmentData,
      message: 'Bestand succesvol geüpload',
    });
  } catch (error: unknown) {
    const supabaseError = error as { code?: string; message?: string; details?: string; hint?: string };
    console.error('Error uploading file:', {
      error,
      message: supabaseError.message,
      code: supabaseError.code,
      details: supabaseError.details,
      hint: supabaseError.hint,
    });

    // Check for table not found error
    if (
      supabaseError.code === '42P01' ||
      supabaseError.message?.includes('does not exist') ||
      supabaseError.message?.includes('schema cache') ||
      supabaseError.message?.includes('lead_attachments')
    ) {
      return NextResponse.json(
        {
          error: 'Database tabel "lead_attachments" bestaat niet. Voer het SQL script "supabase-schema-extensions.sql" uit in je Supabase database om de tabel aan te maken.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: supabaseError.message || 'Fout bij uploaden bestand' },
      { status: 500 }
    );
  }
}
