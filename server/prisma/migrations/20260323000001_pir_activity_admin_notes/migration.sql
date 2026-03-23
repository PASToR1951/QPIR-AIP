-- Add admin_notes field to PIRActivityReview for per-activity admin evaluation notes
ALTER TABLE "PIRActivityReview" ADD COLUMN "admin_notes" TEXT;
