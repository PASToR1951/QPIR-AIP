-- Cluster Consultant role, PIR revision comments, and PIR edit-request parity.

ALTER TABLE "PIR"
  ADD COLUMN IF NOT EXISTS "edit_requested" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "edit_requested_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "edit_request_count" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "PIRComment" (
  "id" SERIAL NOT NULL,
  "pir_id" INTEGER NOT NULL,
  "author_user_id" INTEGER NOT NULL,
  "scope" TEXT NOT NULL,
  "section_key" TEXT,
  "category" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PIRComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PIRComment_pir_id_created_at_idx"
  ON "PIRComment"("pir_id", "created_at");

CREATE INDEX IF NOT EXISTS "PIRComment_author_user_id_idx"
  ON "PIRComment"("author_user_id");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PIRComment_pir_id_fkey'
  ) THEN
    ALTER TABLE "PIRComment"
      ADD CONSTRAINT "PIRComment_pir_id_fkey"
      FOREIGN KEY ("pir_id") REFERENCES "PIR"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PIRComment_author_user_id_fkey'
  ) THEN
    ALTER TABLE "PIRComment"
      ADD CONSTRAINT "PIRComment_author_user_id_fkey"
      FOREIGN KEY ("author_user_id") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

UPDATE "User"
SET role = 'Cluster Consultant',
    is_active = CASE WHEN cluster_id IS NULL THEN false ELSE is_active END
WHERE role = 'Observer';

UPDATE "PIR"
SET status = 'Needs Revision'
WHERE status = 'Returned';
