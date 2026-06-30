-- Self-service user profile: add an auth-gated profile photo column and a
-- school/cluster reassignment request table (admin-approved so users cannot
-- self-escalate their data-access scope).

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "profile_photo" TEXT;

CREATE TABLE IF NOT EXISTS "profile_change_requests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "requested_school_id" INTEGER,
    "requested_cluster_id" INTEGER,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_change_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "profile_change_requests_status_idx"
    ON "profile_change_requests"("status");

CREATE INDEX IF NOT EXISTS "profile_change_requests_user_id_created_at_idx"
    ON "profile_change_requests"("user_id", "created_at" DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profile_change_requests_user_id_fkey'
    ) THEN
        ALTER TABLE "profile_change_requests"
        ADD CONSTRAINT "profile_change_requests_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
