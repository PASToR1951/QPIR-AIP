#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMIT_BATCH="$REPO_ROOT/commit-batch.sh"

WAVE_ORDER=("frontend" "server-migrations" "server" "docs" "root")

SUMMARY_ITEMS=()
HANDOFF_ITEMS=()
SELECTED_WAVES=()
SKIPPED_WAVES=()
COMMIT_MESSAGE=""
DRY_RUN=false
LIST_WAVES=false
OTHER_ARGS=()

usage() {
  cat <<'USAGE'
Usage: ./commit-stages.sh [options]

Commits the working tree in predefined waves and delegates each wave to
commit-batch.sh so every commit gets its own batch note.

Default waves:
  frontend           react-app
  server-migrations  server/prisma/migrations
  server             server paths outside Prisma migrations
  docs               docs
  root               repository-root files outside react-app, server, and docs

Options:
  --wave NAME        Commit only this wave. Can be repeated.
  --skip NAME        Skip this wave. Can be repeated.
  --list-waves       Print wave names and exit.
  --summary TEXT     Add a Summary bullet to every wave note.
  --handoff TEXT     Add a Docs Handoff Notes bullet to every wave note.
  --message TEXT     Use TEXT as the commit message prefix for every wave.
  --commit MESSAGE   Alias for --message TEXT.
  --dry-run          Preview the actions without writing, staging, or committing.
  -h, --help         Show this help.

All other commit-batch.sh options are passed through.
Real runs require:
  COMMIT_BATCH_LLM_RUN=1 ./commit-stages.sh [options]
USAGE
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

log_stage() {
  printf '\n==> %s\n' "$1"
}

require_value() {
  local option="$1"
  local value="${2:-}"
  [ -n "$value" ] || die "$option requires a value"
}

wave_title() {
  case "$1" in
    frontend) printf 'frontend app updates' ;;
    server-migrations) printf 'Prisma migration updates' ;;
    server) printf 'server updates' ;;
    docs) printf 'documentation updates' ;;
    root) printf 'root tooling and cleanup' ;;
    *) die "Unknown wave: $1" ;;
  esac
}

wave_commit_message() {
  local wave="$1"

  if [ -n "$COMMIT_MESSAGE" ]; then
    printf '[%s] %s' "$wave" "$COMMIT_MESSAGE"
    return
  fi

  case "$wave" in
    frontend) printf 'chore(frontend): commit frontend wave' ;;
    server-migrations) printf 'chore(db): commit migration wave' ;;
    server) printf 'chore(server): commit server wave' ;;
    docs) printf 'docs: commit documentation wave' ;;
    root) printf 'chore: commit root cleanup wave' ;;
    *) die "Unknown wave: $wave" ;;
  esac
}

wave_paths() {
  case "$1" in
    frontend)
      printf '%s\n' 'react-app'
      ;;
    server-migrations)
      printf '%s\n' 'server/prisma/migrations'
      ;;
    server)
      printf '%s\n' 'server' ':(top,exclude)server/prisma/migrations/**'
      ;;
    docs)
      printf '%s\n' 'docs'
      ;;
    root)
      printf '%s\n' '.' ':(top,exclude)react-app/**' ':(top,exclude)server/**' ':(top,exclude)docs/**'
      ;;
    *)
      die "Unknown wave: $1"
      ;;
  esac
}

is_known_wave() {
  local wanted="$1"
  local wave

  for wave in "${WAVE_ORDER[@]}"; do
    [ "$wave" = "$wanted" ] && return 0
  done

  return 1
}

contains_item() {
  local wanted="$1"
  shift
  local item

  for item in "$@"; do
    [ "$item" = "$wanted" ] && return 0
  done

  return 1
}

should_process_wave() {
  local wave="$1"

  if [ "${#SELECTED_WAVES[@]}" -gt 0 ] && ! contains_item "$wave" "${SELECTED_WAVES[@]}"; then
    return 1
  fi

  if [ "${#SKIPPED_WAVES[@]}" -gt 0 ] && contains_item "$wave" "${SKIPPED_WAVES[@]}"; then
    return 1
  fi

  return 0
}

