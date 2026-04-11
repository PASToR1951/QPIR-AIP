#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_FILE="$REPO_ROOT/react-app/src/version.js"
NOTE_DIR="$REPO_ROOT/docs/commit-batches"
INSTRUCTIONS_FILE="$NOTE_DIR/INSTRUCTIONS.md"

STAGE_NOTE=true
STAGE_WORKTREE=true
DO_COMMIT=true
DRY_RUN=false
COMMIT_MESSAGE=""
SUMMARY_ITEMS=()
HANDOFF_ITEMS=()

usage() {
  cat <<'USAGE'
Usage: ./commit-batch.sh [options]

Creates a docs/commit-batches note that follows docs/commit-batches/INSTRUCTIONS.md.
The default LLM-run flow creates the note, stages the worktree, force-stages the
ignored batch note, and commits the staged result with an automatic message.
This script is reserved for LLM-run automation. Real runs require:
  COMMIT_BATCH_LLM_RUN=1 ./commit-batch.sh [options]

Options:
  --summary TEXT     Add a Summary bullet. Can be repeated.
  --handoff TEXT     Add a Docs Handoff Notes bullet. Can be repeated.
  --message TEXT     Use TEXT as the commit message.
  --commit MESSAGE   Alias for --message TEXT.
  --stage            Stage normal worktree changes and the batch note, but do not commit.
  --stage-note       Stage only the generated batch note, but do not commit.
  --note-only        Create the batch note only; do not stage or commit.
  --no-commit        Create and stage the batch, but do not commit.
  --dry-run          Print the note target and planned actions without writing or staging.
  -h, --help         Show this help.

Examples:
  COMMIT_BATCH_LLM_RUN=1 ./commit-batch.sh --summary "Removed Microsoft OAuth from the live app surface"
  COMMIT_BATCH_LLM_RUN=1 ./commit-batch.sh --message "chore: document current working batch"
  COMMIT_BATCH_LLM_RUN=1 ./commit-batch.sh --no-commit
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
    --stage-note)
      STAGE_NOTE=true
      STAGE_WORKTREE=false
      DO_COMMIT=false
      shift
      ;;
    --stage)
      STAGE_NOTE=true
      STAGE_WORKTREE=true
      DO_COMMIT=false
      shift
      ;;
    --message)
      require_value "$1" "${2:-}"
      COMMIT_MESSAGE="$2"
      shift 2
      ;;
    --commit)
      require_value "$1" "${2:-}"
      COMMIT_MESSAGE="$2"
      STAGE_NOTE=true
      STAGE_WORKTREE=true
      DO_COMMIT=true
      shift 2
      ;;
    --note-only)
      STAGE_NOTE=false
      STAGE_WORKTREE=false
      DO_COMMIT=false
      shift
      ;;
    --no-commit)
      DO_COMMIT=false
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
done

if [ "${COMMIT_BATCH_LLM_RUN:-}" != "1" ]; then
  cat >&2 <<'ERROR'
ERROR: commit-batch.sh is reserved for LLM-run automation.
Ask the LLM to run it with:
  COMMIT_BATCH_LLM_RUN=1 ./commit-batch.sh [options]
ERROR
  exit 2
fi

command -v git >/dev/null 2>&1 || die "git is required"
[ -f "$VERSION_FILE" ] || die "Missing version file: $VERSION_FILE"
[ -f "$INSTRUCTIONS_FILE" ] || die "Missing instructions file: $INSTRUCTIONS_FILE"
git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Not inside a Git worktree"

CURRENT_VERSION="$(
  sed -nE "s/^export const CURRENT_VERSION = ['\"]([^'\"]+)['\"].*/\1/p" "$VERSION_FILE" | head -1
)"
[ -n "$CURRENT_VERSION" ] || die "Could not parse CURRENT_VERSION from $VERSION_FILE"

MANILA_DATE="$(TZ=Asia/Manila date +%Y-%m-%d)"
MANILA_STAMP="$(TZ=Asia/Manila date +%m%d%Y)"
BASE_COMMIT="$(git -C "$REPO_ROOT" log -1 --oneline 2>/dev/null || echo "none")"

