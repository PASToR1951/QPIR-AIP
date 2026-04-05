#!/bin/bash
# Retention management — removes encrypted backups AND their .sha256 sidecars
# that are older than BACKUP_RETENTION_DAYS. Aborts if fewer than 1 backup
# would remain after deletion.

set -euo pipefail

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-5}"
HOURLY_DIR="/app/backups/hourly"
DAILY_DIR="/app/backups/daily"

log() { echo "[$(date -Iseconds)] [backup_cleanup] $*"; }

cleanup_dir() {
  local dir="$1"
  local label="$2"

  # Count total backups before any deletion
  local total
  total=$(find "${dir}" -maxdepth 1 -name "*.enc" -not -name "*.sha256" 2>/dev/null | wc -l)

  if [ "${total}" -eq 0 ]; then
    log "No ${label} backups found — skipping cleanup."
    return
  fi

  # Find old backup files (not .sha256 sidecars)
  local old_files
  old_files=$(find "${dir}" -maxdepth 1 -name "*.enc" -not -name "*.sha256" \
    -mtime "+${RETENTION_DAYS}" 2>/dev/null || true)

  if [ -z "${old_files}" ]; then
    log "No ${label} backups older than ${RETENTION_DAYS} days — nothing to delete."
    return
  fi

  local old_count
  old_count=$(echo "${old_files}" | grep -c . || true)
  local remaining=$((total - old_count))

  # Safety check: always keep at least 1 backup
  if [ "${remaining}" -lt 1 ]; then
    log "WARNING: Deleting all ${total} ${label} backup(s) would leave none. Keeping the newest — skipping deletion."
    return
  fi

  # Delete each old .enc file and its matching .sha256 sidecar
  echo "${old_files}" | while IFS= read -r enc_file; do
    [ -z "${enc_file}" ] && continue
    local sha_file="${enc_file}.sha256"
    rm -f "${enc_file}"
    rm -f "${sha_file}"
    log "Deleted: $(basename "${enc_file}") (and .sha256 sidecar)"
  done

  log "Cleanup done: removed ${old_count} ${label} backup(s), ${remaining} remain."
}

cleanup_dir "${HOURLY_DIR}" "hourly"
cleanup_dir "${DAILY_DIR}" "daily"
