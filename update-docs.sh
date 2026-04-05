#!/usr/bin/env bash
# =============================================================================
# update-docs.sh — AIP-PIR Portal Documentation & Release Update Script
# =============================================================================
#
# PURPOSE
# -------
# This script collects full project context (version, git history, changed
# files, existing documentation) and outputs a detailed, structured prompt
# that any LLM (Claude, Gemini, GPT, etc.) can follow to update ALL project
# documentation in one pass.
#
# HOW TO USE
# ----------
#   Option A — Pipe directly into Claude CLI:
#     ./update-docs.sh | claude -p
#
#   Option B — Save prompt to file, then paste into any LLM:
#     ./update-docs.sh > docs-update-prompt.txt
#
#   Option C — Run interactively with Claude Code:
#     Open this file, read it, then follow the TASK PROTOCOL below.
#
# WHAT IT UPDATES (in execution order)
# -------------------------------------
#   1. react-app/src/version.js         — CURRENT_VERSION + CHANGELOG entry
#   2. docs/DATABASE_SCHEMA.md          — ERD + schema field descriptions
#   3. docs/SYSTEM_DOCUMENTATION_THESIS.md — Architecture, ERD, role descriptions
#   4. docs/TECH_DESIGN_PLAN.md         — Implementation status checkboxes
#   5. docs/TODO.md                     — Mark completed items, add new ones
#   6. docs/USER_MANUAL.md              — Create or update end-user guidance
#   7. docs/FAQ.md                      — Create or update common questions
#   8. docs/API_DOCS.md                 — REST API endpoint reference
#   9. docs/ROADMAP.md                  — Milestone plan to v1.3.0 Alpha Release
#  10. docs/ISSUE_LOG.md                — Bug/incident repository (append-only)
#  11. docs/CHANGELOG.md                — Running release log (ALWAYS LAST)
#  12. docs/archived/CODEBASE_CLEANUP_AUDIT.md   — READ-ONLY (archived audit)
#  13. docs/archived/SECURITY_REMEDIATION_PLAN.md — READ-ONLY (archived, all resolved)
#  14. docs/archived/HARDCODED_DATA_AUDIT.md     — READ-ONLY (archived, all resolved)
#  15. docs/design-system.md            — Visual design language reference
#  16. docs/PIR-ROUTING-CHAIN.md        — PIR approval workflow reference
#  17. docs/TERM_STRUCTURE_SYSTEM.md    — Term structure feature documentation
#
# RULES (READ BEFORE RUNNING)
# ---------------------------
#   - NEVER skip updating version.js and CHANGELOG.md — these are mandatory.
#   - NEVER bump MAJOR version (e.g., 1.x → 2.x) unless explicitly told to.
#   - NEVER overwrite security audit content in SECURITY_AUDIT.md.
#   - NEVER remove existing changelog entries — only prepend new ones.
#   - NEVER rewrite or restructure ROADMAP.md — only change checkbox states
#     and append new items.
#   - DO create USER_MANUAL.md and FAQ.md if they do not exist.
#   - DO preserve all existing academic references in
#     SYSTEM_DOCUMENTATION_THESIS.md.
#   - DO use [x] / [~] / [ ] for TODO.md checkboxes consistently.
#   - DO keep all changes scoped to what actually changed — no speculative edits.
#
# =============================================================================

set -euo pipefail

# ── Paths ────────────────────────────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_FILE="$REPO_ROOT/react-app/src/version.js"
DOCS_DIR="$REPO_ROOT/docs"
CHANGELOG_FILE="$DOCS_DIR/CHANGELOG.md"
TODO_FILE="$DOCS_DIR/TODO.md"
USER_MANUAL_FILE="$DOCS_DIR/USER_MANUAL.md"
FAQ_FILE="$DOCS_DIR/FAQ.md"
DB_SCHEMA_FILE="$DOCS_DIR/DATABASE_SCHEMA.md"
SYSTEM_DOC_FILE="$DOCS_DIR/SYSTEM_DOCUMENTATION_THESIS.md"
TECH_PLAN_FILE="$DOCS_DIR/TECH_DESIGN_PLAN.md"
API_DOCS_FILE="$DOCS_DIR/API_DOCS.md"
ISSUE_LOG_FILE="$DOCS_DIR/ISSUE_LOG.md"
ROADMAP_FILE="$DOCS_DIR/ROADMAP.md"
UNAPPENDED_FILE="$DOCS_DIR/unappended-changes.md"
CLEANUP_AUDIT_FILE="$DOCS_DIR/archived/CODEBASE_CLEANUP_AUDIT.md"
SECURITY_REMEDIATION_FILE="$DOCS_DIR/archived/SECURITY_REMEDIATION_PLAN.md"
HARDCODED_AUDIT_FILE="$DOCS_DIR/archived/HARDCODED_DATA_AUDIT.md"
DESIGN_SYSTEM_FILE="$DOCS_DIR/design-system.md"
PIR_ROUTING_FILE="$DOCS_DIR/PIR-ROUTING-CHAIN.md"
TERM_STRUCTURE_FILE="$DOCS_DIR/TERM_STRUCTURE_SYSTEM.md"
AUDIT_REPORT_FILE="$DOCS_DIR/AUDIT_REPORT.md"
PRIVACY_COMPLIANCE_FILE="$DOCS_DIR/DATA_PRIVACY_COMPLIANCE.md"

# ── Prerequisite check ───────────────────────────────────────────────────────
for _req in "$VERSION_FILE" "$TECH_PLAN_FILE" "$TODO_FILE"; do
  if [ ! -f "$_req" ]; then
    echo "ERROR: Required file missing: $_req" >&2
    exit 1
  fi
done
unset _req

