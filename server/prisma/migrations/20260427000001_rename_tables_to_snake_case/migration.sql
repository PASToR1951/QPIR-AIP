-- ============================================================================
-- Migration: 20260427000001_rename_tables_to_snake_case
--
-- Rename Program/School/Cluster → snake_case plurals to match @@map directives
-- in schema.prisma. Backfills a `prisma db push` that was applied directly to
-- production without generating a migration file. Required before
-- 20260429000001_focal_person_flow, which references the new names.
--
-- Idempotent: no-op on installs where the rename has already happened.
-- ============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='Program') THEN
    ALTER TABLE "Program" RENAME TO programs;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='School') THEN
    ALTER TABLE "School" RENAME TO schools;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='Cluster') THEN
    ALTER TABLE "Cluster" RENAME TO clusters;
  END IF;
END $$;
