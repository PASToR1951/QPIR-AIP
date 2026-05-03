#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMIT_BATCH="$REPO_ROOT/commit-batch.sh"

WAVE_ORDER=(
  "db-schema"
  "server-auth"
  "server-cluster-removal"
  "server-admin"
  "server-data"
  "server-bootstrap"
  "frontend-cluster-removal"
  "frontend-auth"
  "frontend-onboarding"
  "frontend-admin"
  "frontend-forms"
  "frontend-misc"
  "frontend-version"
  "deploy"
  "docs-root"
  "tooling"
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
  db-schema                 schema.prisma + table-rename / drift-fix / cluster-purge migrations
  server-auth               auth, csrf, magic link, session cookie, oauth, origins lib
  server-cluster-removal    server-side Cluster Coordinator role takedown (routing, schoolsClusters)
  server-admin              admin routes: overview, pirReview, reports, settings, users, guards, submissions, logs
  server-data               data routes: aips, pirs, dashboard, drafts, lookups, notifications
  server-bootstrap          server.ts entry + scripts/seed.ts
  frontend-cluster-removal  delete cluster-head dashboard/layout, cluster onboarding role, cluster admin UI
  frontend-auth             Login, MagicLinkCallback, OAuthCallback, lib/{api,apiBase,auth,errorMessages}
  frontend-onboarding       OnboardingTour rewrite, role configs, validate-onboarding script, hint component
  frontend-admin            admin pages and components beyond cluster removal
  frontend-forms            AIP/PIR form containers, hooks, signatories
  frontend-misc             public pages, ui components, vite/package config, base styles, reportExport
  frontend-version          react-app/src/version.js — changelog rewrite
  deploy                    docker-compose, Caddyfile, deploy/lockdown scripts, data CSV seeds
  docs-root                 README, .gitignore, system-doc thesis, wiki, dataset.json removal
  tooling                   commit-stages.sh wave rewrite for the cluster-removal cycle

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
    db-schema)                printf 'schema.prisma cleanup and table-rename, schema-drift, cluster-purge migrations' ;;
    server-auth)              printf 'auth, csrf, magic link, session cookie, oauth, new origins library' ;;
    server-cluster-removal)   printf 'server-side Cluster Coordinator role takedown (routing, schoolsClusters)' ;;
    server-admin)             printf 'admin routes: overview, pirReview, reports, settings, users, guards, submissions, logs' ;;
    server-data)              printf 'data routes: aips, pirs, dashboard, drafts, lookups, notifications' ;;
    server-bootstrap)         printf 'server.ts entry trim and scripts/seed.ts updates' ;;
    frontend-cluster-removal) printf 'delete cluster-head dashboard/layout, cluster onboarding role, cluster admin UI' ;;
    frontend-auth)            printf 'Login, MagicLinkCallback, OAuthCallback, lib/{api,apiBase,auth,errorMessages}' ;;
    frontend-onboarding)      printf 'OnboardingTour rewrite, role configs, validate-onboarding script, hint component' ;;
    frontend-admin)           printf 'admin pages and components beyond cluster removal' ;;
    frontend-forms)           printf 'AIP/PIR form containers, hooks, signatories' ;;
    frontend-misc)            printf 'public pages, ui components, vite/package config, base styles, reportExport' ;;
    frontend-version)         printf 'react-app/src/version.js — changelog rewrite and 1.1.0-beta entry' ;;
    deploy)                   printf 'docker-compose, Caddyfile, deploy/lockdown scripts, data CSV seeds' ;;
    docs-root)                printf 'README, .gitignore, system-doc thesis, wiki, dataset.json removal' ;;
    tooling)                  printf 'commit-stages.sh wave rewrite for the cluster-removal cycle' ;;
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
    db-schema)                printf 'feat(db): drop Cluster Coordinator role and align schema with snake_case tables' ;;
    server-auth)              printf 'feat(server): origin-aware auth, OAuth, CSRF, and session cookie hardening' ;;
    server-cluster-removal)   printf 'refactor(server): remove Cluster Coordinator routing and admin endpoints' ;;
    server-admin)             printf 'refactor(server): align admin routes with cluster-less review flow' ;;
    server-data)              printf 'refactor(server): align data routes with cluster-less review flow' ;;
    server-bootstrap)         printf 'chore(server): trim server bootstrap and seed script' ;;
    frontend-cluster-removal) printf 'refactor(frontend): remove Cluster Coordinator dashboard, onboarding, and admin UI' ;;
    frontend-auth)            printf 'feat(frontend): origin-aware API client and auth callback hardening' ;;
    frontend-onboarding)      printf 'feat(frontend): rewrite onboarding tour with anchored hints and viewport tracking' ;;
    frontend-admin)           printf 'refactor(frontend): admin pages and components beyond cluster removal' ;;
    frontend-forms)           printf 'refactor(frontend): align AIP/PIR forms with focal-flow review states' ;;
    frontend-misc)            printf 'chore(frontend): public pages, ui polish, vite/package config, base styles' ;;
    frontend-version)         printf 'docs(changelog): rewrite 1.1.0-beta entry and add beta-3 highlights' ;;
    deploy)                   printf 'chore(deploy): Caddy SSL profile, host firewall scripts, and seed CSV dataset' ;;
    docs-root)                printf 'docs: refresh README, system thesis, wiki, and gitignore' ;;
    tooling)                  printf 'chore(tooling): rewrite commit-stages.sh waves for the cluster-removal cycle' ;;
    *) die "Unknown wave: $wave" ;;
  esac
}

