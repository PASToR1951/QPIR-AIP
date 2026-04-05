#!/bin/bash
# Integrity verification — recomputes SHA-256 for every .enc backup file
# and compares against its .sha256 sidecar. Exits non-zero if any fail.

set -euo pipefail

BACKUP_DIR="/app/backups"
DIRS=("${BACKUP_DIR}/hourly" "${BACKUP_DIR}/daily")

log()  { echo "[$(date -Iseconds)] [backup_verify] $*"; }
pass() { echo "[$(date -Iseconds)] [backup_verify] OK:   $*"; }
fail() { echo "[$(date -Iseconds)] [backup_verify] FAIL: $*" >&2; }

TOTAL=0
FAILED=0

for dir in "${DIRS[@]}"; do
  if [ ! -d "${dir}" ]; then
    log "Directory not found: ${dir} — skipping."
    continue
  fi

  while IFS= read -r enc_file; do
    [ -z "${enc_file}" ] && continue
    sha_file="${enc_file}.sha256"
    TOTAL=$((TOTAL + 1))

    if [ ! -f "${sha_file}" ]; then
      fail "$(basename "${enc_file}"): missing .sha256 sidecar"
      FAILED=$((FAILED + 1))
      continue
    fi

    expected=$(cat "${sha_file}")
    actual=$(sha256sum "${enc_file}" | awk '{print $1}')

    if [ "${expected}" = "${actual}" ]; then
      pass "$(basename "${enc_file}")"
    else
      fail "$(basename "${enc_file}"): checksum mismatch (expected ${expected}, got ${actual})"
      FAILED=$((FAILED + 1))
    fi
  done < <(find "${dir}" -maxdepth 1 -name "*.enc" -not -name "*.sha256" | sort)
done

log "Verification complete: ${TOTAL} file(s) checked, ${FAILED} failed."

if [ "${FAILED}" -gt 0 ]; then
  exit 1
fi
exit 0
