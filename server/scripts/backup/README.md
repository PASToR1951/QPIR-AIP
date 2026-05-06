# AIP-PIR Backup System — Setup Guide & Runbook

This document covers initial setup, daily operations, and disaster recovery for the AIP-PIR backup system.

---

## Quick Start

### 1. Generate encryption key

```bash
openssl rand -hex 32
# Copy output → set as BACKUP_ENCRYPTION_KEY in .env
```

### 2. Create read-only database user

```bash
# Set BACKUP_DB_USER and BACKUP_DB_PASSWORD in .env first, then run:
docker compose --env-file .env exec -T db /docker-entrypoint-initdb.d/20-backup-user.sh
```

### 3. Update .env

Add to your `.env` file:

```env
BACKUP_ENCRYPTION_KEY=<hex key from step 1>
BACKUP_DB_USER=backup_reader
BACKUP_DB_PASSWORD=<password from step 2>
BACKUP_RETENTION_DAYS=5
BACKUP_CLOUD_ENABLED=false
```

### 4. (Optional) Configure cloud sync

```bash
# Install rclone on the HOST machine (not inside Docker)
curl https://rclone.org/install.sh | sudo bash

# Configure Google Drive or OneDrive
rclone config
# Follow prompts, name the remote "my_remote"

# Test connection
rclone lsd my_remote:

# Then set in .env:
# BACKUP_CLOUD_ENABLED=true
# BACKUP_RCLONE_REMOTE=my_remote
# BACKUP_RCLONE_PATH=/AIP-PIR-Backups
# RCLONE_CONFIG_DIR=~/.config/rclone
```

### 5. Build and start the backup service

```bash
docker compose --profile backup up -d --build backup

# Verify it's running
docker compose ps backup

# Watch logs
docker compose logs -f backup
```

### 6. Test a backup

```bash
# Trigger a manual hourly backup
docker compose exec backup /app/scripts/backup/backup_hourly.sh

# Verify it was created
ls -lh ./backups/hourly/

# Verify checksums
docker compose exec backup /app/scripts/backup/backup_verify.sh
```

---

## File Locations

| Path | Description |
|------|-------------|
| `./backups/hourly/` | Hourly encrypted backups (`.dump.enc` + `.sha256`) |
| `./backups/daily/` | Daily encrypted backups (`.sql.gz.enc` + `.sha256`) |
| `./backups/status.json` | Current health status (read by backend API) |
| `./backups/restore.log` | Log of all restore operations |

---

## Backup Script Reference

| Script | Purpose | When it runs |
|--------|---------|-------------|
| `backup_hourly.sh` | pg_dump custom format → encrypt → checksum | Every hour (backup service loop) or manually |
| `backup_daily.sh` | pg_dump plain SQL → gzip → encrypt → checksum | Daily at 2:00 AM (backup service loop) or manually |
| `backup_cleanup.sh` | Delete old backups + sidecars beyond retention | Called by hourly/daily |
| `backup_upload.sh` | rclone sync to cloud (if enabled) | Called by hourly/daily |
| `backup_verify.sh` | Re-check all checksums | Manually |
| `backup_healthcheck.sh` | Write status.json | Called by hourly/daily + every 30 min |
| `restore.sh` | Interactive CLI restore | Manually by admin only |

---

## Restore Operations

### Standard restore (data loss or corruption)

```bash
docker compose exec backup /app/scripts/backup/restore.sh
```

The script will:
1. List all available backups with timestamps
2. Prompt you to select one by number
3. Verify the checksum
4. Ask for `yes` confirmation
5. Decrypt, drop DB, restore, and refresh backup health status

For the cleanest restore, stop the backend from the host before running the restore, then start it again after the script succeeds:

```bash
docker compose stop backend
docker compose exec backup /app/scripts/backup/restore.sh
docker compose start backend
```

### Decrypt a backup manually (inspect without restoring)

```bash
# Hourly (custom format) — inspect with pg_restore --list
openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 \
  -pass pass:"$BACKUP_ENCRYPTION_KEY" \
  -in ./backups/hourly/pir_system_hourly_YYYYMMDD_HHMMSS.dump.enc \
  -out /tmp/decrypted.dump

pg_restore --list /tmp/decrypted.dump

# Daily (plain SQL gzipped)
openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 \
  -pass pass:"$BACKUP_ENCRYPTION_KEY" \
  -in ./backups/daily/pir_system_daily_YYYYMMDD.sql.gz.enc \
  -out /tmp/decrypted.sql.gz

zcat /tmp/decrypted.sql.gz | head -100
```

---

## Disaster Recovery Runbook

### Scenario A: Accidental Data Deletion

1. Identify the backup taken before the deletion:
   ```bash
   ls -lh ./backups/hourly/
   ```
2. Run restore:
   ```bash
   docker compose stop backend
   docker compose exec backup /app/scripts/backup/restore.sh
   docker compose start backend
   ```
3. Select the backup just before the incident.
4. Verify application is working:
   ```bash
   curl http://localhost:3001/api/health
   ```

### Scenario B: Complete Server Loss

1. Provision a new server.
2. Clone repository:
   ```bash
   git clone https://github.com/PASToR1951/AIP-PIR.git
   cd AIP-PIR
   ```
3. Restore `.env` (you need `BACKUP_ENCRYPTION_KEY` — store this securely outside the server).
4. Install rclone and download cloud backups:
   ```bash
   curl https://rclone.org/install.sh | sudo bash
   rclone config  # re-configure cloud access
   rclone copy my_remote:/AIP-PIR-Backups/ ./backups/
   ```
5. Start just the database:
   ```bash
   docker compose up -d db
   ```
6. Run restore:
   ```bash
   docker compose --profile backup run --rm backup /app/scripts/backup/restore.sh
   ```
7. Start the full stack:
   ```bash
   docker compose up -d
   ```
8. Verify:
   ```bash
   curl http://localhost:3001/api/health
   ```

### Scenario C: Corrupt Backup File

1. Run verification to identify which backup is corrupted:
   ```bash
   docker compose exec backup /app/scripts/backup/backup_verify.sh
   ```
2. Delete the corrupt file and its sidecar:
   ```bash
   rm ./backups/hourly/pir_system_hourly_YYYYMMDD_HHMMSS.dump.enc
   rm ./backups/hourly/pir_system_hourly_YYYYMMDD_HHMMSS.dump.enc.sha256
   ```
3. Select the next-most-recent backup for restore.

---

## Monitoring

### Check backup status via Admin UI

Navigate to `/admin/backups` in the application — shows last backup times, counts, and alert level.

### Check status.json directly

```bash
cat ./backups/status.json
```

### Watch live backup logs

```bash
docker compose logs -f backup
```

### Alert levels

| Level | Meaning |
|-------|---------|
| `ok` | All backups within expected timeframe |
| `warn` | No hourly backup in the last 2 hours |
| `critical` | No daily backup in 26 hours, or checksum failure |

---

## Security Notes

- `BACKUP_ENCRYPTION_KEY` must be stored securely outside the server (password manager, secrets vault). Without it, encrypted backups cannot be decrypted.
- `backup_reader` is a read-only PostgreSQL user — it cannot modify data.
- The `backups/` directory should not be accessible from the internet.
- Cloud storage (rclone remote) credentials are stored in `~/.config/rclone/rclone.conf` on the host — protect this file.
- Backups contain PII (RA 10173) — treat them with the same care as the live database.
