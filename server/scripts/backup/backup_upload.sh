#!/bin/bash
# Cloud sync via rclone. Only runs when BACKUP_CLOUD_ENABLED=true.
# Syncs ./backups/ to the configured rclone remote, then verifies with rclone check.

set -euo pipefail

CLOUD_ENABLED="${BACKUP_CLOUD_ENABLED:-false}"
RCLONE_REMOTE="${BACKUP_RCLONE_REMOTE:-my_remote}"
RCLONE_PATH="${BACKUP_RCLONE_PATH:-/AIP-PIR-Backups}"
BACKUP_DIR="/app/backups"

log() { echo "[$(date -Iseconds)] [backup_upload] $*"; }

if [ "${CLOUD_ENABLED}" != "true" ]; then
  log "Cloud sync disabled (BACKUP_CLOUD_ENABLED=${CLOUD_ENABLED}). Skipping."
  exit 0
fi

REMOTE_TARGET="${RCLONE_REMOTE}:${RCLONE_PATH}"
log "Syncing ${BACKUP_DIR} → ${REMOTE_TARGET}"

# Sync local backups to remote (excludes status.json — internal file)
if ! rclone sync "${BACKUP_DIR}" "${REMOTE_TARGET}" \
  --exclude "status.json" \
  --transfers 4 \
  --checkers 8 \
  --retries 3 \
  --low-level-retries 10 \
  --stats 0; then
  log "ERROR: rclone sync failed."
  exit 1
fi
log "Sync completed."

# Verify: compare local .sha256 files against remote
log "Verifying checksums on remote..."
if ! rclone check "${BACKUP_DIR}" "${REMOTE_TARGET}" \
  --exclude "status.json" \
  --one-way 2>&1; then
  log "WARNING: rclone check reported differences. Remote may be out of sync."
  exit 1
fi
log "Remote verification passed."
