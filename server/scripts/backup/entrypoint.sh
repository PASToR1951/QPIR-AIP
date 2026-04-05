#!/bin/bash
# Backup service entrypoint
# Creates required directories, runs an initial health check, then starts crond.

set -e

echo "[entrypoint] Starting QPIR-AIP backup service..."

# Ensure backup directories exist on the mounted volume
mkdir -p /app/backups/hourly /app/backups/daily

# Write an initial status.json so the backend has something to read on first start
/app/scripts/backup/backup_healthcheck.sh

echo "[entrypoint] Running crond in foreground..."

# Run crond in foreground (-f) with logging (-l 8 = notice level)
exec crond -f -l 8
