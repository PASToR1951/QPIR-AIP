CREATE TABLE "user_sessions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "session_token" TEXT NOT NULL UNIQUE,
  "user_agent" TEXT,
  "ip_address" TEXT,
  "device_label" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "revoked_by" INTEGER
);

CREATE INDEX "user_sessions_user_id_created_at_idx"
  ON "user_sessions"("user_id", "created_at" DESC);

CREATE INDEX "user_sessions_expires_at_idx"
  ON "user_sessions"("expires_at");