# ── Helper: extract section headers + checkbox lines (for checkbox-tick tasks) ─
extract_checklist() {
  grep -E '^(#{1,4} |\s{0,4}[-*] \[[ x~]\])' "$1" 2>/dev/null || cat "$1"
}

# ── Extract current version from version.js ─────────────────────────────────
CURRENT_VERSION=$(grep "^export const CURRENT_VERSION" "$VERSION_FILE" \
  | sed "s/.*[\"']\([^\"']*\)[\"'].*/\1/")
if [ -z "$CURRENT_VERSION" ]; then
  echo "ERROR: Could not parse CURRENT_VERSION from $VERSION_FILE" >&2
  exit 1
fi

# ── Compute next patch version ───────────────────────────────────────────────
# Handles semver patterns: 1.0.0-alpha, 1.0.1-alpha, 1.2.3, etc.
VERSION_CORE=$(echo "$CURRENT_VERSION" | sed 's/-.*//')
VERSION_SUFFIX=$(echo "$CURRENT_VERSION" | grep -oP '\-.*' || echo "")
MAJOR=$(echo "$VERSION_CORE" | cut -d. -f1)
MINOR=$(echo "$VERSION_CORE" | cut -d. -f2)
PATCH=$(echo "$VERSION_CORE" | cut -d. -f3)
NEXT_PATCH=$(( PATCH + 1 ))
NEXT_VERSION="${MAJOR}.${MINOR}.${NEXT_PATCH}${VERSION_SUFFIX}"

# ── Git context ──────────────────────────────────────────────────────────────
TODAY=$(date +%Y-%m-%d)

# Last commit that actually touched version.js = the version bump commit
LAST_VERSION_COMMIT=$(git -C "$REPO_ROOT" log -1 --format="%H" \
  -- "$VERSION_FILE" 2>/dev/null || echo "")

if [ -n "$LAST_VERSION_COMMIT" ]; then
  GIT_LOG=$(git -C "$REPO_ROOT" log --oneline "${LAST_VERSION_COMMIT}..HEAD" 2>/dev/null || true)
  # If empty (run immediately after bumping version), fall back to last 20
  if [ -z "$GIT_LOG" ]; then
    GIT_LOG=$(git -C "$REPO_ROOT" log --oneline -20)
  fi
else
  GIT_LOG=$(git -C "$REPO_ROOT" log --oneline -20)
fi

# Files changed since last commit
GIT_CHANGED=$(git -C "$REPO_ROOT" diff --name-only HEAD 2>/dev/null || echo "(none — working tree clean)")
GIT_STAGED=$(git -C "$REPO_ROOT" diff --cached --name-only 2>/dev/null || echo "(none)")
GIT_UNTRACKED=$(git -C "$REPO_ROOT" ls-files --others --exclude-standard 2>/dev/null || echo "(none)")

# Full diff summary (file names + insertion/deletion counts)
GIT_DIFF_STAT=$(git -C "$REPO_ROOT" diff --stat HEAD 2>/dev/null \
  || echo "(no diff — clean working tree)")

# ── Detect existing docs ─────────────────────────────────────────────────────
has_file() { [ -f "$1" ] && echo "EXISTS" || echo "MISSING — CREATE IT"; }

STATUS_USER_MANUAL=$(has_file "$USER_MANUAL_FILE")
STATUS_FAQ=$(has_file "$FAQ_FILE")
STATUS_CHANGELOG=$(has_file "$CHANGELOG_FILE")
STATUS_API_DOCS=$(has_file "$API_DOCS_FILE")
STATUS_ISSUE_LOG=$(has_file "$ISSUE_LOG_FILE")
STATUS_ROADMAP=$(has_file "$ROADMAP_FILE")
STATUS_CLEANUP_AUDIT=$(has_file "$CLEANUP_AUDIT_FILE")
STATUS_SECURITY_REMEDIATION=$(has_file "$SECURITY_REMEDIATION_FILE")
STATUS_HARDCODED_AUDIT=$(has_file "$HARDCODED_AUDIT_FILE")
STATUS_DESIGN_SYSTEM=$(has_file "$DESIGN_SYSTEM_FILE")
STATUS_PIR_ROUTING=$(has_file "$PIR_ROUTING_FILE")
STATUS_TERM_STRUCTURE=$(has_file "$TERM_STRUCTURE_FILE")
STATUS_AUDIT_REPORT=$(has_file "$AUDIT_REPORT_FILE")
STATUS_PRIVACY_COMPLIANCE=$(has_file "$PRIVACY_COMPLIANCE_FILE")

# ── Context reads (ordered to match task execution sequence) ─────────────────

# Unappended Changes — detailed descriptions of changes not yet in docs
if [ -f "$UNAPPENDED_FILE" ]; then
  UNAPPENDED_CONTENT=$(cat "$UNAPPENDED_FILE")
else
  UNAPPENDED_CONTENT="(no unappended changes file found)"
fi

# Task 1 — version.js (last 80 lines for CHANGELOG array context)
VERSION_JS_TAIL=$(tail -80 "$VERSION_FILE")

# Tasks 2 & 3 — Prisma schema (source of truth for ERD tasks)
PRISMA_SCHEMA=$(cat "$REPO_ROOT/server/prisma/schema.prisma")

# Task 4 — TECH_DESIGN_PLAN.md (headers + checkbox lines)
TECH_PLAN_CONTENT=$(extract_checklist "$TECH_PLAN_FILE")

# Task 5 — TODO.md (headers + checkbox lines)
TODO_CONTENT=$(extract_checklist "$TODO_FILE")

# Task 9 — ROADMAP.md (headers + checkbox lines)
if [ -f "$ROADMAP_FILE" ]; then
  ROADMAP_CONTENT=$(extract_checklist "$ROADMAP_FILE")
