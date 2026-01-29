import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminPermission } from '@/lib/api-security';
import { isValidUUID } from '@/lib/security';

const BUCKET = 'admin-user-documents';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const;
const ALLOWED_NDA_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_DOCUMENT_TYPES = ['passport_front', 'passport_back', 'nda'] as const;

// POST: Upload passport front or back. Requires can_manage_users. Strict validation.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminPermission('can_manage_users');
  if ('error' in authResult) return authResult.error;

  const { id: adminUserId } = await params;
  if (!isValidUUID(adminUserId)) {
    return NextResponse.json({ error: 'Ongeldige gebruikers-id' }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Ongeldige formulierdata' }, { status: 400 });
  }

  const documentType = formData.get('document_type');
  if (typeof documentType !== 'string' || !ALLOWED_DOCUMENT_TYPES.includes(documentType as typeof ALLOWED_DOCUMENT_TYPES[number])) {
    return NextResponse.json({ error: 'document_type moet passport_front, passport_back of nda zijn' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Geen bestand geüpload' }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Bestand mag maximaal 10 MB zijn' }, { status: 400 });
  }

  const mime = file.type as string;
  const isNda = documentType === 'nda';
  const allowedMimes: readonly string[] = isNda ? ALLOWED_NDA_TYPES : ALLOWED_IMAGE_TYPES;
  if (!allowedMimes.includes(mime)) {
    return NextResponse.json(
      { error: isNda ? 'NDA: alleen JPEG, PNG of PDF toegestaan' : 'Alleen JPEG en PNG zijn toegestaan' },
      { status: 400 }
    );
  }

  const ext = mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg';
  const storagePath = `${adminUserId}/${documentType}.${ext}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Storage niet geconfigureerd' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: user } = await supabase.from('admin_users').select('id').eq('id', adminUserId).single();
  if (!user) {
    return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: bucketErr } = await supabase.storage.getBucket(BUCKET);
  if (bucketErr) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: MAX_SIZE_BYTES,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    });
    if (createErr) {
      console.error('Create bucket error:', createErr);
      return NextResponse.json({ error: 'Storage niet beschikbaar' }, { status: 500 });
    }
  }

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: mime,
      upsert: true,
    });

  if (uploadErr) {
    console.error('Upload error:', uploadErr);
    return NextResponse.json({ error: 'Upload mislukt' }, { status: 500 });
  }

  const docRow = {
    admin_user_id: adminUserId,
    document_type: documentType,
    storage_path: storagePath,
    file_name: file.name || `${documentType}.${ext}`,
    content_type: mime,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertErr } = await supabase
    .from('admin_user_documents')
    .upsert(docRow, {
      onConflict: 'admin_user_id,document_type',
      ignoreDuplicates: false,
    });

  if (upsertErr) {
    console.error('Upsert document record error:', upsertErr);
    return NextResponse.json({ error: 'Documentregistratie mislukt' }, { status: 500 });
  }

  return NextResponse.json({ success: true, document_type: documentType }, { status: 201 });
}
