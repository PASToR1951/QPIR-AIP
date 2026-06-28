-- ============================================================================
-- Migration: 20260628000001_fix_school_abbreviation_optional
--
-- The School.abbreviation field is optional in schema.prisma and in the admin UI.
-- Some live databases can still have drifted unique constraints/indexes on this
-- nullable column, causing "duplicate" conflicts when admins create schools
-- without an abbreviation. Normalize blank values and remove those stale indexes.
-- ============================================================================

UPDATE schools
SET abbreviation = NULL
WHERE abbreviation IS NOT NULL
  AND btrim(abbreviation) = '';

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
  LOOP
    EXECUTE format(
      'DROP INDEX IF EXISTS %I.%I',
      'public',
      index_record.relname
    );
  END LOOP;
END $$;
