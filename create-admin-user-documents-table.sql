-- Tabel voor beveiligde opslag van documenten (paspoort voor-/achterzijde) per admin gebruiker.
-- Toegang alleen via API met can_manage_users. Bestanden staan in Supabase Storage (private bucket admin-user-documents).
-- Vereist: update_updated_at_column() uit supabase-schema.sql.
-- Run in Supabase SQL editor. Maak daarna in Supabase Dashboard > Storage een private bucket "admin-user-documents"
-- aan (of laat de API die bij eerste upload aanmaken).

CREATE TABLE IF NOT EXISTS admin_user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('passport_front', 'passport_back')),
  storage_path TEXT NOT NULL,
  file_name TEXT,
  content_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(admin_user_id, document_type)
);

CREATE INDEX IF NOT EXISTS idx_admin_user_documents_admin_user_id ON admin_user_documents(admin_user_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_admin_user_documents_updated_at ON admin_user_documents;
CREATE TRIGGER update_admin_user_documents_updated_at
  BEFORE UPDATE ON admin_user_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: alleen service role (API) mag lezen/schrijven; geen directe client-toegang.
-- Als RLS wordt ingeschakeld, policy toevoegen voor service_role.
