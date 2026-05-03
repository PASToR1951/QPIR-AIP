#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_FILE="$REPO_ROOT/react-app/src/version.js"
NOTE_DIR="$REPO_ROOT/docs/commit-batches"
INSTRUCTIONS_FILE="$NOTE_DIR/INSTRUCTIONS.md"

STAGE_NOTE=true
WRITE_NOTE=true
STAGE_WORKTREE=true
DO_COMMIT=true
DRY_RUN=false
ALLOW_EMPTY=false
ALLOW_PRESTAGED=false
NO_VERIFY=false
COMMIT_MESSAGE=""
ADD_PATHS=()
FORCE_ADD_PATHS=()
SUMMARY_ITEMS=()
HANDOFF_ITEMS=()
INSTRUCTIONS_CREATED=false

usage() {
  cat <<'USAGE'
Usage: ./commit-batch.sh [options]

Creates one detailed docs/commit-batches note for a scoped set of paths, stages
only that batch, force-stages the ignored batch note, and commits it. This is
the primitive used by commit-stages.sh so large work can land as categorized
commits instead of a single mixed commit.

Real runs require:
  COMMIT_BATCH_LLM_RUN=1 ./commit-batch.sh [options]

Required for real note-writing runs:
  --summary TEXT     Add a behavior-focused Summary bullet. Can be repeated.
  --handoff TEXT     Add a Docs Handoff Notes bullet. Can be repeated.

Scope and commit options:
  --add PATH         Stage this normal Git pathspec. Can be repeated.
                     If omitted, normal staging defaults to the whole tree.
  --force-add PATH   Force-stage this ignored pathspec. Can be repeated.
                     Use sparingly for intentionally ignored docs/notes.
  --message TEXT     Use TEXT as the commit subject.
  --commit MESSAGE   Alias for --message TEXT and keep commit enabled.
  --stage            Create the note and stage scoped files, but do not commit.
  --stage-note       Create and stage only the generated batch note.
  --note-only        Create the batch note only; do not stage or commit.
  --no-commit        Create and stage the scoped batch, but do not commit.
  --allow-empty      Allow git commit --allow-empty.
  --allow-prestaged  Permit pre-existing staged changes in the commit.
  --no-verify        Pass --no-verify to git commit.
  --dry-run          Preview actions without writing, staging, or committing.
  -h, --help         Show this help.

Examples:
  COMMIT_BATCH_LLM_RUN=1 ./commit-batch.sh \
    --add server/lib \
    --summary "Added shared advisory-lock helpers." \
    --handoff "Document the lock namespace and resource-key behavior." \
    --commit "feat(server): add advisory lock infrastructure"

  COMMIT_BATCH_LLM_RUN=1 ./commit-batch.sh --dry-run --add react-app
USAGE
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

write_instructions_template() {
  local target="$1"

  cat > "$target" <<'TEMPLATE'
# Commit Batch Instructions

This file is auto-created by `commit-batch.sh` when it is missing. Keep it in
`docs/commit-batches` as the local template/reference for generated batch notes.

## Required Inputs

- Use at least one `--summary "..."` item for real note-writing runs.
- Use at least one `--handoff "..."` item for real note-writing runs.
- Scope each batch with `--add PATH` and use `--force-add PATH` only for
  intentionally ignored files that should be committed.

## Generated Note Template

```md
# <version>-<MMDDYYYY>-<batch>

## Metadata

- Version: `<version>`
- Date: `<YYYY-MM-DD>`
- Filename date: `<MMDDYYYY>`
- Batch: `<NN>`
- Status: categorized working tree batch
- Base commit: `<short sha and subject>`
- Commit subject: `<subject>`
- Selected paths: `<scope>`
- Staged files before this batch: `<files or none>`
- Selected tracked diff stat: `<stat or none>`
- Selected untracked additions: `<count> files`

## Summary

- <behavior-focused summary>

## File Inventory

| Status | File | Change summary |
| --- | --- | --- |
| <status> | `<path>` | <short summary> |

## Docs Handoff Notes

- <what the next documentation pass should know>
```

## Review Checklist

- Confirm the selected scope is narrow enough for one commit.
- Confirm generated notes do not duplicate the latest same-day batch.
- Confirm the commit message and handoff notes describe behavior, not only files.
TEMPLATE
}

ensure_instructions_file() {
  [ -f "$INSTRUCTIONS_FILE" ] && return

  if [ "$DRY_RUN" = true ]; then
    INSTRUCTIONS_CREATED=dry-run
    return
  fi

  mkdir -p "$NOTE_DIR"
  write_instructions_template "$INSTRUCTIONS_FILE"
  INSTRUCTIONS_CREATED=true
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
    --add)
      require_value "$1" "${2:-}"
      ADD_PATHS+=("$2")
      shift 2
      ;;
    --force-add)
      require_value "$1" "${2:-}"
      FORCE_ADD_PATHS+=("$2")
      shift 2
      ;;
    --stage-note)
      WRITE_NOTE=true
      STAGE_NOTE=true
      STAGE_WORKTREE=false
      DO_COMMIT=false
      shift
      ;;
    --stage)
      WRITE_NOTE=true
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
      WRITE_NOTE=true
      STAGE_NOTE=false
      STAGE_WORKTREE=false
      DO_COMMIT=false
      shift
      ;;
    --no-commit)
      DO_COMMIT=false
      shift
      ;;
    --allow-empty)
      ALLOW_EMPTY=true
      shift
      ;;
    --allow-prestaged)
      ALLOW_PRESTAGED=true
      shift
      ;;
    --no-verify)
      NO_VERIFY=true
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
ensure_instructions_file
git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Not inside a Git worktree"

