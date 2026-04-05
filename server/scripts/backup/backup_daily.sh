#!/bin/bash
# Daily hard backup — plain SQL dump, gzipped, encrypted, checksummed.
# Uses atomic .tmp pattern: never promotes a partial file to final name.

set -euo pipefail

DATESTAMP=$(date +%Y%m%d)
DB_HOST="${POSTGRES_HOST:-db}"
DB_USER="${BACKUP_DB_USER:-backup_reader}"
DB_NAME="${POSTGRES_DB:-pir_system}"
BACKUP_DIR="/app/backups/daily"
FINAL_NAME="pir_system_daily_${DATESTAMP}.sql.gz.enc"
TMP_SQL="${BACKUP_DIR}/.tmp_daily_${DATESTAMP}.sql"
TMP_GZ="${BACKUP_DIR}/.tmp_daily_${DATESTAMP}.sql.gz"
TMP_ENC="${BACKUP_DIR}/.tmp_daily_${DATESTAMP}.sql.gz.enc"
FINAL_PATH="${BACKUP_DIR}/${FINAL_NAME}"
SHA_PATH="${FINAL_PATH}.sha256"

log() { echo "[$(date -Iseconds)] [backup_daily] $*"; }

cleanup_tmp() {
  rm -f "${TMP_SQL}" "${TMP_GZ}" "${TMP_ENC}" 2>/dev/null || true
}
trap cleanup_tmp EXIT

log "Starting daily backup: ${FINAL_NAME}"

# 1. Dump plain SQL to temp file using read-only backup_reader user
export PGPASSWORD="${BACKUP_DB_PASSWORD}"
if ! pg_dump \
  --host="${DB_HOST}" \
  --username="${DB_USER}" \
  --dbname="${DB_NAME}" \
  --format=plain \
  --no-password \
  --file="${TMP_SQL}"; then
  log "ERROR: pg_dump failed. Aborting."
  exit 1
fi
log "pg_dump completed: $(du -sh "${TMP_SQL}" | cut -f1)"

# 2. Gzip compress
if ! gzip -9 -c "${TMP_SQL}" > "${TMP_GZ}"; then
  log "ERROR: gzip failed. Aborting."
  exit 1
fi
rm -f "${TMP_SQL}"
log "Compression completed: $(du -sh "${TMP_GZ}" | cut -f1)"

# 3. Encrypt with AES-256-CBC + PBKDF2 (100,000 iterations)
if ! openssl enc -aes-256-cbc \
  -pbkdf2 -iter 100000 \
  -pass env:BACKUP_ENCRYPTION_KEY \
  -in "${TMP_GZ}" \
  -out "${TMP_ENC}"; then
  log "ERROR: Encryption failed. Aborting."
  exit 1
fi
rm -f "${TMP_GZ}"
log "Encryption completed: $(du -sh "${TMP_ENC}" | cut -f1)"

# 4. Generate SHA-256 checksum of the encrypted file
sha256sum "${TMP_ENC}" | awk '{print $1}' > "${TMP_ENC}.sha256"

# 5. Atomic rename: only promote to final name if everything succeeded
mv "${TMP_ENC}" "${FINAL_PATH}"
mv "${TMP_ENC}.sha256" "${SHA_PATH}"

log "Backup saved: ${FINAL_PATH}"

# 6. Run cleanup, upload, and health check
/app/scripts/backup/backup_cleanup.sh
/app/scripts/backup/backup_upload.sh
/app/scripts/backup/backup_healthcheck.sh

log "Daily backup complete."
