-- Drop category column from programs table — KRA grouping is no longer used
ALTER TABLE "programs" DROP COLUMN IF EXISTS "category";