next_batch_number() {
  local max_batch=0
  local file base number

  while IFS= read -r file; do
    [ -n "$file" ] || continue
    base="$(basename "$file")"
    number="${base##*-}"
    number="${number%.md}"
    if [[ "$number" =~ ^[0-9][0-9]$ ]] && [ "$((10#$number))" -gt "$max_batch" ]; then
      max_batch="$((10#$number))"
    fi
  done < <(
    {
      find "$NOTE_DIR" -maxdepth 1 -type f -name "${CURRENT_VERSION}-${MANILA_STAMP}-[0-9][0-9].md" 2>/dev/null
      git -C "$REPO_ROOT" ls-files --cached --deleted -- "docs/commit-batches" 2>/dev/null
    } | sort -u
  )

  printf '%02d' "$((max_batch + 1))"
}

BATCH_NUMBER="$(next_batch_number)"
while [ -e "$NOTE_DIR/${CURRENT_VERSION}-${MANILA_STAMP}-${BATCH_NUMBER}.md" ]; do
  BATCH_NUMBER="$(printf '%02d' "$((10#$BATCH_NUMBER + 1))")"
done
NOTE_PATH="$NOTE_DIR/${CURRENT_VERSION}-${MANILA_STAMP}-${BATCH_NUMBER}.md"

if [ -z "$COMMIT_MESSAGE" ]; then
  COMMIT_MESSAGE="chore: capture commit batch ${CURRENT_VERSION}-${MANILA_STAMP}-${BATCH_NUMBER}"
fi

tracked_diff_stat() {
  local stat
  stat="$(git -C "$REPO_ROOT" diff --stat HEAD -- 2>/dev/null || true)"
  if [ -n "$stat" ]; then
    printf '%s\n' "$stat" | tail -1
  else
    printf 'none\n'
  fi
}

staged_files_csv() {
  local files
  files="$(git -C "$REPO_ROOT" diff --cached --name-only -- 2>/dev/null || true)"
  if [ -n "$files" ]; then
    printf '%s\n' "$files" | awk 'BEGIN { first = 1 } { if (!first) printf ", "; printf "%s", $0; first = 0 } END { print "" }'
  else
    printf 'none\n'
  fi
}

untracked_count() {
  git -C "$REPO_ROOT" ls-files --others --exclude-standard | sed '/^$/d' | wc -l | tr -d ' '
}

status_label() {
  case "$1" in
    A) printf 'Added' ;;
    C*) printf 'Copied' ;;
    D) printf 'Deleted' ;;
    M) printf 'Modified' ;;
    R*) printf 'Renamed' ;;
    T) printf 'Type changed' ;;
    U) printf 'Unmerged' ;;
    *) printf 'Changed' ;;
  esac
}

tracked_summary() {
  local file="$1"
  local stat
  stat="$(git -C "$REPO_ROOT" diff --shortstat HEAD -- "$file" 2>/dev/null || true)"
  if [ -n "$stat" ]; then
    printf '%s' "$stat"
  else
    printf 'tracked change; details pending'
  fi
}

untracked_summary() {
  local file="$1"
  local full_path="$REPO_ROOT/$file"
  local byte_count line_count

  if [ -f "$full_path" ]; then
    byte_count="$(wc -c < "$full_path" | tr -d ' ')"
    line_count="$(wc -l < "$full_path" | tr -d ' ')"
    printf 'new untracked file; %s lines, %s bytes' "$line_count" "$byte_count"
  else
    printf 'new untracked path; details pending'
  fi
}

append_inventory() {
  local diff_seen=false
  local status file old_file new_file label summary

  printf '| Status | File | Change summary |\n'
  printf '| --- | --- | --- |\n'

  while IFS=$'\t' read -r status file new_file; do
    [ -n "${status:-}" ] || continue
    diff_seen=true
    if [[ "$status" == R* || "$status" == C* ]]; then
      old_file="$file"
      file="$new_file"
      summary="$(tracked_summary "$file")"
      summary="${summary}; from ${old_file}"
    else
      summary="$(tracked_summary "$file")"
    fi
    label="$(status_label "$status")"
    printf '| %s | `%s` | %s |\n' "$label" "$file" "$summary"
  done < <(git -C "$REPO_ROOT" diff --name-status HEAD --)

  while IFS= read -r file; do
    [ -n "$file" ] || continue
    diff_seen=true
    printf '| Untracked | `%s` | %s |\n' "$file" "$(untracked_summary "$file")"
  done < <(git -C "$REPO_ROOT" ls-files --others --exclude-standard)

  if [ "$diff_seen" = false ]; then
    printf '| Clean | `(working tree)` | no tracked or untracked changes detected |\n'
  fi
}

