-- Migration: Add expires_at to announcements; seed custom_periods system config key

-- 1. Add nullable expires_at column to announcements
ALTER TABLE "announcements"
  ADD COLUMN "expires_at" TIMESTAMPTZ;

-- 2. Seed custom_periods key in system_config (null values = use hardcoded defaults per term type)
INSERT INTO "system_config" ("key", "value", "updated_at")
VALUES (
  'custom_periods',
  '{"Trimester":null,"Quarterly":null,"Bimester":null}',
  NOW()
)
ON CONFLICT ("key") DO NOTHING;
