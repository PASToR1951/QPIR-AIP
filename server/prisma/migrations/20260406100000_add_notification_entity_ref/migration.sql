-- Add entity reference fields to notifications table
ALTER TABLE "notifications" ADD COLUMN "entity_id" INTEGER;
ALTER TABLE "notifications" ADD COLUMN "entity_type" TEXT;