else
  ROADMAP_CONTENT="(file does not exist — you must CREATE it)"
fi

# Task 11 — CHANGELOG.md tail (context for writing the new entry last)
if [ -f "$CHANGELOG_FILE" ]; then
  CHANGELOG_TAIL=$(tail -40 "$CHANGELOG_FILE")
else
  CHANGELOG_TAIL="(file does not exist — you must CREATE it)"
fi

# Cleanup audit — tail for LLM context
if [ -f "$CLEANUP_AUDIT_FILE" ]; then
  CLEANUP_AUDIT_CONTENT=$(tail -80 "$CLEANUP_AUDIT_FILE")
else
  CLEANUP_AUDIT_CONTENT="(file does not exist — CREATE IT from the active cleanup plan)"
fi

# Security remediation plan — tail for LLM context
if [ -f "$SECURITY_REMEDIATION_FILE" ]; then
  SECURITY_REMEDIATION_CONTENT=$(tail -60 "$SECURITY_REMEDIATION_FILE")
else
  SECURITY_REMEDIATION_CONTENT="(file does not exist)"
fi

if [ -f "$AUDIT_REPORT_FILE" ]; then
  AUDIT_REPORT_CONTENT=$(cat "$AUDIT_REPORT_FILE")
else
  AUDIT_REPORT_CONTENT="(file does not exist)"
fi

if [ -f "$PRIVACY_COMPLIANCE_FILE" ]; then
  PRIVACY_COMPLIANCE_CONTENT=$(tail -60 "$PRIVACY_COMPLIANCE_FILE")
else
  PRIVACY_COMPLIANCE_CONTENT="(file does not exist — CREATE IT if privacy remediation work was done)"
fi
# Task 10 — ISSUE_LOG.md tail + compute next issue number
if [ -f "$ISSUE_LOG_FILE" ]; then
  ISSUE_LOG_TAIL=$(tail -80 "$ISSUE_LOG_FILE")
  LAST_ISSUE_NUM=$(grep -oE 'ISSUE-[0-9]+' "$ISSUE_LOG_FILE" \
    | grep -oE '[0-9]+' | sort -n | tail -1 || echo "0")
else
  ISSUE_LOG_TAIL="(file does not exist — CREATE IT)"
  LAST_ISSUE_NUM="0"
