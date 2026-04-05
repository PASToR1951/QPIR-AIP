-- =============================================================================
-- Create read-only backup_reader role for pg_dump
-- Run once: docker compose exec db psql -U postgres -d pir_system -f /path/to/db_readonly_user.sql
--
-- This user has CONNECT + SELECT only — no INSERT, UPDATE, DELETE, or DDL.
-- =============================================================================

-- Replace 'change_me_backup_password' with the value of BACKUP_DB_PASSWORD in .env
CREATE USER backup_reader WITH PASSWORD 'change_me_backup_password';

-- Allow connection to the database
GRANT CONNECT ON DATABASE pir_system TO backup_reader;

-- Allow access to the public schema
GRANT USAGE ON SCHEMA public TO backup_reader;

-- Grant SELECT on all existing tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_reader;

-- Grant SELECT on all sequences (needed for pg_dump completeness)
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO backup_reader;

-- Grant SELECT on future tables created by migrations
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO backup_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO backup_reader;
