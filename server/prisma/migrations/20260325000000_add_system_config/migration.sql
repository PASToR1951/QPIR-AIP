-- Migration: Add system_config table for runtime-configurable term structure
-- Supports switching between Trimester (3), Quarterly (4), and Bimester (2) periods
-- without code changes or data migrations.

CREATE TABLE "system_config" (
  "key"        TEXT         NOT NULL,
  "value"      TEXT         NOT NULL,
  "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT "system_config_pkey" PRIMARY KEY ("key")
);

-- Seed the default term type (Trimester = current system default)
INSERT INTO "system_config" ("key", "value", "updated_at")
VALUES ('term_type', 'Trimester', NOW())
ON CONFLICT ("key") DO NOTHING;
