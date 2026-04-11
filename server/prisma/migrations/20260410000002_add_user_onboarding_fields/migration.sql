ALTER TABLE "User"
ADD COLUMN "onboarding_version_seen" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "onboarding_show_on_login" BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN "onboarding_dismissed_at" TIMESTAMP(3),
ADD COLUMN "onboarding_completed_at" TIMESTAMP(3),
ADD COLUMN "checklist_progress" JSONB NOT NULL DEFAULT '{}';
