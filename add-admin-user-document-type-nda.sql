-- Voeg documenttype 'nda' toe aan admin_user_documents.
-- Run in Supabase SQL editor.

ALTER TABLE admin_user_documents
  DROP CONSTRAINT IF EXISTS admin_user_documents_document_type_check;

ALTER TABLE admin_user_documents
  ADD CONSTRAINT admin_user_documents_document_type_check
  CHECK (document_type IN ('passport_front', 'passport_back', 'nda'));
