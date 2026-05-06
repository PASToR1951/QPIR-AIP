#!/bin/bash
# Hourly soft backup — pg_dump custom format, encrypted, checksummed.
# Uses atomic .tmp pattern: never promotes a partial file to final name.

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_HOST="${POSTGRES_HOST:-db}"
DB_USER="${BACKUP_DB_USER:-backup_reader}"
DB_NAME="${POSTGRES_DB:-pir_system}"
BACKUP_DIR="/app/backups/hourly"
FINAL_NAME="pir_system_hourly_${TIMESTAMP}.dump.enc"
TMP_DUMP="${BACKUP_DIR}/.tmp_hourly_${TIMESTAMP}.dump"
TMP_ENC="${BACKUP_DIR}/.tmp_hourly_${TIMESTAMP}.dump.enc"
FINAL_PATH="${BACKUP_DIR}/${FINAL_NAME}"
SHA_PATH="${FINAL_PATH}.sha256"

log() { echo "[$(date -Iseconds)] [backup_hourly] $*"; }

require_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    log "ERROR: ${name} is not set."
    exit 1
  fi
}

cleanup_tmp() {
  rm -f "${TMP_DUMP}" "${TMP_ENC}" 2>/dev/null || true
}
trap cleanup_tmp EXIT

require_env "BACKUP_DB_PASSWORD"
require_env "BACKUP_ENCRYPTION_KEY"
mkdir -p "${BACKUP_DIR}"

log "Starting hourly backup: ${FINAL_NAME}"

# 1. Dump to temp file using read-only backup_reader user
export PGPASSWORD="${BACKUP_DB_PASSWORD}"
if ! pg_dump \
  --host="${DB_HOST}" \
  --username="${DB_USER}" \
  --dbname="${DB_NAME}" \
  --format=custom \
  --compress=9 \
  --no-password \
  --file="${TMP_DUMP}"; then
  log "ERROR: pg_dump failed. Aborting."
  exit 1
fi
log "pg_dump completed: $(du -sh "${TMP_DUMP}" | cut -f1)"

# 2. Encrypt with AES-256-CBC + PBKDF2 (100,000 iterations)
if ! openssl enc -aes-256-cbc \
  -pbkdf2 -iter 100000 \
  -pass env:BACKUP_ENCRYPTION_KEY \
  -in "${TMP_DUMP}" \
  -out "${TMP_ENC}"; then
  log "ERROR: Encryption failed. Aborting."
  exit 1
fi
rm -f "${TMP_DUMP}"
log "Encryption completed: $(du -sh "${TMP_ENC}" | cut -f1)"

# 3. Generate SHA-256 checksum of the encrypted file
sha256sum "${TMP_ENC}" | awk '{print $1}' > "${TMP_ENC}.sha256"

# 4. Atomic rename: only promote to final name if everything succeeded
mv "${TMP_ENC}" "${FINAL_PATH}"
mv "${TMP_ENC}.sha256" "${SHA_PATH}"

log "Backup saved: ${FINAL_PATH}"

# 5. Run cleanup, upload, and health check
/app/scripts/backup/backup_cleanup.sh
/app/scripts/backup/backup_upload.sh
/app/scripts/backup/backup_healthcheck.sh

log "Hourly backup complete."
