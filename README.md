# AIP-PIR Management System

Web-based system for managing **Annual Implementation Plans (AIP)** and **Program Implementation Reviews (PIR)** for the DepEd Division of Guihulngan City.

> **Version:** 1.1.0-beta — Beta 2

---

## Overview

Schools submit an AIP at the start of each fiscal year, outlining their program activities, targets, and budget. At the end of each quarter, they submit a PIR to track how well those activities were implemented. The system enforces a gated workflow — PIR submission is locked until the AIP is approved.

**User roles:**
- **School** — tied 1-to-1 with a school; submits and manages their school's AIP and PIRs
- **Division Personnel** — manages programs they are assigned to; maintains independent AIP/PIR records
- **CES-SGOD / CES-ASDS / CES-CID** — reviews division-level PIRs within their functional division
- **Cluster Coordinator** — reviews school PIRs for all schools within their assigned cluster
- **Admin** — full system access; manages users, schools, programs, deadlines, email, and submissions
- **Observer** — read-only access to submitted AIPs and PIRs across the division
- **Pending** — newly created accounts awaiting role assignment by an Admin

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Vite 7 |
| Styling | Tailwind CSS 4, Framer Motion |
| Backend | Deno 2, Hono 4 |
| Database | PostgreSQL, Prisma ORM 7 |
| Auth | JWT (HS256) in HttpOnly cookies, Google OAuth 2.0 SSO |

---

## Project Structure

```
AIP-PIR/
├── react-app/                  # React frontend (Vite)
│   ├── src/
│   │   ├── admin/              # Admin panel pages and components
│   │   │   ├── pages/          # Overview, Users, Schools, Programs, Deadlines,
│   │   │   │                   # Submissions, Reports, Settings, Backups, PIR Review
│   │   │   └── components/     # DataTable, FormModal, CreateUserWizard, etc.
│   │   ├── ces/                # CES reviewer dashboard and PIR review flow
│   │   ├── cluster-head/       # Cluster Coordinator dashboard
│   │   ├── components/
│   │   │   ├── forms/pir/      # PIR form section components
│   │   │   └── ui/             # Shared UI: DashboardHeader, NotificationBell, etc.
│   │   ├── context/            # Accessibility context (contrast, motion, font)
│   │   ├── lib/                # Shared utilities (api, auth, errorMessages, etc.)
│   │   ├── AIPForm.jsx         # Multi-step AIP submission wizard
│   │   ├── PIRForm.jsx         # Multi-step PIR submission wizard
│   │   ├── Dashboard.jsx       # Main user dashboard
│   │   ├── App.jsx             # Root app with error boundary
│   │   ├── AnimatedContent.jsx # Lazy-loaded routes and route guards
│   │   └── version.js          # Version + changelog registry
│   └── public/                 # Institutional logos, fonts, and default cluster logos
│
└── server/                     # Deno backend
    ├── routes/
    │   ├── auth.ts             # Login, logout, and current session profile
    │   ├── oauth.ts            # Google OAuth 2.0 + PKCE
    │   ├── data.ts             # AIP, PIR, dashboard, notifications, drafts
    │   ├── admin.ts            # Admin CRUD for users, schools, programs, etc.
    │   └── backup.ts           # Database backup management
    ├── lib/                    # Server utilities (auth, logger, config)
    ├── db/                     # Prisma client instance
    ├── scripts/                # Seed, audit, and maintenance scripts
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    └── server.ts               # Entry point, CORS, rate limiting, static file serving
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (for the React frontend)
- [Deno](https://deno.land/) 2.x (for the backend)
- [PostgreSQL](https://www.postgresql.org/) 15+ (local development) or Docker Compose

---

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd AIP-PIR

cd react-app
npm install

cd ../server
npm install

cd ..
```

The backend runs on Deno, but Prisma's CLI/client are installed through `server/package.json` because the Deno tasks call `npx prisma`.

### 2. Configure local environment variables

**Backend** — create `server/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/pir_system?schema=public"
JWT_SECRET="your-strong-random-secret"
PORT=3001
ALLOWED_ORIGIN=http://localhost:5173
NODE_ENV=development

# OAuth SSO - required only when enabling Google sign-in
OAUTH_REDIRECT_BASE_URL=http://localhost:3001
OAUTH_STATE_SECRET="your-strong-oauth-state-secret"
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TRUST_PROXY=false
TRUSTED_PROXY_CIDRS=
RECAPTCHA_BYPASS_PRIVATE_IPS=false
```

