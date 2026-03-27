-- Create division_config table for storing configurable division-level settings
CREATE TABLE "division_config" (
  "id"               SERIAL PRIMARY KEY,
  "supervisor_name"  TEXT NOT NULL DEFAULT '',
  "supervisor_title" TEXT NOT NULL DEFAULT '',
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed one default row so GET always returns something
INSERT INTO "division_config" ("supervisor_name", "supervisor_title", "updated_at")
VALUES ('', '', NOW());
