# AIP-PIR Portal — API Reference

> **Base URL:** `http://localhost:3001` (dev) · Configurable via `VITE_API_URL` env var
> **Auth:** JWT Bearer token. Include as `Authorization: Bearer <token>` header on protected routes.
> **Server:** Hono.js on Deno · **ORM:** Prisma + PostgreSQL

---

## Table of Contents

1. [Auth](#1-auth)
2. [Dashboard](#2-dashboard)
3. [Deadlines](#3-deadlines)
4. [Schools & Clusters](#4-schools--clusters)
5. [Programs](#5-programs)
6. [Drafts](#6-drafts)
7. [AIP](#7-aip)
8. [PIR](#8-pir)

---

## 1. Auth

### `POST /api/auth/register`
Register a new user account.

**Body**
```json
{
  "email": "school@deped.gov.ph",
  "password": "string",
  "role": "School | Division Personnel",
  "name": "string",
  "school_id": 1
}
```

**Response `201`**
```json
{ "id": 1, "email": "school@deped.gov.ph" }
```

---

### `POST /api/auth/login`
Authenticate and receive a JWT token (24h expiry).

**Body**
```json
{ "email": "string", "password": "string" }
```

**Response `200`**
```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "school@deped.gov.ph",
    "role": "School",
    "name": "string",
    "school_id": 1,
    "school_name": "Vallehermoso Central Elementary School"
  }
}
```

---

## 2. Dashboard

### `GET /api/dashboard` 🔒
Returns all aggregated dashboard stats for the authenticated user in a single call. Determines current quarter by calendar date (Q1=Jan–Mar, Q2=Apr–Jun, Q3=Jul–Sep, Q4=Oct–Dec).

**Query Params**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `year` | `number` | Current calendar year | Fiscal year to query |

**Response `200`**
```json
{
  "activePrograms": 5,
  "aipCompletion": {
    "completed": 3,
    "total": 5,
    "percentage": 60
  },
  "pirSubmitted": {
    "submitted": 1,
    "total": 3
  },
  "currentQuarter": 1,
  "deadline": "2026-03-31T00:00:00.000Z",
  "quarters": [
    { "name": "Q1", "status": "In Progress", "deadline": "2026-03-31T00:00:00.000Z" },
    { "name": "Q2", "status": "Locked",      "deadline": "2026-06-30T00:00:00.000Z" },
    { "name": "Q3", "status": "Locked",      "deadline": "2026-09-30T00:00:00.000Z" },
    { "name": "Q4", "status": "Locked",      "deadline": "2026-12-31T00:00:00.000Z" }
  ]
}
```

**Quarter `status` values**
| Value | Condition |
|-------|-----------|
| `In Progress` | Current quarter, deadline not yet passed |
| `Submitted` | Past quarter AND at least one PIR exists for that quarter |
| `Missed` | Past quarter AND no PIRs exist for that quarter |
| `Locked` | Future quarter |

**Notes**
- `activePrograms` — programs the school is eligible for (by school level, minus restricted programs)
- `aipCompletion.total` — same as `activePrograms`; `completed` = how many of those programs have a submitted AIP
- `pirSubmitted.total` — number of AIPs created by this user/school for the current year; `submitted` = PIRs submitted for those AIPs in the current quarter
- `deadline` — reads from `Deadline` table first; falls back to last day of quarter month if no record exists

---

## 3. Deadlines

### `GET /api/deadlines` 🔒
Returns deadline records for a given fiscal year. Falls back to defaults for any quarter without a DB record.

**Query Params**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `year` | `number` | Current calendar year | Fiscal year |

**Response `200`**
```json
[
  { "quarter": 1, "date": "2026-03-31T00:00:00.000Z", "isCustom": false },
  { "quarter": 2, "date": "2026-06-30T00:00:00.000Z", "isCustom": false },
  { "quarter": 3, "date": "2026-09-30T00:00:00.000Z", "isCustom": false },
  { "quarter": 4, "date": "2026-12-31T00:00:00.000Z", "isCustom": false }
]
```

`isCustom: true` when the date comes from a DB record (admin override); `false` when using the default.

---

### `POST /api/deadlines` 🔒 *(admin only — enforced once Admin panel is built)*
Create or update a deadline for a specific quarter/year.

**Body**
```json
{
  "year": 2026,
  "quarter": 1,
  "date": "2026-04-15"
}
```

**Response `200`**
```json
{ "id": 1, "year": 2026, "quarter": 1, "date": "2026-04-15T00:00:00.000Z" }
```

**Notes**
- Uses upsert — safe to call for both create and update
- `date` must be a valid ISO date string
- No restriction on moving the deadline before or after the calendar default

---

## 4. Schools & Clusters

### `GET /api/clusters`
Returns all clusters with their associated schools.

**Response `200`**
```json
[
  {
    "id": 1,
    "cluster_number": 1,
    "name": "Cluster 1",
    "schools": [
      { "id": 1, "name": "Vallehermoso CES", "level": "Elementary" }
    ]
  }
]
```

---

### `GET /api/schools`
Returns all schools with cluster info.

**Response `200`**
```json
[
  {
    "id": 1,
    "name": "Vallehermoso Central Elementary School",
    "level": "Elementary",
    "cluster": { "id": 1, "cluster_number": 1, "name": "Cluster 1" }
  }
]
```

---

### `GET /api/schools/:id/aip-status`
Check if a school has submitted an AIP for the given year.

**Query Params**
| Param | Type | Default |
|-------|------|---------|
| `year` | `number` | Current year |

**Response `200`**
```json
{ "hasAIP": true, "count": 2 }
```

---

### `GET /api/users/:id/aip-status`
Check if a Division Personnel user has submitted an AIP (where `school_id IS NULL`).

**Query Params**
| Param | Type | Default |
|-------|------|---------|
| `year` | `number` | Current year |

**Response `200`**
```json
{ "hasAIP": true, "count": 1 }
```

---

## 5. Programs

### `GET /api/programs` 🔒 *(optional auth)*
Returns programs available to the requesting user.

**Filtering logic**
- **School user** — programs matching school level, excluding restricted programs for that school
- **Division Personnel** — only programs assigned to that user
- **Unauthenticated** — all programs

**Query Params**
| Param | Type | Description |
|-------|------|-------------|
| `level` | `string` | Filter by school level (`Elementary`, `Secondary`, `Both`) |

**Response `200`**
```json
[
  { "id": 1, "title": "Reading Program", "school_level_requirement": "Elementary" }
]
```

---

### `GET /api/programs/with-aips` 🔒
Returns programs that the current user has already submitted AIPs for.

**Query Params**
| Param | Type | Default |
|-------|------|---------|
| `year` | `number` | Current year |

**Response `200`**
```json
[
  { "id": 1, "title": "Reading Program", "aip_id": 5 }
]
```

---

## 6. Drafts

### `POST /api/drafts`
Save (create or update) a form draft. One draft per user per form type.

**Body**
```json
{
  "userId": 1,
  "formType": "AIP",
  "data": { "...form fields..." }
}
```

**Response `200`**
```json
{
  "id": 1,
  "user_id": 1,
  "form_type": "AIP",
  "file_path": "data/drafts/AIP_1.json",
  "updated_at": "2026-03-15T10:00:00.000Z"
}
```

---

### `GET /api/drafts/:formType/:userId`
Retrieve the saved draft for a user.

**Response `200`**
```json
{
  "hasDraft": true,
  "draftData": { "...form fields..." },
  "lastSaved": "2026-03-15T10:00:00.000Z"
}
```

---

### `DELETE /api/drafts/:formType/:userId`
Delete a draft (both DB record and JSON file on disk).

**Response `200`**
```json
{ "message": "Draft deleted successfully" }
```

---

## 7. AIP

### `POST /api/aips` 🔒
Create a new Annual Implementation Plan.

**Body**
```json
{
  "program_title": "Reading Program",
  "year": 2026,
  "outcome": "Improved Literacy",
  "sip_title": "Project READ",
  "project_coordinator": "Juan Dela Cruz",
  "objectives": ["Improve reading fluency", "Reduce non-readers"],
  "indicators": [
    { "description": "% of pupils reading at grade level", "target": "80%" }
  ],
  "prepared_by_name": "string",
  "prepared_by_title": "string",
  "approved_by_name": "string",
  "approved_by_title": "string",
  "activities": [
    {
      "phase": "Planning",
      "activity_name": "Conduct reading assessment",
      "implementation_period": "January 2026",
      "persons_involved": "Teachers",
      "outputs": "Assessment results",
      "budget_amount": 5000,
      "budget_source": "MOOE"
    }
  ]
}
```

**Response `201`**
Returns the created AIP with nested `activities`.

---

### `GET /api/aips/activities` 🔒
Fetch AIP activities for PIR pre-population.

**Query Params**
| Param | Required | Description |
|-------|----------|-------------|
| `program_title` | ✅ | Program to look up |
| `year` | — | Defaults to current year |
| `school_id` | — | For School users |
| `user_id` | — | For Division Personnel |

**Response `200`**
```json
{
  "aip_id": 5,
  "activities": [
    {
      "id": 12,
      "activity_name": "Conduct reading assessment",
      "implementation_period": "January 2026",
      "phase": "Planning",
      "budget_amount": 5000
    }
  ]
}
```

---

## 8. PIR

### `POST /api/pirs` 🔒
Create a new Program Implementation Review.

**Body**
```json
{
  "program_title": "Reading Program",
  "quarter": "1st Quarter CY 2026",
  "program_owner": "Schools Division of Guihulngan City",
  "total_budget": 50000,
  "fund_source": "MOOE",
  "activity_reviews": [
    {
      "aip_activity_id": 12,
      "physical_target": 100,
      "financial_target": 5000,
      "physical_accomplished": 80,
      "financial_accomplished": 4000,
      "actions_to_address_gap": "Follow-up session scheduled"
    }
  ],
  "factors": {
    "Institutional": {
      "facilitating_factors": "Strong admin support",
      "hindering_factors": "Limited classroom space"
    }
  }
}
```

**Response `201`**
Returns the created PIR with nested `activity_reviews` and `factors`.

---

## Data Models Reference

### `Deadline` *(added: 2026-03-15)*
| Field | Type | Notes |
|-------|------|-------|
| `id` | `Int` | Auto-increment PK |
| `year` | `Int` | Fiscal year, e.g. `2026` |
| `quarter` | `Int` | `1` – `4` |
| `date` | `DateTime` | Admin-set deadline |
| `created_at` | `DateTime` | Auto |
| `updated_at` | `DateTime` | Auto |

Unique constraint: `(year, quarter)`

**Default deadlines (no DB record):**
| Quarter | Default deadline |
|---------|-----------------|
| Q1 | March 31 |
| Q2 | June 30 |
| Q3 | September 30 |
| Q4 | December 31 |

---

*Last updated: 2026-03-15 · Dashboard Live Data milestone*
*🔒 = requires `Authorization: Bearer <token>` header*