if [ "$DRY_RUN" = false ] && [ "$WRITE_NOTE" = true ]; then
  [ "${#SUMMARY_ITEMS[@]}" -gt 0 ] || die "Real runs that write a batch note require at least one --summary item"
  [ "${#HANDOFF_ITEMS[@]}" -gt 0 ] || die "Real runs that write a batch note require at least one --handoff item"
fi

CURRENT_VERSION="$(
  sed -nE "s/^export const CURRENT_VERSION = ['\"]([^'\"]+)['\"].*/\1/p" "$VERSION_FILE" | head -1
)"
[ -n "$CURRENT_VERSION" ] || die "Could not parse CURRENT_VERSION from $VERSION_FILE"

MANILA_DATE="$(TZ=Asia/Manila date +%Y-%m-%d)"
MANILA_STAMP="$(TZ=Asia/Manila date +%m%d%Y)"
BASE_COMMIT="$(git -C "$REPO_ROOT" log -1 --oneline 2>/dev/null || echo "none")"

run_git_for_paths() {
  local mode="$1"
  shift

  if [ "$mode" = "normal" ]; then
    if [ "${#ADD_PATHS[@]}" -gt 0 ]; then
      git -C "$REPO_ROOT" "$@" -- "${ADD_PATHS[@]}"
    elif [ "${#FORCE_ADD_PATHS[@]}" -gt 0 ]; then
      return 0
    else
      git -C "$REPO_ROOT" "$@" --
    fi
    return
  fi

  if [ "${#FORCE_ADD_PATHS[@]}" -gt 0 ]; then
    git -C "$REPO_ROOT" "$@" -- "${FORCE_ADD_PATHS[@]}"
  fi
}

normal_status() {
  if [ "${#ADD_PATHS[@]}" -gt 0 ]; then
    git -C "$REPO_ROOT" status --porcelain -- "${ADD_PATHS[@]}"
  elif [ "${#FORCE_ADD_PATHS[@]}" -gt 0 ]; then
    return 0
  else
    git -C "$REPO_ROOT" status --porcelain
  fi
}

force_status() {
  [ "${#FORCE_ADD_PATHS[@]}" -gt 0 ] || return 0
  git -C "$REPO_ROOT" status --porcelain --ignored=matching -- "${FORCE_ADD_PATHS[@]}"
}

target_has_changes() {
  [ -n "$(normal_status)" ] && return 0
  [ -n "$(force_status)" ] && return 0
  return 1
}

