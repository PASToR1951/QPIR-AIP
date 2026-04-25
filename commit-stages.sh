#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMIT_BATCH="$REPO_ROOT/commit-batch.sh"

WAVE_ORDER=(
  "root"
  "server-migrations"
  "server-infra"
  "server-data"
  "server-admin"
  "frontend"
  "server-tests"
  "docs"
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
  root               repository-root commit tooling and cleanup
  server-migrations  server/prisma/migrations
  server-infra       shared server libraries and concurrency primitives
  server-data        user data routes and shared data-route helpers
  server-admin       admin submission/review routes
  frontend           react-app UI/API caller changes
  server-tests       Deno tests and guarded DB integration coverage
  docs               targeted documentation updates

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
    root) printf 'root commit tooling and cleanup' ;;
    server-migrations) printf 'Prisma migration updates' ;;
    server-infra) printf 'server concurrency infrastructure' ;;
    server-data) printf 'data-route concurrency hardening' ;;
    server-admin) printf 'admin-route concurrency hardening' ;;
    frontend) printf 'frontend idempotent caller updates' ;;
    server-tests) printf 'server concurrency test coverage' ;;
    docs) printf 'targeted concurrency documentation' ;;
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
    root) printf 'chore(tooling): add categorized commit batching' ;;
    server-migrations) printf 'chore(db): commit migration wave' ;;
    server-infra) printf 'feat(server): add concurrency hardening primitives' ;;
    server-data) printf 'fix(data): serialize AIP and PIR writes' ;;
    server-admin) printf 'fix(admin): coordinate submission review writes' ;;
    frontend) printf 'fix(frontend): send explicit PIR presented values' ;;
    server-tests) printf 'test(server): cover AIP and PIR concurrency hardening' ;;
    docs) printf 'docs(concurrency): document advisory lock hardening' ;;
    *) die "Unknown wave: $wave" ;;
  esac
}

wave_paths() {
  case "$1" in
    root)
      printf '%s\n' '.' ':(top,exclude)react-app/**' ':(top,exclude)server/**' ':(top,exclude)docs/**'
      ;;
    server-migrations)
      printf '%s\n' 'server/prisma/migrations'
      ;;
    server-infra)
      printf '%s\n' \
        'server/lib/advisoryLock.ts' \
        'server/lib/errors.ts' \
        'server/lib/prismaErrors.ts' \
        'server/lib/quarters.ts'
      ;;
    server-data)
      printf '%s\n' \
        'server/routes/data/aips.ts' \
        'server/routes/data/drafts.ts' \
        'server/routes/data/lookups.ts' \
        'server/routes/data/pirs.ts' \
        'server/routes/data/shared/asyncHandler.ts' \
        'server/routes/data/shared/lookups.ts'
      ;;
    server-admin)
      printf '%s\n' \
        'server/routes/admin/pirReview.ts' \
        'server/routes/admin/submissions/aipEdit.ts' \
        'server/routes/admin/submissions/asyncHandler.ts' \
        'server/routes/admin/submissions/pirActions.ts' \
        'server/routes/admin/submissions/presented.ts' \
        'server/routes/admin/submissions/status.ts'
      ;;
    frontend)
      printf '%s\n' \
        'react-app/src/admin/pages/adminReports/ClusterPIRSummary.jsx' \
        'react-app/src/admin/pages/pirReview/usePirReviewActions.js' \
        'react-app/src/lib/errorMessages.js'
      ;;
    server-tests)
      printf '%s\n' \
        'server/concurrency.integration.test.ts' \
        'server/lib/advisoryLock.test.ts' \
        'server/lib/prismaErrors.test.ts' \
        'server/lib/quarters.test.ts' \
        'server/routes/admin/submissions/pirActions.test.ts' \
        'server/routes/data/shared/asyncHandler.test.ts'
      ;;
    docs)
      printf '%s\n'
      ;;
    *)
      die "Unknown wave: $1"
      ;;
  esac
}

wave_force_paths() {
  case "$1" in
    root)
      printf '%s\n' 'commit-batch.sh'
      ;;
    docs)
      printf '%s\n' 'docs/CONCURRENCY_AND_RACE_CONDITIONS.md'
      ;;
    *)
      printf '%s\n'
      ;;
  esac
}