wave_paths() {
  case "$1" in
    db-schema)
      printf '%s\n' \
        'server/prisma/schema.prisma' \
        'server/prisma/migrations/20260427000001_rename_tables_to_snake_case' \
        'server/prisma/migrations/20260501000001_schema_drift_fix_v2' \
        'server/prisma/migrations/20260501000002_purge_cluster_coordinators'
      ;;
    server-auth)
      printf '%s\n' \
        'server/lib/auth.ts' \
        'server/lib/csrf.ts' \
        'server/lib/magicLink.ts' \
        'server/lib/sessionCookie.ts' \
        'server/lib/userSessions.ts' \
        'server/lib/accountEmails.ts' \
        'server/lib/config.ts' \
        'server/lib/security.test.ts' \
        'server/lib/origins.ts' \
        'server/routes/auth.ts' \
        'server/routes/oauth.ts'
      ;;
    server-cluster-removal)
      printf '%s\n' \
        'server/lib/routing.ts' \
        'server/routes/admin/schoolsClusters.ts'
      ;;
    server-admin)
      printf '%s\n' \
        'server/routes/admin/overview.ts' \
        'server/routes/admin/pirReview.ts' \
        'server/routes/admin/reports.ts' \
        'server/routes/admin/settings.ts' \
        'server/routes/admin/users.ts' \
        'server/routes/admin/security.test.ts' \
        'server/routes/admin/shared/guards.ts' \
        'server/routes/admin/shared/pirAccess.ts' \
        'server/routes/admin/submissions/notifications.ts' \
        'server/routes/admin/submissions/status.ts' \
        'server/routes/admin/submissions/validation.ts' \
        'server/routes/admin/logs/actionCatalog.ts'
      ;;
    server-data)
      printf '%s\n' \
        'server/routes/data/aips.ts' \
        'server/routes/data/dashboard.ts' \
        'server/routes/data/drafts.ts' \
        'server/routes/data/lookups.ts' \
        'server/routes/data/notifications.ts' \
        'server/routes/data/pirs.ts' \
        'server/routes/data/shared/lookups.ts'
      ;;
    server-bootstrap)
      printf '%s\n' \
        'server/server.ts' \
        'server/scripts/seed.ts'
      ;;
    frontend-cluster-removal)
      printf '%s\n' \
        'react-app/src/cluster-head/ClusterHeadDashboard.jsx' \
        'react-app/src/cluster-head/ClusterHeadLayout.jsx' \
        'react-app/src/lib/onboarding/roles/cluster.js' \
        'react-app/src/lib/onboarding/roles/index.js' \
        'react-app/src/lib/clusterLogo.js' \
        'react-app/src/lib/routeTheme.js' \
        'react-app/src/admin/pages/AdminSchools.jsx' \
        'react-app/src/admin/pages/adminSchools/ClusterCard.jsx' \
        'react-app/src/admin/pages/adminSchools/useSchoolsData.js'
      ;;
    frontend-auth)
      printf '%s\n' \
        'react-app/src/Login.jsx' \
        'react-app/src/MagicLinkCallback.jsx' \
        'react-app/src/OAuthCallback.jsx' \
        'react-app/src/lib/api.js' \
        'react-app/src/lib/auth.js' \
        'react-app/src/lib/apiBase.js' \
        'react-app/src/lib/errorMessages.js'
      ;;
    frontend-onboarding)
      printf '%s\n' \
        'react-app/src/components/ui/OnboardingChecklist.jsx' \
        'react-app/src/components/ui/OnboardingController.jsx' \
        'react-app/src/components/ui/OnboardingTour.jsx' \
        'react-app/src/components/ui/OnboardingHint.jsx' \
        'react-app/src/components/ui/onboardingTour' \
        'react-app/src/lib/onboarding/roles/ces.js' \
        'react-app/src/lib/onboarding/roles/division.js' \
        'react-app/src/lib/onboarding/roles/school.js' \
        'react-app/src/lib/onboarding/validateTargets.dev.js' \
        'react-app/src/lib/onboardingConfig.js' \
        'react-app/src/lib/onboardingUtils.js' \
        'react-app/src/lib/portalHelpConfig.js' \
        'react-app/src/hooks/useOnboarding.jsx' \
        'react-app/scripts/validate-onboarding.mjs'
      ;;
    frontend-admin)
      printf '%s\n' \
        'react-app/src/admin/AdminTopBar.jsx' \
        'react-app/src/admin/components/CreateUserWizard.jsx' \
        'react-app/src/admin/components/ImportUsersModal.jsx' \
        'react-app/src/admin/components/StatusBadge.jsx' \
        'react-app/src/admin/components/importUsersModal/PasteStep.jsx' \
        'react-app/src/admin/components/importUsersModal/importUsersCsv.js' \
        'react-app/src/admin/pages/AdminConsolidationTemplate.jsx' \
        'react-app/src/admin/pages/AdminSessions.jsx' \
        'react-app/src/admin/pages/AdminUsers.jsx' \
        'react-app/src/admin/pages/adminOverview/AdminOverviewCharts.jsx' \
        'react-app/src/admin/pages/adminSettings/SignatoriesPanel.jsx' \
        'react-app/src/admin/pages/adminSubmissions/submissionsConstants.js' \
        'react-app/src/admin/pages/adminUsers/UserForm.jsx' \
        'react-app/src/admin/pages/adminUsers/schoolAssignmentOptions.js' \
        'react-app/src/admin/pages/adminUsers/useUserData.js' \
        'react-app/src/admin/pages/adminUsers/useUserMutations.js' \
        'react-app/src/admin/pages/pirReview/PIRFullFormView.jsx'
      ;;
    frontend-forms)
      printf '%s\n' \
        'react-app/src/forms/aip/AIPFormContainer.jsx' \
        'react-app/src/forms/aip/useAipProgramState.js' \
        'react-app/src/forms/aip/useAipSignatories.js' \
        'react-app/src/forms/pir/PIRFormContainer.jsx' \
        'react-app/src/forms/pir/PIRFormEditor.jsx' \
        'react-app/src/forms/shared/useProgramsAndConfig.js'
      ;;
    frontend-misc)
      printf '%s\n' \
        'react-app/src/AnimatedContent.jsx' \
        'react-app/src/components/FAQ.jsx' \
        'react-app/src/components/PrivacyPolicy.jsx' \
        'react-app/src/components/ui/AnnouncementBanner.jsx' \
        'react-app/src/components/ui/ForceChangePasswordModal.jsx' \
        'react-app/src/components/ui/NotificationBell.jsx' \
        'react-app/src/components/ui/PracticeInteractionModal.jsx' \
        'react-app/src/components/ui/WelcomeCard.jsx' \
        'react-app/src/lib/reportExport.js' \
        'react-app/src/styles/base.css' \
        'react-app/vite.config.js' \
        'react-app/package.json'
      ;;
    frontend-version)
      printf '%s\n' \
        'react-app/src/version.js'
      ;;
    deploy)
      printf '%s\n' \
        'docker-compose.yml' \
        'deploy' \
        'scripts' \
        'data'
      ;;
    docs-root)
      printf '%s\n' \
        'README.md' \
        '.gitignore' \
        'docs/SYSTEM_DOCUMENTATION_THESIS.md' \
        'docs/wiki/user-guides/Getting-Started.md' \
        'dataset.json'
      ;;
    tooling)
      printf '%s\n' \
        'commit-stages.sh'
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
    db-schema)
      printf '%s\n' \
        'Removed Cluster Coordinator role, cluster_head/coordinator_users relations, and "For Cluster Head Review" PIR status from schema.prisma.' \
        'Added 20260427000001_rename_tables_to_snake_case migration that backfills the Program/School/Cluster → snake_case rename that was previously applied via prisma db push.' \
        'Added 20260501000001_schema_drift_fix_v2 to align constraint and index names with the renamed tables (idempotent).' \
        'Added 20260501000002_purge_cluster_coordinators to migrate "For Cluster Head Review" PIRs back to "For CES Review" and downgrade Cluster Coordinator users to inactive Pending records.'
      ;;
    server-auth)
      printf '%s\n' \
        'Added server/lib/origins.ts with normalizeOrigin / parseAllowedOrigins / getAllowedOrigins helpers for CORS allowlist parsing.' \
        'Routed CSRF, session cookie, magic link, and userSessions through the origin helpers so trust decisions use a single normalized form.' \
        'Hardened server/routes/oauth.ts with allowed-origin validation and tightened error paths.' \
        'Trimmed accountEmails, auth.ts, magicLink, and config.ts to align with the new origin contract.'
      ;;
    server-cluster-removal)
      printf '%s\n' \
        'Updated routing.ts JSDoc to drop the Cluster Coordinator routing branch; getCESRoleForDivisionPIR is now used only for Division Personnel and focal-recommended school AIPs/PIRs.' \
        'Stripped Cluster Coordinator handling from server/routes/admin/schoolsClusters.ts.'
      ;;
    server-admin)
      printf '%s\n' \
        'Removed "For Cluster Head Review" handling from overview, pirReview, reports, settings, and users routes.' \
        'Updated submissions/{notifications,status,validation}.ts to drop the cluster-review status from the pipeline.' \
        'Updated shared guards and pirAccess to remove cluster-head review hooks.' \
        'Refreshed the action catalog to drop Cluster Coordinator audit verbs.'
      ;;
    server-data)
      printf '%s\n' \
        'Updated aips, pirs, dashboard, drafts, lookups, and notifications routes to drop "For Cluster Head Review" from filed/active status arrays.' \
        'Aligned shared/lookups with the cluster-less status set so dashboards and filters return consistent counts.'
      ;;
    server-bootstrap)
      printf '%s\n' \
        'Trimmed server.ts to drop Cluster Coordinator-specific bootstrap branches.' \
        'Updated scripts/seed.ts to seed without the Cluster Coordinator role.'
      ;;
    frontend-cluster-removal)
      printf '%s\n' \
        'Deleted react-app/src/cluster-head/ClusterHeadDashboard.jsx and ClusterHeadLayout.jsx.' \
        'Deleted react-app/src/lib/onboarding/roles/cluster.js and removed it from the role index.' \
        'Stripped Cluster Coordinator branches from clusterLogo.js, routeTheme.js, AdminSchools.jsx, ClusterCard.jsx, and useSchoolsData.js.'
      ;;
    frontend-auth)
      printf '%s\n' \
        'Added react-app/src/lib/apiBase.js for API base URL resolution shared across api.js and auth.js.' \
        'Updated Login, MagicLinkCallback, and OAuthCallback to use the shared apiBase and surface origin-aware errors.' \
        'Refreshed errorMessages.js to cover the new auth error codes.'
      ;;
    frontend-onboarding)
      printf '%s\n' \
        'Added OnboardingHint component plus useAnchoredPosition and useViewportSize hooks for resilient anchored tooltips.' \
        'Rewrote OnboardingTour, OnboardingChecklist, OnboardingController and the onboardingTour/* helpers around the new anchoring model.' \
        'Refactored role configs (ces, division, school), onboardingConfig, onboardingUtils, portalHelpConfig, and useOnboarding to drive the new tour shape.' \
        'Added scripts/validate-onboarding.mjs and lib/onboarding/validateTargets.dev.js so onboarding targets can be validated in dev.'
      ;;
    frontend-admin)
      printf '%s\n' \
        'Refreshed AdminTopBar, AdminUsers, AdminSessions, AdminConsolidationTemplate, and PIRFullFormView to align with the cluster-less review flow.' \
        'Updated CreateUserWizard, ImportUsersModal, importUsersModal/* and StatusBadge for the new role/status set.' \
        'Updated adminOverview/AdminOverviewCharts, adminSettings/SignatoriesPanel, adminSubmissions/submissionsConstants, and adminUsers/* helpers to match.'
      ;;
    frontend-forms)
      printf '%s\n' \
        'Updated AIPFormContainer, useAipProgramState, and useAipSignatories so school AIPs flow through the focal recommendation step.' \
        'Updated PIRFormContainer and PIRFormEditor to drop "For Cluster Head Review" handling and rely on CES review only.' \
        'Aligned forms/shared/useProgramsAndConfig with the cluster-less program list.'
      ;;
    frontend-misc)
      printf '%s\n' \
        'Refreshed AnimatedContent, FAQ, PrivacyPolicy, AnnouncementBanner, ForceChangePasswordModal, NotificationBell, PracticeInteractionModal, and WelcomeCard for the new flow.' \
        'Updated reportExport.js status mappings, base.css polish, vite.config.js, and react-app/package.json deps to support the rewritten tour and auth changes.'
      ;;
    frontend-version)
      printf '%s\n' \
        'Rewrote the 1.1.0-beta changelog entry with the full Beta 2 feature inventory (SMTP, magic links, Observer role, onboarding tour, practice mode, program templates, admin/AIP refactor).' \
        'Updated the in-progress 1.2.0-beta entry to note the Cluster Coordinator role retirement.'
      ;;
    deploy)
      printf '%s\n' \
        'Added docker-compose Caddy SSL profile and bound Postgres/backend ports to the loopback by default for production hardening.' \
        'Added deploy/Caddyfile for the optional HTTPS reverse proxy.' \
        'Added scripts/{deploy-windows.ps1, lockdown-linux-ufw.sh, lockdown-windows-firewall.ps1} for OS-level deploy and firewall lockdown automation.' \
        'Added data/{clusters,programs,schools}.csv as the canonical seed dataset for fresh installs.'
      ;;
    docs-root)
      printf '%s\n' \
        'Refreshed README.md, docs/SYSTEM_DOCUMENTATION_THESIS.md, and docs/wiki/user-guides/Getting-Started.md for the cluster-less flow and new deploy story.' \
        'Updated .gitignore: dropped retired entries (tunnel.sh, setup-production.sh, /.claude/, /.codex, CLAUDE.md, claude-devtools/, populate-aip-pir helpers); added start.sh and /.local-backups/.' \
        'Removed the obsolete root dataset.json now that data/*.csv is the canonical seed source.'
      ;;
    tooling)
      printf '%s\n' \
        'Rewrote WAVE_ORDER, wave_paths, wave_summary, wave_handoff, wave_title, and wave_commit_message for the cluster-removal release cycle (db-schema, server-auth, server-cluster-removal, server-admin, server-data, server-bootstrap, frontend-cluster-removal, frontend-auth, frontend-onboarding, frontend-admin, frontend-forms, frontend-misc, frontend-version, deploy, docs-root, tooling).' \
        'Replaced the focal-flow-era wave map (whose targets were already shipped) with explicit per-file pathspecs so this run produces narrowly-scoped batch commits.'
      ;;
    *)
      die "Unknown wave: $1"
      ;;
  esac
}

