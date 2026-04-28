#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMIT_BATCH="$REPO_ROOT/commit-batch.sh"

WAVE_ORDER=(
  "schema"
  "server-sessions"
  "server-admin-shared"
  "server-admin-routes"
  "server-admin-submissions"
  "server-data"
  "frontend"
  "docs"
  "root"
)

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
commit-batch.sh so every category gets its own batch note and commit.

Default waves:
  schema                 prisma schema cleanup and migration purges
  server-sessions        session library and auth route hardening
  server-admin-shared    admin shared guards, display, and selects
  server-admin-routes    core admin routes: overview, sessions, users, PIR review
  server-admin-submissions  admin submissions route cleanup
  server-data            soft delete and history for AIPs and PIRs
  frontend               frontend visual design, table layout, and logo assets
  docs                   session restore and logout documentation
  root                   root tooling: commit-stages.sh update

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
    schema)                 printf 'schema cleanup and migration purges' ;;
    server-sessions)        printf 'session library and auth route hardening' ;;
    server-admin-shared)    printf 'admin shared guards, display, and selects cleanup' ;;
    server-admin-routes)    printf 'core admin routes: overview, sessions, users, PIR review' ;;
    server-admin-submissions) printf 'admin submissions route cleanup' ;;
    server-data)            printf 'soft delete and history for AIPs and PIRs' ;;
    frontend)               printf 'frontend visual design, table layout, and logo assets' ;;
    docs)                   printf 'session restore and logout documentation' ;;
    root)                   printf 'root tooling: commit-stages.sh for this release cycle' ;;
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
    schema)                   printf 'chore(db): purge observer review notes and consolidation TA columns' ;;
    server-sessions)          printf 'feat(server): harden session restore and multi-device logout' ;;
    server-admin-shared)      printf 'refactor(admin): remove observer access helper, update guards and selects' ;;
    server-admin-routes)      printf 'refactor(admin): clean up overview, sessions, users, consolidation, and PIR review routes' ;;
    server-admin-submissions) printf 'refactor(admin): remove observer notes from submissions, clean up list and validation' ;;
    server-data)              printf 'feat(server): soft delete for AIPs and PIRs' ;;
    frontend)                 printf 'feat(frontend): improve visual design, table layout, and logo assets' ;;
    docs)                     printf 'docs(sessions): add SECURE_SESSION_RESTORE_AND_LOGOUT guide' ;;
    root)                     printf 'chore(tooling): update commit-stages.sh for session and admin overhaul waves' ;;
    *) die "Unknown wave: $wave" ;;
  esac
}

wave_paths() {
  case "$1" in
    schema)
      printf '%s\n' \
        'server/prisma/schema.prisma' \
        'server/prisma/migrations'
      ;;
    server-sessions)
      printf '%s\n' \
        'server/lib/auth.ts' \
        'server/lib/userSessions.ts' \
        'server/lib/userSessions.test.ts' \
        'server/routes/auth.ts'
      ;;
    server-admin-shared)
      printf '%s\n' \
        'server/routes/admin/shared'
      ;;
    server-admin-routes)
      printf '%s\n' \
        'server/routes/admin/consolidationNotes.ts' \
        'server/routes/admin/logs/actionCatalog.ts' \
        'server/routes/admin/overview.ts' \
        'server/routes/admin/pirReview.ts' \
        'server/routes/admin/security.test.ts' \
        'server/routes/admin/sessions.ts' \
        'server/routes/admin/users.ts'
      ;;
    server-admin-submissions)
      printf '%s\n' \
        'server/routes/admin/submissions.ts' \
        'server/routes/admin/submissions'
      ;;
    server-data)
      printf '%s\n' \
        'server/routes/data/aips.ts' \
        'server/routes/data/dashboard.ts' \
        'server/routes/data/pirs.ts'
      ;;
    frontend)
      printf '%s\n' \
        'react-app/src' \
        'react-app/public'
      ;;
    docs)
      printf '%s\n' \
        'docs/SECURE_SESSION_RESTORE_AND_LOGOUT.md'
      ;;
    root)
      printf '%s\n' '.' ':(top,exclude)react-app/**' ':(top,exclude)server/**' ':(top,exclude)docs/**'
      ;;
    *)
      die "Unknown wave: $1"
      ;;
  esac
}

wave_force_paths() {
  case "$1" in
    *)
      printf '%s\n'
      ;;
  esac
}

wave_summary() {
  case "$1" in
    schema)
      printf '%s\n' \
        'Removed the AdminObserverReviewNote model and committed its purge migration.' \
        'Dropped the consolidation TA-schools percentage columns no longer referenced in the UI.'
      ;;
    server-sessions)
      printf '%s\n' \
        'Updated session library to support secure session restore and explicit multi-device logout.' \
        'Hardened auth route token validation and session cookie handling.'
      ;;
    server-admin-shared)
      printf '%s\n' \
        'Deleted observerAccess helper now that observer review notes are removed.' \
        'Updated shared guards and Prisma selects to match the cleaned-up schema.'
      ;;
    server-admin-routes)
      printf '%s\n' \
        'Updated admin overview, sessions, users, consolidation notes, and PIR review routes.' \
        'Cleaned up action catalog log entries; updated security tests.'
      ;;
    server-admin-submissions)
      printf '%s\n' \
        'Deleted the observerNotes submission handler; removed the feature end-to-end.' \
        'Updated list, normalizer, notification, and validation modules.'
      ;;
    server-data)
      printf '%s\n' \
        'Implemented soft deletion for AIPs and PIRs using deleted_at timestamp.' \
        'Updated dashboard data queries to fetch soft-deleted items for history view.'
      ;;
    frontend)
      printf '%s\n' \
        'Implemented glassmorphic UI and Framer Motion micro-animations for PIR workflow.' \
        'Resolved PIR form table layout issues to enforce landscape orientation and fix column widths.' \
        'Replaced blurry logos with high-quality WebP assets in public directory.'
      ;;
    docs)
      printf '%s\n' \
        'Added SECURE_SESSION_RESTORE_AND_LOGOUT.md documenting the secure session restore and explicit logout flows.'
      ;;
    root)
      printf '%s\n' \
        'Updated commit-stages.sh wave definitions to match the current session management and admin overhaul work.' \
        'Updated README.md to reflect the current release state.'
      ;;
    *)
      die "Unknown wave: $1"
      ;;
  esac
}

