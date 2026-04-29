#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMIT_BATCH="$REPO_ROOT/commit-batch.sh"

WAVE_ORDER=(
  "schema"
  "server-lib"
  "server-admin"
  "server-admin-submissions"
  "server-data"
  "frontend"
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
  schema                 ProgramFocalPerson model + focal person migration
  server-lib             routing.ts comment update for focal flow
  server-admin           admin routes: programs, overview, reports, pirReview, focalPersonReview, index
  server-admin-submissions  submissions: validation, status guard, notification label
  server-data            aips, pirs, lookups, dashboard — focal person submission routing
  frontend               all react-app/src changes: division UI, CES AIP review, status badge
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
    schema)                   printf 'ProgramFocalPerson model and focal person migration' ;;
    server-lib)               printf 'routing.ts comment update for focal person flow' ;;
    server-admin)             printf 'admin routes: programs, overview, reports, pirReview, focalPersonReview' ;;
    server-admin-submissions) printf 'submissions: validation status, admin guard, notification label' ;;
    server-data)              printf 'aips, pirs, lookups, dashboard — focal person submission routing' ;;
    frontend)                 printf 'division UI, CES AIP review queue, status badge, focal flow wiring' ;;
    root)                     printf 'root tooling: commit-stages.sh for focal person flow cycle' ;;
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
    schema)                   printf 'feat(db): add ProgramFocalPerson model and focal person fields on AIP/PIR' ;;
    server-lib)               printf 'chore(server): update routing.ts comment for focal person flow' ;;
    server-admin)             printf 'feat(admin): focal person review routes and program focal-persons management' ;;
    server-admin-submissions) printf 'feat(admin): add For Recommendation status to submissions pipeline' ;;
    server-data)              printf 'feat(server): route school AIP/PIR submissions through focal person flow' ;;
    frontend)                 printf 'feat(frontend): division focal person queue, CES AIP review, status badge updates' ;;
    root)                     printf 'chore(tooling): update commit-stages.sh for focal person flow cycle' ;;
    *) die "Unknown wave: $wave" ;;
  esac
}