fi
NEXT_ISSUE_NUM=$(printf '%03d' $(( 10#${LAST_ISSUE_NUM} + 1 )))

# Server architecture context — lib/ modules
SERVER_LIB_AUTH=""
if [ -f "$REPO_ROOT/server/lib/auth.ts" ]; then
  SERVER_LIB_AUTH=$(cat "$REPO_ROOT/server/lib/auth.ts")
fi

SERVER_LIB_CONFIG=""
if [ -f "$REPO_ROOT/server/lib/config.ts" ]; then
  SERVER_LIB_CONFIG=$(cat "$REPO_ROOT/server/lib/config.ts")
fi

SERVER_LIB_ROUTING=""
if [ -f "$REPO_ROOT/server/lib/routing.ts" ]; then
  SERVER_LIB_ROUTING=$(cat "$REPO_ROOT/server/lib/routing.ts")
fi

# server.ts (entry point — small file, include full content)
SERVER_ENTRY=""
if [ -f "$REPO_ROOT/server/server.ts" ]; then
  SERVER_ENTRY=$(cat "$REPO_ROOT/server/server.ts")
fi

# Plans directory listing
PLANS_LIST=""
if [ -d "$DOCS_DIR/plans" ]; then
  PLANS_LIST=$(ls -1 "$DOCS_DIR/plans/" 2>/dev/null || echo "(empty)")
fi

# =============================================================================
# OUTPUT: LLM-READY PROMPT
# =============================================================================
cat <<PROMPT
================================================================================
 AIP-PIR PORTAL — DOCUMENTATION UPDATE TASK
 Generated: $TODAY  |  Current Version: $CURRENT_VERSION  |  Next Version: $NEXT_VERSION
================================================================================

You are a documentation engineer for the AIP-PIR Portal — a DepEd (Department
of Education) web system used by schools in the Division of Guihulngan City to
manage Annual Implementation Plans (AIPs) and Program Implementation Reviews
(PIRs). Your job is to update ALL documentation files listed below to reflect
the latest changes in the codebase.

IMPORTANT NAMING RULE: The system is called "AIP-PIR". Any occurrence of
"AIP-PIR" or "AIP-PIR" in documentation should be corrected to "AIP-PIR".

Read this entire prompt carefully before making any edits. Follow every
instruction exactly. Do not skip any section.

────────────────────────────────────────────────────────────────────────────────
SECTION 0 — UNAPPENDED CHANGES (read this FIRST)
────────────────────────────────────────────────────────────────────────────────

This file contains structured, detailed descriptions of changes that have been
made to the codebase but NOT yet reflected in the documentation. Use this as
your PRIMARY source of truth for what changed (more detailed than git log).
After all documentation tasks are complete, DELETE this file — its content will
have been incorporated into the official docs.

$UNAPPENDED_CONTENT

────────────────────────────────────────────────────────────────────────────────
SECTION 1 — PROJECT CONTEXT
────────────────────────────────────────────────────────────────────────────────

REPOSITORY ROOT:  $REPO_ROOT
CURRENT VERSION:  $CURRENT_VERSION
NEXT VERSION:     $NEXT_VERSION  (patch bump — use this unless told otherwise)
TODAY'S DATE:     $TODAY

TECHNOLOGY STACK:
  Frontend  : React 19 + Vite + Tailwind CSS v4 + Framer Motion
  Backend   : Deno runtime + Hono web framework
  Database  : PostgreSQL + Prisma ORM (driverAdapters preview)
  Auth      : JWT (jsonwebtoken) issued as HttpOnly; Secure; SameSite=Strict cookie
              (migrated from sessionStorage — XSS-proof, RA 10173 compliant)
              Cookie set/cleared via hono/cookie setCookie/deleteCookie
              Logout endpoint: POST /api/auth/logout
              Shared auth helper: server/lib/auth.ts (reads cookie OR Bearer header)
              JWT secret fail-fast validation: server/lib/config.ts
              JWT payload: id, role, school_id, cluster_id ONLY (no PII)
  CORS      : Restricted to ALLOWED_ORIGIN env var (not wildcard)
  Language  : TypeScript (backend) / JavaScript (frontend)

SERVER ARCHITECTURE:
  Entry point   : server/server.ts (mounts auth, data, admin route modules)
  Route files   : server/routes/auth.ts, data.ts, admin.ts
  Shared libs   : server/lib/auth.ts (TokenPayload + getUserFromToken)
                  server/lib/config.ts (JWT_SECRET with startup validation)
                  server/lib/routing.ts (CES role routing helper)
  Database      : server/db/client.ts (Prisma client)
  Prisma schema : server/prisma/schema.prisma

USER ROLES (7 roles):
  1. School User        — linked 1-to-1 to a School (school_id on User record).
                          Can create AIPs and PIRs for their own school only.
                          Sees programs by default (minus restricted ones for their school).
  2. Division Personnel — NOT linked to any school (school_id is null).
                          Creates their own AIPs/PIRs for assigned programs only.
                          Access scope defined by _UserPrograms M-to-M junction table.
                          Has split name fields (first_name, middle_initial, last_name).
  3. CES-SGOD           — CES reviewer for SGOD division programs.
                          Singleton role (only 1 account per CES role).
                          Reviews PIRs in "For CES Review" status.
  4. CES-ASDS           — CES reviewer for ASDS programs. Same constraints.
  5. CES-CID            — CES reviewer for CID programs. Same constraints.
  6. Cluster Coordinator — Second-tier PIR reviewer. Linked to a cluster via
                          User.cluster_id. Capped at 10 accounts system-wide.
                          Reviews PIRs forwarded by CES reviewers.
  7. Admin              — Full system access. Manages users, schools, programs,
                          deadlines, announcements, and system settings.

PIR ROUTING CHAIN (3-tier approval):
  Submission → "For CES Review" (auto-assigned to CES-SGOD/ASDS/CID based on
  Program.division field) → CES notes or returns → "For Cluster Head Review"
  (Cluster Coordinator for the school's cluster) → notes or returns → Admin
  final approval. Status values: "Draft" | "For CES Review" | "For Cluster
  Head Review" | "Approved" | "Returned".

KEY BUSINESS RULES:
  - A PIR can ONLY be created if an AIP already exists for the same
    school/program/year.
  - PIR activities are auto-populated from the linked AIP, filtered by quarter
    relevance (only activities whose period_start_month/period_end_month overlap
    the selected quarter).
  - AIP activities have structured month range fields (period_start_month,
    period_end_month) that determine which quarters they are active in.
  - Each AIP and PIR has a created_by_user_id FK for ownership-based access control.
  - One AIP per school+program+year. One PIR per AIP+quarter.
  - CES roles are singleton — only one account per CES sub-role is allowed.
  - Cluster Coordinators are capped at 10 accounts.
  - DivisionProgram model stores 79+ standard DepEd programs with division
    assignment (CID / OSDS / SGOD).
  - DivisionConfig model stores supervisor name/title for PIR document headers.
  - Self-registration is disabled — all accounts created via admin panel.

────────────────────────────────────────────────────────────────────────────────
SECTION 2 — RECENT GIT HISTORY (commits to incorporate into docs)
────────────────────────────────────────────────────────────────────────────────

$GIT_LOG

STAGED FILES (added but not yet committed):
$GIT_STAGED

UNSTAGED CHANGES:
$GIT_CHANGED

UNTRACKED FILES:
$GIT_UNTRACKED

DIFF SUMMARY:
$GIT_DIFF_STAT

────────────────────────────────────────────────────────────────────────────────
SECTION 3 — DOCUMENTATION INVENTORY & STATUS
────────────────────────────────────────────────────────────────────────────────

File                                        Status
────────────────────────────────────────────────────────────────────────────────
 1. react-app/src/version.js                     EXISTS — bump version + add changelog entry
 2. docs/DATABASE_SCHEMA.md                      EXISTS — update if schema changed
 3. docs/SYSTEM_DOCUMENTATION_THESIS.md          EXISTS — update ERD, roles, workflows
 4. docs/TECH_DESIGN_PLAN.md                     EXISTS — tick off completed items
 5. docs/TODO.md                                 EXISTS — mark completed tasks, add new ones
 6. docs/USER_MANUAL.md                          $STATUS_USER_MANUAL
 7. docs/FAQ.md                                  $STATUS_FAQ
 8. docs/API_DOCS.md                             $STATUS_API_DOCS
 9. docs/ROADMAP.md                              $STATUS_ROADMAP
10. docs/ISSUE_LOG.md                            $STATUS_ISSUE_LOG
11. docs/CHANGELOG.md                            $STATUS_CHANGELOG  ← written LAST
12. docs/archived/CODEBASE_CLEANUP_AUDIT.md      $STATUS_CLEANUP_AUDIT  (archived — read-only)
13. docs/archived/SECURITY_REMEDIATION_PLAN.md   $STATUS_SECURITY_REMEDIATION  (archived — read-only)
14. docs/archived/HARDCODED_DATA_AUDIT.md        $STATUS_HARDCODED_AUDIT  (archived — read-only)
15. docs/design-system.md                        $STATUS_DESIGN_SYSTEM
16. docs/PIR-ROUTING-CHAIN.md                    $STATUS_PIR_ROUTING
17. docs/TERM_STRUCTURE_SYSTEM.md                $STATUS_TERM_STRUCTURE
18. docs/AUDIT_REPORT.md                         $STATUS_AUDIT_REPORT
19. docs/DATA_PRIVACY_COMPLIANCE.md              $STATUS_PRIVACY_COMPLIANCE

    docs/SECURITY_AUDIT.md                       DO NOT MODIFY (audit is append-only)

PLANS DIRECTORY (docs/plans/):
$PLANS_LIST

────────────────────────────────────────────────────────────────────────────────
SECTION 4 — CURRENT version.js STATE (last 80 lines) [reference for Task 1]
────────────────────────────────────────────────────────────────────────────────

$VERSION_JS_TAIL

────────────────────────────────────────────────────────────────────────────────
SECTION 5 — PRISMA SCHEMA (source of truth for Tasks 2 & 3)
────────────────────────────────────────────────────────────────────────────────

$PRISMA_SCHEMA

────────────────────────────────────────────────────────────────────────────────
SECTION 6 — CURRENT TECH_DESIGN_PLAN.md [headers + checkboxes only]
────────────────────────────────────────────────────────────────────────────────

$TECH_PLAN_CONTENT

────────────────────────────────────────────────────────────────────────────────
SECTION 7 — CURRENT TODO.md [headers + checkboxes only]
────────────────────────────────────────────────────────────────────────────────

$TODO_CONTENT

────────────────────────────────────────────────────────────────────────────────
SECTION 8 — CURRENT ROADMAP.md [headers + checkboxes only]
────────────────────────────────────────────────────────────────────────────────

$ROADMAP_CONTENT

────────────────────────────────────────────────────────────────────────────────
SECTION 9 — CURRENT CHANGELOG.md TAIL (last 40 lines) [reference for Task 11]
────────────────────────────────────────────────────────────────────────────────

$CHANGELOG_TAIL

────────────────────────────────────────────────────────────────────────────────
SECTION 10 — CURRENT ISSUE_LOG.md TAIL (last 80 lines) [reference for Task 10]
────────────────────────────────────────────────────────────────────────────────

Last assigned issue number : ISSUE-$LAST_ISSUE_NUM
Next issue number to assign: ISSUE-$NEXT_ISSUE_NUM

$ISSUE_LOG_TAIL

────────────────────────────────────────────────────────────────────────────────
SECTION 11 — SERVER ARCHITECTURE CONTEXT
────────────────────────────────────────────────────────────────────────────────

=== server/server.ts (entry point) ===

$SERVER_ENTRY

=== server/lib/auth.ts (shared auth helper) ===

$SERVER_LIB_AUTH

=== server/lib/config.ts (environment config) ===

$SERVER_LIB_CONFIG

=== server/lib/routing.ts (CES routing helper) ===

$SERVER_LIB_ROUTING

────────────────────────────────────────────────────────────────────────────────
SECTION 12 — CODEBASE CLEANUP AUDIT STATE (last 80 lines)
────────────────────────────────────────────────────────────────────────────────

$CLEANUP_AUDIT_CONTENT

────────────────────────────────────────────────────────────────────────────────
SECTION 13 — SECURITY REMEDIATION PLAN STATE (last 60 lines)
────────────────────────────────────────────────────────────────────────────────

$SECURITY_REMEDIATION_CONTENT

────────────────────────────────────────────────────────────────────────────────
SECTION 13b — LATEST AUDIT REPORT
────────────────────────────────────────────────────────────────────────────────

$AUDIT_REPORT_CONTENT

────────────────────────────────────────────────────────────────────────────────
SECTION 13c — DATA PRIVACY COMPLIANCE REPORT (last 60 lines)
────────────────────────────────────────────────────────────────────────────────

$PRIVACY_COMPLIANCE_CONTENT

────────────────────────────────────────────────────────────────────────────────
SECTION 14 — TASK PROTOCOL (follow in order, one file at a time)
────────────────────────────────────────────────────────────────────────────────

Execute the following tasks in sequence. Mark each complete before moving on.

── TASK 1: version.js ── [MANDATORY — DO NOT SKIP] ────────────────────────────

File: react-app/src/version.js

Steps:
  a) Change CURRENT_VERSION from '$CURRENT_VERSION' to '$NEXT_VERSION'.
  b) Prepend a new object to the CHANGELOG array with:
       - version : '$NEXT_VERSION'
       - date    : '$TODAY'
       - title   : A short descriptive title (5–10 words) summarizing the sprint
       - description: 1–2 sentences summarizing what changed overall
       - changes : An array of { type, text } entries. Use ONLY these types:
                     'feature'     — new capability or API endpoint
                     'fix'         — bug fix
                     'improvement' — enhancement to existing functionality
                     'breaking'    — behavior-breaking change
                     'docs'        — documentation update
                     'security'    — security patch
  c) Derive the changes list from SECTION 2 (git log). Every meaningful commit
     should map to at least one change entry. Ignore merge commits and typo fixes.
  d) DO NOT modify any existing CHANGELOG entries.

