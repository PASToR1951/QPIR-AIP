-- Add salutation (Mr./Ms./Mrs./Dr.) and position (job title) to users
ALTER TABLE "User" ADD COLUMN "salutation" TEXT;
ALTER TABLE "User" ADD COLUMN "position" TEXT;