target_scope_label() {
  local item

  if [ "${#ADD_PATHS[@]}" -eq 0 ] && [ "${#FORCE_ADD_PATHS[@]}" -eq 0 ]; then
    printf 'all non-ignored worktree changes'
    return
  fi

  if [ "${#ADD_PATHS[@]}" -gt 0 ]; then
    printf 'normal:'
    for item in "${ADD_PATHS[@]}"; do
      printf ' `%s`' "$item"
    done
  fi

  if [ "${#FORCE_ADD_PATHS[@]}" -gt 0 ]; then
    [ "${#ADD_PATHS[@]}" -gt 0 ] && printf '; '
    printf 'force:'
    for item in "${FORCE_ADD_PATHS[@]}"; do
      printf ' `%s`' "$item"
    done
  fi
}

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
      git -C "$REPO_ROOT" ls-files --cached -- "docs/commit-batches/${CURRENT_VERSION}-${MANILA_STAMP}-[0-9][0-9].md" 2>/dev/null
    } | sort -u
  )

  printf '%02d' "$((max_batch + 1))"
}

BATCH_NUMBER="$(next_batch_number)"
while [ -e "$NOTE_DIR/${CURRENT_VERSION}-${MANILA_STAMP}-${BATCH_NUMBER}.md" ]; do
  BATCH_NUMBER="$(printf '%02d' "$((10#$BATCH_NUMBER + 1))")"
done
NOTE_PATH="$NOTE_DIR/${CURRENT_VERSION}-${MANILA_STAMP}-${BATCH_NUMBER}.md"
NOTE_REL="${NOTE_PATH#$REPO_ROOT/}"

if [ -z "$COMMIT_MESSAGE" ]; then
  COMMIT_MESSAGE="chore: capture commit batch ${CURRENT_VERSION}-${MANILA_STAMP}-${BATCH_NUMBER}"
fi

tracked_diff_stat() {
  local stat
  stat="$(
    {
      run_git_for_paths normal diff --stat HEAD 2>/dev/null || true
      run_git_for_paths force diff --stat HEAD 2>/dev/null || true
    } | sed '/^$/d' | tail -1
  )"
  if [ -n "$stat" ]; then
    printf '%s\n' "$stat"
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

target_untracked_count() {
  {
    if [ "${#ADD_PATHS[@]}" -gt 0 ]; then
      git -C "$REPO_ROOT" ls-files --others --exclude-standard -- "${ADD_PATHS[@]}"
    elif [ "${#FORCE_ADD_PATHS[@]}" -eq 0 ]; then
      git -C "$REPO_ROOT" ls-files --others --exclude-standard
    fi

    if [ "${#FORCE_ADD_PATHS[@]}" -gt 0 ]; then
      git -C "$REPO_ROOT" ls-files --others -i --exclude-standard -- "${FORCE_ADD_PATHS[@]}"
    fi
  } | sed '/^$/d' | sort -u | wc -l | tr -d ' '
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
  done < <(
    {
      run_git_for_paths normal diff --name-status HEAD
      run_git_for_paths force diff --name-status HEAD
    } | sed '/^$/d' | sort -u
  )

  while IFS= read -r file; do
    [ -n "$file" ] || continue
    diff_seen=true
    printf '| Untracked | `%s` | %s |\n' "$file" "$(untracked_summary "$file")"
  done < <(
    {
      if [ "${#ADD_PATHS[@]}" -gt 0 ]; then
        git -C "$REPO_ROOT" ls-files --others --exclude-standard -- "${ADD_PATHS[@]}"
      elif [ "${#FORCE_ADD_PATHS[@]}" -eq 0 ]; then
        git -C "$REPO_ROOT" ls-files --others --exclude-standard
      fi

      if [ "${#FORCE_ADD_PATHS[@]}" -gt 0 ]; then
        git -C "$REPO_ROOT" ls-files --others -i --exclude-standard -- "${FORCE_ADD_PATHS[@]}"
      fi
    } | sed '/^$/d' | sort -u
  )

  if [ "$diff_seen" = false ]; then
    printf '| Clean | `(selected scope)` | no tracked or untracked changes detected |\n'
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
  local target="$1"

  {
    printf '# %s-%s-%s\n\n' "$CURRENT_VERSION" "$MANILA_STAMP" "$BATCH_NUMBER"
    printf '## Metadata\n\n'
    printf -- '- Version: `%s`\n' "$CURRENT_VERSION"
    printf -- '- Date: `%s`\n' "$MANILA_DATE"
    printf -- '- Filename date: `%s`\n' "$MANILA_STAMP"
    printf -- '- Batch: `%s`\n' "$BATCH_NUMBER"
    printf -- '- Status: categorized working tree batch\n'
    printf -- '- Base commit: `%s`\n' "$BASE_COMMIT"
    printf -- '- Commit subject: `%s`\n' "$COMMIT_MESSAGE"
    printf -- '- Selected paths: %s\n' "$(target_scope_label)"
    printf -- '- Staged files before this batch: %s\n' "$(staged_files_csv)"
    printf -- '- Selected tracked diff stat: %s\n' "$(tracked_diff_stat)"
    printf -- '- Selected untracked additions: %s files\n\n' "$(target_untracked_count)"
    printf '## Summary\n\n'
    append_bullets "Captured the selected working tree batch for documentation handoff." "${SUMMARY_ITEMS[@]}"
    printf '\n## File Inventory\n\n'
    append_inventory
    printf '\n## Docs Handoff Notes\n\n'
    append_bullets "Review this note before running update-docs.sh, then keep it as historical batch-note context." "${HANDOFF_ITEMS[@]}"
  } > "$target"
}

normalize_note_for_duplicate_check() {
  sed -e '1d' -e '/^- Batch: `/d' "$1"
}

latest_same_day_note() {
  find "$NOTE_DIR" -maxdepth 1 -type f -name "${CURRENT_VERSION}-${MANILA_STAMP}-[0-9][0-9].md" 2>/dev/null |
    sort |
    tail -1
}

write_commit_message() {
  local target="$1"

  {
    printf '%s\n\n' "$COMMIT_MESSAGE"
    printf 'Summary:\n'
    append_bullets "Captured the selected working tree batch." "${SUMMARY_ITEMS[@]}"
    printf '\nDocs handoff:\n'
    append_bullets "Review the generated batch note before the next documentation refresh." "${HANDOFF_ITEMS[@]}"
    printf '\nBatch note: %s\n' "$NOTE_REL"
  } > "$target"
}

if [ "$STAGE_WORKTREE" = true ] && ! target_has_changes; then
  log_stage "No selected changes detected"
  if [ "$DRY_RUN" = true ]; then
    echo "Dry run enabled; no scoped worktree changes would be staged."
  else
    echo "No scoped worktree changes found; skipping note and commit."
  fi
  exit 0
fi

PREEXISTING_STAGED_FILES="$(git -C "$REPO_ROOT" diff --cached --name-only -- 2>/dev/null || true)"
if [ "$ALLOW_PRESTAGED" = false ] && [ -n "$PREEXISTING_STAGED_FILES" ] && { [ "$STAGE_WORKTREE" = true ] || [ "$DO_COMMIT" = true ]; }; then
  cat >&2 <<ERROR
ERROR: The index already has staged changes. Refusing to mix them into a scoped batch.

Staged files:
$PREEXISTING_STAGED_FILES

Commit or unstage them first, or rerun with --allow-prestaged if this is intentional.
ERROR
  exit 1
fi

log_stage "Stage 1: Read commit-batch instructions"
echo "Instructions: $INSTRUCTIONS_FILE"
case "$INSTRUCTIONS_CREATED" in
  true)
    echo "Template:     auto-created missing instructions file"
    ;;
  dry-run)
    echo "Template:     dry run; would auto-create missing instructions file"
    ;;
