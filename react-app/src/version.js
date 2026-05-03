export const CURRENT_VERSION = '1.2.0-beta';

export const CHANGELOG = [
  {
    version: '1.2.0-beta',
    date: '2026-04-30',
    title: 'AIP-PIR Beta 3',
    description:
      'Beta 3 adds the focal person recommendation chain for school submissions and migrates school reporting windows from quarters to trimesters.',
    changes: [
      {
        type: 'feature',
        text: 'School AIP and PIR submissions now enter a Division Personnel focal person recommendation step before CES review.',
      },
      {
        type: 'improvement',
        text: 'Cluster-level reviewer accounts and routing have been retired; school PIRs now move from focal recommendation to CES review.',
      },
      {
        type: 'feature',
        text: 'Admins can assign program focal persons, and focal reviewers now have dedicated AIP/PIR queues and recommendation or return actions.',
      },
      {
        type: 'feature',
        text: 'CES reviewers now have an AIP review queue for focal-recommended school AIPs.',
      },
      {
        type: 'feature',
        text: 'School reporting periods now use trimesters with admin-managed trimester submission windows.',
      },
      {
        type: 'improvement',
        text: 'PIR monitoring factors are now captured per activity for clearer review, PDF, and report output.',
      },
      {
        type: 'improvement',
        text: 'AIPs and PIRs now support soft-delete timestamps for retention and privacy workflows.',
      },
      {
        type: 'security',
        text: 'Session restore and multi-device logout flows were hardened for safer shared-device and stale-session handling.',
      },
      {
        type: 'fix',
        text: 'AIP/PIR writes and admin review writes now use advisory-lock concurrency protections to prevent duplicate or conflicting updates.',
      },
      {
        type: 'improvement',
        text: 'Admin submissions, PIR review, session management, dashboard insights, and status badges were cleaned up for the Beta 3 workflow.',
      },
      {
        type: 'fix',
        text: 'PIR profile lifecycle updates lock AIP-derived functional division values and keep read-only back navigation from triggering draft saves.',
      },
      {
        type: 'docs',
        text: 'Documentation is being aligned with the DepEd Monitoring and Evaluation Manual, including PIR timelines, MOVs, roles, and YEPE concepts.',
      },
    ],
  },
  {
    version: '1.1.0-beta',
    date: '2026-04-13',
    title: 'AIP-PIR Beta 2',
    description:
      'Beta 2 adds SMTP email and division broadcasts, magic link tokens, the Observer role, onboarding tour, practice mode, program templates, and a major refactor of the admin and AIP form modules.',
    changes: [
      {
        type: 'feature',
        text: 'SMTP email system — configurable EmailConfig singleton (host, port, TLS, sender) plus GET/PUT /api/admin/settings/email-config and a connection test endpoint.',
      },
      {
        type: 'feature',
        text: 'Email Blast — Admin → Email Blast for division-wide broadcast messages; delivery tracked in EmailBlastLog via GET/POST /api/admin/email-blast.',
      },
      {
        type: 'feature',
        text: 'Magic link tokens — admin-generated one-time sign-in URLs for account provisioning and passwordless entry, with expiry and single-use enforcement.',
      },
      {
        type: 'feature',
        text: 'Must Change Password flow — accounts with must_change_password are blocked from all portal screens until a permanent password is set via POST /api/auth/change-password.',
      },
      {
        type: 'feature',
        text: 'reCAPTCHA v3 silent bot protection on the login form; token validated server-side before credentials are processed.',
      },
      {
        type: 'feature',
        text: 'Program templates — ProgramTemplate model and admin UI to pre-fill standard activity phases on new AIP creation.',
      },
      {
        type: 'feature',
        text: 'Division signatories — six signatory fields on DivisionConfig (SGOD/CID/OSDS noted-by name and title) surfaced in the AIP/PIR printed footer; app_logo field for division-level branding.',
      },
      {
        type: 'feature',
        text: 'Observer role — eighth active workflow role with read-only access to submitted AIPs and PIRs across the division.',
      },
      {
        type: 'feature',
        text: 'Legacy cluster-level reviewer assignment field added for earlier routing experiments.',
      },
      {
        type: 'feature',
        text: 'Onboarding tour — role-specific guided tour for first-time users with WelcomeCard, OnboardingChecklist, OnboardingController, and OnboardingTour.',
      },
      {
        type: 'feature',
        text: 'Practice mode sandbox for exploring AIP/PIR forms with sample data without creating database records.',
      },
      {
        type: 'feature',
        text: 'OnboardingCompletionCard splash card displayed when all onboarding checklist tasks are completed.',
      },
      {
        type: 'feature',
        text: 'HelpLauncher header button that opens the practice intro card and links back to the onboarding tour.',
      },
      {
        type: 'feature',
        text: 'ProgramMembersModal — admin modal for viewing and managing Division Personnel assignments per program.',
      },
      {
        type: 'feature',
        text: 'User fields: salutation (optional honorific) and position (optional job title).',
      },
      {
        type: 'feature',
        text: 'User onboarding state fields: onboarding_dismissed, onboarding_completed, checklist_progress — server-synced via PATCH /api/auth/me/onboarding.',
      },
      {
        type: 'feature',
        text: 'AIP fields: edit_requested_at, edit_request_count, target_description, observer_notes.',
      },
      {
        type: 'feature',
        text: 'MonthRangePicker standalone picker replacing inline month dropdowns in the AIP activity phase editor.',
      },
      {
        type: 'improvement',
        text: 'Admin codebase refactored into focused subdirectory modules: adminOverview, adminReports, adminSchools, adminSettings, adminSubmissions, adminUsers, pirReview.',
      },
      {
        type: 'improvement',
        text: 'Admin submissions split into granular sub-modules: aipEdit, detail, list, normalizers, notifications, observerNotes, pirActions, status, validation.',
      },
      {
        type: 'improvement',
        text: 'AIP form hooks extracted into focused modules: useAipMutations, useAipProgramInit, useAipProgramState, useAipSignatories.',
      },
      {
        type: 'improvement',
        text: 'PIR M&E table refactored into sub-components: buildDesktopTableConfig, RemovedActivitiesTray, ComplianceToggle, GapWidgets, ActivityCollapsedTitle.',
      },
      {
        type: 'improvement',
        text: 'ImportUsersModal step flow refactored into PasteStep → PreviewStep → ResultsStep with WelcomeBatchProgress display.',
      },
      {
        type: 'improvement',
        text: 'SubmissionsHistory view revamped for improved role-aware rendering.',
      },
      {
        type: 'improvement',
        text: 'PDF export moved to lib/pdf/ with dedicated aipPdf, pirPdf, and shared modules.',
      },
      {
        type: 'improvement',
        text: 'CSS split from a monolithic file into a styles/ directory with modules for animations, charts, and accessibility.',
      },
      {
        type: 'improvement',
        text: 'Login page UX — DepEd Google SSO promoted as the primary sign-in option; email/password card becomes an animated secondary fallback.',
      },
      {
        type: 'improvement',
        text: 'AIPFormEditor extracted as a standalone component from AIPForm.jsx, completing the editor sub-component and hook extraction.',
      },
      {
        type: 'breaking',
        text: 'Microsoft OAuth support dropped — only Google SSO with DepEd @deped.gov.ph domain enforcement is available.',
      },
      {
        type: 'fix',
        text: 'ADMIN-09 — AdminSubmissions PDF export silently failed due to a stale closure; handleExportPDF now accepts the target item as an explicit argument (ISSUE-013).',
      },
      {
        type: 'fix',
        text: 'ADMIN-10 — PDF download button is now disabled for the duration of the export via pdfLoadingId state, preventing concurrent exports (ISSUE-014).',
      },
      {
        type: 'fix',
        text: 'ADMIN-11 — ClusterPIR Summary quarter buttons are now derived from TermConfigContext instead of being hardcoded Q1 to Q4 (ISSUE-015).',
      },
      {
        type: 'fix',
        text: 'ADMIN-12 — relativeDate() showed Unix epoch ("Jan 1, 1970") for draft submissions with no dateSubmitted; null guard added (ISSUE-016).',
      },
      {
        type: 'fix',
        text: 'GET /api/config returned 500 when no DivisionConfig row existed; handler now returns a safe empty config object (ISSUE-018).',
      },
      {
        type: 'security',
        text: 'Microsoft OAuth removed reduces the OAuth attack surface; DepEd domain enforcement applies only to Google SSO.',
      },
      {
        type: 'security',
        text: 'Must Change Password gate prevents portal access for accounts provisioned with temporary passwords.',
      },
      {
        type: 'docs',
        text: 'Full Beta 2 documentation pass: CHANGELOG, DATABASE_SCHEMA, SYSTEM_DOCUMENTATION_THESIS, USER_MANUAL, FAQ, API_DOCS, ROADMAP, design-system, and ISSUE_LOG updated.',
      },
    ],
  },
  {
    version: '1.0.0-beta',
    date: '2026-04-08',
    title: 'AIP-PIR Beta',
    description:
      'First Beta release — completed Admin panel, CSV user import, school and cluster logo management, backup management, reports, announcements, audit logs, and refreshed dashboard summaries.',
    changes: [
      {
        type: 'feature',
        text: 'Beta documentation release covering the completed Admin panel, CSV user directory import, school and cluster logo upload/removal, bundled cluster logo fallback, backup management, reports, announcements, audit logs, and refreshed dashboard summaries.',
      },
      {
        type: 'feature',
        text: 'Dedicated PIR review documentation for the Beta routing model, including review ownership, start-review actions, notes, returns, reviewer metadata, per-activity admin notes, presented flags, recommendations, and notification deep links.',
      },
      {
        type: 'feature',
        text: 'OAuth and session documentation for Google SSO with PKCE, DepEd account guidance, OAuth state storage, HttpOnly cookie sessions, /api/auth/me refresh, and environment-aware cookie behavior for HTTPS/tunnel and local development.',
      },
      {
        type: 'feature',
        text: 'Runtime documentation for Cloudflare tunnel support, ignored tunnel env overrides, Deno production startup tasks, Prisma env loading, fetch-based SSE notification streams, and API/logo proxying.',
      },
      {
        type: 'improvement',
        text: 'Updated schema, API, user manual, FAQ, roadmap, design system, logo, backup, and privacy documentation to use the AIP-PIR Beta identity instead of the older alpha/SDS terminology.',
      },
      {
        type: 'improvement',
        text: 'Clarified Admin submissions behavior: PIR rows deep-link to the dedicated review page, feedback is required before returns, terminal statuses hide actions, and returned submissions are not downloadable.',
      },
      {
        type: 'improvement',
        text: 'Refreshed AIP/PIR form guidance for clearer errors, server-side drafts, timeline-aware activity filtering, returned-submission editing, AIP edit requests, and read-only recommendation display.',
      },
      {
        type: 'improvement',
        text: 'Updated accessibility documentation for system/light/dark color scheme selection while retaining high contrast, font size, line spacing, letter spacing, and reduced motion controls.',
      },
      {
        type: 'fix',
        text: 'Documented user-friendly API error handling, safer integer parsing, request sanitization, request body limits, SSE connection limits, and login/session failure messaging.',
      },
      {
        type: 'security',
        text: 'Clarified privacy support for personal data export, user anonymization, soft-delete timestamps, nullable audit admin_id, audit evidence preservation, and minimal JWT payloads.',
      },
      {
        type: 'security',
        text: 'Documented HttpOnly JWT cookies with SameSite=None; Secure for HTTPS/tunnels and SameSite=Lax for local HTTP development; frontend session storage keeps only non-token user metadata.',
      },
    ],
  },
  {
    version: '1.0.11-alpha',
    date: '2026-04-03',
    title: 'Review Routing Refinements',
    description:
      'Refines the review portal flow and centralizes JWT auth and program/division alignment.',
    changes: [
      {
        type: 'feature',
        text: 'Review portal routing replacing the legacy SDS portal.',
      },
      {
        type: 'feature',
        text: 'Complete PIR routing chain API endpoints.',
      },
      {
        type: 'feature',
        text: 'Pre-seeded DivisionProgram model with 79 standard DepEd programs.',
      },
      {
        type: 'improvement',
        text: 'Centralized JWT auth logic to server/lib/auth.ts.',
      },
      {
        type: 'improvement',
        text: 'Refactored Program schema to leverage Division alignment via the new division_programs table.',
      },
      {
        type: 'improvement',
        text: 'Restricted CES creation to one account per role.',
      },
      {
        type: 'improvement',
        text: 'Updated default deadlines to end of day in admin layout.',
      },
      {
        type: 'security',
        text: 'Migrated frontend token storage from localStorage to sessionStorage across all apps.',
      },
      {
        type: 'security',
        text: 'Restricted CORS configuration and removed wildcard origin.',
      },
      {
        type: 'security',
        text: 'Wrapped announcement mutations in Prisma transactions.',
      },
      {
        type: 'breaking',
        text: 'Old Reviewer role decommissioned entirely in favor of strict CES routing.',
      },
      {
        type: 'improvement',
        text: 'Removed unused cyQuarter dependencies and legacy fast-entry references.',
      },
    ],
  },
  {
    version: '1.0.10-alpha',
    date: '2026-03-30',
    title: 'PIR Routing Chain & CES Portal',
    description:
      'Introduces PIR approval routing with CES review portals, the DivisionProgram model, and singleton role constraints.',
    changes: [
      {
        type: 'feature',
        text: 'PIR routing chain — review flow with CES review, approval, and Returned as an alternative state.',
      },
      {
        type: 'feature',
        text: 'CES review portal — /ces-portal route with CES-SGOD/ASDS/CID queues, GET/POST /api/admin/ces/pirs (note + return), reviewer tracked via PIR.ces_reviewer_id and ces_noted_at.',
      },
      {
        type: 'feature',
        text: 'Review portal route support with optional returnTo field.',
      },
      {
        type: 'feature',
        text: 'DivisionProgram model — new division_programs table with required division (SGOD/OSDS/CID), pre-seeded with 79 standard DepEd programs and admin CRUD endpoints.',
      },
      {
        type: 'feature',
        text: 'User account constraints — CES roles enforced as singleton (one account per CES role type).',
      },
      {
        type: 'feature',
        text: 'server/lib/routing.ts — shared helper exporting getCESRoleForPIR(), CES_ROLES constant map, and CESRole type used by CES portal route and PIR submission handler.',
      },
      {
        type: 'feature',
        text: 'CreateUserWizard Review Chain group — CES-SGOD, CES-ASDS, and CES-CID role options added with program multi-select skipped for review-chain roles.',
      },
      {
        type: 'breaking',
        text: 'Program.category removed — KRA grouping field dropped; replaced by Program.division (SGOD/OSDS/CID) for CES routing alignment.',
      },
      {
        type: 'breaking',
        text: 'Reviewer role removed entirely — portal, route guard, and all admin UI references decommissioned.',
      },
      {
        type: 'breaking',
        text: 'SDS portal decommissioned — SDS-related route guards, API endpoints, and UI components replaced with the review portal model.',
      },
      {
        type: 'improvement',
        text: 'AIP form outcome target selection added to profile section; indicator target handling improved.',
      },
      {
        type: 'improvement',
        text: 'AIP-PIR form UX refined — input layout, draft save/restore reliability, and automated data population improved.',
      },
      {
        type: 'improvement',
        text: 'AIP status notifications updated — users notified when their PIR enters review states.',
      },
      {
        type: 'improvement',
        text: 'Default submission deadlines updated to end-of-day (23:59:59) in admin layout-info endpoint.',
      },
    ],
  },
  {
    version: '1.0.9-alpha',
    date: '2026-03-23',
    title: 'PIR Review Drawer & Admin Wizard',
    description:
      'Replaces the PIR Remarks Modal with the PIRReviewDrawer, introduces the role-first CreateUserWizard, the announcement banner, and an expanded AdminReports.',
    changes: [
      {
        type: 'feature',
        text: 'PIRReviewDrawer — sliding admin review panel replacing PIRRemarksModal; per-activity physical/financial breakdown, validation flags, per-activity admin_notes, approve/return workflow, presented toggle, and financial summary.',
      },
      {
        type: 'feature',
        text: 'CreateUserWizard — 3-step role-first user creation wizard (Role Picker → Account Info → Confirmation) integrated into AdminUsers, supporting School, Division Personnel, and Admin roles.',
      },
      {
        type: 'feature',
        text: 'UserProfileModal — admin-facing user management modal with display name, role badge, school/program summary, password reset, activate/deactivate toggle, and delete with ConfirmModal guard.',
      },
      {
        type: 'feature',
        text: 'AnnouncementBanner — system-wide announcement bar fetching public GET /api/announcement; supports info/warning/critical types with per-session dismissal stored in sessionStorage.',
      },
      {
        type: 'feature',
        text: 'Announcement banner wired into App.jsx — admins publish via Admin Settings; users see it immediately on next dashboard load.',
      },
      {
        type: 'feature',
        text: 'GET /api/announcement public endpoint documented in API_DOCS.md.',
      },
      {
        type: 'feature',
        text: 'AdminReports expanded to 9 tabs — Accomplishment Rates, Factors Analysis, Budget Sources, AIP Status Funnel, and Cluster PIR Summary added alongside the original 4.',
      },
      {
        type: 'feature',
        text: 'Schema: User.first_name, middle_initial, last_name — split name fields for Division Personnel; buildSubmittedBy helper returns formatted full name.',
      },
      {
        type: 'feature',
        text: 'Schema: PIRActivityReview.admin_notes — per-activity admin evaluation notes written via PIRReviewDrawer.',
      },
      {
        type: 'feature',
        text: 'Schema: PIR.presented (Boolean, default false) — admin-toggled flag tracking whether a school presented their PIR at the division review.',
      },
      {
        type: 'feature',
        text: 'Schema: Program.category — KRA grouping (ACCESS/EQUITY/QUALITY/WELL-BEING & RESILIENCY/GOVERNANCE) drives category-grouped filtering in reports.',
      },
      {
        type: 'feature',
        text: 'Schema: Announcement.dismissible (Boolean, default true) — controls whether users can close the banner or it remains pinned.',
      },
      {
        type: 'improvement',
        text: 'Multi-user per school — unique index on User.school_id dropped; a single school can now have multiple user accounts.',
      },
      {
        type: 'improvement',
        text: 'Program uniqueness constraint changed to (title, school_level_requirement) — same program title is now allowed for different school level requirements.',
      },
      {
        type: 'improvement',
        text: 'PIRRemarksModal removed — superseded by the more capable PIRReviewDrawer.',
      },
      {
        type: 'fix',
        text: 'Schema drift resolved — migration 20260322000000_schema_drift_fix adds all missing tables (notifications, announcements, deadlines, audit_logs); deadline and announcement systems are now fully functional (ISSUE-011).',
      },
      {
        type: 'fix',
        text: 'SYS-02 — PIR draft detection fixed; PIRForm.jsx now passes program_title to GET /api/pirs/draft so users returning to an in-progress PIR are correctly offered draft restore (ISSUE-012).',
      },
    ],
  },
  {
    version: '1.0.8-alpha',
    date: '2026-03-22',
    title: 'Admin Overview & Notifications',
    description:
      'Overhauls the admin overview with Nivo charts, adds the lightweight layout-info endpoint, in-app notifications, audit logs, announcements, and a bootstrap admin seed.',
    changes: [
      {
        type: 'feature',
        text: 'Admin overview dashboard overhauled with Nivo bar/pie charts for AIP/PIR submission trends by program and cluster; cluster drill-down rows expandable per panel.',
      },
      {
        type: 'feature',
        text: 'GET /api/admin/layout-info — lightweight endpoint powering the admin shell; returns daysLeft, currentQuarter, deadlineDate without the 8-query overhead of the full overview (resolves ADMIN-07).',
      },
      {
        type: 'feature',
        text: 'School.abbreviation field exposed in AdminSchools create/edit forms.',
      },
      {
        type: 'feature',
        text: 'Reports PDF export — client-side PDF generation for compliance and workload reports via html2canvas + jsPDF.',
      },
      {
        type: 'feature',
        text: 'GET /api/aips/:id/document accepts JWT via ?token= query param, enabling PDF iframe embedding in VerifyAIPs (resolves SYS-01 / ISSUE-007).',
      },
      {
        type: 'feature',
        text: 'Notifications system — Notification model added; backend creates in-app notifications when admin changes AIP/PIR status.',
      },
      {
        type: 'feature',
        text: 'GET /api/notifications, PATCH /api/notifications/:id/read, PATCH /api/notifications/read-all endpoints.',
      },
      {
        type: 'feature',
        text: 'AuditLog model — tracks admin actions with action, entity_type, entity_id, and details JSON.',
      },
      {
        type: 'feature',
        text: 'Announcement model — admin-managed system-wide banners with type (info/warning/critical) and is_active toggle.',
      },
      {
        type: 'feature',
        text: 'Bootstrap admin seed (server/scripts/seed.ts) — provisions a default Admin account on first run.',
      },
      {
        type: 'fix',
        text: 'ADMIN-01 — Compliance report restriction check: restricted_programs now included in Prisma include; "Select Schools" restriction matrix correctly applied (ISSUE-009).',
      },
      {
        type: 'fix',
        text: 'ADMIN-02 — has_remarks flag included in GET /api/admin/submissions; remarks badge in AdminSubmissions survives page refresh (ISSUE-010).',
      },
      {
        type: 'fix',
        text: 'ADMIN-03 — Approve Selected bulk action wired to batch PATCH /api/admin/submissions/:id/status with progress and error feedback.',
      },
      {
        type: 'fix',
        text: 'ADMIN-06 — Error feedback (catch block with setFormError) added to all CRUD mutations in AdminSchools, AdminPrograms, AdminDeadlines, and AdminSettings.',
      },
      {
        type: 'fix',
        text: 'ADMIN-08 — Schools dropdown in AdminUsers filters out schools that already have a user assigned, eliminating misleading "Email already exists" Prisma constraint errors.',
      },
      {
        type: 'fix',
        text: 'ADMIN-09 — Workload report accepts ?year= param and filters by fiscal year; previously counted all-time records.',
      },
      {
        type: 'fix',
        text: 'ADMIN-10 — PIRRemarksModal dark mode classes corrected with dark: prefixed Tailwind variants.',
      },
      {
        type: 'fix',
        text: 'SYS-01 — AIP verification iframe always returned 401; document endpoint now accepts JWT via query param (ISSUE-007).',
      },
      {
        type: 'fix',
        text: 'SYS-03 — ViewModeSelector no longer renders fake demo programs for users with zero assignments; shows empty state instead (ISSUE-008).',
      },
      {
        type: 'fix',
        text: 'SYS-04/05 — Non-functional Profile and User Logs links in DashboardHeader hidden until the pages are built.',
      },
      {
        type: 'fix',
        text: 'SYS-06 — Programs with-AIPs endpoint now filters to Submitted status only; prevents "No AIP found" error when a Draft AIP is selected for PIR.',
      },
      {
        type: 'security',
        text: 'SYS-07 — POST /api/deadlines restricted to Admin role; legacy data route removed/restricted in favor of /api/admin/deadlines.',
      },
      {
        type: 'improvement',
        text: 'PDF export timing: replaced double requestAnimationFrame with 500ms setTimeout for reliable DOM readiness before html2canvas capture (ADMIN-05).',
      },
    ],
  },
  {
    version: '1.0.7-alpha',
    date: '2026-03-22',
    title: 'Route Guards & Cleanup',
    description:
      'Adds DivisionPersonnelRouteGuard, locks down auth on schools/clusters routes, and cleans up dead code and stale UI behavior.',
    changes: [
      {
        type: 'feature',
        text: 'DivisionPersonnelRouteGuard for /verify-aips — School Users receive an instant redirect with no content flash or wasted API call (SYS-13).',
      },
      {
        type: 'fix',
        text: 'ConfirmationModal confirm button no longer calls onClose() after onConfirm() — eliminates setState-on-unmounting React warnings (SYS-12).',
      },
      {
        type: 'fix',
        text: 'Error modal "Try Again" label renamed to "Dismiss" and wired to closeModal in AIPForm and PIRForm (SYS-11).',
      },
      {
        type: 'fix',
        text: 'Removed unnecessary GET /api/schools fetch in PIRForm for School Users — schoolMap was never used; school is always derived from JWT (SYS-16).',
      },
      {
        type: 'fix',
        text: 'Dashboard fiscal year now dynamically uses new Date().getFullYear() instead of the hardcoded "FY 2026" (SYS-09).',
      },
      {
        type: 'fix',
        text: 'Admin submission export returns HTTP 400 for unsupported formats instead of leaking raw JSON response (ADMIN-04).',
      },
      {
        type: 'fix',
        text: 'Deleted dead compliancePct function in AdminSchools and orphaned StatCard.jsx component — confirmed zero consumers (ADMIN-11, ADMIN-12).',
      },
      {
        type: 'security',
        text: 'GET /api/schools now requires a valid JWT; unauthenticated GET /api/clusters route removed entirely (SYS-14).',
      },
      {
        type: 'security',
        text: 'Orphaned GET/POST /api/deadlines data routes removed — deadline management is exclusively via /api/admin/deadlines (SYS-15).',
      },
      {
        type: 'improvement',
        text: 'PDF export timing improved — double requestAnimationFrame replaced with 500ms setTimeout for more reliable DOM readiness before html2canvas capture (ADMIN-05).',
      },
      {
        type: 'improvement',
        text: 'Mobile ViewModeSelector no longer auto-starts wizard mode — users see the mode selection screen instead (SYS-17).',
      },
      {
        type: 'docs',
        text: 'Orphaned GET /api/admin/audit-log route annotated with frontend roadmap intent (ADMIN-13).',
      },
    ],
  },
  {
    version: '1.0.6-alpha',
    date: '2026-03-20',
    title: 'System-Wide Dark Mode',
    description:
      'Adds dark mode support across all pages, forms, and UI components with a persistent preference toggle in the Accessibility Panel.',
    changes: [
      {
        type: 'feature',
        text: 'System-wide dark mode — all pages, forms, UI components, and section layouts support a dark color palette toggled via the Accessibility Panel.',
      },
      {
        type: 'feature',
        text: 'Dark mode palette applied across page-level components (Dashboard, AIP/PIR forms, Login), UI components (modals, headers, stat cards, timeline), and form sections (profile, goals, action plan, factors, financials, M&E).',
      },
      {
        type: 'improvement',
        text: 'Performance optimized via React.memo on PIRMonitoringEvaluationSection to prevent unnecessary re-renders.',
      },
      {
        type: 'improvement',
        text: 'Logo assets refreshed; SVG replaced with optimized PNG variants.',
      },
      {
        type: 'improvement',
        text: 'Admin Dashboard design plan completed — full UI/UX specification for user management, school profiles, program access control, and deadline management; implementation pending.',
      },
      {
        type: 'improvement',
        text: 'Dark mode preference persists in browser local storage and is restored automatically on next session.',
      },
      {
        type: 'docs',
        text: 'Updated README and internal tracking files for latest release features.',
      },
    ],
  },
  {
    version: '1.0.5-alpha',
    date: '2026-03-19',
    title: 'Structured Activity Periods & Performance',
    description:
      'Replaces free-text implementation periods with structured month-range pickers, adds the QuarterTimeline stepper, and ships major frontend performance optimizations.',
    changes: [
      {
        type: 'feature',
        text: 'Structured AIP activity periods — replaced free-text implementation period with precise month-range pickers (period_start_month, period_end_month) in schema and UI.',
      },
      {
        type: 'feature',
        text: 'Timeline-aware PIR filtering — the PIR form now contextually filters AIP activities to show only those relevant to the selected quarter.',
      },
      {
        type: 'feature',
        text: 'New 3-card dashboard stats layout featuring segmented progress bars, dot pips for PIR tracking, and color-coded urgency tiers for deadlines.',
      },
      {
        type: 'feature',
        text: 'QuarterTimeline visual stepper on the dashboard showing live status badges (Submitted, In Progress, Missed, No Activities, Locked) across Q1 to Q4.',
      },
      {
        type: 'feature',
        text: 'Full-screen PageLoader with animated logo preloading and unified state handling for parallel data fetches on form mount.',
      },
      {
        type: 'improvement',
        text: 'Significant frontend performance optimizations — React.memo, useCallback, and useMemo applied across all forms and context providers to eliminate keystroke stuttering.',
      },
      {
        type: 'improvement',
        text: 'Migrated from animejs to pure CSS keyframe animations for the Login page and card transitions, reducing bundle size.',
      },
      {
        type: 'improvement',
        text: 'Redesigned ViewModeSelector with priority-based sort order (Drafts > Submitted > Pending) and improved mobile layout.',
      },
      {
        type: 'improvement',
        text: 'Simplified Dashboard welcome section with contextual action prompts based on current timeline status.',
      },
      {
        type: 'improvement',
        text: 'GPU-optimized FormBackground by removing continuous pulse animations from blurred orbs.',
      },
      {
        type: 'improvement',
        text: 'Hoisted theme configuration objects in Input and Select components to improve render efficiency.',
      },
      {
        type: 'fix',
        text: 'TextareaAuto now correctly auto-resizes to fit its content on initial load and when switching between draft records.',
      },
      {
        type: 'fix',
        text: 'Hidden the ViewModeToggle on mobile screens to prevent layout inconsistencies in forced-wizard mode.',
      },
      {
        type: 'fix',
        text: 'Scoped CSS reduce-motion selectors to specific animated classes to prevent global layout performance hits.',
      },
      {
        type: 'fix',
        text: 'Added JSON.parse try/catch guards to FormHeader to prevent crashes on local storage corruption.',
      },
      {
        type: 'fix',
        text: 'Applied lazy loading and explicit dimensions to dashboard institutional logos to prevent Cumulative Layout Shift (CLS).',
      },
    ],
  },
  {
    version: '1.0.4-alpha',
    date: '2026-03-15',
    title: 'Read-Only Submitted Views & Auth Hardening',
    description:
      'Adds read-only submitted AIP/PIR views, the with-pirs program filter, and tightens auth on draft, status, and AIP-activity endpoints.',
    changes: [
      {
        type: 'feature',
        text: 'GET /api/programs/with-pirs — returns programs with at least one submitted PIR for the authenticated user in the current year; powers completed-program filtering in ViewModeSelector.',
      },
      {
        type: 'feature',
        text: 'ViewModeSelector now receives a completedPrograms prop wired from /api/programs/with-pirs; PIR review mode list is filtered to programs with submitted PIRs only.',
      },
      {
        type: 'feature',
        text: 'GET /api/aips — new read-only endpoint returning the full submitted AIP record for the authenticated user.',
      },
      {
        type: 'feature',
        text: 'GET /api/pirs — new read-only endpoint returning the full submitted PIR record for the authenticated user.',
      },
      {
        type: 'feature',
        text: 'AIP read-only submitted view — AIPForm.jsx renders a read-only document view for already-submitted AIPs; AIPDocument.jsx redesigned to support this mode.',
      },
      {
        type: 'feature',
        text: 'PIR read-only view — PIRForm.jsx renders a read-only submitted view, including a "View AIP" reference preview modal.',
      },
      {
        type: 'feature',
        text: 'Locked "From AIP" fields in PIR form — program_owner, total_budget, and fund_source display a padlock badge labelled "From AIP" when pre-filled from the linked AIP record.',
      },
      {
        type: 'improvement',
        text: 'ViewModeSelector card grid layout enhanced — richer program status indicators, improved selection UX, demo simulation renders placeholder cards when no programs list is supplied.',
      },
      {
        type: 'improvement',
        text: 'App configurations and main form component wiring updated to support the completed-programs data flow.',
      },
      {
        type: 'improvement',
        text: 'PageTransition z-index corrected — no longer overlaps modals and overlay components.',
      },
      {
        type: 'improvement',
        text: 'Auth headers wired to all status and draft API calls in the frontend — Authorization: Bearer <token> sent on every protected request.',
      },
      {
        type: 'improvement',
        text: 'Dev PIR unlock buttons removed from PIRForm.jsx — dev_pir_unlocked localStorage bypass is no longer accessible from the UI.',
      },
      {
        type: 'fix',
        text: 'prisma.pir → prisma.pIR casing corrected throughout server/routes/data.ts — all 6 broken Prisma calls that caused GET /api/dashboard and GET /api/programs/with-pirs to 500 are resolved (ISSUE-001).',
      },
      {
        type: 'security',
        text: 'POST /api/drafts — user_id is now derived from the JWT token; client-supplied user_id in the request body is ignored.',
      },
      {
        type: 'security',
        text: 'GET/DELETE /api/drafts/:formType/:userId — 401 guard added for unauthenticated requests; 403 guard added when token identity does not match the URL :userId parameter.',
      },
      {
        type: 'security',
        text: 'GET /api/schools/:id/aip-status now requires authentication; School-role users are restricted to querying their own school only.',
      },
      {
        type: 'security',
        text: 'GET /api/users/:id/aip-status now requires authentication; users are restricted to querying their own status only.',
      },
      {
        type: 'security',
        text: 'GET /api/aips/activities — client-supplied school_id and user_id query parameters are ignored; identity is resolved from the JWT token only.',
      },
      {
        type: 'security',
        text: 'POST /api/deadlines restricted to Division Personnel role only; other roles receive 403.',
      },
    ],
  },
  {
    version: '1.0.3-alpha',
    date: '2026-03-15',
    title: 'Dashboard API & Deadline Model',
    description:
      'Introduces the unified /api/dashboard endpoint, the Deadline model with per-quarter records, and the comprehensive API_DOCS reference.',
    changes: [
      {
        type: 'feature',
        text: 'Deadline model — new deadlines table with year, quarter, date, created_at, updated_at and @@unique([year, quarter]).',
      },
      {
        type: 'feature',
        text: 'GET /api/dashboard — single aggregated endpoint returning activePrograms, aipCompletion, pirSubmitted, currentQuarter, deadline, and quarters[] for the authenticated user.',
      },
      {
        type: 'feature',
        text: 'GET /api/deadlines?year=YYYY — returns all 4 quarter deadlines for a fiscal year; each entry includes an isCustom flag (true = DB record, false = system default last-day-of-quarter).',
      },
      {
        type: 'feature',
        text: 'POST /api/deadlines — upsert a deadline for a given year + quarter; designed for the upcoming Admin panel Deadline Management UI.',
      },
      {
        type: 'feature',
        text: 'Loading skeleton state on the Dashboard while /api/dashboard is fetching.',
      },
      {
        type: 'feature',
        text: 'Stat badge hover effect — stat cards display a collapsed symbol that expands on hover to show the full context label.',
      },
      {
        type: 'docs',
        text: 'API_DOCS.md created — comprehensive REST API reference covering Auth, Dashboard, Deadlines, Schools & Clusters, Programs, Drafts, AIP, and PIR, with Deadline model reference table.',
      },
      {
        type: 'improvement',
        text: 'Dashboard (App.jsx) fully migrated from hardcoded stat values to live API data — all dashboard fields derived from GET /api/dashboard response.',
      },
    ],
  },
  {
    version: '1.0.2-alpha',
    date: '2026-03-15',
    title: 'Modular Wizard Forms',
    description:
      'Refactors AIP and PIR forms into modular wizard steppers with shared UI components and adds school-level-aware program filtering.',
    changes: [
      {
        type: 'feature',
        text: 'AIPForm refactored into modular wizard stepper with sub-components: AIPProfileSection, AIPGoalsTargetsSection, AIPActionPlanSection.',
      },
      {
        type: 'feature',
        text: 'PIRForm refactored into modular wizard stepper with sub-components: PIRProfileSection, PIRMonitoringEvaluationSection, PIRFactorsSection, PIRFinancialsSection.',
      },
      {
        type: 'feature',
        text: 'New shared UI components: WizardStepper, SectionHeader, SignatureBlock, FinalizeCard.',
      },
      {
        type: 'feature',
        text: 'School-level-aware program filtering — GET /api/programs filters by school.level vs program.school_level_requirement (Elementary schools see Elementary/Both, Secondary schools see Secondary/Both).',
      },
      {
        type: 'feature',
        text: 'Document header (FormBoxHeader) now includes DepEd NIR Logo and AIP-PIR logo alongside existing DepEd Seal and Division Logo.',
      },
      {
        type: 'improvement',
        text: 'All logos in FormBoxHeader are now print-visible via print:block / print:flex Tailwind classes.',
      },
      {
        type: 'fix',
        text: 'TypeScript inference errors on let aip variable in GET /aips/activities and POST /pirs handlers — typed as any to match existing codebase pattern.',
      },
      {
        type: 'fix',
        text: 'User text selection disabled (select-none) on ErrorPage and NotFound pages.',
      },
      {
        type: 'docs',
        text: 'SYSTEM_DOCUMENTATION_THESIS.md updated with institutional logo header block and new Section 1.3 — the Apir brand identity and cultural context.',
      },
      {
        type: 'docs',
        text: 'CHANGELOG.md created.',
      },
      {
        type: 'docs',
        text: 'USER_MANUAL.md created — step-by-step guide for School Users and Division Personnel.',
      },
      {
        type: 'docs',
        text: 'FAQ.md created — common questions covering program filtering, PIR auto-population, and draft management.',
      },
    ],
  },
  {
    version: '1.0.1-alpha',
    date: '2026-03-15',
    title: 'PIR Auto-Population & Activity Tracking',
    description:
      'Adds PIR auto-population from AIP activities, the implementation period column, and the created_by_user_id ownership field for Division Personnel.',
    changes: [
      {
        type: 'feature',
        text: 'PIR form auto-fetches AIP activities on school/program/year selection — activity names and implementation periods are pre-filled as read-only fields.',
      },
      {
        type: 'feature',
        text: 'Implementation Period column added to PIR print document (PIRDocument).',
      },
      {
        type: 'feature',
        text: 'New GET /api/aips/activities endpoint returns the activity list for a given school, program, and year.',
      },
      {
        type: 'feature',
        text: 'created_by_user_id tracking field added to AIP and PIR schema for Division Personnel ownership isolation.',
      },
      {
        type: 'improvement',
        text: 'PIR activity matching now uses aip_activity_id directly instead of fragile name-based string fallback.',
      },
      {
        type: 'docs',
        text: 'Division Personnel implementation plan added to TODO.md.',
      },
      {
        type: 'docs',
        text: 'DATABASE_SCHEMA.md and SYSTEM_DOCUMENTATION_THESIS.md updated to reflect schema and role changes.',
      },
    ],
  },
  {
    version: '1.0.0-alpha',
    date: '2026-03-14',
    title: 'AIP-PIR Alpha',
    description:
      'Initial alpha release — AIP and PIR forms, role-based authentication, dashboard, draft persistence, print-ready documents, and the Deno + Prisma + PostgreSQL backend.',
    changes: [
      {
        type: 'feature',
        text: 'AIP Form module with multi-phase activity planning (Planning, Implementation, M&E).',
      },
      {
        type: 'feature',
        text: 'PIR Form module with quarterly review workflow gated behind AIP completion.',
      },
      {
        type: 'feature',
        text: 'Role-based authentication — School Users and Division Personnel.',
      },
      {
        type: 'feature',
        text: 'Interactive dashboard with AIP/PIR status tracking and quarterly progress overview.',
      },
      {
        type: 'feature',
        text: 'Draft persistence — save and resume form progress via server-side API.',
      },
      {
        type: 'feature',
        text: 'Print-ready AIP and PIR document generation.',
      },
      {
        type: 'feature',
        text: 'Dynamic signatory fields and DepEd Outcome Category dropdown.',
      },
      {
        type: 'feature',
        text: 'Mobile-responsive layout across all pages.',
      },
      {
        type: 'feature',
        text: 'Deno runtime with Prisma ORM and PostgreSQL backend.',
      },
      {
        type: 'feature',
        text: 'System changelog and version tracking via version.js.',
      },
    ],
  },
];

export function getChangelog() {
  return CHANGELOG;
}
