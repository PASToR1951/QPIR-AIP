-- Change unique constraint on programs: title alone → (title, school_level_requirement)
-- Allows the same program name to exist under different applicability levels.
DROP INDEX IF EXISTS "programs_title_key";
ALTER TABLE "Program" ADD CONSTRAINT "programs_title_school_level_requirement_key" UNIQUE ("title", "school_level_requirement");
