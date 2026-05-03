-- ============================================================================
-- Migration: 20260501000001_schema_drift_fix_v2
--
-- Resolves remaining drift between on-disk migrations and schema.prisma.
-- The table-rename portion lives in 20260427000001_rename_tables_to_snake_case
-- so it runs before focal_person_flow. This migration handles everything else:
-- leftover constraint/index names, missing join tables, default values,
-- type alignment, and an FK fix.
--
-- Every statement is idempotent so this single migration works on:
--   - fresh installs  → performs the actual create / alter work
--   - the live DB     → no-op (state already matches), just records a
--                       _prisma_migrations row
-- ============================================================================

-- 1. Rename leftover PK/FK/index names from the old PascalCase table names
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Program_pkey') THEN
    ALTER TABLE programs RENAME CONSTRAINT "Program_pkey" TO programs_pkey;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='School_pkey') THEN
    ALTER TABLE schools RENAME CONSTRAINT "School_pkey" TO schools_pkey;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Cluster_pkey') THEN
    ALTER TABLE clusters RENAME CONSTRAINT "Cluster_pkey" TO clusters_pkey;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='School_cluster_id_fkey') THEN
    ALTER TABLE schools RENAME CONSTRAINT "School_cluster_id_fkey" TO schools_cluster_id_fkey;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='Cluster_cluster_number_key') THEN
    ALTER INDEX "Cluster_cluster_number_key" RENAME TO clusters_cluster_number_key;
  END IF;
END $$;

-- 2. Drop stale single-column unique on programs(title) — superseded by
--    the composite (title, school_level_requirement) unique key.
DROP INDEX IF EXISTS "Program_title_key";
DROP INDEX IF EXISTS "programs_title_key";

-- 3. Create missing announcement-mention join tables
CREATE TABLE IF NOT EXISTS announcement_mention_schools (
  announcement_id INTEGER NOT NULL,
  school_id       INTEGER NOT NULL,
  CONSTRAINT announcement_mention_schools_pkey PRIMARY KEY (announcement_id, school_id)
);

CREATE TABLE IF NOT EXISTS announcement_mention_users (
  announcement_id INTEGER NOT NULL,
  user_id         INTEGER NOT NULL,
  CONSTRAINT announcement_mention_users_pkey PRIMARY KEY (announcement_id, user_id)
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='announcement_mention_schools_announcement_id_fkey') THEN
    ALTER TABLE announcement_mention_schools
      ADD CONSTRAINT announcement_mention_schools_announcement_id_fkey
      FOREIGN KEY (announcement_id) REFERENCES announcements(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='announcement_mention_schools_school_id_fkey') THEN
    ALTER TABLE announcement_mention_schools
      ADD CONSTRAINT announcement_mention_schools_school_id_fkey
      FOREIGN KEY (school_id) REFERENCES schools(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='announcement_mention_users_announcement_id_fkey') THEN
    ALTER TABLE announcement_mention_users
      ADD CONSTRAINT announcement_mention_users_announcement_id_fkey
      FOREIGN KEY (announcement_id) REFERENCES announcements(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='announcement_mention_users_user_id_fkey') THEN
    ALTER TABLE announcement_mention_users
      ADD CONSTRAINT announcement_mention_users_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES "User"(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 4. Default value alignment (SET / DROP DEFAULT are inherently idempotent)
ALTER TABLE "AIP" ALTER COLUMN status SET DEFAULT 'Approved';
ALTER TABLE "PIR" ALTER COLUMN status SET DEFAULT 'For CES Review';

ALTER TABLE announcements        ALTER COLUMN updated_at DROP DEFAULT;
ALTER TABLE deadlines            ALTER COLUMN updated_at DROP DEFAULT;
ALTER TABLE division_config      ALTER COLUMN updated_at DROP DEFAULT;
ALTER TABLE email_config         ALTER COLUMN updated_at DROP DEFAULT;
ALTER TABLE program_templates    ALTER COLUMN updated_at DROP DEFAULT;
ALTER TABLE trimester_deadlines  ALTER COLUMN updated_at DROP DEFAULT;

-- 5. Type alignment
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='PIR'
      AND column_name='budget_from_division'
      AND (data_type <> 'numeric'
           OR numeric_precision IS DISTINCT FROM 65
           OR numeric_scale IS DISTINCT FROM 30)
  ) THEN
    ALTER TABLE "PIR"
      ALTER COLUMN budget_from_division TYPE DECIMAL(65,30)
      USING budget_from_division::DECIMAL(65,30);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='PIR'
      AND column_name='budget_from_co_psf'
      AND (data_type <> 'numeric'
           OR numeric_precision IS DISTINCT FROM 65
           OR numeric_scale IS DISTINCT FROM 30)
  ) THEN
    ALTER TABLE "PIR"
      ALTER COLUMN budget_from_co_psf TYPE DECIMAL(65,30)
      USING budget_from_co_psf::DECIMAL(65,30);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='announcements'
      AND column_name='expires_at'
      AND (data_type <> 'timestamp without time zone' OR datetime_precision <> 3)
  ) THEN
    ALTER TABLE announcements
      ALTER COLUMN expires_at TYPE TIMESTAMP(3);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='division_config'
      AND column_name='updated_at'
      AND (data_type <> 'timestamp without time zone' OR datetime_precision <> 3)
  ) THEN
    ALTER TABLE division_config
      ALTER COLUMN updated_at TYPE TIMESTAMP(3);
  END IF;
END $$;

-- 6. Recreate user_sessions FK with ON UPDATE CASCADE (live missing this)
ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;
ALTER TABLE user_sessions
  ADD CONSTRAINT user_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES "User"(id)
  ON DELETE CASCADE ON UPDATE CASCADE;