esac
echo "Version:      $CURRENT_VERSION"
echo "Date:         $MANILA_DATE ($MANILA_STAMP)"
echo "Batch:        $BATCH_NUMBER"
echo "Scope:        $(target_scope_label)"
echo "Commit:       $([ "$DO_COMMIT" = true ] && printf '%s' "$COMMIT_MESSAGE" || printf 'disabled')"

log_stage "Stage 2: Inspect selected Git worktree"
if [ "${#ADD_PATHS[@]}" -gt 0 ]; then
  git -C "$REPO_ROOT" status --short -- "${ADD_PATHS[@]}" || true
elif [ "${#FORCE_ADD_PATHS[@]}" -eq 0 ]; then
  git -C "$REPO_ROOT" status --short || true
fi
if [ "${#FORCE_ADD_PATHS[@]}" -gt 0 ]; then
  git -C "$REPO_ROOT" status --short --ignored=matching -- "${FORCE_ADD_PATHS[@]}" || true
fi

log_stage "Stage 3: Prepare batch note"
echo "Target: $NOTE_PATH"
if [ "$DRY_RUN" = true ]; then
  echo "Dry run enabled; note was not written."
elif [ "$WRITE_NOTE" = true ]; then
  [ ! -e "$NOTE_PATH" ] || die "Refusing to overwrite existing note: $NOTE_PATH"

  NOTE_TMP="$(mktemp "${TMPDIR:-/tmp}/commit-batch-note.XXXXXX")"
  trap 'rm -f "$NOTE_TMP" "${COMMIT_TMP:-}"' EXIT
  write_note "$NOTE_TMP"

  LATEST_NOTE="$(latest_same_day_note)"
  if [ -n "$LATEST_NOTE" ] && cmp -s <(normalize_note_for_duplicate_check "$NOTE_TMP") <(normalize_note_for_duplicate_check "$LATEST_NOTE"); then
    die "Generated note duplicates latest same-day batch after allowed metadata normalization: $LATEST_NOTE"
  fi

  mv "$NOTE_TMP" "$NOTE_PATH"
  echo "Wrote: $NOTE_PATH"
