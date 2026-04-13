-- Consolidate division_programs into the programs table.
-- All working code (lookups, AIP filing, PIR routing, CES review) already
-- operates on Program rows with school_level_requirement = 'Division'.
-- The division_programs table was a parallel dumb list with no personnel
-- or template support — migrating its 79 rows here gives Division Personnel
-- the full workflow (assignment, AIP filing, PIR routing) for free.
--
-- Both tables share the same "Division" enum for the division column,
-- so no casting is required.

INSERT INTO "programs" ("title", "abbreviation", "division", "school_level_requirement")
SELECT "title", "abbreviation", "division", 'Division'
FROM "division_programs"
ON CONFLICT ("title", "school_level_requirement") DO NOTHING;

DROP TABLE "division_programs";