wave_paths() {
  case "$1" in
    schema)
      printf '%s\n' \
        'server/prisma/schema.prisma' \
        'server/prisma/migrations/20260429000001_focal_person_flow'
      ;;
    server-lib)
      printf '%s\n' \
        'server/lib/routing.ts'
      ;;
    server-admin)
      printf '%s\n' \
        'server/routes/admin/index.ts' \
        'server/routes/admin/overview.ts' \
        'server/routes/admin/pirReview.ts' \
        'server/routes/admin/programs.ts' \
        'server/routes/admin/reports.ts' \
        'server/routes/admin/focalPersonReview.ts'
      ;;
    server-admin-submissions)
      printf '%s\n' \
        'server/routes/admin/submissions/notifications.ts' \
        'server/routes/admin/submissions/status.ts' \
        'server/routes/admin/submissions/validation.ts'
      ;;
    server-data)
      printf '%s\n' \
        'server/routes/data/aips.ts' \
        'server/routes/data/dashboard.ts' \
        'server/routes/data/lookups.ts' \
        'server/routes/data/pirs.ts'
      ;;
    frontend)
      printf '%s\n' \
        'react-app/src'
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
        'Added ProgramFocalPerson join table linking Division Personnel users to programs as focal persons.' \
        'Added focal_person_id, focal_recommended_at, focal_remarks fields to AIP and PIR.' \
        'Added ces_reviewer_id, ces_noted_at, ces_remarks fields to AIP for CES noting workflow.' \
        'Added migration 20260429000001_focal_person_flow with all DDL changes.'
      ;;
    server-lib)
      printf '%s\n' \
        'Updated getCESRoleForDivisionPIR JSDoc to reflect its new role in the focal-recommendation path for school AIPs/PIRs.'
      ;;
    server-admin)
      printf '%s\n' \
        'Added focalPersonReview.ts (667 lines) with focal recommendation, CES noting, and cluster head approval endpoints for school AIPs and PIRs.' \
        'Mounted focalReviewRoutes in admin/index.ts.' \
        'Updated programs.ts to expose focal_persons list and added PUT /programs/:id/focal-persons management endpoint.' \
        'Updated overview.ts stats to include For Recommendation status in submitted/underReview/pending counts.' \
        'Updated reports.ts funnel statuses and quarterly report pending logic to include For Recommendation, For CES Review, For Cluster Head Review.'
      ;;
    server-admin-submissions)
      printf '%s\n' \
        'Added For Recommendation to VALID_STATUSES in validation.ts.' \
        'Added guard in status.ts blocking admin status changes on school AIPs already in focal or CES review.' \
        'Added For Recommendation push-notification message template in notifications.ts.'
      ;;
    server-data)
      printf '%s\n' \
        'School AIP submissions now require at least one active focal person for the program; submission is blocked otherwise.' \
        'School AIP submissions now land in For Recommendation status instead of Approved.' \
        'School PIR submissions now require an approved AIP and active focal persons; PIRs land in For Recommendation status.' \
        'Updated lookups.ts and dashboard.ts filed/active status arrays to include For Recommendation, For CES Review, and For Cluster Head Review.'
      ;;
    frontend)
      printf '%s\n' \
        'Added react-app/src/division/ with DivisionLayout, FocalPersonQueue, and FocalPersonReview components for the Division Personnel focal-review workflow.' \
        'Added CESAIPReview.jsx for CES AIP noting queue alongside the existing PIR review queue.' \
        'Updated CESDashboard to fetch and display both PIRs and AIPs in tabbed queues.' \
        'Added For Recommendation to StatusBadge, submissionsConstants, and useSubmissionActions.' \
        'Updated AnimatedContent, AdminTopBar, DashboardHeader, NotificationBell, PIRFormEditor, CESLayout, AdminPrograms, and errorMessages for focal flow support.'
      ;;
    root)
      printf '%s\n' \
        'Updated commit-stages.sh wave definitions to match the focal person flow release cycle.' \
        'Replaced session/admin-overhaul waves with schema, server-lib, server-admin, server-admin-submissions, server-data, frontend, and root waves.'
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
        'Confirm Prisma client was regenerated after schema change (prisma generate).' \
        'Verify no remaining unhandled references to the new focal_person_id/ces_reviewer_id fields in any route not yet updated.' \
        'Update DATABASE_SCHEMA.md ERD and SYSTEM_DOCUMENTATION_THESIS.md ERD in the next docs pass.'
      ;;
    server-lib)
      printf '%s\n' \
        'No functional change — comment-only update. Confirm getCESRoleForDivisionPIR call sites are correct in focalPersonReview.ts.'
      ;;
    server-admin)
      printf '%s\n' \
        'Review focalPersonReview.ts endpoints against the focal person flow spec: recommend, CES note, cluster head approve/return.' \
        'Confirm PUT /programs/:id/focal-persons is wired correctly in AdminPrograms.jsx.' \
        'Document new focal person endpoints in API_DOCS.md during the next docs pass.'
      ;;
    server-admin-submissions)
      printf '%s\n' \
        'Confirm the admin status guard in status.ts does not block any legitimate admin workflow.' \
        'Test the For Recommendation push notification end-to-end against the focal person review flow.'
      ;;
    server-data)
      printf '%s\n' \
        'Test that a school user cannot submit an AIP when no focal persons are assigned to the program.' \
        'Confirm PIR submission guard (AIP must be Approved) works after the focal flow lands the AIP in Approved state.' \
        'Verify dashboard and lookup queries return correct counts for the new statuses.'
      ;;
    frontend)
      printf '%s\n' \
        'Walk through the Division Personnel focal-review flow end-to-end in the browser (queue → review → recommend/return).' \
        'Confirm CESDashboard AIP tab loads correctly and the CESAIPReview modal works.' \
        'Verify StatusBadge renders For Recommendation in yellow for all table contexts.'
      ;;
    root)
      printf '%s\n' \
        'This commit-stages.sh covers the focal person flow release cycle. Update wave definitions at the start of the next release.' \
        'Verify README.md version badge and highlights section match the CHANGELOG entry after the next docs pass.'
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
