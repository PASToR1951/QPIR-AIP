-- ============================================================================
-- Migration: 20260629000002_drop_stale_school_unique_indexes
--
-- The Prisma School model has no unique fields except the primary key.
-- Some live databases have drifted unique constraints/indexes on the schools
-- table, causing Admin > Schools creates to fail with P2002 regardless of the
-- entered name/abbreviation. Remove every non-primary unique rule on schools.
-- ============================================================================

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
      AND NOT ix.indisprimary
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
