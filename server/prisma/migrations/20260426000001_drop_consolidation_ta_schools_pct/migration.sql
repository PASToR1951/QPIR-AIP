-- TA % is now computed from PIR data server-side; the manual text field is no longer used.
ALTER TABLE "consolidation_notes" DROP COLUMN IF EXISTS "ta_schools_pct";