── TASK 2: DATABASE_SCHEMA.md ──────────────────────────────────────────────────

File: docs/DATABASE_SCHEMA.md

Steps:
  a) Use the Prisma schema in SECTION 5 as the source of truth.
  b) Compare each model's fields against what is documented.
  c) Update the Mermaid ERD if any fields, relations, or entities are
     missing or wrong.
  d) Update the "Schema Details" section to match any new fields.
  e) Key fields that MUST be present:
       - AIP.created_by_user_id (Int FK → User)
       - PIR.created_by_user_id (Int FK → User)
       - PIR.ces_reviewer_id, PIR.ces_noted_at, PIR.ces_remarks (CES routing)
       - AIPActivity.implementation_period (String)
       - AIPActivity.period_start_month (Int? — 1=Jan … 12=Dec)
       - AIPActivity.period_end_month (Int? — 1=Jan … 12=Dec)
       - User entity with school_id, cluster_id, role, programs relation
       - User.first_name, User.middle_initial, User.last_name (split names)
       - DivisionProgram model (title, division, unique constraint)
       - DivisionConfig model (supervisor_name, supervisor_title)
       - Program.division (SGOD | OSDS | CID) for CES routing
  f) Tech stack must read: PostgreSQL / Prisma / Deno+Hono / React 19+Vite.

