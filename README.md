# AIP-PIR Management System

Web-based system for managing **Annual Implementation Plans (AIP)** and **Program Implementation Reviews (PIR)** for the DepEd Division of Guihulngan City.

> **Version:** 1.0.5-beta — Performance & Timeline Update. 

---

## Overview

Schools submit an AIP at the start of each fiscal year, outlining their program activities, targets, and budget. At the end of each quarter, they submit a PIR to track how well those activities were implemented. The system enforces a gated workflow — PIR submission is locked until the AIP is completed.

**User roles:**
- **School User** — tied 1-to-1 with a school; manage their school's AIP and PIRs
- **Division Personnel** — manage programs they are directly assigned to; maintain their own independent AIP/PIR records

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Vite 7 |
| Styling | Tailwind CSS 4, Framer Motion |
| Backend | Deno 2, Hono 4 |
| Database | PostgreSQL, Prisma ORM 7 |
| Auth | JWT (HS256) |

---

## Project Structure

```
QPIR-AIP/
├── react-app/          # React frontend (Vite)
│   ├── src/
│   │   ├── components/ # Reusable UI and document components
│   │   ├── context/    # React context (accessibility, etc.)
│   │   ├── AIPForm.jsx # Multi-step AIP wizard
│   │   ├── PIRForm.jsx # Multi-step PIR wizard
│   │   ├── App.jsx     # Dashboard, routes, and route guards
│   │   └── version.js  # Version + changelog registry (ignored)
│   └── public/         # Institutional logos and fonts
│
└── server/             # Deno backend
    ├── routes/
    │   ├── auth.ts     # Login, token verification
    │   └── data.ts     # AIP, PIR, dashboard, and deadline CRUD
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    └── server.ts       # Entry point
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (for the React frontend)
- [Deno](https://deno.land/) 2.x (for the backend)
- [PostgreSQL](https://www.postgresql.org/) 15+

---

## Setup

### 1. Clone and install frontend dependencies

```bash
git clone <repo-url>
cd QPIR-AIP/react-app
npm install
```

### 2. Configure environment variables

**Backend** — create `server/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/pir_system?schema=public"
JWT_SECRET="your-strong-random-secret"
PORT=3001
```

**Frontend** — create `react-app/.env`:
```env
VITE_API_URL=http://localhost:3001
```

### 3. Initialize the database

```bash
cd server
npx prisma migrate deploy    # Apply migrations
deno task seed               # Seed initial data (schools, clusters, programs)
```

---

## Running

### Quick start (all services)

```bash
bash ./start.sh
```

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

---

## Key Features

- **Performance Optimized** — React 19 memoization and stable callbacks for a smooth, lag-free form experience; migrated to pure CSS animations for lightweight transitions.
- **Structured Timeline Logic** — Precise month-range pickers in the AIP Action Plan enable intelligent PIR filtering and dashboard metrics.
- **Gated Workflow** — PIR is locked until the AIP for that school/program/year is submitted.
- **Timeline-Aware PIR Filtering** — PIR forms automatically filter AIP activities to only show those scheduled for the selected quarter.
- **Interactive Dashboard** — Real-time progress tracking with a visual 4-node `QuarterTimeline` stepper and urgency-aware deadline tiers.
- **Print-ready Documents** — Generates official formatted AIP and PIR documents with NIR and Division institutional branding.
- **Accessibility Engine** — High contrast, reduced motion, and dyslexia-friendly font options (OpenDyslexic).

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate user, returns JWT |
| `GET` | `/api/dashboard` | Aggregated dashboard stats, current quarter, and deadlines |
| `GET` | `/api/programs` | List programs (filtered by role and school level) |
| `GET` | `/api/aips` | List submitted AIPs for current user |
| `POST` | `/api/aips` | Create a new AIP (persists structured month periods) |
| `GET` | `/api/aips/activities` | Fetch timeline-filtered AIP activities for PIR population |
| `GET` | `/api/pirs` | List submitted PIRs for current user |
| `POST` | `/api/pirs` | Create a new PIR review |
| `GET` | `/api/deadlines` | List submission deadlines for a given fiscal year |
| `GET` | `/api/drafts/:type/:userId` | Fetch saved in-progress draft |

---

## Status

Active beta development.

- Performance and timeline features (v1.0.5) are complete.
- Admin Function development (v1.0.6) is the next milestone.
- Security hardening (v1.0.7) follows the Admin Function.
- See internal `ROADMAP.md` and `TODO.md` for full milestone tracking.
