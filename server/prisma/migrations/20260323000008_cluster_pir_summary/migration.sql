-- AlterTable: Add presented flag to PIR for admin-toggled presentation tracking
ALTER TABLE "PIR" ADD COLUMN "presented" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add KRA category grouping to programs
ALTER TABLE "Program" ADD COLUMN "category" TEXT;