── TASK 3: SYSTEM_DOCUMENTATION_THESIS.md ──────────────────────────────────────

File: docs/SYSTEM_DOCUMENTATION_THESIS.md

Steps:
  a) Update the Mermaid ERD in Chapter 3 to match the Prisma schema in
     SECTION 5 (same rules as Task 2c).
  b) Update all role descriptions to include the 7-role system:
     School User, Division Personnel, CES-SGOD, CES-ASDS, CES-CID,
     Cluster Coordinator, Admin.
  c) Update PIR workflow sections to reflect the 3-tier routing chain:
     Submission → CES Review → Cluster Head Review → Admin Approval.
  d) If a new workflow was added (e.g., PIR auto-population from AIP),
     add or update the relevant subsection.
  e) DO NOT remove academic references. DO NOT change citation formatting.
  f) Only update sections that are factually stale — do not rewrite working
     sections.

── TASK 4: TECH_DESIGN_PLAN.md ─────────────────────────────────────────────────

File: docs/TECH_DESIGN_PLAN.md

Steps:
  a) Tick off [x] any items in the "Implementation Status" checklist that
     are now done.
  b) Add new items (unchecked [ ]) for planned work visible in the git log
     or TODO.md.
  c) Update the "Technology Stack" section if versions changed.
  d) Update auth description: JWT issued as HttpOnly; Secure; SameSite=Strict
     cookie (NOT sessionStorage). Cookie cleared via POST /api/auth/logout.
     CORS restricted to ALLOWED_ORIGIN. Shared auth helper server/lib/auth.ts
     reads from cookie or Authorization Bearer header. JWT payload contains
     only id, role, school_id, cluster_id (no PII).
  e) Add a "Last Updated" line at the bottom with $TODAY.

── TASK 5: TODO.md ─────────────────────────────────────────────────────────────

File: docs/TODO.md

Steps:
  a) Mark [x] any items that were completed based on the git log (SECTION 2).
  b) Mark [~] any items that are in-progress.
  c) Add new [ ] items if the git log reveals new tasks not yet listed.
  d) Keep section structure intact. Update "Last updated" timestamp to $TODAY.

── TASK 6: USER_MANUAL.md ──────────────────────────────────────────────────────

File: docs/USER_MANUAL.md  [$STATUS_USER_MANUAL]

If MISSING — CREATE IT with the following structure:
  # AIP-PIR Portal — User Manual
  ## 1. Getting Started
     - Login, roles overview, dashboard tour
  ## 2. School User Guide
     - 2.1 Creating an AIP (step-by-step)
     - 2.2 Creating a PIR (step-by-step, AIP dependency explained)
     - 2.3 Saving Drafts
     - 2.4 Printing Documents
  ## 3. Division Personnel Guide
     - 3.1 Viewing Assigned Programs
     - 3.2 Creating an AIP as Division Personnel
     - 3.3 Creating a PIR as Division Personnel
  ## 4. CES Reviewer Guide
     - 4.1 Reviewing PIRs in the CES Portal
     - 4.2 Noting (forwarding) or Returning PIRs
  ## 5. Cluster Coordinator Guide
     - 5.1 Reviewing forwarded PIRs
     - 5.2 Noting or Returning PIRs
  ## 6. Common Workflows
     - Quarterly PIR Submission Cycle (full routing chain)
  ## 7. Troubleshooting
     - AIP not found when creating PIR
     - Draft not loading

If EXISTS — update only sections that are affected by changes in SECTION 2.
Always reflect the correct user role capabilities as described in SECTION 1.

── TASK 7: FAQ.md ──────────────────────────────────────────────────────────────

File: docs/FAQ.md  [$STATUS_FAQ]

If MISSING — CREATE IT with at minimum these questions:
  Q: Why can't I access the PIR form?
  A: A PIR requires an approved AIP for the same school, program, and year.
     Contact your administrator if your AIP has not been submitted.

  Q: Why are my activities already filled in when I open the PIR form?
  A: The PIR form automatically loads your AIP activities, including their
     implementation periods, so you only need to fill in the accomplishment
     values.

  Q: Why can't I see certain programs in the dropdown?
  A: School Users only see programs available to their school level.
     Division Personnel only see programs they have been explicitly assigned to.

  Q: Can I edit a submitted AIP or PIR?
  A: Currently, submitted documents are final. Use the draft feature to save
     work before submitting.

  Q: How do I save my progress?
  A: Click "Save Draft" at any time. Your progress is stored server-side and
     will be restored the next time you open the form.

  Q: What is the PIR routing chain?
  A: After submission, PIRs go through a 3-tier review: CES first (based on
     the program's division), then Cluster Coordinator, then Admin. At each
     step, a reviewer can forward (note) or return the PIR with remarks.

If EXISTS — append new Q&A entries if any recent changes introduce new
behavior that users would ask about.

── TASK 8: API_DOCS.md ─────────────────────────────────────────────────────────

File: docs/API_DOCS.md  [$STATUS_API_DOCS]

If MISSING — CREATE IT documenting all REST API endpoints with:
  - Method + path
  - Auth requirement (🔒 or public)
  - Query params table
  - Request body (JSON example)
  - Response shape (JSON example)
  - Notes on business logic

If EXISTS — update only sections affected by new or changed endpoints. Reflect:
  a) Any new endpoints added in this sprint
  b) Any changed request/response shapes
  c) CES and Cluster Head portal endpoints (GET/POST /api/admin/ces/pirs,
     GET/POST /api/admin/cluster-head/pirs)
  d) DivisionProgram CRUD endpoints
  e) DivisionConfig endpoints
  f) Auth token is now an HttpOnly cookie — remove any Authorization header
     examples from client code. All requests use withCredentials: true (Axios)
     or credentials: include (fetch).
  g) Update the "Last updated" line at the bottom