**Frontend** — create `react-app/.env`:

```env
VITE_API_URL=http://localhost:3001
```

For Docker, copy the checked-in template instead:

```bash
cp .env.docker .env
```

Then fill the root `.env` values for PostgreSQL, `JWT_SECRET`, `EMAIL_CONFIG_SECRET`, backups, OAuth, `ALLOWED_ORIGIN`, and `VITE_API_URL`.

### 3. Initialize the database

Create the `pir_system` PostgreSQL database first if it does not exist, then run:

```bash
cd server
deno task prisma:deploy    # Apply all migrations
deno task prisma:generate  # Generate Prisma client
deno task seed             # Seed schools, clusters, and programs
```

---

## Running

### Manual (recommended for development)

```bash
# Terminal 1 — backend
cd server && deno task dev

# Terminal 2 — frontend
cd react-app && npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3001 |
| Health check | http://localhost:3001/api/health |

`deno task dev` starts the watched backend without applying migrations. Run `deno task prisma:prepare` when migrations or the schema change; `deno task start` runs that step automatically before booting.

### Local helper scripts

Some local checkouts include ignored convenience scripts for personal development:

| Script | Purpose |
|--------|---------|
| `bash ./start.sh` | Starts local PostgreSQL, the Deno backend, and the Vite frontend on Linux |
| `bash ./tunnel.sh` | Starts the app for local-network testing and writes temporary LAN env overrides |

These scripts are listed in `.gitignore`, so fresh clones should use the manual or Docker commands unless you add your own copies.

### Docker Compose

After filling the root `.env` from `.env.docker`, start the core application services:

```bash
docker compose up -d --build
```

Optional services:

```bash
docker compose --profile backup up -d --build backup
docker compose --profile devtools up -d --build devtools
```

The `backup` service runs scheduled backups and processes manual backup requests from the Admin UI. Start the `backup` profile before relying on the Backups panel in production.

The first time the Docker Postgres volume is initialized, Compose creates the read-only backup database user from `BACKUP_DB_USER` and `BACKUP_DB_PASSWORD`. If you already have an existing `db_data` volume, run `server/scripts/db_readonly_user.sql` manually or create the user yourself.

If you serve the frontend from a non-Vite origin such as `http://localhost` on port 80, make sure `.env` has a matching `ALLOWED_ORIGIN`. Do the same for the `OAUTH_*`, `GOOGLE_*`, and reCAPTCHA values when enabling those features in Docker.

---

## Key Features

- **Gated Workflow** — PIR submission is locked until the school's AIP for that program and year is approved.
- **Full Admin Panel** — manage users, schools, clusters, programs, deadlines, announcements, email config, and system settings.
- **PIR Review Pipeline** — structured multi-stage review: CES notation → Cluster Head review → Admin approval/return, with per-activity evaluation notes.
- **OAuth SSO** — Google sign-in with PKCE and DepEd domain enforcement; email/password login also supported.
- **SMTP Email** — configurable division SMTP for transactional email, magic link sign-in, and admin email blasts.
- **Magic Link Login** — admin-generated one-time sign-in URLs for account provisioning; single-use with expiry.
- **Must Change Password** — accounts with temporary passwords are gated until a permanent password is set.
- **reCAPTCHA v3** — silent bot protection on the login form.
- **Program Templates** — admins pre-configure activity phase sets per program; new AIPs are pre-filled automatically.
- **Division Signatories** — six configurable signatory fields on the division config; printed in AIP/PIR document footers.
- **Onboarding Tour** — role-specific guided tour for first-time users with checklist, spotlight overlay, and keyboard navigation.
- **Practice Mode** — sandbox for exploring AIP/PIR forms without creating real database records.
- **Notifications** — in-app notification bell with deep-linking to the relevant PIR or AIP on click.
- **Announcements** — admin-authored system-wide or targeted announcements with @mention support.
- **Audit Log** — every admin action is recorded with entity reference; preserved on account deletion (RA 10173 §20).
- **Privacy Compliance** — right-to-erasure via PII anonymization (RA 10173 §23); soft-delete timestamps on users, AIPs, and PIRs.
- **Database Backups** — admin-triggered backups with status tracking via the Backups panel.
- **Logo Upload** — per-school and per-cluster logo upload; falls back to bundled default cluster logos automatically.
- **Import Users** — bulk user creation via CSV import in the Users admin panel.
- **Timeline-Aware PIR** — AIP activities are filtered by scheduled month range so only activities due in the selected quarter appear in the PIR form.
- **Interactive Dashboard** — real-time progress with a `QuarterTimeline` stepper, urgency-aware deadline tiers, and submission history.
- **Print-ready Documents** — generates formatted AIP and PIR documents with institutional branding and division signatories.
- **Accessibility Engine** — high contrast, reduced motion, and dyslexia-friendly font (OpenDyslexic) options.
- **Performance** — React 19 memoization, stable callbacks, CSS animations, and code-split lazy routes.

