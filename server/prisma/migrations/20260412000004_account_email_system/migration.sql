CREATE TABLE "email_config" (
    "id" SERIAL NOT NULL,
    "smtp_host" TEXT NOT NULL DEFAULT 'smtp.gmail.com',
    "smtp_port" INTEGER NOT NULL DEFAULT 587,
    "smtp_user" TEXT NOT NULL DEFAULT '',
    "smtp_pass_enc" TEXT NOT NULL DEFAULT '',
    "from_name" TEXT NOT NULL DEFAULT 'AIP-PIR System',
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "magic_link_ttl_login" INTEGER NOT NULL DEFAULT 15,
    "magic_link_ttl_welcome" INTEGER NOT NULL DEFAULT 10080,
    "magic_link_ttl_reminder" INTEGER NOT NULL DEFAULT 1440,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_config_pkey" PRIMARY KEY ("id")
);

INSERT INTO "email_config" (
    "smtp_host",
    "smtp_port",
    "smtp_user",
    "smtp_pass_enc",
    "from_name",
    "is_enabled",
    "magic_link_ttl_login",
    "magic_link_ttl_welcome",
    "magic_link_ttl_reminder"
) VALUES (
    'smtp.gmail.com',
    587,
    '',
    '',
    'AIP-PIR System',
    false,
    15,
    10080,
    1440
);

CREATE TABLE "magic_link_tokens" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'login',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_link_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "magic_link_tokens_token_hash_key" ON "magic_link_tokens"("token_hash");
CREATE INDEX "magic_link_tokens_expires_at_idx" ON "magic_link_tokens"("expires_at");
CREATE INDEX "magic_link_tokens_user_id_purpose_idx" ON "magic_link_tokens"("user_id", "purpose");

ALTER TABLE "magic_link_tokens"
ADD CONSTRAINT "magic_link_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "email_blast_logs" (
    "id" SERIAL NOT NULL,
    "blast_key" TEXT NOT NULL,
    "blast_type" TEXT NOT NULL,
    "blast_label" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_blast_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_blast_logs_blast_key_user_id_key" ON "email_blast_logs"("blast_key", "user_id");
CREATE INDEX "email_blast_logs_sent_at_idx" ON "email_blast_logs"("sent_at");

ALTER TABLE "email_blast_logs"
ADD CONSTRAINT "email_blast_logs_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
