# QPIR-AIP Technical Design & Auth Plan

## Technology Stack (Finalized)
- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Backend:** Deno (Runtime)
- **Database:** PostgreSQL
- **ORM:** Prisma (configured with Deno preview features)

## Authentication & User Roles

### 1. User Types
- **School User**
  - **Identifier:** Unique School ID mapped to email (e.g., `120233@deped.gov.ph`).
  - **Access:** Has access to all programs by default.
  - **Special Case (ALS):** Access to ALS is limited only to "Selected Schools". This is managed via the `restricted_programs` and `restricted_schools` relations in the database.
- **Division Personnel**
  - **Identifier:** Personnel Name mapped to email (e.g., `queendelyn.badilles@deped.gov.ph`).
  - **Access:** Restricted to one or multiple assigned programs only.

### 2. Database Schema (Prisma)
The schema has been updated to include a `User` model with the following relationships:
- `User` ↔ `School`: 1-to-1 relationship (A school has one user account).
- `User` ↔ `Program`: Many-to-Many relationship (Personnel can monitor multiple programs; programs can have multiple personnel).
- `School` ↔ `Program`: Many-to-Many relation specifically for "Selected Schools Only" programs like ALS.

### 3. Implementation Status
- [x] Primary `schema.prisma` updated to `postgresql` and `deno`.
- [x] `User` model implemented with `role` and `email` fields.
- [x] Many-to-Many relations established for programs and personnel.
- [x] Deno `server.ts` boilerplate creation (Completed).
- [x] PostgreSQL connection and migration (Completed).

---
*Reference file created on 2026-03-07 to document the transition to Deno/Postgres and role-based access.*
