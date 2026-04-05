#!/bin/bash
# Interactive CLI restore script.
# IMPORTANT: This must be run from within the backup container, NOT via the admin UI.
#
# Usage:
#   docker compose exec backup /app/scripts/backup/restore.sh
#
# What it does:
#   1. Lists all available encrypted backups with index, size, and timestamp
#   2. Prompts admin to select one
#   3. Verifies SHA-256 checksum before proceeding
#   4. Detects format (custom → pg_restore, plain SQL → psql)
#   5. Stops the backend container
#   6. Drops and recreates the database
#   7. Restores from the selected backup
#   8. Restarts the backend container
#   9. Logs the restore event to /app/backups/restore.log

set -euo pipefail

BACKUP_DIR="/app/backups"
DB_HOST="${POSTGRES_HOST:-db}"
DB_SUPERUSER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-pir_system}"
RESTORE_LOG="${BACKUP_DIR}/restore.log"
TMP_DECRYPTED="/tmp/restore_decrypted_$$.tmp"

log()  { echo "[$(date -Iseconds)] [restore] $*" | tee -a "${RESTORE_LOG}"; }
warn() { echo "[$(date -Iseconds)] [restore] WARNING: $*" | tee -a "${RESTORE_LOG}"; }

cleanup_tmp() { rm -f "${TMP_DECRYPTED}" 2>/dev/null || true; }
trap cleanup_tmp EXIT

# --- Check required env vars ---
if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  echo "ERROR: BACKUP_ENCRYPTION_KEY is not set. Cannot decrypt backups." >&2
  exit 1
fi

export PGPASSWORD="${POSTGRES_PASSWORD}"

# --- Collect all available backups ---
mapfile -t ALL_BACKUPS < <(
  find "${BACKUP_DIR}/hourly" "${BACKUP_DIR}/daily" \
    -maxdepth 1 -name "*.enc" -not -name "*.sha256" 2>/dev/null | sort -r
)

if [ "${#ALL_BACKUPS[@]}" -eq 0 ]; then
  echo "No encrypted backups found in ${BACKUP_DIR}/hourly or ${BACKUP_DIR}/daily."
  exit 1
fi

# --- Display backup list ---
echo ""
echo "======================================================"
echo "  QPIR-AIP Database Restore"
echo "  WARNING: This will DESTROY all current data."
echo "======================================================"
echo ""
printf "  %-4s  %-10s  %-8s  %s\n" "IDX" "TYPE" "SIZE" "FILENAME"
printf "  %-4s  %-10s  %-8s  %s\n" "---" "----" "----" "--------"

for i in "${!ALL_BACKUPS[@]}"; do
  f="${ALL_BACKUPS[$i]}"
  fname=$(basename "${f}")
  fsize=$(du -sh "${f}" 2>/dev/null | cut -f1)
  if echo "${fname}" | grep -q "hourly"; then
    ftype="hourly"
  else
    ftype="daily"
  fi
  printf "  %-4s  %-10s  %-8s  %s\n" "$((i+1))" "${ftype}" "${fsize}" "${fname}"
done

echo ""
read -rp "Enter backup number to restore (or 'q' to quit): " SELECTION

if [ "${SELECTION}" = "q" ] || [ "${SELECTION}" = "Q" ]; then
  echo "Restore cancelled."
  exit 0
fi

if ! [[ "${SELECTION}" =~ ^[0-9]+$ ]] || \
   [ "${SELECTION}" -lt 1 ] || \
   [ "${SELECTION}" -gt "${#ALL_BACKUPS[@]}" ]; then
  echo "Invalid selection." >&2
  exit 1
fi

SELECTED_FILE="${ALL_BACKUPS[$((SELECTION-1))]}"
SELECTED_NAME=$(basename "${SELECTED_FILE}")
SHA_FILE="${SELECTED_FILE}.sha256"

echo ""
echo "Selected: ${SELECTED_NAME}"

