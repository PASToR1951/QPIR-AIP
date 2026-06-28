-- ============================================================================
-- Migration: 20260629000001_harden_school_abbreviation_nullable
--
-- Follow-up hardening for live databases where School.abbreviation was added
-- through drift/manual changes before it became an optional app field.
-- Ensures blank abbreviations are represented as NULL and removes any stale
-- uniqueness rule that would make multiple blank optional values conflict.
-- ============================================================================

ALTER TABLE schools
ADD COLUMN IF NOT EXISTS abbreviation TEXT;

UPDATE schools
SET abbreviation = NULL
WHERE abbreviation IS NOT NULL
  AND btrim(abbreviation) = '';

ALTER TABLE schools
ALTER COLUMN abbreviation DROP DEFAULT;

ALTER TABLE schools
ALTER COLUMN abbreviation DROP NOT NULL;

DO $$
DECLARE
  constraint_record RECORD;
  index_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'schools'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) ILIKE '%abbreviation%'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I',
      'public',
      'schools',
      constraint_record.conname
    );
  END LOOP;

  FOR index_record IN
    SELECT i.relname
    FROM pg_index ix
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'schools'
      AND ix.indisunique
      AND pg_get_indexdef(i.oid) ILIKE '%abbreviation%'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        WHERE c.conindid = i.oid
      )
  LOOP
    EXECUTE format(
      'DROP INDEX IF EXISTS %I.%I',
      'public',
      index_record.relname
    );
  END LOOP;
END $$;
