-- Migration: 20260322000001_user_name_split
-- Adds first_name, middle_initial, last_name columns to "User".
-- All three are nullable — existing rows are unaffected.
-- The legacy `name` column is preserved for Admin users.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "first_name"     TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "middle_initial" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "last_name"      TEXT;
