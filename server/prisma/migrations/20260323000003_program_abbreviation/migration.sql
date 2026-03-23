-- Add abbreviation column to programs
ALTER TABLE "programs" ADD COLUMN IF NOT EXISTS "abbreviation" TEXT;
