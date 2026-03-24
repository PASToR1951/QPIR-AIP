-- Migration: Quarter → Trimester
-- Renames existing PIR quarter labels from "Xth Quarter CY YYYY" to "Xth Trimester SY YYYY-YYYY"
-- and removes orphaned Q4 deadline records (T4 no longer exists).
--
-- Mapping (old CY basis → new SY basis):
--   1st Quarter CY YYYY (Jan–Mar) → 3rd Trimester SY {YYYY-1}-{YYYY}
--   2nd Quarter CY YYYY (Apr–Jun) → 1st Trimester SY {YYYY}-{YYYY+1}
--   3rd Quarter CY YYYY (Jul–Sep) → 1st Trimester SY {YYYY}-{YYYY+1}
--   4th Quarter CY YYYY (Oct–Dec) → 2nd Trimester SY {YYYY}-{YYYY+1}

-- ── 1st Quarter CY YYYY → 3rd Trimester SY (YYYY-1)-YYYY ─────────────────
UPDATE "PIR" SET "quarter" = '3rd Trimester SY 2023-2024' WHERE "quarter" = '1st Quarter CY 2024';
UPDATE "PIR" SET "quarter" = '3rd Trimester SY 2024-2025' WHERE "quarter" = '1st Quarter CY 2025';
UPDATE "PIR" SET "quarter" = '3rd Trimester SY 2025-2026' WHERE "quarter" = '1st Quarter CY 2026';
UPDATE "PIR" SET "quarter" = '3rd Trimester SY 2026-2027' WHERE "quarter" = '1st Quarter CY 2027';

-- ── 2nd Quarter CY YYYY → 1st Trimester SY YYYY-(YYYY+1) ─────────────────
UPDATE "PIR" SET "quarter" = '1st Trimester SY 2024-2025' WHERE "quarter" = '2nd Quarter CY 2024';
UPDATE "PIR" SET "quarter" = '1st Trimester SY 2025-2026' WHERE "quarter" = '2nd Quarter CY 2025';
UPDATE "PIR" SET "quarter" = '1st Trimester SY 2026-2027' WHERE "quarter" = '2nd Quarter CY 2026';
UPDATE "PIR" SET "quarter" = '1st Trimester SY 2027-2028' WHERE "quarter" = '2nd Quarter CY 2027';

-- ── 3rd Quarter CY YYYY → 1st Trimester SY YYYY-(YYYY+1) ─────────────────
UPDATE "PIR" SET "quarter" = '1st Trimester SY 2024-2025' WHERE "quarter" = '3rd Quarter CY 2024';
UPDATE "PIR" SET "quarter" = '1st Trimester SY 2025-2026' WHERE "quarter" = '3rd Quarter CY 2025';
UPDATE "PIR" SET "quarter" = '1st Trimester SY 2026-2027' WHERE "quarter" = '3rd Quarter CY 2026';
UPDATE "PIR" SET "quarter" = '1st Trimester SY 2027-2028' WHERE "quarter" = '3rd Quarter CY 2027';

-- ── 4th Quarter CY YYYY → 2nd Trimester SY YYYY-(YYYY+1) ─────────────────
UPDATE "PIR" SET "quarter" = '2nd Trimester SY 2024-2025' WHERE "quarter" = '4th Quarter CY 2024';
UPDATE "PIR" SET "quarter" = '2nd Trimester SY 2025-2026' WHERE "quarter" = '4th Quarter CY 2025';
UPDATE "PIR" SET "quarter" = '2nd Trimester SY 2026-2027' WHERE "quarter" = '4th Quarter CY 2026';
UPDATE "PIR" SET "quarter" = '2nd Trimester SY 2027-2028' WHERE "quarter" = '4th Quarter CY 2027';

-- ── Remove Q4 deadline records (4th trimester no longer exists) ───────────
DELETE FROM "deadlines" WHERE "quarter" = 4;
