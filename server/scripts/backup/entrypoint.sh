#!/bin/bash
# Backup service entrypoint
# Creates required directories, runs an initial health check, starts the manual
# trigger watcher, then runs the backup schedule without requiring cron packages.

set -e

LOG_FILE="/var/log/backup.log"

echo "[entrypoint] Starting AIP-PIR backup service..."

# Ensure backup directories exist on the mounted volume
mkdir -p /app/backups/hourly /app/backups/daily /app/backups/triggers
touch "${LOG_FILE}"

run_logged() {
  label="$1"
  shift

  echo "[$(date -Iseconds)] [entrypoint] Starting ${label}..." >> "${LOG_FILE}"
  if "$@" >> "${LOG_FILE}" 2>&1; then
    echo "[$(date -Iseconds)] [entrypoint] ${label} completed." >> "${LOG_FILE}"
    return 0
  fi

  echo "[$(date -Iseconds)] [entrypoint] ${label} failed." >> "${LOG_FILE}"
  return 1
}

# Write an initial status.json so the backend has something to read on first start
/app/scripts/backup/backup_healthcheck.sh

watch_manual_triggers() {
  echo "[entrypoint] Watching for manual backup triggers..."
  while true; do
    for trigger in /app/backups/triggers/hourly-*.json; do
      [ -e "${trigger}" ] || continue

      lock_dir="${trigger}.lock"
      if mkdir "${lock_dir}" 2>/dev/null; then
        echo "[entrypoint] Processing manual backup trigger: ${trigger}"
        rm -f "${trigger}"
        if run_logged "manual hourly backup" /app/scripts/backup/backup_hourly.sh; then
          echo "[entrypoint] Manual backup completed."
        else
          echo "[entrypoint] Manual backup failed. Check ${LOG_FILE}."
        fi
        rmdir "${lock_dir}" 2>/dev/null || true
      fi
    done
    sleep 5
  done
}

run_schedule() {
  echo "[entrypoint] Running backup schedule loop..."

  last_hourly=""
  last_daily=""
  last_health=""

  while true; do
    current_minute="$(date +%M)"
    current_hour="$(date +%H)"
    current_hour_key="$(date +%Y%m%d%H)"
    current_day_key="$(date +%Y%m%d)"
    current_health_key="${current_hour_key}${current_minute}"

    if [ "${current_minute}" = "00" ] && [ "${last_hourly}" != "${current_hour_key}" ]; then
      run_logged "scheduled hourly backup" /app/scripts/backup/backup_hourly.sh || true
      last_hourly="${current_hour_key}"
    fi

    if [ "${current_hour}" = "02" ] && [ "${current_minute}" = "00" ] && [ "${last_daily}" != "${current_day_key}" ]; then
      run_logged "scheduled daily backup" /app/scripts/backup/backup_daily.sh || true
      last_daily="${current_day_key}"
    fi

    if { [ "${current_minute}" = "00" ] || [ "${current_minute}" = "30" ]; } && [ "${last_health}" != "${current_health_key}" ]; then
      run_logged "scheduled backup health check" /app/scripts/backup/backup_healthcheck.sh || true
      last_health="${current_health_key}"
    fi

    sleep 30
  done
}

watch_manual_triggers &
run_schedule &

wait -n

echo "[entrypoint] Backup service stopped unexpectedly."
exit 1