has_wave_changes() {
  local pathspecs=("$@")
  git -C "$REPO_ROOT" status --porcelain -- "${pathspecs[@]}" | grep -q .
}

print_waves() {
  local wave

  for wave in "${WAVE_ORDER[@]}"; do
    printf '%-18s %s\n' "$wave" "$(wave_title "$wave")"
  done
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --summary)
      require_value "$1" "${2:-}"
      SUMMARY_ITEMS+=("$2")
      shift 2
      ;;
    --handoff)
      require_value "$1" "${2:-}"
      HANDOFF_ITEMS+=("$2")
      shift 2
      ;;
    --message|--commit)
      require_value "$1" "${2:-}"
      COMMIT_MESSAGE="$2"
      shift 2
      ;;
    --wave|--only)
      require_value "$1" "${2:-}"
      is_known_wave "$2" || die "Unknown wave for $1: $2"
      SELECTED_WAVES+=("$2")
      shift 2
      ;;
    --skip)
      require_value "$1" "${2:-}"
      is_known_wave "$2" || die "Unknown wave for $1: $2"
      SKIPPED_WAVES+=("$2")
      shift 2
      ;;
    --list-waves)
      LIST_WAVES=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      OTHER_ARGS+=("$1")
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      OTHER_ARGS+=("$1")
      shift
      ;;
  esac
done

if [ "$LIST_WAVES" = true ]; then
  print_waves
  exit 0
fi

if [ ! -f "$COMMIT_BATCH" ]; then
  die "commit-batch.sh not found at $COMMIT_BATCH"
fi

if [ "${COMMIT_BATCH_LLM_RUN:-}" != "1" ]; then
  cat >&2 <<'ERROR'
ERROR: commit-stages.sh is reserved for LLM-run automation.
Ask the LLM to run it with:
  COMMIT_BATCH_LLM_RUN=1 ./commit-stages.sh [options]
ERROR
  exit 2
fi

log_stage "commit-stages.sh: Detecting changes by wave"

processed=0

for wave in "${WAVE_ORDER[@]}"; do
  should_process_wave "$wave" || continue

  PATHS=()
  while IFS= read -r path; do
    PATHS+=("$path")
  done < <(wave_paths "$wave")
  if ! has_wave_changes "${PATHS[@]}"; then
    printf 'Skipping wave with no changes: %s\n' "$wave"
    continue
  fi

  processed=$((processed + 1))
  log_stage "Processing wave: $wave ($(wave_title "$wave"))"

  CMD_ARGS=()
  CMD_ARGS+=(--summary "Wave $wave: $(wave_title "$wave").")
  CMD_ARGS+=(--handoff "Review the $wave wave batch note before the next documentation refresh.")

  if [ "${#SUMMARY_ITEMS[@]}" -gt 0 ]; then
    for summary in "${SUMMARY_ITEMS[@]}"; do
      CMD_ARGS+=(--summary "$summary")
    done
  fi

  if [ "${#HANDOFF_ITEMS[@]}" -gt 0 ]; then
    for handoff in "${HANDOFF_ITEMS[@]}"; do
      CMD_ARGS+=(--handoff "$handoff")
    done
  fi

  CMD_ARGS+=(--commit "$(wave_commit_message "$wave")")

  for path in "${PATHS[@]}"; do
    CMD_ARGS+=(--add "$path")
  done

  if [ "${#OTHER_ARGS[@]}" -gt 0 ]; then
    COMMIT_BATCH_LLM_RUN=1 "$COMMIT_BATCH" "${CMD_ARGS[@]}" "${OTHER_ARGS[@]}" < /dev/null
  else
    COMMIT_BATCH_LLM_RUN=1 "$COMMIT_BATCH" "${CMD_ARGS[@]}" < /dev/null
  fi
done

if [ "$processed" -eq 0 ]; then
  log_stage "No changes detected in selected waves."
fi

exit 0