wave_handoff() {
  case "$1" in
    db-schema)
      printf '%s\n' \
        'Run prisma migrate deploy on a staging database to confirm the three new migrations apply cleanly in order, including the idempotent rename and drift-fix steps.' \
        'Regenerate the Prisma client and confirm no route still imports a removed Cluster relation.' \
        'Update DATABASE_SCHEMA.md and the SYSTEM_DOCUMENTATION_THESIS ERD in the next docs pass.'
      ;;
    server-auth)
      printf '%s\n' \
        'Smoke-test OAuth login from each allowed origin in ALLOWED_ORIGIN; confirm rejected origins return the correct error.' \
        'Confirm magic link emails carry a URL whose origin matches the configured allowlist.' \
        'Re-run server/lib/security.test.ts and any auth route tests against the new origin contract.'
      ;;
    server-cluster-removal)
      printf '%s\n' \
        'Grep the server tree for any remaining "Cluster Coordinator" or "Cluster Head" string before the next docs refresh.' \
        'Confirm getCESRoleForDivisionPIR call sites no longer pass a Cluster Coordinator branch.'
      ;;
    server-admin)
      printf '%s\n' \
        'Walk the admin overview, reports, and PIR review pages and confirm no UI affordance still expects "For Cluster Head Review" status.' \
        'Confirm submissions status guard does not block any legitimate admin workflow now that the cluster-review branch is gone.' \
        'Refresh API_DOCS.md to drop the cluster-review endpoints in the next docs pass.'
      ;;
    server-data)
      printf '%s\n' \
        'Verify dashboard and lookup queries return correct counts for the cluster-less status set in staging.' \
        'Confirm school PIR drafts/submissions still progress correctly through For Recommendation → For CES Review.'
      ;;
    server-bootstrap)
      printf '%s\n' \
        'Run the seed script against a clean database and verify no Cluster Coordinator user is created.' \
        'Confirm server boot logs no longer reference the Cluster Coordinator role.'
      ;;
    frontend-cluster-removal)
      printf '%s\n' \
        'Confirm the React Router config has no remaining /cluster-head route after these deletions.' \
        'Visually verify AdminSchools and ClusterCard render correctly without the cluster-head assignment UI.' \
        'Update screenshots in the user guide that previously showed the Cluster Coordinator dashboard.'
      ;;
    frontend-auth)
      printf '%s\n' \
        'Test login, magic link callback, and OAuth callback in dev with VITE_API_BASE pointing at a separate origin to validate apiBase.js.' \
        'Confirm all surfaces that previously imported api.js still resolve through the new apiBase.'
      ;;
    frontend-onboarding)
      printf '%s\n' \
        'Run scripts/validate-onboarding.mjs against every role and resolve any unmatched targets.' \
        'Walk the onboarding tour end-to-end as Admin, CES, Division Personnel, and School in the browser; confirm hints anchor correctly across viewport resizes.' \
        'Refresh onboarding screenshots in docs/wiki on the next docs pass.'
      ;;
    frontend-admin)
      printf '%s\n' \
        'Smoke-test CreateUserWizard and ImportUsersModal flows; confirm the role dropdown no longer offers Cluster Coordinator.' \
        'Walk AdminUsers, AdminSessions, and AdminConsolidationTemplate; confirm the new status set renders correctly in tables.'
      ;;
    frontend-forms)
      printf '%s\n' \
        'Submit a school AIP and confirm it lands in For Recommendation, then walk it through the focal recommendation → CES approval path.' \
        'Submit a school PIR after AIP approval and confirm it follows the same path without ever entering For Cluster Head Review.'
      ;;
    frontend-misc)
      printf '%s\n' \
        'Spot-check public pages (FAQ, PrivacyPolicy) for stale Cluster Coordinator references.' \
        'Confirm reportExport.js exports the expected status set and that base.css polish has not regressed any layout.'
      ;;
    frontend-version)
      printf '%s\n' \
        'Cross-reference the rewritten 1.1.0-beta changelog against git log entries between the 1.0 and 1.1 tags; flag missing items.' \
        'Sync the README highlights and version badge with the changelog in the next docs pass.'
      ;;
    deploy)
      printf '%s\n' \
        'Run the Caddy SSL profile against a staging host and verify the reverse proxy issues a cert.' \
        'Dry-run the lockdown scripts on a clean Linux and Windows host before applying them in production.' \
        'Document the new seed CSV import path in the deployment guide.'
      ;;
    docs-root)
      printf '%s\n' \
        'After this wave, run a docs lint pass to catch any remaining Cluster Coordinator strings in the wiki.' \
        'Confirm /.local-backups/ is in fact ignored by running git check-ignore on a sample file inside it.' \
        'Note that dataset.json was retired in favor of data/*.csv; remove any tooling that still reads dataset.json.'
      ;;
    tooling)
      printf '%s\n' \
        'Update wave definitions at the start of the next release cycle so commit-stages.sh stays aligned with current uncommitted work.' \
        'Confirm the new tooling wave fires last so the wave-rewrite commit lands after every wave it describes.'
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
