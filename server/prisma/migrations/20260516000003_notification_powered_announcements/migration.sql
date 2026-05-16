-- Notification-powered announcements: scheduling, CTA, explicit audience roles,
-- and per-user receipts for notification dedupe plus persistent dismissal.

ALTER TABLE "announcements"
  ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT 'Announcement',
  ADD COLUMN IF NOT EXISTS "starts_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "action_label" TEXT,
  ADD COLUMN IF NOT EXISTS "action_url" TEXT;

CREATE INDEX IF NOT EXISTS "announcements_is_active_starts_at_expires_at_idx"
  ON "announcements"("is_active", "starts_at", "expires_at");

CREATE INDEX IF NOT EXISTS "announcements_archived_at_idx"
  ON "announcements"("archived_at");

CREATE TABLE IF NOT EXISTS "announcement_target_roles" (
  "announcement_id" INTEGER NOT NULL,
  "role" TEXT NOT NULL,
  CONSTRAINT "announcement_target_roles_pkey" PRIMARY KEY ("announcement_id", "role")
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'announcement_target_roles_announcement_id_fkey'
  ) THEN
    ALTER TABLE "announcement_target_roles"
      ADD CONSTRAINT "announcement_target_roles_announcement_id_fkey"
      FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "announcement_receipts" (
  "announcement_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "dismissed_at" TIMESTAMPTZ,
  "notified_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "announcement_receipts_pkey" PRIMARY KEY ("announcement_id", "user_id")
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'announcement_receipts_announcement_id_fkey'
  ) THEN
    ALTER TABLE "announcement_receipts"
      ADD CONSTRAINT "announcement_receipts_announcement_id_fkey"
      FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'announcement_receipts_user_id_fkey'
  ) THEN
    ALTER TABLE "announcement_receipts"
      ADD CONSTRAINT "announcement_receipts_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "announcement_receipts_user_id_dismissed_at_idx"
  ON "announcement_receipts"("user_id", "dismissed_at");
