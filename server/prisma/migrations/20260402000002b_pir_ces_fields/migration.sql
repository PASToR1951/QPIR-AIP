-- Add missing PIR columns that exist in schema but were never migrated
ALTER TABLE "PIR" ADD COLUMN IF NOT EXISTS "functional_division" TEXT;
ALTER TABLE "PIR" ADD COLUMN IF NOT EXISTS "ces_reviewer_id"     INTEGER;
ALTER TABLE "PIR" ADD COLUMN IF NOT EXISTS "ces_noted_at"        TIMESTAMP(3);
ALTER TABLE "PIR" ADD COLUMN IF NOT EXISTS "ces_remarks"         TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'PIR_ces_reviewer_id_fkey'
  ) THEN
    ALTER TABLE "PIR" ADD CONSTRAINT "PIR_ces_reviewer_id_fkey"
      FOREIGN KEY ("ces_reviewer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
