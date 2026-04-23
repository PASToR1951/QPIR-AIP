-- Add abbreviation column to programs
ALTER TABLE "Program" ADD COLUMN IF NOT EXISTS "abbreviation" TEXT;
