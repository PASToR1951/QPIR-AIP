-- Create enum type (safe on fresh installs where it may already exist from partial apply)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Division') THEN
    CREATE TYPE "Division" AS ENUM ('SGOD', 'OSDS', 'CID');
  END IF;
END $$;

-- Alter division_programs.division (TEXT -> Division), skip if already converted
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'division_programs' AND column_name = 'division' AND data_type = 'text'
  ) THEN
    ALTER TABLE "division_programs"
      ALTER COLUMN "division" TYPE "Division"
      USING "division"::"text"::"Division";
  END IF;
END $$;

-- Program.division: add as nullable Division enum if not present, or convert if TEXT
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Program' AND column_name = 'division'
  ) THEN
    ALTER TABLE "Program" ADD COLUMN "division" "Division";
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Program' AND column_name = 'division' AND data_type = 'text'
  ) THEN
    ALTER TABLE "Program"
      ALTER COLUMN "division" TYPE "Division"
      USING "division"::"text"::"Division";
  END IF;
END $$;