── TASK 9: ROADMAP.md ──────────────────────────────────────────────────────────

File: docs/ROADMAP.md  [$STATUS_ROADMAP]

Steps:
  a) If MISSING — CREATE IT with the milestone structure described in the
     current ROADMAP content (SECTION 8).
  b) If EXISTS — the full current content is in SECTION 8 above. You MUST:
       - Preserve ALL existing text verbatim: milestone names, descriptions,
         "Must ship" lists, "Definition of Done" blocks, and the "Critical
         Path" summary. Do NOT rewrite, reorder, or restructure any of it.
       - Only change [ ] → [x] for items that git log (SECTION 2) confirms
         complete.
       - Only append NEW [ ] items under the correct milestone when git log
         introduces scope not yet listed — do not insert items mid-file.
  c) When ALL items in a milestone are ticked, mark that milestone's heading
     with "(COMPLETE)" and update only the status line in the "Critical Path"
     summary block.
  d) DO NOT change any Definition of Done text unless the scope explicitly
     changed this sprint.
  e) Update the "Last updated" line at the bottom.

── TASK 10: ISSUE_LOG.md ───────────────────────────────────────────────────────

File: docs/ISSUE_LOG.md  [$STATUS_ISSUE_LOG]

Steps:
  a) If MISSING — CREATE IT using the template format already defined in the
     file header (ISSUE-XXX, Date, Severity, Status, Affected, Symptom, Root
     Cause, Fix, Verification, Prevention sections).
  b) If EXISTS — append a new entry ONLY if the git log (SECTION 2) or diff
     contains evidence of a bug fix (commits with "fix", "bug", "regression",
     "revert", or "patch" in the message, or changed files that suggest a
     hotfix).
  c) For each new entry:
       - Assign ISSUE-$NEXT_ISSUE_NUM (current highest is ISSUE-$LAST_ISSUE_NUM).
       - Set Severity based on user impact: Critical (data loss/auth bypass),
         High (feature completely broken), Medium (degraded UX), Low (cosmetic).
       - Set Status to "Resolved" if the fix is already committed.
       - Populate Symptom, Root Cause, Fix, Verification, and Prevention
         sections from the git diff and commit messages.
  d) DO NOT modify or delete existing ISSUE entries — this log is append-only.
  e) Update the "Last updated" timestamp at the bottom of the file.

── TASK 11: CHANGELOG.md ── [MANDATORY — SYSTEM LOG — DO NOT SKIP] ─────────────

File: docs/CHANGELOG.md (create if MISSING)

Format rules:
  - Use Keep-a-Changelog format: https://keepachangelog.com/en/1.0.0/
  - Sections: Added, Changed, Fixed, Security, Deprecated, Removed
  - Most recent version at the top. Never delete old entries.
  - Link version headers to git tags when available.

Steps:
  a) If CHANGELOG.md does not exist, create it with full header and all past
     versions derived from version.js CHANGELOG array.
  b) If it exists, prepend a new ## [$NEXT_VERSION] - $TODAY section.
  c) Populate Added/Changed/Fixed/Security sections from git log (SECTION 2)
     AND from any updates made in Tasks 2–10 above. This is the authoritative
     summary — write it last so it reflects the full picture of what changed.
  d) Keep [Unreleased] section at top if there are staged but uncommitted
     changes.
  e) Update the link-reference block at the BOTTOM of CHANGELOG.md:
       - Change the [Unreleased] line to point to: .../compare/v$NEXT_VERSION...HEAD
       - Insert a new line directly below it:
         [$NEXT_VERSION]: .../compare/v$CURRENT_VERSION...v$NEXT_VERSION
       - Leave all older comparison link lines untouched.

── TASK 12: CODEBASE_CLEANUP_AUDIT.md ── [$STATUS_CLEANUP_AUDIT] ───────────────

File: docs/archived/CODEBASE_CLEANUP_AUDIT.md  (ARCHIVED — read-only)

Steps:
  a) DO NOT modify — this file is archived. It is a historical record of the
     2026-04-03 security and code quality audit.
  b) If new audit findings are needed, create a NEW audit file in docs/ using
     the date as a suffix (e.g., CODEBASE_CLEANUP_AUDIT_YYYYMMDD.md) and
     archive it here when complete.

── TASK 13: SECURITY_REMEDIATION_PLAN.md ── [$STATUS_SECURITY_REMEDIATION] ─────

File: docs/archived/SECURITY_REMEDIATION_PLAN.md  (ARCHIVED — read-only)

Steps:
  a) DO NOT modify — all phases resolved. Archived as historical reference.
  b) If a new security sprint is needed, create a new remediation plan in
     docs/ with a version suffix and archive it when resolved.

── TASK 14: HARDCODED_DATA_AUDIT.md ── [$STATUS_HARDCODED_AUDIT] ───────────────

File: docs/archived/HARDCODED_DATA_AUDIT.md  (ARCHIVED — read-only)