wave_summary() {
  case "$1" in
    root)
      printf '%s\n' \
        'Added the missing commit-batch.sh helper for scoped staging, batch-note generation, duplicate-note protection, and detailed commit message bodies.' \
        'Split commit-stages.sh into concurrency-focused waves so tooling, server infrastructure, data routes, admin routes, frontend callers, tests, and docs can land separately.'
      ;;
    server-migrations)
      printf '%s\n' \
        'Captured Prisma migration changes separately so schema movement stays isolated from runtime logic.'
      ;;
    server-infra)
      printf '%s\n' \
        'Added shared HttpError/ConflictError handling, known Prisma P2002 conflict parsing, PostgreSQL advisory-lock helpers, and canonical quarter normalization support.' \
        'Centralized AIP/PIR resource-key generation so user and admin write paths coordinate on the same hashed lock identities.'
      ;;
    server-data)
      printf '%s\n' \
        'Wrapped AIP/PIR submit, draft, update, and draft-delete flows in transaction-scoped advisory locks keyed from the actual uniqueness rules.' \
        'Moved existence checks, status decisions, parent writes, and child delete/recreate sequences inside the same transaction while preserving post-commit side effects.'
      ;;
    server-admin)
      printf '%s\n' \
        'Coordinated admin status, remarks, presentation, edit-permission, and activity-note writes with the same AIP/PIR resource locks used by data routes.' \
        'Kept existing last-write-wins admin status behavior while making returned/edit and remarks mutations atomic under the relevant lock.'
      ;;
    frontend)
      printf '%s\n' \
        'Updated PIR presented callers to send explicit desired boolean values so the admin API can behave idempotently under concurrent writes.' \
        'Adjusted frontend error messaging around expected concurrency conflicts.'
      ;;
    server-tests)
      printf '%s\n' \
        'Added Deno coverage for advisory resource keys, Prisma P2002 target parsing, async handler error mapping, quarter canonicalization, and presented toggle compatibility.' \
        'Added guarded DB-backed concurrency integration coverage for duplicate submit/draft races, delete/recreate rollback behavior, returned/status races, and explicit presented writes.'
      ;;
    docs)
      printf '%s\n' \
        'Documented the AIP/PIR advisory-lock implementation, quarter normalization caveat, workflow asymmetry, known empirical follow-ups, and rollback-test coverage expectations.'
      ;;
    *)
      die "Unknown wave: $1"
      ;;
  esac
}

wave_handoff() {
  case "$1" in
    root)
      printf '%s\n' \
        'Use COMMIT_BATCH_LLM_RUN=1 ./commit-stages.sh --dry-run before real categorized commits to verify each wave scope.' \
        'The root wave intentionally force-adds commit-batch.sh because the repository ignore rules hide that helper by default.' \
        'The docs wave intentionally force-adds only docs/CONCURRENCY_AND_RACE_CONDITIONS.md because docs/ is broadly ignored.'
      ;;
    server-migrations)
      printf '%s\n' \
        'Confirm migration notes and generated Prisma artifacts separately if a future schema migration appears in this wave.'
      ;;
    server-infra)
      printf '%s\n' \
        'Document advisory-lock namespaces, hash collision behavior as false serialization, and supported P2002 meta.target shapes.'
      ;;
    server-data)
      printf '%s\n' \
        'Document user-facing 409 behavior for duplicate AIP/PIR create races and the canonical PIR quarter storage rule.'
      ;;
    server-admin)
      printf '%s\n' \
        'Document that admin status writes preserve current last-write-wins semantics while sharing AIP/PIR locks with user writes.'
      ;;
    frontend)
      printf '%s\n' \
        'Mention that presented updates now prefer explicit set semantics while the backend still supports the legacy empty-body toggle.'
      ;;
    server-tests)
      printf '%s\n' \
        'Record which tests are unit-only and which guarded integration tests require AIP_PIR_CONCURRENCY_DB_TESTS plus database credentials.'
      ;;
    docs)
      printf '%s\n' \
        'Use the concurrency document as the source-of-truth note for future README, system docs, and implementation review updates.'
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
    printf '%-20s %s\n' "$wave" "$(wave_title "$wave")"
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
