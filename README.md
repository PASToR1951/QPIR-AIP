# AIP-PIR Management System

Web-based system for managing **Annual Implementation Plans (AIP)** and **Program Implementation Reviews (PIR)** for the DepEd Division of Guihulngan City.

> **Version:** 1.0.1-beta — Active development. Security hardening and Division Personnel features are in progress.

---

## Overview

Schools submit an AIP at the start of each fiscal year, outlining their program activities, targets, and budget. At the end of each quarter, they submit a PIR to track how well those activities were implemented. The system enforces a gated workflow — PIR submission is locked until the AIP is completed.

**User roles:**
- **School Users** — tied 1-to-1 with a school; manage their school's AIP and PIRs
- **Division Personnel** — not school-bound; manage programs they are directly assigned to

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Vite 7 |
| Styling | Tailwind CSS 4, Framer Motion |
| Backend | Deno, Hono 4 |
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
│   │   ├── AIPForm.jsx
│   │   ├── PIRForm.jsx
│   │   ├── App.jsx     # Routes and route guards
│   │   └── version.js  # Version + changelog registry
│   └── public/         # Static assets and fonts
│
└── server/             # Deno backend
    ├── routes/
    │   ├── auth.ts     # Login, token verification
    │   └── data.ts     # AIP, PIR, programs, drafts CRUD
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    └── server.ts       # Entry point
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (for the React frontend)
- [Deno](https://deno.land/) 2.x (for the backend)
- [PostgreSQL](https://www.postgresql.org/) 14+

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
JWT_SECRET="change-this-to-a-strong-random-secret"
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

- **Gated workflow** — PIR is locked until the AIP for that school/program/year is submitted
- **PIR auto-population** — activity names and implementation periods are pre-filled from the completed AIP
- **Draft persistence** — forms auto-save progress; users can resume at any time
- **Print-ready documents** — generates formatted AIP and PIR documents for official submission
- **Accessibility panel** — high contrast, reduced motion, and dyslexia-friendly font options
- **Quarterly structure** — Q1–Q4 review periods with deadline countdowns on the dashboard

---

## Available Scripts

**Frontend:**
```bash
npm run dev        # Vite dev server with HMR
npm run build      # Production build
npm run lint       # ESLint
npm run changelog  # Generate changelog from version.js
```

**Backend:**
```bash
deno task dev      # Hot-reload development server
deno task start    # Production server
deno task seed     # Seed database
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate user, returns JWT |
| `GET` | `/api/auth/verify` | Verify token validity |
| `GET` | `/api/programs` | List programs (filtered by user role) |
| `GET` | `/api/aips` | List AIPs for current user/school |
| `POST` | `/api/aips` | Create a new AIP |
| `GET` | `/api/aips/activities` | Fetch AIP activities for PIR population |
| `GET` | `/api/pirs` | List PIRs for current user/school |
| `POST` | `/api/pirs` | Create a new PIR |
| `GET` | `/api/drafts/:type/:userId` | Fetch saved draft |
| `PUT` | `/api/drafts/:type/:userId` | Save or update draft |

---

## Status

This project is in active beta development.

- Security hardening (JWT middleware, CORS, IDOR fixes) is pending the Admin Function
- Division Personnel access isolation (`created_by_user_id`) is schema-ready, pending migration
- See the internal `TODO.md` and `SECURITY_AUDIT.md` for full task and vulnerability tracking