Steps:
  a) DO NOT modify — archived after all critical items were resolved.
  b) If new hard-coded data issues are found, document them in ISSUE_LOG.md
     or TODO.md instead.

── TASK 15: design-system.md ── [$STATUS_DESIGN_SYSTEM] ────────────────────────

File: docs/design-system.md

Steps:
  a) If EXISTS — update only sections affected by UI changes in this sprint
     (color tokens, new components, typography changes).
  b) Ensure dark mode tokens match current implementation.
  c) If MISSING — skip this task.

── TASK 16: PIR-ROUTING-CHAIN.md ── [$STATUS_PIR_ROUTING] ─────────────────────

File: docs/PIR-ROUTING-CHAIN.md

Steps:
  a) If EXISTS — update if PIR routing logic, status values, or CES/Cluster
     Head portal endpoints changed. Update "Last Updated" if modified.
  b) If MISSING — skip this task (created when PIR routing chain is first
     implemented).

── TASK 18: TERM_STRUCTURE_SYSTEM.md ── [$STATUS_TERM_STRUCTURE] ───────────────

File: docs/TERM_STRUCTURE_SYSTEM.md

Steps:
  a) If EXISTS — update if term structure system changed (new term types,
     API changes, config table schema changes). Verify "Key Files" section
     matches current file paths.
  b) If MISSING — skip this task.

── TASK 19: DATA_PRIVACY_COMPLIANCE.md ── [$STATUS_PRIVACY_COMPLIANCE] ─────────

File: docs/DATA_PRIVACY_COMPLIANCE.md

Steps:
  a) If EXISTS — update the RA 10173 Compliance Scorecard when new items are
     remediated. Append new findings under the correct severity section if a
     privacy audit was run this sprint. Update the Remaining Actions table when
     infrastructure or organizational items are completed. Update the audit date.
  b) If MISSING — skip this task (it is created when a privacy audit is run).
  c) NEVER overwrite existing FIXED findings — only update status from ⏳ to ✅.
  d) If auth mechanism changed, update the "HttpOnly cookie" description in the
     executive summary to reflect the current implementation.

────────────────────────────────────────────────────────────────────────────────
SECTION 15 — VALIDATION CHECKLIST
────────────────────────────────────────────────────────────────────────────────

After completing all tasks, verify:

  [ ] version.js — CURRENT_VERSION is '$NEXT_VERSION', new CHANGELOG entry prepended
  [ ] CHANGELOG.md — new ## [$NEXT_VERSION] section at top, all git commits covered
  [ ] DATABASE_SCHEMA.md — ERD matches schema.prisma exactly, tech stack correct
  [ ] SYSTEM_DOCUMENTATION_THESIS.md — ERD updated, all 7 roles documented,
      PIR routing chain described, Division Personnel section accurate
  [ ] TECH_DESIGN_PLAN.md — completed items ticked, auth desc updated,
      "Last Updated" set to $TODAY
  [ ] TODO.md — completed items marked [x], "Last updated" set to $TODAY
  [ ] USER_MANUAL.md — exists and covers all 7 user roles accurately, includes
      CES portal and Cluster Head portal workflows
  [ ] FAQ.md — exists and covers auto-population, role restrictions, PIR routing
  [ ] API_DOCS.md — exists, all endpoints documented including CES/Cluster Head
      portal endpoints and DivisionProgram CRUD
  [ ] No existing content deleted (only additions and targeted corrections)
  [ ] ISSUE_LOG.md — new entry appended if a bug fix is present in git log,
      append-only (no edits to existing entries)
  [ ] ROADMAP.md — milestone items ticked if completed, "Last updated" set to
      $TODAY, no existing text rewritten or reordered
  [ ] unappended-changes.md — DELETED (content incorporated into official docs)
  [ ] archived/CODEBASE_CLEANUP_AUDIT.md — NOT MODIFIED (archived, read-only)
  [ ] archived/SECURITY_REMEDIATION_PLAN.md — NOT MODIFIED (archived, read-only)
  [ ] archived/HARDCODED_DATA_AUDIT.md — NOT MODIFIED (archived, read-only)
  [ ] SECURITY_AUDIT.md — NOT MODIFIED
  [ ] DATA_PRIVACY_COMPLIANCE.md — RA 10173 scorecard updated if new items resolved;
      Remaining Actions table updated; audit date refreshed if changes made
  [ ] All occurrences of "AIP-PIR" or "AIP-PIR" corrected to "AIP-PIR"

────────────────────────────────────────────────────────────────────────────────
SECTION 16 — FORMATTING STANDARDS
────────────────────────────────────────────────────────────────────────────────

Markdown:
  - Headings: Use #/##/### hierarchy consistently within each file.
  - Code blocks: Use triple backticks with language hint (e.g., \`\`\`prisma,
    \`\`\`bash).
  - Tables: GitHub-flavored markdown pipe tables.
  - Mermaid: Use \`\`\`mermaid code fences for all ERDs.
  - Checkboxes: [ ] / [x] / [~] (pending / done / in-progress).

version.js:
  - Change types are lowercase strings: 'feature', 'fix', 'improvement',
    'breaking', 'docs', 'security'.
  - Text fields are plain English — no markdown, no emojis, no backtick escapes.
  - CHANGELOG array is ordered newest-first.

CHANGELOG.md:
  - Versions are in descending order (newest at top).
  - Dates are ISO 8601: YYYY-MM-DD.
  - Bullet points start with a capital letter, end without a period.

────────────────────────────────────────────────────────────────────────────────
BEGIN TASKS NOW. Work through Tasks 1–18 in order. Confirm each task completion
before proceeding to the next. Save CHANGELOG.md for last (Task 11).
────────────────────────────────────────────────────────────────────────────────
PROMPT
