-- AlterTable
ALTER TABLE "deadlines"
  ADD COLUMN "open_date" TIMESTAMP(3),
  ADD COLUMN "grace_period_days" INTEGER NOT NULL DEFAULT 0;
