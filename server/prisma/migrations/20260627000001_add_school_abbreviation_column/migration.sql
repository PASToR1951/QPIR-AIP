-- Add the optional school abbreviation column before later drift-cleanup
-- migrations normalize and remove stale uniqueness rules around it.
ALTER TABLE schools
ADD COLUMN IF NOT EXISTS abbreviation TEXT;