# --- Verify checksum ---
if [ ! -f "${SHA_FILE}" ]; then
  echo "ERROR: Missing .sha256 sidecar for ${SELECTED_NAME}. Cannot verify integrity." >&2
  exit 1
fi

expected=$(cat "${SHA_FILE}")
actual=$(sha256sum "${SELECTED_FILE}" | awk '{print $1}')

if [ "${expected}" != "${actual}" ]; then
  echo "ERROR: Checksum mismatch for ${SELECTED_NAME}!" >&2
  echo "  Expected: ${expected}" >&2
  echo "  Got:      ${actual}" >&2
  echo "Backup may be corrupted. Aborting." >&2
  exit 1
fi
echo "Checksum verified OK."

# --- Detect format ---
# Hourly = custom format (pg_restore), Daily = plain SQL gzipped (psql)
if echo "${SELECTED_NAME}" | grep -q "hourly"; then
  FORMAT="custom"
else
  FORMAT="plain_sql_gz"
fi
echo "Format detected: ${FORMAT}"

# --- Final confirmation ---
echo ""
echo "  Target database : ${DB_NAME} on ${DB_HOST}"
echo "  Restore from    : ${SELECTED_NAME}"
echo "  Format          : ${FORMAT}"
echo ""
echo "  THIS WILL DROP AND RECREATE THE DATABASE."
echo "  All current data will be permanently lost."
echo ""
read -rp "Type 'yes' to confirm restore: " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

log "Restore initiated by operator — file: ${SELECTED_NAME}"

# --- Decrypt to temp file ---
log "Decrypting backup..."
if ! openssl enc -d -aes-256-cbc \
  -pbkdf2 -iter 100000 \
  -pass env:BACKUP_ENCRYPTION_KEY \
  -in "${SELECTED_FILE}" \
  -out "${TMP_DECRYPTED}"; then
  log "ERROR: Decryption failed."
  exit 1
fi

# --- Stop backend container ---
log "Stopping backend container..."
if command -v docker &>/dev/null; then
  COMPOSE_PROJECT=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
  BACKEND_CONTAINER="${COMPOSE_PROJECT}-backend-1"
  docker stop "${BACKEND_CONTAINER}" 2>/dev/null || \
    warn "Could not stop backend container '${BACKEND_CONTAINER}'. Proceeding anyway."
else
  warn "docker not available inside container. Stop the backend manually before restore."
fi

# --- Drop and recreate database ---
log "Dropping database ${DB_NAME}..."
psql -h "${DB_HOST}" -U "${DB_SUPERUSER}" -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}';" \
  -c "DROP DATABASE IF EXISTS \"${DB_NAME}\";" \
  -c "CREATE DATABASE \"${DB_NAME}\";"
log "Database recreated."

# --- Restore ---
log "Restoring from ${SELECTED_NAME} (format: ${FORMAT})..."

if [ "${FORMAT}" = "custom" ]; then
  pg_restore \
    --host="${DB_HOST}" \
    --username="${DB_SUPERUSER}" \
    --dbname="${DB_NAME}" \
    --no-password \
    --verbose \
    "${TMP_DECRYPTED}"
else
  # Plain SQL gzipped — decompress on the fly
  zcat "${TMP_DECRYPTED}" | psql \
    -h "${DB_HOST}" \
    -U "${DB_SUPERUSER}" \
    -d "${DB_NAME}" \
    --no-password
fi

log "Restore completed successfully."

# --- Restart backend container ---
if command -v docker &>/dev/null; then
  log "Restarting backend container..."
  docker start "${BACKEND_CONTAINER}" 2>/dev/null || \
    warn "Could not restart backend container '${BACKEND_CONTAINER}'. Start it manually."
fi

# --- Update health status ---
/app/scripts/backup/backup_healthcheck.sh

log "=== Restore finished: ${SELECTED_NAME} ==="
echo ""
echo "Restore complete. Verify the application is working correctly."
