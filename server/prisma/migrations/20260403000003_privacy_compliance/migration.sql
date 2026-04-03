-- Migration: Privacy Compliance (RA 10173 / GDPR)
-- Adds soft-delete timestamps to User, AIP, PIR for data retention support.
-- Fixes AuditLog admin_id to be nullable so deleting an admin preserves audit evidence.

-- User: soft-delete support
ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AIP: soft-delete support (archived_at already exists; deleted_at is distinct — for erasure)
ALTER TABLE "AIP" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- PIR: soft-delete support
ALTER TABLE "PIR" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AuditLog: make admin_id nullable + switch cascade to SET NULL
-- This preserves audit records when an admin account is deleted.
ALTER TABLE "audit_logs" ALTER COLUMN "admin_id" DROP NOT NULL;
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_admin_id_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
