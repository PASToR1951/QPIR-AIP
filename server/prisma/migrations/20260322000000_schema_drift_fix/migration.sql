-- =============================================================
-- Migration: 20260322000000_schema_drift_fix
-- Resolves all schema drift between init migration and schema.prisma
-- =============================================================

-- 1. SCHOOL: add abbreviation
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "abbreviation" TEXT;

-- 2. USER: add is_active
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

-- 3. AIP: make school_id nullable (was NOT NULL in init)
ALTER TABLE "AIP" ALTER COLUMN "school_id" DROP NOT NULL;

-- 4. AIP: rename pillar -> outcome (preserves existing data)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='AIP' AND column_name='pillar'
  ) THEN
    ALTER TABLE "AIP" RENAME COLUMN "pillar" TO "outcome";
  END IF;
END $$;

-- 5. AIP: add new columns
ALTER TABLE "AIP" ADD COLUMN IF NOT EXISTS "created_by_user_id" INTEGER;
ALTER TABLE "AIP" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'Submitted';
ALTER TABLE "AIP" ADD COLUMN IF NOT EXISTS "verification_document_path" TEXT;
ALTER TABLE "AIP" ADD COLUMN IF NOT EXISTS "prepared_by_name"  TEXT NOT NULL DEFAULT '';
ALTER TABLE "AIP" ADD COLUMN IF NOT EXISTS "prepared_by_title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AIP" ADD COLUMN IF NOT EXISTS "approved_by_name"  TEXT NOT NULL DEFAULT '';
ALTER TABLE "AIP" ADD COLUMN IF NOT EXISTS "approved_by_title" TEXT NOT NULL DEFAULT '';

-- 6. AIP: add FK for created_by_user_id (only if not already present)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name='AIP_created_by_user_id_fkey'
  ) THEN
    ALTER TABLE "AIP" ADD CONSTRAINT "AIP_created_by_user_id_fkey"
      FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 7. AIP: objectives/indicators TEXT -> JSONB
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='AIP' AND column_name='objectives'
    AND data_type='text'
  ) THEN
    ALTER TABLE "AIP"
      ALTER COLUMN "objectives" TYPE JSONB
      USING CASE
        WHEN objectives IS NULL OR objectives = '' THEN '[]'::JSONB
        ELSE objectives::JSONB
      END;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='AIP' AND column_name='indicators'
    AND data_type='text'
  ) THEN
    ALTER TABLE "AIP"
      ALTER COLUMN "indicators" TYPE JSONB
      USING CASE
        WHEN indicators IS NULL OR indicators = '' THEN '[]'::JSONB
        ELSE indicators::JSONB
      END;
  END IF;
END $$;

-- 8. AIP: drop orphaned annual_target column
ALTER TABLE "AIP" DROP COLUMN IF EXISTS "annual_target";

-- 9. AIPActivity: add period month columns
ALTER TABLE "AIPActivity" ADD COLUMN IF NOT EXISTS "period_start_month" INTEGER;
ALTER TABLE "AIPActivity" ADD COLUMN IF NOT EXISTS "period_end_month"   INTEGER;

-- 10. PIR: add missing columns
ALTER TABLE "PIR" ADD COLUMN IF NOT EXISTS "created_by_user_id" INTEGER;
ALTER TABLE "PIR" ADD COLUMN IF NOT EXISTS "status"  TEXT NOT NULL DEFAULT 'Submitted';
ALTER TABLE "PIR" ADD COLUMN IF NOT EXISTS "remarks" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name='PIR_created_by_user_id_fkey'
  ) THEN
    ALTER TABLE "PIR" ADD CONSTRAINT "PIR_created_by_user_id_fkey"
      FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 11. CREATE TABLE notifications
CREATE TABLE IF NOT EXISTS "notifications" (
    "id"         SERIAL       NOT NULL,
    "user_id"    INTEGER      NOT NULL,
    "title"      TEXT         NOT NULL,
    "message"    TEXT         NOT NULL,
    "type"       TEXT         NOT NULL,
    "read"       BOOLEAN      NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name='notifications_user_id_fkey'
  ) THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 12. CREATE TABLE deadlines
CREATE TABLE IF NOT EXISTS "deadlines" (
    "id"         SERIAL       NOT NULL,
    "year"       INTEGER      NOT NULL,
    "quarter"    INTEGER      NOT NULL,
    "date"       TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deadlines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "deadlines_year_quarter_key" ON "deadlines"("year", "quarter");

-- 13. CREATE TABLE announcements
CREATE TABLE IF NOT EXISTS "announcements" (
    "id"         SERIAL       NOT NULL,
    "message"    TEXT         NOT NULL,
    "type"       TEXT         NOT NULL DEFAULT 'info',
    "is_active"  BOOLEAN      NOT NULL DEFAULT true,
    "created_by" INTEGER      NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- 14. CREATE TABLE audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id"          SERIAL       NOT NULL,
    "admin_id"    INTEGER      NOT NULL,
    "action"      TEXT         NOT NULL,
    "entity_type" TEXT         NOT NULL,
    "entity_id"   INTEGER      NOT NULL,
    "details"     JSONB        NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name='audit_logs_admin_id_fkey'
  ) THEN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey"
      FOREIGN KEY ("admin_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 15. Partial unique index for Division Personnel AIPs
CREATE UNIQUE INDEX IF NOT EXISTS "AIP_div_personnel_unique_idx"
    ON "AIP"("created_by_user_id", "program_id", "year")
    WHERE "school_id" IS NULL;
