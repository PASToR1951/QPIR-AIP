-- Drop category column from programs table — KRA grouping is no longer used
ALTER TABLE "Program" DROP COLUMN IF EXISTS "category";
