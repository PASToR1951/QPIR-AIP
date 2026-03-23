-- Add dismissible column to announcements table
ALTER TABLE "announcements" ADD COLUMN "dismissible" BOOLEAN NOT NULL DEFAULT true;