else
  echo "Batch-note writing disabled."
fi

if [ "$STAGE_WORKTREE" = true ]; then
  log_stage "Stage 4: Stage scoped worktree changes"
  if [ "$DRY_RUN" = true ]; then
    if [ "${#ADD_PATHS[@]}" -gt 0 ]; then
      printf 'Dry run enabled; would run: git add -A --'
      printf ' %q' "${ADD_PATHS[@]}"
      printf '\n'
    elif [ "${#FORCE_ADD_PATHS[@]}" -eq 0 ]; then
      echo "Dry run enabled; would run: git add -A"
    fi
    if [ "${#FORCE_ADD_PATHS[@]}" -gt 0 ]; then
      printf 'Dry run enabled; would run: git add -A -f --'
      printf ' %q' "${FORCE_ADD_PATHS[@]}"
      printf '\n'
    fi
  else
    if [ "${#ADD_PATHS[@]}" -gt 0 ]; then
      git -C "$REPO_ROOT" add -A -- "${ADD_PATHS[@]}"
    elif [ "${#FORCE_ADD_PATHS[@]}" -eq 0 ]; then
      git -C "$REPO_ROOT" add -A
    fi
    if [ "${#FORCE_ADD_PATHS[@]}" -gt 0 ]; then
      git -C "$REPO_ROOT" add -A -f -- "${FORCE_ADD_PATHS[@]}"
    fi
    echo "Staged scoped worktree changes."
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
  log_stage "Stage 6: Commit staged batch"
  if [ "$DRY_RUN" = true ]; then
    echo "Dry run enabled; would commit with subject: $COMMIT_MESSAGE"
  elif git -C "$REPO_ROOT" diff --cached --quiet -- && [ "$ALLOW_EMPTY" = false ]; then
    echo "No staged changes detected; skipping commit."
  else
    COMMIT_TMP="$(mktemp "${TMPDIR:-/tmp}/commit-batch-message.XXXXXX")"
    write_commit_message "$COMMIT_TMP"

    COMMIT_ARGS=()
    [ "$ALLOW_EMPTY" = true ] && COMMIT_ARGS+=(--allow-empty)
    [ "$NO_VERIFY" = true ] && COMMIT_ARGS+=(--no-verify)
    COMMIT_ARGS+=(-F "$COMMIT_TMP")

    git -C "$REPO_ROOT" commit "${COMMIT_ARGS[@]}"
    echo "Committed: $(git -C "$REPO_ROOT" rev-parse --short HEAD)"
  fi
fi

log_stage "Final status"
git -C "$REPO_ROOT" status --short