append_bullets() {
  local fallback="$1"
  shift
  local item

  if [ "$#" -eq 0 ]; then
    printf -- '- %s\n' "$fallback"
    return
  fi

  for item in "$@"; do
    printf -- '- %s\n' "$item"
  done
}

write_note() {
  {
    printf '# %s-%s-%s\n\n' "$CURRENT_VERSION" "$MANILA_STAMP" "$BATCH_NUMBER"
    printf '## Metadata\n\n'
    printf -- '- Version: `%s`\n' "$CURRENT_VERSION"
    printf -- '- Date: `%s`\n' "$MANILA_DATE"
    printf -- '- Filename date: `%s`\n' "$MANILA_STAMP"
    printf -- '- Batch: `%s`\n' "$BATCH_NUMBER"
    printf -- '- Status: uncommitted working tree batch\n'
    printf -- '- Base commit: `%s`\n' "$BASE_COMMIT"
    printf -- '- Staged files: %s\n' "$(staged_files_csv)"
    printf -- '- Tracked diff stat: %s\n' "$(tracked_diff_stat)"
    printf -- '- Untracked additions in this batch: %s files\n\n' "$(untracked_count)"
    printf '## Summary\n\n'
    append_bullets "Captured the current working tree for documentation handoff; replace this line with a behavior-focused summary if needed." "${SUMMARY_ITEMS[@]}"
    printf '\n## File Inventory\n\n'
    append_inventory
    printf '\n## Docs Handoff Notes\n\n'
    append_bullets "Review this note before running update-docs.sh, then keep it as historical batch-note context." "${HANDOFF_ITEMS[@]}"
  } > "$NOTE_PATH"
}

log_stage "Stage 1: Read commit-batch instructions"
echo "Instructions: $INSTRUCTIONS_FILE"
echo "Version:      $CURRENT_VERSION"
echo "Date:         $MANILA_DATE ($MANILA_STAMP)"
echo "Batch:        $BATCH_NUMBER"
echo "Commit:       $([ "$DO_COMMIT" = true ] && printf '%s' "$COMMIT_MESSAGE" || printf 'disabled')"

log_stage "Stage 2: Inspect Git worktree"
git -C "$REPO_ROOT" status --short

log_stage "Stage 3: Prepare batch note"
echo "Target: $NOTE_PATH"
if [ "$DRY_RUN" = true ]; then
  echo "Dry run enabled; note was not written."
else
  [ ! -e "$NOTE_PATH" ] || die "Refusing to overwrite existing note: $NOTE_PATH"
  write_note
  echo "Wrote: $NOTE_PATH"
fi

if [ "$STAGE_WORKTREE" = true ]; then
  log_stage "Stage 4: Stage normal worktree changes"
  if [ "$DRY_RUN" = true ]; then
    echo "Dry run enabled; would run: git add -A"
  else
    git -C "$REPO_ROOT" add -A
    echo "Staged normal worktree changes."
  fi
fi

if [ "$STAGE_NOTE" = true ]; then
  log_stage "Stage 5: Stage generated batch note"
  if [ "$DRY_RUN" = true ]; then
    echo "Dry run enabled; would run: git add -f $NOTE_PATH"
  else
    git -C "$REPO_ROOT" add -f "$NOTE_PATH"
    echo "Force-added ignored batch note."
  fi
fi

if [ "$DO_COMMIT" = true ]; then
  log_stage "Stage 6: Commit staged changes"
  if [ "$DRY_RUN" = true ]; then
    echo "Dry run enabled; would run: git commit -m \"$COMMIT_MESSAGE\""
  elif git -C "$REPO_ROOT" diff --cached --quiet --; then
    echo "No staged changes detected; skipping commit."
  else
    git -C "$REPO_ROOT" commit -m "$COMMIT_MESSAGE"
  fi
fi

log_stage "Final status"
git -C "$REPO_ROOT" status --short
