-- Remove Fast Entry beta feature: drop verification_document_path column
ALTER TABLE "AIP" DROP COLUMN IF EXISTS "verification_document_path";
