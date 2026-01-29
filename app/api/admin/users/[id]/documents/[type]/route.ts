import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminPermission } from '@/lib/api-security';
import { isValidUUID } from '@/lib/security';

const BUCKET = 'admin-user-documents';
const ALLOWED_TYPES = ['passport_front', 'passport_back', 'nda'] as const;

// GET: Download document (stream). Requires can_manage_users. No direct URLs exposed.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const authResult = await requireAdminPermission('can_manage_users');
  if ('error' in authResult) return authResult.error;

  const { id: adminUserId, type: documentType } = await params;
  if (!isValidUUID(adminUserId)) {
    return NextResponse.json({ error: 'Ongeldige gebruikers-id' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(documentType as typeof ALLOWED_TYPES[number])) {
    return NextResponse.json({ error: 'Ongeldig documenttype' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Storage niet geconfigureerd' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: doc, error: docErr } = await supabase
    .from('admin_user_documents')
    .select('storage_path, content_type, file_name')
    .eq('admin_user_id', adminUserId)
    .eq('document_type', documentType)
    .single();

  if (docErr || !doc) {
    return NextResponse.json({ error: 'Document niet gevonden' }, { status: 404 });
  }

  const { data: fileData, error: downloadErr } = await supabase.storage
    .from(BUCKET)
    .download(doc.storage_path);

  if (downloadErr || !fileData) {
    return NextResponse.json({ error: 'Document niet beschikbaar' }, { status: 404 });
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const contentType = doc.content_type || 'application/octet-stream';
  const ext = contentType.includes('pdf') ? 'pdf' : 'jpg';
  const fileName = doc.file_name || `${documentType}.${ext}`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

// DELETE: Remove document. Requires can_manage_users.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const authResult = await requireAdminPermission('can_manage_users');
  if ('error' in authResult) return authResult.error;

  const { id: adminUserId, type: documentType } = await params;
  if (!isValidUUID(adminUserId)) {
    return NextResponse.json({ error: 'Ongeldige gebruikers-id' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(documentType as typeof ALLOWED_TYPES[number])) {
    return NextResponse.json({ error: 'Ongeldig documenttype' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Storage niet geconfigureerd' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: doc } = await supabase
    .from('admin_user_documents')
    .select('storage_path')
    .eq('admin_user_id', adminUserId)
    .eq('document_type', documentType)
    .single();

  if (doc) {
    await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    await supabase.from('admin_user_documents').delete().eq('admin_user_id', adminUserId).eq('document_type', documentType);
  }

  return NextResponse.json({ success: true });
}
