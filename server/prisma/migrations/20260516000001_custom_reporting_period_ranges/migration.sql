ALTER TABLE "deadlines"
  ADD COLUMN IF NOT EXISTS "period_start_month" INTEGER,
  ADD COLUMN IF NOT EXISTS "period_end_month" INTEGER;

ALTER TABLE "trimester_deadlines"
  ADD COLUMN IF NOT EXISTS "period_start_month" INTEGER,
  ADD COLUMN IF NOT EXISTS "period_end_month" INTEGER;
