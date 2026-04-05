#!/bin/bash
# Health check — determines backup freshness and writes status.json
# to /app/backups/status.json for the backend to read and serve.

set -euo pipefail

BACKUP_DIR="/app/backups"
STATUS_FILE="${BACKUP_DIR}/status.json"
CLOUD_ENABLED="${BACKUP_CLOUD_ENABLED:-false}"
NOW_EPOCH=$(date +%s)

log() { echo "[$(date -Iseconds)] [backup_healthcheck] $*"; }

# --- Find newest hourly backup ---
NEWEST_HOURLY_FILE=$(find "${BACKUP_DIR}/hourly" -maxdepth 1 -name "*.enc" -not -name "*.sha256" \
  2>/dev/null | sort | tail -n1)
HOURLY_COUNT=$(find "${BACKUP_DIR}/hourly" -maxdepth 1 -name "*.enc" -not -name "*.sha256" \
  2>/dev/null | wc -l | tr -d ' ')

if [ -n "${NEWEST_HOURLY_FILE}" ]; then
  LAST_HOURLY_EPOCH=$(stat -c %Y "${NEWEST_HOURLY_FILE}" 2>/dev/null || echo 0)
  LAST_HOURLY_ISO=$(date -d "@${LAST_HOURLY_EPOCH}" -Iseconds 2>/dev/null || date -r "${LAST_HOURLY_EPOCH}" -Iseconds)
  HOURLY_AGE_MIN=$(( (NOW_EPOCH - LAST_HOURLY_EPOCH) / 60 ))
else
  LAST_HOURLY_ISO="null"
  HOURLY_AGE_MIN=9999
fi

# --- Find newest daily backup ---
NEWEST_DAILY_FILE=$(find "${BACKUP_DIR}/daily" -maxdepth 1 -name "*.enc" -not -name "*.sha256" \
  2>/dev/null | sort | tail -n1)
DAILY_COUNT=$(find "${BACKUP_DIR}/daily" -maxdepth 1 -name "*.enc" -not -name "*.sha256" \
  2>/dev/null | wc -l | tr -d ' ')

if [ -n "${NEWEST_DAILY_FILE}" ]; then
  LAST_DAILY_EPOCH=$(stat -c %Y "${NEWEST_DAILY_FILE}" 2>/dev/null || echo 0)
  LAST_DAILY_ISO=$(date -d "@${LAST_DAILY_EPOCH}" -Iseconds 2>/dev/null || date -r "${LAST_DAILY_EPOCH}" -Iseconds)
  DAILY_AGE_MIN=$(( (NOW_EPOCH - LAST_DAILY_EPOCH) / 60 ))
else
  LAST_DAILY_ISO="null"
  DAILY_AGE_MIN=9999
fi

# --- Determine alert level ---
ALERT_LEVEL="ok"

if [ "${DAILY_AGE_MIN}" -gt 1560 ]; then   # > 26 hours
  ALERT_LEVEL="critical"
elif [ "${HOURLY_AGE_MIN}" -gt 120 ]; then  # > 2 hours
  ALERT_LEVEL="warn"
fi

# Format last_hourly / last_daily as JSON strings or null
format_ts() {
  local ts="$1"
  if [ "${ts}" = "null" ]; then echo "null"; else echo "\"${ts}\""; fi
}

# --- Write status.json ---
CLOUD_SYNC_STATUS="disabled"
if [ "${CLOUD_ENABLED}" = "true" ]; then
  CLOUD_SYNC_STATUS="enabled"
fi

cat > "${STATUS_FILE}" <<EOF
{
  "status": "${ALERT_LEVEL}",
  "last_hourly_backup": $(format_ts "${LAST_HOURLY_ISO}"),
  "last_daily_backup": $(format_ts "${LAST_DAILY_ISO}"),
  "hourly_count": ${HOURLY_COUNT},
  "daily_count": ${DAILY_COUNT},
  "hourly_age_minutes": ${HOURLY_AGE_MIN},
  "daily_age_minutes": ${DAILY_AGE_MIN},
  "cloud_sync_status": "${CLOUD_SYNC_STATUS}",
  "alert_level": "${ALERT_LEVEL}",
  "updated_at": "$(date -Iseconds)"
}
EOF

log "status.json written — alert_level=${ALERT_LEVEL}, hourly_count=${HOURLY_COUNT}, daily_count=${DAILY_COUNT}"
