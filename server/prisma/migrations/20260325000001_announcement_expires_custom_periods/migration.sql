-- Migration: Add expires_at to announcements; seed custom_periods system config key

-- 1. Add nullable expires_at column to announcements
ALTER TABLE "announcements"
  ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMPTZ;

-- 2. system_config was removed before this migration ran on fresh installs; skip safely
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_config') THEN
    INSERT INTO "system_config" ("key", "value", "updated_at")
    VALUES ('custom_periods', '{"Trimester":null,"Quarterly":null,"Bimester":null}', NOW())
    ON CONFLICT ("key") DO NOTHING;
  END IF;
END $$;
