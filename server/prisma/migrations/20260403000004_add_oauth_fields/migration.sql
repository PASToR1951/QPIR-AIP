-- AlterTable: make password nullable and add OAuth SSO fields to User
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

ALTER TABLE "User"
  ADD COLUMN "oauth_provider" TEXT,
  ADD COLUMN "oauth_subject"  TEXT;

-- Unique constraint: each (provider, subject) pair maps to exactly one user
CREATE UNIQUE INDEX "User_oauth_provider_oauth_subject_key"
  ON "User"("oauth_provider", "oauth_subject");

-- New table: stores PKCE code_verifier + CSRF state for OAuth flows (single-use, 10-min TTL)
CREATE TABLE "oauth_states" (
    "id"            TEXT         NOT NULL,
    "nonce"         TEXT         NOT NULL,
    "provider"      TEXT         NOT NULL,
    "hmac"          TEXT         NOT NULL,
    "code_verifier" TEXT         NOT NULL,
    "expires_at"    TIMESTAMP(3) NOT NULL,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oauth_states_nonce_key" ON "oauth_states"("nonce");
