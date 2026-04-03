-- Create enum type
CREATE TYPE "Division" AS ENUM ('SGOD', 'OSDS', 'CID');

-- Alter division_programs.division (NOT NULL, has existing data)
ALTER TABLE "division_programs"
  ALTER COLUMN "division" TYPE "Division"
  USING "division"::"text"::"Division";

-- Alter Program.division (nullable)
ALTER TABLE "programs"
  ALTER COLUMN "division" TYPE "Division"
  USING "division"::"text"::"Division";