---

## API Endpoints

Routes are mounted in `server/server.ts`. Most routes require the HttpOnly JWT cookie set by password login or OAuth.

### Public and auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API status text |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/config` | Public division config used in generated documents |
| `GET` | `/api/announcement` | Current broadcast or targeted announcement |
| `POST` | `/api/auth/login` | Password login with reCAPTCHA; sets JWT cookie |
| `POST` | `/api/auth/logout` | Clears session cookie |
| `POST` | `/api/auth/change-password` | Change password; clears must_change_password flag |
| `POST` | `/api/auth/magic-link/verify` | Verify a one-time magic link token; sets session |
| `GET` | `/api/auth/me` | Current user profile and session expiry metadata |
| `GET` | `/api/auth/oauth/google` | Initiate Google OAuth flow |
| `GET` | `/api/auth/oauth/google/callback` | Google OAuth callback |

### User data and submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | Dashboard stats, current quarter, and deadlines |
| `GET` | `/api/programs` | Programs list (filtered by role and school level) |
| `GET` | `/api/programs/with-aips` | Programs that already have an AIP for the current user/year |
| `GET` | `/api/programs/with-pirs` | Programs that already have a PIR for the selected quarter |
| `GET` | `/api/schools` | Schools visible to the authenticated user |
| `GET` | `/api/schools/:id/aip-status` | School AIP completion status |
| `GET` | `/api/schools/:id/coordinators` | School coordinators for AIP auto-fill |
| `GET` | `/api/schools/:id/persons-terms` | Persons involved and terms for AIP auto-fill |
| `GET` | `/api/users/:id/aip-status` | Division personnel AIP completion status |
| `GET/POST/DELETE` | `/api/aips/draft` | Fetch, save, or clear the current AIP draft |
| `GET/POST/DELETE` | `/api/pirs/draft` | Fetch, save, or clear the current PIR draft |
| `GET/POST` | `/api/aips` | List or submit AIPs for the current user |
| `PUT` | `/api/aips/:id` | Update an editable AIP |
| `DELETE` | `/api/aips` | Delete the current user's selected AIP |
| `GET` | `/api/aips/activities` | Timeline-filtered AIP activities for PIR population |
| `POST` | `/api/aips/:id/request-edit` | Request admin unlock of an approved AIP |
| `GET/POST` | `/api/pirs` | List or submit PIRs for the current user |
| `PUT/DELETE` | `/api/pirs/:id` | Update or delete a PIR |
| `GET` | `/api/history` | Grouped AIP/PIR submission history |
| `GET` | `/api/notifications` | Notifications for current user |
| `GET` | `/api/notifications/stream` | Server-sent events stream for notifications |
| `PATCH` | `/api/notifications/:id/read` | Mark notification as read |
| `PATCH` | `/api/notifications/read-all` | Mark all notifications as read |
| `GET` | `/api/me/export` | Export the authenticated user's personal data |