wave_handoff() {
  case "$1" in
    schema)
      printf '%s\n' \
        'Review the two new migration files for correctness; confirm Prisma client was regenerated after schema change.' \
        'Verify no remaining references to AdminObserverReviewNote or consolidation TA percentage fields in server code.'
      ;;
    server-sessions)
      printf '%s\n' \
        'Review userSessions test coverage and the new session restore behavior end-to-end.' \
        'Confirm cookie SameSite and HttpOnly settings are correct in both dev and production environments.'
      ;;
    server-admin-shared)
      printf '%s\n' \
        'Grep for any remaining observerAccess imports in admin routes before declaring the cleanup complete.' \
        'Verify guards.ts and prismaSelects.ts compile cleanly after the schema change.'
      ;;
    server-admin-routes)
      printf '%s\n' \
        'Run security.test.ts and confirm all refactored routes have passing coverage.' \
        'Review the PIR review route for any references to the removed observer notes types.'
      ;;
    server-admin-submissions)
      printf '%s\n' \
        'Confirm all observer-note endpoints have been removed from admin submissions routing.' \
        'Verify submission list, normalizer, and notification modules reflect the updated schema selects.'
      ;;
    server-data)
      printf '%s\n' \
        'Verify soft deletion cascades correctly or is handled properly in relation to dependencies.' \
        'Ensure soft-deleted records do not accidentally appear in active lists.'
      ;;
    frontend)
      printf '%s\n' \
        'Verify PIR form landscape layout renders correctly on smaller screens.' \
        'Confirm logo assets load correctly across different network conditions.'
      ;;
    docs)
      printf '%s\n' \
        'Incorporate the new session doc into USER_MANUAL.md and FAQ.md in the next documentation pass.' \
        'Cross-reference from README.md once the root wave lands.'
      ;;
    root)
      printf '%s\n' \
        'This commit-stages.sh covers the current session-and-admin-overhaul cycle. Update wave definitions at the start of the next release.' \
        'Verify README.md version badge and highlights section match the CHANGELOG entry.'
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
  local wave="$1"
  local path
  local normal_paths=()
  local force_paths=()

  while IFS= read -r path; do
    [ -n "$path" ] && normal_paths+=("$path")
  done < <(wave_paths "$wave")

  while IFS= read -r path; do
    [ -n "$path" ] && force_paths+=("$path")
  done < <(wave_force_paths "$wave")

  if [ "${#normal_paths[@]}" -gt 0 ] && git -C "$REPO_ROOT" status --porcelain -- "${normal_paths[@]}" | grep -q .; then
    return 0
  fi

  if [ "${#force_paths[@]}" -gt 0 ] && git -C "$REPO_ROOT" status --porcelain --ignored=matching -- "${force_paths[@]}" | grep -q .; then
    return 0
  fi

  return 1
}

print_waves() {
  local wave

  for wave in "${WAVE_ORDER[@]}"; do
    printf '%-28s %s\n' "$wave" "$(wave_title "$wave")"
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
  FORCE_PATHS=()
  while IFS= read -r path; do
    [ -n "$path" ] && PATHS+=("$path")
  done < <(wave_paths "$wave")

  while IFS= read -r path; do
    [ -n "$path" ] && FORCE_PATHS+=("$path")
  done < <(wave_force_paths "$wave")

  if ! has_wave_changes "$wave"; then
    printf 'Skipping wave with no changes: %s\n' "$wave"
    continue
  fi

  processed=$((processed + 1))
  log_stage "Processing wave: $wave ($(wave_title "$wave"))"

  CMD_ARGS=()
  CMD_ARGS+=(--summary "Wave $wave: $(wave_title "$wave").")
  CMD_ARGS+=(--handoff "Review the $wave wave batch note before the next documentation refresh.")

  while IFS= read -r summary; do
    [ -n "$summary" ] && CMD_ARGS+=(--summary "$summary")
  done < <(wave_summary "$wave")

  while IFS= read -r handoff; do
    [ -n "$handoff" ] && CMD_ARGS+=(--handoff "$handoff")
  done < <(wave_handoff "$wave")

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

  if [ "${#PATHS[@]}" -gt 0 ]; then
    for path in "${PATHS[@]}"; do
      CMD_ARGS+=(--add "$path")
    done
  fi

  if [ "${#FORCE_PATHS[@]}" -gt 0 ]; then
    for path in "${FORCE_PATHS[@]}"; do
      CMD_ARGS+=(--force-add "$path")
    done
  fi

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
