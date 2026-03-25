-- PIR v4 Template Migration
-- Clean slate: wipe all PIR data (confirmed by user)
TRUNCATE "PIRActivityReview", "PIRFactor", "PIR" CASCADE;

-- Remove old budget columns from PIR table
ALTER TABLE "PIR" DROP COLUMN IF EXISTS "total_budget";
ALTER TABLE "PIR" DROP COLUMN IF EXISTS "fund_source";

-- Add new budget columns to PIR
ALTER TABLE "PIR" ADD COLUMN "budget_from_division" DECIMAL NOT NULL DEFAULT 0.0;
ALTER TABLE "PIR" ADD COLUMN "budget_from_co_psf" DECIMAL NOT NULL DEFAULT 0.0;

-- Add new JSON columns to PIR
ALTER TABLE "PIR" ADD COLUMN "indicator_quarterly_targets" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "PIR" ADD COLUMN "action_items" JSONB NOT NULL DEFAULT '[]';

-- Make aip_activity_id nullable in PIRActivityReview (for unplanned activities)
ALTER TABLE "PIRActivityReview" ALTER COLUMN "aip_activity_id" DROP NOT NULL;

-- Add new columns to PIRActivityReview
ALTER TABLE "PIRActivityReview" ADD COLUMN "complied" BOOLEAN;
ALTER TABLE "PIRActivityReview" ADD COLUMN "actual_tasks_conducted" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PIRActivityReview" ADD COLUMN "contributory_performance_indicators" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PIRActivityReview" ADD COLUMN "movs_expected_outputs" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PIRActivityReview" ADD COLUMN "adjustments" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PIRActivityReview" ADD COLUMN "is_unplanned" BOOLEAN NOT NULL DEFAULT false;

-- Add recommendations column to PIRFactor
ALTER TABLE "PIRFactor" ADD COLUMN "recommendations" TEXT NOT NULL DEFAULT '';

-- Drop SystemConfig table (term system cleanup)
DROP TABLE IF EXISTS "system_config";