### Admin, reports, and reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/overview` | System-wide statistics |
| `GET` | `/api/admin/layout-info` | Lightweight admin shell stats |
| `GET/POST/PATCH/DELETE` | `/api/admin/users` | User management |
| `POST` | `/api/admin/users/import` | Bulk user import (CSV) |
| `POST` | `/api/admin/users/:id/reset-password` | Generate a temporary password |
| `POST` | `/api/admin/users/:id/magic-link` | Generate a magic link token for this user |
| `POST` | `/api/admin/users/:id/anonymize` | PII erasure (RA 10173 §23) |
| `GET/POST/PATCH/DELETE` | `/api/admin/clusters` | Cluster management |
| `POST/DELETE` | `/api/admin/clusters/:id/logo` | Cluster logo upload/removal |
| `GET/POST/PATCH/DELETE` | `/api/admin/schools` | School management |
| `PATCH` | `/api/admin/schools/:id/restrictions` | Assign restricted programs for a school |
| `POST/DELETE` | `/api/admin/schools/:id/logo` | School logo upload/removal |
| `GET/POST/PATCH/DELETE` | `/api/admin/programs` | Program management |
| `PATCH` | `/api/admin/programs/:id/personnel` | Assign personnel to a program |
| `GET/PUT` | `/api/admin/programs/:id/template` | Get or set the activity template for a program |
| `GET/POST/PATCH/DELETE` | `/api/admin/division-programs` | Division-level program management |
| `GET/POST/DELETE` | `/api/admin/deadlines` | Deadline management |
| `GET` | `/api/admin/deadlines/history` | Deadline audit/history view |
| `GET` | `/api/admin/submissions` | AIP/PIR submission review list |
| `GET` | `/api/admin/submissions/export` | Export submissions |
| `GET` | `/api/admin/submissions/:id` | Submission detail |
| `PATCH` | `/api/admin/submissions/:id/status` | Approve/return a submission |
| `PATCH` | `/api/admin/aips/:id/approve-edit` | Approve an AIP edit request |
| `PATCH` | `/api/admin/aips/:id/deny-edit` | Deny an AIP edit request |
| `GET` | `/api/admin/pirs` | Admin PIR list |
| `GET` | `/api/admin/pirs/:id` | PIR detail |
| `PATCH` | `/api/admin/pirs/:id/presented` | Toggle PIR presented status |
| `GET` | `/api/admin/ces/pirs` | CES review queue |
| `POST` | `/api/admin/ces/pirs/:id/start-review` | Mark a PIR as actively reviewed by CES |
| `POST` | `/api/admin/ces/pirs/:id/note` | CES approve/note action |
| `POST` | `/api/admin/ces/pirs/:id/return` | CES return action |
| `GET` | `/api/admin/cluster-head/pirs` | Cluster Coordinator review queue |
| `POST` | `/api/admin/cluster-head/pirs/:id/start-review` | Mark a PIR as actively reviewed by Cluster Coordinator |
| `POST` | `/api/admin/cluster-head/pirs/:id/note` | Cluster Coordinator approve/note action |
| `POST` | `/api/admin/cluster-head/pirs/:id/return` | Cluster Coordinator return action |
| `GET` | `/api/admin/reports/years` | Years available for reports |
| `GET` | `/api/admin/reports/{compliance,quarterly,budget,workload,accomplishment,factors,aip-funnel,cluster-pir-summary}` | Report datasets |
| `GET` | `/api/admin/reports/:type/export` | CSV/XLSX report export |
| `GET/POST/DELETE` | `/api/admin/announcements` | Announcement management |
| `GET` | `/api/admin/settings/system-info` | Runtime system info for settings |
| `GET/POST` | `/api/admin/settings/division-config` | Division config (supervisor name/title/signatories) |
| `GET/PUT` | `/api/admin/settings/email-config` | SMTP email configuration |
| `POST` | `/api/admin/settings/email-config/test` | Test SMTP connection |
| `GET/POST` | `/api/admin/email-blast` | Email blast management |
| `GET` | `/api/admin/audit-logs` | Audit log viewer |
| `GET` | `/api/admin/backup/status` | Backup health and file listing |
| `POST` | `/api/admin/backup/trigger` | Trigger a background hourly backup |

---

## Status

Active beta — **Beta 2** (`v1.1.0-beta`, 2026-04-13).

- Core workflows (AIP, PIR, dashboard) are complete and validated.
- Admin panel is feature-complete — users, schools, clusters, programs, deadlines, submissions, reports, backups, settings, announcements, email config, email blasts, and logs.
- PIR review queues are complete: school PIRs route to Cluster Coordinators; division-level and Cluster Coordinator-owned PIRs route to CES; Admin retains oversight and override tools.
- Beta 2 additions: SMTP email system, magic link tokens, Must Change Password flow, reCAPTCHA v3, program templates, division signatories, onboarding tour, practice mode, Observer role, cluster head assignment.
- Admin and form codebases refactored into focused subdirectory modules.
- OAuth SSO (Google only — Microsoft OAuth removed), HttpOnly cookie sessions, real-time notifications, announcements, audit logs, and privacy compliance are implemented.
- School/cluster logo uploads, bundled cluster-logo fallbacks, CSV user import, and report/export workflows are complete.
- See internal `ROADMAP.md` and `TODO.md` for full milestone tracking.

---

## Security Documentation

- [Secure Session Restore and Logout Cleanup](docs/SECURE_SESSION_RESTORE_AND_LOGOUT.md) - documents the HttpOnly-cookie session restore flow, device revocation, logout cleanup behavior, and Data Privacy Act of 2012 security rationale.
