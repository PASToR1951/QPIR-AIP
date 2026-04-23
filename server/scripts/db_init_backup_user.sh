#!/bin/sh
# Creates or updates the read-only PostgreSQL user used by backup containers.
# This runs only when the Postgres data volume is initialized for the first time.

set -eu

BACKUP_DB_USER="${BACKUP_DB_USER:-backup_reader}"
POSTGRES_DB="${POSTGRES_DB:-pir_system}"

if [ -z "${BACKUP_DB_PASSWORD:-}" ]; then
  echo "[db-init] BACKUP_DB_PASSWORD is not set; skipping backup user setup."
  exit 0
fi

case "${BACKUP_DB_USER}" in
  ""|*[!A-Za-z0-9_]*)
    echo "[db-init] BACKUP_DB_USER must contain only letters, numbers, and underscores." >&2
    exit 1
    ;;
esac

case "${POSTGRES_DB}" in
  ""|*[!A-Za-z0-9_]*)
    echo "[db-init] POSTGRES_DB must contain only letters, numbers, and underscores." >&2
    exit 1
    ;;
esac

escaped_password=$(printf "%s" "${BACKUP_DB_PASSWORD}" | sed "s/'/''/g")

psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<EOSQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${BACKUP_DB_USER}') THEN
    CREATE USER "${BACKUP_DB_USER}" WITH PASSWORD '${escaped_password}';
  ELSE
    ALTER USER "${BACKUP_DB_USER}" WITH PASSWORD '${escaped_password}';
  END IF;
END
\$\$;

GRANT CONNECT ON DATABASE "${POSTGRES_DB}" TO "${BACKUP_DB_USER}";
GRANT USAGE ON SCHEMA public TO "${BACKUP_DB_USER}";
GRANT SELECT ON ALL TABLES IN SCHEMA public TO "${BACKUP_DB_USER}";
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO "${BACKUP_DB_USER}";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO "${BACKUP_DB_USER}";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO "${BACKUP_DB_USER}";
EOSQL

echo "[db-init] Backup user '${BACKUP_DB_USER}' is ready."
