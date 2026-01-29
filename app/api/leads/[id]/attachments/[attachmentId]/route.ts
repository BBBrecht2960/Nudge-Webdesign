import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminPermission } from '@/lib/api-security';

// DELETE: Delete an attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const authResult = await requireAdminPermission('can_leads');
    if ('error' in authResult) return authResult.error;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database niet geconfigureerd' },
        { status: 500 }
      );
    }

    const { id, attachmentId } = await params;
    const leadId = id;

    // Use anon key for database operations
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get attachment info first to get the file URL
    const { data: attachment, error: fetchError } = await supabase
      .from('lead_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('lead_id', leadId)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json(
        { error: 'Bijlage niet gevonden' },
        { status: 404 }
      );
    }

    // Delete file from storage if it exists
    if (attachment.file_url) {
      try {
        // Extract file path from URL
        // Supabase storage URLs are like: https://[project].supabase.co/storage/v1/object/public/lead-attachments/[path]
        const urlParts = attachment.file_url.split('/lead-attachments/');
        if (urlParts.length === 2) {
          const filePath = urlParts[1];
          
          // Use service role key for storage operations
          const supabaseStorage = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          });

          const { error: storageError } = await supabaseStorage.storage
            .from('lead-attachments')
            .remove([filePath]);

          if (storageError) {
            console.warn('Error deleting file from storage:', storageError);
            // Continue with database deletion even if storage deletion fails
          }
        }
      } catch (storageError) {
        console.warn('Error processing storage deletion:', storageError);
        // Continue with database deletion
      }
    }

    // Delete attachment record from database
    const { error: deleteError } = await supabase
      .from('lead_attachments')
      .delete()
      .eq('id', attachmentId)
      .eq('lead_id', leadId);

    if (deleteError) {
      console.error('Error deleting attachment record:', deleteError);
      return NextResponse.json(
        { error: 'Fout bij verwijderen bijlage uit database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Bijlage succesvol verwijderd',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string })?.code;
    console.error('Error deleting attachment:', {
      error,
      message: errorMessage,
      code: errorCode,
    });
    return NextResponse.json(
      { error: errorMessage || 'Fout bij verwijderen bijlage' },
      { status: 500 }
    );
  }
}
