# Concurrency and Race Conditions in AIP-PIR

## Abstract

The AIP-PIR portal processes concurrent HTTP requests from school users, cluster
coordinators, CES personnel, division personnel, observers, and administrators. Several
write paths read the database to decide whether a record should be inserted, updated, or
rejected, then perform the write in a later query. Two requests for the same logical
record can therefore both make a decision from stale state before either write completes.
This is a classic time-of-check/time-of-use (TOCTOU) race condition.

The database unique constraints do the most important job: they prevent duplicate AIP/PIR
rows from being stored. Before the hardening work, those constraints failed late, usually
as a Prisma `P2002` infrastructure error, and the shared async handler surfaced that as
HTTP 500. That protected data integrity but gave users a misleading failure. [→ N1, N2]

The implemented fix is layered:

1. Keep database constraints as the final integrity guarantee.
2. Use PostgreSQL advisory transaction locks around logical AIP/PIR critical sections.
3. Move multi-query write sequences into transactions.
4. Map expected duplicate-write failures to domain-level HTTP 409 responses.
5. Add concurrency tests for submit, autosave, resubmit, delete, and admin status changes.

As of April 25, 2026, the concurrency hardening described in this document has been
implemented in the server and frontend worktree. The old "proposal" language below is
kept where it explains the design, but the implementation status is now documented in
the "Implemented Changes" section and the annotation notes have been updated.

---

## Problem

### The Check-Then-Create Race

AIP and PIR submit and draft-save routes follow this sequence:

```text
1. fetchAIPForUser() / fetchPIRForUser() -> SELECT (check if record exists)
2. if exists -> update / reject
   if not   -> INSERT (create new record)
```

These are separate database queries with no isolation between them. Under normal
single-user conditions this is fine. Under concurrent load, such as double-clicking
Submit, saving from two browser tabs, or a retry storm, the following race can occur:

```text
Request A ---- fetchAIPForUser -> none found ---------------- INSERT succeeds
Request B ---------- fetchAIPForUser -> none found ---------- INSERT fails with P2002
```

Request B hits a database unique constraint. Before this fix, the shared `asyncHandler`
caught that as an unrecognized error and returned HTTP 500, so the user saw a generic
failure rather than a meaningful conflict message.

The same pattern exists in draft autosave. Autosave can fire repeatedly from multiple
tabs or retry paths, and it uses the same logical uniqueness keys as submitted records.
If draft routes are left out of the concurrency fix, the system will still have a
duplicate-create race on the most frequently repeated write path.

### The Delete-Then-Recreate Race

Several update paths replace child rows by deleting all existing child rows and then
creating a new set:

```text
1. DELETE child rows for AIP/PIR
2. UPDATE parent record
3. CREATE replacement child rows
```

This is safe only if the sequence is atomic and no concurrent writer can interleave with
it. Without a transaction, a failure after the delete can leave the parent record without
activities, reviews, or factors. Without a logical lock, two concurrent edits can
interleave and produce lost updates or a child-row set that does not match either request
exactly.

This affects:

- AIP submit/resubmit paths that delete and recreate `AIPActivity` rows.
- AIP returned-edit update paths.
- PIR submit/resubmit paths that delete and recreate `PIRActivityReview` and `PIRFactor`
  rows.
- PIR returned-edit update paths.

### The Admin/User Status Race

Administrative status changes can race with user resubmissions. For example, an admin can
approve or return an AIP at the same time that the owner resubmits a returned AIP.

Advisory locks are cooperative. They only help when every competing writer for the same
logical resource uses the same lock. If the user route locks but the admin route does not,
the admin write can still interleave with the user write.

Any route that changes the workflow state of an AIP or PIR should either:

- acquire the same logical advisory lock before reading/writing the record, or
- perform an atomic conditional update that fails cleanly when the status is no longer
  what the route expected.

### Why the Database Constraint Alone Is Insufficient

The unique constraint is a necessary safety net. It guarantees data integrity regardless
of application behavior. But it is not a complete user-facing concurrency strategy. It
fires after the race has already been lost, and it produces an infrastructure-level error
code (`P2002`) that is not automatically meaningful to the application.

Catching every `P2002` generically in business code is fragile: it conflates a legitimate
duplicate submission with a misconfigured schema or an accidental unique index violation
on a different field. A narrow, constraint-aware mapping is still useful as a final
safety net, but it should not be the primary concurrency design.

---

## Concurrency Code Surface [→ N3]

The table below lists the logical resources that must be protected. The controls in the
right-hand column are now implemented in the code paths documented under "Implemented
Changes".

| Route / operation | Race key | Risk | Required control |
|---|---|---|---|
| `POST /data/aips` submit | School: `school_id + program_id + year`; division/CES: `created_by_user_id + program_id + year` | Duplicate create, stale status decision, delete/recreate interleaving | Advisory lock + transaction + 409 on conflict |
| `POST /data/aips/draft` autosave | Same as AIP submit | Duplicate draft create, lost draft update | Advisory lock + transaction |
| `PUT /data/aips/:id` returned edit | Existing AIP logical key | Lost update, child-row delete/recreate interleaving | Transaction + same AIP lock or conditional update |
| `DELETE /data/aips` / `DELETE /data/aips/draft` | Same as AIP submit | Delete racing with autosave/resubmit | Same AIP lock or conditional delete in transaction |
| `PATCH /admin/submissions/:id/status` for AIP | Existing AIP logical key | Admin status overwritten by user resubmit | Same AIP lock or atomic conditional update |
| `PATCH /admin/aips/:id/approve-edit` / `deny-edit` | Existing AIP logical key | Edit permission/status racing with user update | Same AIP lock or atomic conditional update |
| `POST /data/pirs` submit | `aip_id + quarter` | Duplicate create, stale status decision, child-row interleaving | Advisory lock + transaction + 409 on conflict |
| `POST /data/pirs/draft` autosave | `aip_id + quarter` | Duplicate draft create, lost draft update | Advisory lock + transaction |
| `PUT /data/pirs/:id` returned edit | Existing PIR logical key | Lost update, child-row delete/recreate interleaving | Transaction + same PIR lock or conditional update |
| `DELETE /data/pirs/:id` / `DELETE /data/pirs/draft` | Existing PIR logical key | Delete racing with autosave/resubmit | Same PIR lock or conditional delete in transaction |
| PIR admin status/remarks/presented/actions | Existing PIR logical key | Status/metadata lost updates, read-modify-write races | Atomic update where possible; lock for read-modify-write toggles |

Creation routes are the highest priority because they can produce user-visible 500s from
unique constraint races. Delete/recreate and status routes are next because they can
produce lost updates or inconsistent child collections under simultaneous edits.

---

## Definitions

### TOCTOU (Time-of-Check / Time-of-Use)

A TOCTOU race condition occurs when a program reads shared state to make a decision, and
then acts on that decision after the state may have changed. The gap between the check
and the use is the race window.

In this system the shared state is the AIP or PIR row in PostgreSQL. The check is the
`findUnique` / `findFirst` query. The use is the `create`, `update`, `delete`, or
delete-then-recreate sequence that follows. Because PostgreSQL processes concurrent
connections asynchronously, two requests can interleave across that gap.

### PostgreSQL Advisory Locks

PostgreSQL advisory locks are application-level cooperative locks that live outside the
normal row/table locking system. They are acquired explicitly by the application using a
numeric key and released automatically when the enclosing transaction commits or rolls
back.

```sql
SELECT pg_advisory_xact_lock(key1, key2);
```

- `key1` and `key2` are `int4` values chosen by the application to represent a logical
  resource.
- The lock is exclusive: a second call with the same key blocks until the first
  transaction finishes.
- No cleanup code is needed because the lock lifetime is tied to the transaction.
- Locks on different keys do not interfere. Two schools submitting different AIPs can
  proceed in parallel.
- Advisory locks are cooperative. They do not protect a record from code paths that do
  not acquire the same lock.

### Transaction

A transaction groups multiple queries into one atomic unit. If any query fails, the
database rolls the whole transaction back. This is required for delete/recreate sequences
so the system never commits the delete without also committing the replacement rows.

Transactions and advisory locks solve different parts of the problem:

- The transaction makes a multi-query write atomic.
- The advisory lock serializes competing transactions for the same logical resource.

### Domain Error vs. Infrastructure Error

A domain error (`ConflictError`) expresses a business rule violation in application
terms: "a record already exists for this submission." It maps cleanly to HTTP 409.

An infrastructure error (`PrismaClientKnownRequestError` with code `P2002`) expresses a
database-level constraint violation. It is correct but semantically opaque: the same code
fires for any unique constraint on any table for any reason.

The route layer should return domain errors for expected conflicts. A narrow `P2002`
mapping should remain at the boundary as defense in depth, especially because database
constraints are still the final integrity guarantee.

### AIP vs. PIR Workflow Asymmetry

AIP and PIR do not have the same status workflow.

AIP submission goes directly to `Approved`. That is intentional in the current
application: AIPs are editable only while `Draft` or after they are explicitly returned
for correction. AIP concurrency control is therefore mostly about duplicate create,
delete/recreate atomicity, edit permission, and avoiding stale returned-edit overwrites.

PIR submission has a review chain. Depending on role and ownership, a submitted PIR can
enter `For Cluster Head Review`, `For CES Review`, or `For Admin Review`, and later move
through `Under Review`, `Approved`, `Returned`, or `Submitted`. PIR concurrency control
has a wider status surface, so returned edit, reviewer status changes, remarks, activity
notes, and presented state all need to coordinate on the same PIR resource lock.

---

## Locking Model

### Lock Identity

The lock key must match the actual uniqueness rule. The original simple key
`(schoolId ?? 0) * 10_000 + programId` is not safe enough because:

- It collapses all division/CES AIPs into `schoolId = 0`.
- It ignores the partial unique index for division personnel:
  `(created_by_user_id, program_id, year) WHERE school_id IS NULL`.
- It can collide if `programId` exceeds the assumed packing range.
- It does not namespace AIP locks from PIR locks.

Use explicit resource strings and a namespace instead:

```text
AIP school record:   aip:school:<school_id>:program:<program_id>:year:<year>
AIP division record: aip:user:<created_by_user_id>:program:<program_id>:year:<year>
PIR record:          pir:aip:<aip_id>:quarter:<normalized_quarter>
```

PIR quarter labels are also canonicalized before database operations. The lock key
normalization is not enough on its own because the database uniqueness constraint compares
the stored `quarter` text case-sensitively. The application now stores recognized quarter
labels in canonical display form (`1st Quarter CY <year>`, etc.) and uses the same
canonical value for lookups and creates.

Then map the resource string into the PostgreSQL advisory lock key. There are two good
options:

1. Use `pg_advisory_xact_lock(namespace, hashtext(resource))`.
2. Use a small `lock_keys` table keyed by the resource string and `SELECT ... FOR UPDATE`
   the matching row for zero hash-collision risk.

The advisory lock option is simpler and likely sufficient for this application. A
`hashtext(resource)` collision would cause false serialization: two unrelated resources
in the same namespace would block each other unnecessarily. It should not create duplicate
or corrupt data because the code still re-reads the specific row inside the transaction
and database uniqueness constraints remain the final integrity guarantee. Avoid
hand-packed arithmetic keys unless the ID ranges are formally bounded and tested.

### Namespaces

Use distinct integer namespaces so unrelated resources never block each other even if
their hashed resource values match.

```ts
export const LOCK_NAMESPACE = {
  AIP: 10_001,
  PIR: 10_002,
} as const;
```

### Lock Lifetime

Use transaction-scoped locks only:

```sql
SELECT pg_advisory_xact_lock(namespace, hashtext(resource));
```

Do not use session-scoped advisory locks for HTTP handlers. Session locks can survive
longer than a single request if the connection is returned to the pool in an unexpected
state. Transaction locks are released automatically on commit or rollback.

### Lock Ordering

Most routes need only one lock, which keeps deadlock risk low. If a future route needs
both an AIP lock and a PIR lock, it must always acquire them in the same order:

```text
1. AIP lock
2. PIR lock
```

Never acquire PIR first in one route and AIP first in another.

---

## Implemented Changes

This section records the concrete implementation added on April 25, 2026. It should be
read as the current code map for the design described in the rest of this document.

### Shared Infrastructure

The shared concurrency helpers now live in:

- `server/lib/errors.ts`
  - Adds `HttpError` for expected HTTP failures.
  - Adds `ConflictError`, a 409-specific subclass used for stale or duplicate actions.
- `server/lib/prismaErrors.ts`
  - Detects Prisma `P2002` uniqueness errors structurally instead of relying on one
    adapter-specific error class.
  - Accepts both field-array targets and constraint/index-name targets.
  - Knows only the AIP/PIR uniqueness surfaces:
    - `school_id,program_id,year`
    - `created_by_user_id,program_id,year`
    - `aip_id,quarter`
    - `AIP_school_id_program_id_year_key`
    - `AIP_div_personnel_unique_idx`
    - `PIR_aip_id_quarter_key`
  - Includes `isPrismaUniqueConflictWithoutTarget` so a route can map targetless `P2002`
    errors only when it is already inside a known AIP/PIR create critical section.
- `server/lib/advisoryLock.ts`
  - Adds `LOCK_NAMESPACE.AIP = 10001` and `LOCK_NAMESPACE.PIR = 10002`.
  - Adds `withAdvisoryLock` and `withAdvisoryLocks`.
  - Uses transaction-scoped PostgreSQL advisory locks:

    ```sql
    SELECT pg_advisory_xact_lock(namespace, hashtext(resource))
    ```

  - Adds AIP/PIR resource-key helpers:
    - `aipResourceKey`
    - `aipResourceKeyFromRecord`
    - `pirResourceKey`
    - `pirResourceKeyFromRecord`
  - Normalizes PIR quarter lock keys by trimming, lowercasing, and collapsing
    whitespace.
- `server/lib/quarters.ts`
  - Adds `normalizeQuarterLabel`, which canonicalizes recognized quarter labels before
    PIR database lookups and writes.
  - Stores recognized PIR quarter labels in display form, such as
    `1st Quarter CY 2026`, instead of lowercasing user-visible values.

`withAdvisoryLocks` de-duplicates and sorts lock requests before acquiring them. This is
used by bulk draft delete so a request touching multiple AIP draft resources acquires
locks deterministically.

### Error Handling

The data shared async handler now maps expected failures before the generic 500 path:

- `HttpError` returns its declared status and `{ error, code }` payload.
- Known AIP/PIR `P2002` uniqueness conflicts return HTTP 409.
- Unknown errors and unrelated unique conflicts still go to the existing server-error
  path.

Admin submission routes now use `server/routes/admin/submissions/asyncHandler.ts`, which
applies the same expected-error behavior for status, edit-permission, remarks,
presented, and activity-note writes.

### Transaction-Aware Lookups

`fetchAIPForUser` and `fetchPIRForUser` now accept an optional transaction client as the
fifth argument:

```ts
fetchAIPForUser(user, programId, year, include, tx);
fetchPIRForUser(aipId, quarter, include, tx);
```

Existing callers still work because the default client remains global `prisma`. Locked
critical sections pass `tx` so their existence checks and writes share the same
transaction.

### Data Route Coverage

The following data routes now perform the state check and dependent writes inside the
same advisory-locked transaction:

| Route | Lock resource | Implemented behavior |
|---|---|---|
| `POST /api/aips` | AIP resource from real ownership rule | Serializes submit/create, updates `Draft`/`Returned`, returns 409 for existing non-editable records |
| `POST /api/aips/draft` | Same AIP resource as submit | Serializes autosave, permits last-writer-wins draft updates, rejects non-draft existing records |
| `PUT /api/aips/:id` | AIP resource from pre-read record | Re-reads after lock, checks owner/status, replaces activities atomically |
| `DELETE /api/aips` | AIP resource from found record | Re-reads after lock and deletes only still-deletable `Draft`/`Returned` AIPs |
| `DELETE /api/aips/draft` | Deterministic set of AIP draft locks | Deletes the snapshot of found drafts under locks |
| `POST /api/pirs` | `pir:aip:<aip_id>:quarter:<normalized_quarter>` | Serializes submit/create, promotes drafts, returns 409 for existing non-draft PIRs |
| `POST /api/pirs/draft` | Same PIR resource as submit | Serializes autosave, replaces factors/reviews atomically |
| `PUT /api/pirs/:id` | PIR resource from pre-read record | Re-reads after lock, checks owner/status, replaces factors/reviews atomically |
| `DELETE /api/pirs/:id` | PIR resource from pre-read record | Re-reads after lock and deletes only still-deletable PIRs |
| `DELETE /api/pirs/draft` | PIR resource from found record | Re-reads after lock and deletes only if still `Draft` |

For create paths, route-local targetless `P2002` handling maps ambiguous unique failures
to HTTP 409 only inside known AIP/PIR critical sections. Unknown `P2002` errors elsewhere
remain server errors.

PIR quarter inputs are canonicalized before DB lookup/create/update. This is important
because the advisory lock intentionally treats casing and whitespace variants as the same
logical quarter, while PostgreSQL's `PIR_aip_id_quarter_key` uniqueness comparison on
plain text is case-sensitive. Canonicalizing before DB operations prevents values like
`1st Quarter CY 2026` and `1ST QUARTER CY 2026` from becoming two rows for the same
logical reporting period.

### Admin and Review Route Coverage

The following admin writes now coordinate with the same logical AIP/PIR locks:

| Route | Lock resource | Implemented behavior |
|---|---|---|
| `PATCH /api/admin/submissions/:id/status` for AIP | Existing AIP resource | Re-reads inside lock and updates status; notifications happen after commit |
| `PATCH /api/admin/submissions/:id/status` for PIR | Existing PIR resource | Re-reads remarks inside lock, merges feedback, updates status/remarks atomically |
| `PATCH /api/admin/aips/:id/approve-edit` | Existing AIP resource | Re-reads inside lock and sets `status = Returned`, `edit_requested = false` |
| `PATCH /api/admin/aips/:id/deny-edit` | Existing AIP resource | Re-reads inside lock and clears `edit_requested` |
| `PATCH /api/admin/pirs/:id/remarks` | Existing PIR resource | Re-reads inside lock and updates remarks |
| `PATCH /api/admin/pirs/:id/presented` | Existing PIR resource | Re-reads inside lock and sets/toggles presented |
| `PATCH /api/admin/pirs/:id/activity-notes` | Existing PIR resource | Updates activity notes under the parent PIR lock |
| CES PIR start/note/return routes | Existing PIR resource | Re-read and status decisions happen under the PIR lock |
| Cluster-head PIR start/note/return routes | Existing PIR resource | Re-read, cluster authorization, and status decisions happen under the PIR lock |

The user-side AIP edit request and cancel-edit-request routes also now use the AIP lock
before changing edit-request state. This prevents edit permission changes from racing
with admin edit approval/denial and returned-edit resubmission.

### Side Effects After Commit

Notifications, SSE pushes, audit logs, and user activity logs are performed after the
locked transaction returns. This keeps external side effects from being emitted for
database work that may still roll back.

The implementation keeps existing business behavior unless concurrency correctness
requires a conflict response. In particular, admin status routes preserve current
last-write-wins status semantics; this pass does not introduce a new status transition
matrix.

### Public API Adjustment

`PATCH /api/admin/pirs/:id/presented` now accepts:

```json
{ "presented": true }
```

or:

```json
{ "presented": false }
```

This makes the operation idempotent. Empty-body requests still perform the legacy toggle
inside the PIR lock for backward compatibility. Invalid non-empty JSON returns 400 rather
than being treated as a toggle.

The frontend callers now send explicit desired values:

- `react-app/src/admin/pages/pirReview/usePirReviewActions.js`
- `react-app/src/admin/pages/adminReports/ClusterPIRSummary.jsx`

### Tests Added

Unit tests were added for:

- AIP/PIR resource-key generation:
  `server/lib/advisoryLock.test.ts`
- Known `P2002` field-array, constraint-name, index-name, unknown-target, and targetless
  parsing:
  `server/lib/prismaErrors.test.ts`
- Data `asyncHandler` mapping for `HttpError`, `ConflictError`, and known AIP/PIR
  uniqueness conflicts:
  `server/routes/data/shared/asyncHandler.test.ts`
- Explicit `presented` set behavior and legacy toggle fallback:
  `server/routes/admin/submissions/pirActions.test.ts`

Guarded DB-backed integration tests were added in `server/concurrency.integration.test.ts`.
They are ignored by default and require `DATABASE_URL`, `JWT_SECRET`,
`EMAIL_CONFIG_SECRET`, and `AIP_PIR_CONCURRENCY_DB_TESTS=1`:

```bash
AIP_PIR_CONCURRENCY_DB_TESTS=1 deno test --allow-env --allow-read --allow-net concurrency.integration.test.ts
```

The guarded scenarios cover:

- Two simultaneous AIP submits.
- Two simultaneous AIP draft saves.
- Two simultaneous PIR submits.
- Quarter casing/whitespace variants resolving to one PIR row.
- Two simultaneous PIR draft saves.
- AIP returned edit racing with admin status change.
- Concurrent explicit `presented` writes.
- Empirical `AIP_div_personnel_unique_idx` `P2002.meta.target` shape recognition.
- AIP activity rollback after an injected failure following child deletion.
- PIR review/factor rollback after an injected failure following child deletion.

### Verification Performed

The implementation was verified on April 25, 2026 with:

```bash
cd server && deno check server.ts
cd server && deno test --allow-env --allow-read --allow-net
cd react-app && npm run build
```

Results:

- `deno check server.ts`: passed.
- `deno test --allow-env --allow-read --allow-net`: `44 passed`, `0 failed`,
  `10 ignored`.
- `npm run build`: passed. Vite emitted existing PostCSS warnings about outdated
  gradient direction syntax; they are unrelated to this concurrency change.

---

## Implementation Design

### 1. Add Domain Errors [→ N4]

Create a small error module for expected HTTP errors. Keeping this generic makes it
usable outside the AIP/PIR routes later.

```ts
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ConflictError extends HttpError {
  constructor(message: string, code = "CONFLICT") {
    super(409, message, code);
  }
}
```

### 2. Teach `asyncHandler` About Expected Errors [→ N5]

The shared data-route handler should return expected errors without logging them as
server failures.

```ts
import { HttpError } from "../../../lib/errors.ts";
import { isKnownUniqueConflict } from "../../../lib/prismaErrors.ts";

if (error instanceof HttpError) {
  return c.json({ error: error.message, code: error.code }, error.status);
}

if (isKnownUniqueConflict(error)) {
  return c.json({ error: "A record already exists for this request" }, 409);
}

logger.error(logLabel, error);
return c.json({ error: clientMessage }, 500);
```

The `P2002` fallback should be narrow if possible. For example, inspect
`error.meta?.target` and only map the known AIP/PIR uniqueness targets to this message.
Unknown unique failures should still be logged because they might indicate a schema or
application bug.

`isKnownUniqueConflict` should be implemented as:

const KNOWN_UNIQUE_CONSTRAINTS = new Set([
  "AIP_school_id_program_id_year_key",
  "AIP_div_personnel_unique_idx",
  "PIR_aip_id_quarter_key",
]);

const KNOWN_UNIQUE_FIELD_TARGETS = new Set([
  "school_id,program_id,year",
  "created_by_user_id,program_id,year",
  "aip_id,quarter",
]);

export function isKnownUniqueConflict(error: unknown): boolean {
  if (!isPrismaUniqueConflict(error)) return false;
  const target = getPrismaUniqueTarget(error);
  return KNOWN_UNIQUE_CONSTRAINTS.has(target) ||
    KNOWN_UNIQUE_FIELD_TARGETS.has(target);
}

export function isPrismaUniqueConflict(error: unknown): boolean {
  return getErrorRecord(error)?.code === "P2002";
}

export function getPrismaUniqueTarget(error: unknown): string {
  const meta = getErrorRecord(error)?.meta;
  const target = typeof meta === "object" && meta !== null
    ? (meta as { target?: unknown }).target
    : undefined;
  const targetKey = Array.isArray(target)
    ? target.map(String).join(",")
    : String(target ?? "");
  return targetKey;
}
```

Prisma commonly exposes `meta.target` as an array of field names, but database adapters
and manually created indexes can expose a constraint/index name instead. The helper should
accept both known forms. The implementation intentionally uses structural detection
(`code === "P2002"`) rather than `instanceof Prisma.PrismaClientKnownRequestError`,
because the Deno/driver-adapter runtime and tests are more robust when the helper is not
tied to one concrete error class. If `target` is unavailable, a route may still map the
error to 409 only when it is already inside a known AIP/PIR create critical section.
Passing unknown `P2002` errors through to the 500 path ensures schema bugs or accidental
duplicate index violations are not silently swallowed as user errors. [→ N6]

### 3. Add an Advisory Lock Helper [→ N7]

Use `Prisma.TransactionClient` rather than deriving the type from `$transaction`.

```ts
import type { Prisma } from "@prisma/client";
import { prisma } from "../db/client.ts";

export type TxClient = Prisma.TransactionClient;

export const LOCK_NAMESPACE = {
  AIP: 10_001,
  PIR: 10_002,
} as const;

export async function withAdvisoryLock<T>(
  namespace: number,
  resource: string,
  fn: (tx: TxClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(${namespace}, hashtext(${resource}))
    `;
    return fn(tx);
  });
}
```

If the project later needs zero theoretical hash collisions, replace this helper with a
`lock_keys` table:

```sql
CREATE TABLE lock_keys (
  resource text PRIMARY KEY
);
```

Then insert the resource key if missing and lock the row with `SELECT ... FOR UPDATE`.

### 4. Build Resource Keys From Real Ownership Rules

AIP locks must distinguish school-owned records from division/CES records.

```ts
import type { TokenPayload } from "./auth.ts";

export function aipResourceKey(
  user: TokenPayload,
  schoolId: number | null,
  programId: number,
  year: number,
): string {
  const ownerKey = schoolId != null
    ? `school:${schoolId}`
    : `user:${user.id}`;
  return `aip:${ownerKey}:program:${programId}:year:${year}`;
}

export function pirResourceKey(aipId: number, quarter: string): string {
  return `pir:aip:${aipId}:quarter:${quarter.trim().toLowerCase()}`;
}
```

This matches the database:

- School AIPs are unique by `school_id + program_id + year`.
- Division/CES AIPs are unique by the partial index on
  `created_by_user_id + program_id + year` where `school_id IS NULL`.
- PIRs are unique by `aip_id + quarter`.

For legacy AIP rows where `school_id IS NULL` and `created_by_user_id IS NULL`, prefer a
data repair that backfills `created_by_user_id` before rolling out this locking scheme.
If repair is not possible immediately, admin-only operations on those rows can fall back
to an `aip:id:<id>` lock, but submit/draft routes should continue to use the user-based
key because that is the uniqueness rule for new division/CES records.

### 5. Let Lookup Helpers Use a Transaction Client [→ N8]

`fetchAIPForUser` and `fetchPIRForUser` previously closed over global `prisma`. Any route
that calls them inside a transaction needs to pass the transaction client.

```ts
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../../db/client.ts";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function fetchAIPForUser(
  user: TokenPayload,
  programId: number,
  year: number,
  include?: Prisma.AIPInclude,
  db: DbClient = prisma,
) {
  if ((user.role === "School" || user.role === "Cluster Coordinator") && user.school_id) {
    return db.aIP.findUnique({
      where: {
        school_id_program_id_year: {
          school_id: user.school_id,
          program_id: programId,
          year,
        },
      },
      ...(include ? { include } : {}),
    });
  }

  return db.aIP.findFirst({
    where: {
      created_by_user_id: user.id,
      school_id: null,
      program_id: programId,
      year,
    },
    ...(include ? { include } : {}),
  });
}

export async function fetchPIRForUser(
  aipId: number,
  quarter: string,
  include?: Prisma.PIRInclude,
  db: DbClient = prisma,
) {
  return db.pIR.findUnique({
    where: { aip_id_quarter: { aip_id: aipId, quarter } },
    ...(include ? { include } : {}),
  });
}
```

The important rule is: once a route enters the critical section, every read and write
that makes the decision must use `tx`, not global `prisma`.

### 6. AIP Submit Critical Section [→ N9]

Validate and normalize request input before taking the lock. Keep the locked section
short, but put the existence check and all parent/child writes inside it.

The `status: "Approved"` value in the AIP submit/update payload is intentional. Unlike
PIR, AIP does not enter a multi-tier review chain in the current workflow.

```ts
const resource = aipResourceKey(tokenUser, schoolId, program.id, parsedYear);

const aip = await withAdvisoryLock(
  LOCK_NAMESPACE.AIP,
  resource,
  async (tx) => {
    const existing = await fetchAIPForUser(
      tokenUser,
      program.id,
      parsedYear,
      undefined,
      tx,
    );

    if (existing?.archived) {
      throw new ConflictError("This AIP has been archived and cannot be modified");
    }

    if (existing && existing.status !== "Draft" && existing.status !== "Returned") {
      throw new ConflictError("A record already exists for this request");
    }

    if (existing) {
      await tx.aIPActivity.deleteMany({ where: { aip_id: existing.id } });
      return tx.aIP.update({
        where: { id: existing.id },
        data: {
          ...aipFields,
          activities: { create: activityFields },
        },
        include: { activities: true },
      });
    }

    return tx.aIP.create({
      data: {
        school_id: schoolId,
        program_id: program.id,
        created_by_user_id: tokenUser.id,
        year: parsedYear,
        ...aipFields,
        activities: { create: activityFields },
      },
      include: { activities: true },
    });
  },
);
```

Create notifications, push SSE events, and write user activity logs after the transaction
commits. If any notification row must be transactionally coupled to the AIP write, create
the notification rows inside the transaction but push them only after commit.

### 7. AIP Draft Critical Section

Draft autosave should use the same AIP resource key as submit. The expected behavior can
be more permissive than submit: two simultaneous autosaves can both return success as
long as they serialize and update the same draft record.

Inside the lock:

1. Re-fetch the AIP/draft using `tx`.
2. If the record exists and is not `Draft`, return HTTP 409.
3. If the record is archived, return HTTP 409.
4. If a draft exists, delete/recreate activities and update the draft in one transaction.
5. If no record exists, create the draft.

This prevents duplicate draft creation and keeps the child activities consistent with the
saved draft payload.

### 8. AIP Returned Edit / Resubmit by ID

Routes that update an existing AIP by ID need the same logical AIP lock. Because the route
starts with only `:id`, it can do a lightweight pre-read to compute the resource key, then
must re-read inside the lock before making decisions.

```ts
const current = await prisma.aIP.findUnique({
  where: { id: aipId },
  select: {
    id: true,
    school_id: true,
    program_id: true,
    year: true,
    created_by_user_id: true,
  },
});

if (!current) return c.json({ error: "AIP not found" }, 404);

const resource = current.school_id != null
  ? `aip:school:${current.school_id}:program:${current.program_id}:year:${current.year}`
  : `aip:user:${current.created_by_user_id}:program:${current.program_id}:year:${current.year}`;

const updated = await withAdvisoryLock(LOCK_NAMESPACE.AIP, resource, async (tx) => {
  const aip = await tx.aIP.findUnique({ where: { id: aipId } });
  if (!aip) throw new HttpError(404, "AIP not found", "NOT_FOUND");
  if (aip.status !== "Returned") {
    throw new ConflictError("This AIP can no longer be edited in its current state.");
  }

  await tx.aIPActivity.deleteMany({ where: { aip_id: aipId } });
  return tx.aIP.update({
    where: { id: aipId },
    data: {
      ...aipFields,
      status: "Approved",
      activities: { create: activityFields },
    },
    include: { activities: true },
  });
});
```

The pre-read is only used to find the lock key. The authoritative status check happens
after the lock is acquired.

There is a narrow gap between the pre-read and the lock acquisition where the AIP could be
deleted by another request, such as an admin hard delete. The re-read inside the lock
handles this: if `findUnique` returns `null`, return 404 rather than 409. For this portal,
hard deletes on submitted records are admin-only and extremely rare, so this gap is
acceptable without further mitigation.

### 9. PIR Submit Critical Section

PIR locks are based on the parent AIP ID and normalized quarter.

```ts
const resource = pirResourceKey(aip.id, cleanQuarter);

const pir = await withAdvisoryLock(
  LOCK_NAMESPACE.PIR,
  resource,
  async (tx) => {
    const existing = await fetchPIRForUser(aip.id, cleanQuarter, undefined, tx);

    if (existing) {
      if (existing.status !== "Draft") {
        throw new ConflictError(
          "A PIR has already been submitted for this program and quarter.",
        );
      }

      await tx.pIRActivityReview.deleteMany({ where: { pir_id: existing.id } });
      await tx.pIRFactor.deleteMany({ where: { pir_id: existing.id } });
      return tx.pIR.update({
        where: { id: existing.id },
        data: {
          ...pirData,
          status: nextStatus,
          factors: { create: factorData },
          activity_reviews: { create: reviewData },
        },
      });
    }

    return tx.pIR.create({
      data: {
        aip_id: aip.id,
        created_by_user_id: tokenUser.id,
        quarter: cleanQuarter,
        ...pirData,
        status: nextStatus,
        factors: { create: factorData },
        activity_reviews: { create: reviewData },
      },
    });
  },
);
```

The current PIR workflow uses statuses such as `Draft`, `For CES Review`, `For Cluster
Head Review`, `For Admin Review`, `Under Review`, `Approved`, `Returned`, and
`Submitted`. [→ N10] The data submit route currently emits review-chain statuses such as
`For Cluster Head Review`, `For Admin Review`, and `For CES Review`; it does not emit
`Submitted`. `Submitted` is still a real status in the broader codebase, not a placeholder.
`Reviewed` is not part of the current validated status vocabulary.

Returned PIRs are edited through the by-ID update route in the current code, so the POST
submit route should not fall through to `create` when it finds an existing `Returned` PIR.
Either return 409 with a clear message or intentionally support returned resubmission in
this route, but do not attempt a second insert for the same `aip_id + quarter`.

The implemented POST route returns a targeted 409 for `Returned` PIRs:

```text
This PIR was returned for correction. Please update the returned PIR instead of submitting a new one.
```

### 10. PIR Draft Critical Section

PIR draft autosave should use the same `pir:aip:<id>:quarter:<quarter>` lock as submit.
Inside the lock:

1. Re-fetch the PIR using `tx`.
2. If it exists and is not `Draft`, return HTTP 409.
3. If it exists and is `Draft`, delete/recreate factors and activity reviews inside the
   same transaction.
4. If it does not exist, create it.

This makes repeated autosave requests serialize cleanly.

### 11. Admin Status Routes [→ N11]

Admin status routes should not update blindly when a status transition depends on the
current state. There are two acceptable approaches.

Approach A: acquire the same logical AIP/PIR lock, re-read inside the transaction, then
apply the status change.

Approach B: use an atomic conditional update:

```ts
const result = await prisma.aIP.updateMany({
  where: {
    id,
    status: expectedCurrentStatus,
  },
  data: { status: nextStatus },
});

if (result.count === 0) {
  return c.json({ error: "This submission changed before the action completed." }, 409);
}
```

Use Approach A when the route also reads related state, merges remarks, writes child
records, or needs to coordinate with submit/resubmit routes. Use Approach B for simple
single-row transitions where the expected current status is known.

### 12. Toggle and Read-Modify-Write Routes [→ N12]

Routes like `PATCH /pirs/:id/presented` used to read a boolean and then write the opposite
value. Two simultaneous toggles can both read the same value and both write the same
opposite value, effectively dropping one toggle.

Preferred fixes:

- Change the API to accept the desired final value (`presented: true/false`) rather than
  "toggle".
- Or perform the read and update inside the same PIR lock.

Setting an explicit value is usually better because it is idempotent.

---

## Use Cases

### School User Double-Submits an AIP

A school user fills out an AIP form and clicks Submit. The network is slow; the button
remains active and the user clicks again. Two POST requests reach the server within
milliseconds of each other.

Without advisory locks:

```text
Request A: fetchAIPForUser -> null -> INSERT AIP succeeds -> HTTP 200
Request B: fetchAIPForUser -> null -> INSERT AIP -> P2002 -> HTTP 500
```

With advisory locks:

```text
Request A: lock aip:school:3:program:7:year:2025
           fetchAIPForUser -> null
           INSERT AIP
           commit and release lock
           HTTP 200

Request B: lock aip:school:3:program:7:year:2025 -> waits
           lock acquired after Request A commits
           fetchAIPForUser -> record found, status Approved
           ConflictError
           HTTP 409
```

Request A completes normally. Request B waits at the lock, reads the now-existing record,
and returns a clean conflict response. No 500. No duplicate attempt.

### Two Schools Submit Simultaneously

School A and School B submit AIPs for the same program and year at the same time.

```text
School A lock: aip:school:3:program:7:year:2025
School B lock: aip:school:8:program:7:year:2025
```

Different resources use different locks, so both requests proceed in parallel.

### Two Division Personnel Submit the Same Program

Division/CES records have `school_id = null`, so the lock must include the submitter.

```text
User 42 lock: aip:user:42:program:7:year:2025
User 99 lock: aip:user:99:program:7:year:2025
```

Those records are allowed to coexist because the partial unique index is scoped to
`created_by_user_id`. They should not block each other.

### Admin Approves While School Re-submits

A school user has a returned AIP open in their browser. An admin approves or changes the
same AIP at the same moment the school user clicks re-submit.

Correct behavior requires both routes to use the same AIP lock or an equivalent atomic
conditional update.

```text
Admin:  lock aip:school:3:program:7:year:2025
        read current status
        update status
        commit and release lock

School: lock aip:school:3:program:7:year:2025 -> waits
        re-read current status
        sees status no longer allows resubmit
        HTTP 409
```

The important point is not "admin always wins." The important point is that the second
writer makes its decision from current state after the first writer commits.

### Autosave From Two Tabs

A user has the same draft open in two tabs. Both tabs autosave at almost the same time.

Correct behavior:

1. Both requests use the same AIP or PIR draft lock.
2. The first request creates or updates the draft.
3. The second request waits, re-reads the draft, then updates the same record.
4. Both requests can return success if the record is still a draft.
5. The final saved content is last-writer-wins, but there is no duplicate row and no
   partially deleted child collection.

If last-writer-wins is not acceptable for draft content, add optimistic concurrency with
an `updated_at` or `version` column and return HTTP 409 when the client saves over a
newer draft.

---

## Testing Plan and Current Coverage

### Unit Tests

Tests now cover the pure helpers and error mapping:

- `server/lib/advisoryLock.test.ts`
  - `aipResourceKey` returns `aip:school:<id>` for school-owned records.
  - `aipResourceKey` returns `aip:user:<id>` for division/CES records.
  - `aipResourceKeyFromRecord` follows school, user, and legacy fallback rules.
  - `pirResourceKey` normalizes quarter strings consistently.
- `server/lib/prismaErrors.test.ts`
  - Known AIP/PIR `P2002` field-array targets map as known conflicts.
  - Known AIP/PIR constraint/index names map as known conflicts.
  - Unknown `P2002` targets stay unknown.
  - Targetless `P2002` errors are detectable for route-local critical sections.
- `server/routes/data/shared/asyncHandler.test.ts`
  - `HttpError` maps to its declared status.
  - `ConflictError` maps to HTTP 409.
  - Known AIP/PIR uniqueness errors map to HTTP 409.
- `server/routes/admin/submissions/pirActions.test.ts`
  - Explicit `presented` values are idempotent.
  - Missing `presented` preserves legacy toggle behavior.

### Integration Tests

`server/concurrency.integration.test.ts` contains DB-backed race tests using
`Promise.all` to issue simultaneous requests against the same resource. These tests are
guarded because they require a disposable PostgreSQL test database and valid server env.

Run them explicitly with:

```bash
cd server
AIP_PIR_CONCURRENCY_DB_TESTS=1 deno test --allow-env --allow-read --allow-net concurrency.integration.test.ts
```

Required env for the guarded tests:

- `DATABASE_URL`
- `JWT_SECRET`
- `EMAIL_CONFIG_SECRET`
- `AIP_PIR_CONCURRENCY_DB_TESTS=1`

Covered outcomes:

| Scenario | Expected result |
|---|---|
| Two simultaneous AIP submits with no existing record | one success, one HTTP 409, one AIP row |
| Two simultaneous AIP draft saves | no HTTP 500, one AIP draft row, consistent activities |
| AIP returned edit racing with admin status change | no overwrite from stale status; one request returns HTTP 409 if state changed |
| Two simultaneous PIR submits with no existing PIR | one success, one HTTP 409, one PIR row |
| Quarter casing/whitespace variants for the same PIR | one success, one HTTP 409, one canonical PIR row |
| Two simultaneous PIR draft saves | no HTTP 500, one PIR draft row, consistent reviews/factors |
| Two simultaneous explicit `presented` changes | idempotent final value |
| Duplicate division AIP against `AIP_div_personnel_unique_idx` | Prisma `P2002` target shape is logged and recognized by the parser |
| AIP activity delete followed by injected transaction failure | deleted activities roll back |
| PIR review/factor delete followed by injected transaction failure | deleted reviews/factors roll back |

Additional useful future integration tests:

- AIP submit from an existing draft racing with another submit.
- AIP draft save racing with AIP submit.
- PIR submit racing with PIR draft autosave.
- PIR returned edit racing with admin status change.

### Failure Injection Tests

Guarded DB-backed failure-injection tests now simulate errors after the child-delete
portion of the AIP and PIR delete/recreate paths. The expected result is a full rollback:
the original child rows are still present after the transaction fails.

Useful future expansion: route-level failure injection that exercises the full HTTP
handler path rather than the shared transaction/lock primitive directly.

### Manual Verification

During manual QA:

1. Open the same draft in two browser tabs and trigger autosave in both.
2. Double-click AIP Submit and PIR Submit.
3. Start a returned edit as a user while an admin changes status.
4. Confirm the UI shows 409 conflict messages rather than generic failures.
5. Confirm database row counts for AIP/PIR remain one per logical resource.

---

## Trade-offs and Constraints

| Concern | Detail |
|---|---|
| Lock granularity | One lock per logical AIP or PIR resource. Different schools, users, programs, years, AIPs, and quarters proceed independently. |
| Lock wait | The second request blocks briefly instead of failing immediately. This is acceptable for submit/autosave scale and avoids low-level duplicate errors. |
| Transaction scope | Keep validation outside the lock when possible. Put the state check and all dependent writes inside the transaction. |
| Side effects | Push notifications and SSE events only after commit. Do not push events for a transaction that might roll back. |
| Horizontal scaling | Advisory locks are per PostgreSQL instance. They are safe as long as all app servers share the same primary database for writes. |
| Hash collisions | `hashtext(resource)` has a theoretical collision risk. A collision should cause false serialization, not data corruption, because writes still re-read exact records and database constraints remain authoritative. Use a `lock_keys` table with row locks if zero collision risk is required. |
| Deadlock risk | Low when routes acquire only one lock. If multiple locks become necessary, enforce one global lock order. |
| User experience | Users should see HTTP 409 for stale or duplicate actions, with copy that explains the record changed or already exists. |
| Data integrity | Database unique constraints remain mandatory. Locks improve behavior; constraints remain the final protection. |

---

## Completed Implementation Order [→ N13]

1. Add `HttpError`, `ConflictError`, and narrow Prisma unique-conflict mapping.
2. Add `withAdvisoryLock`, namespaces, and resource-key helpers.
3. Update lookup helpers to accept `Prisma.TransactionClient`.
4. Wrap `POST /data/aips` and `POST /data/aips/draft`.
5. Wrap `POST /data/pirs` and `POST /data/pirs/draft`.
6. Move returned-edit delete/recreate paths into transactions and shared locks.
7. Update admin AIP/PIR status routes to use locks or conditional updates.
8. Replace toggle-style updates with explicit idempotent setters where feasible.
9. Add concurrency unit tests and guarded DB-backed integration tests.
10. Run automated verification for server checks, server tests, and frontend build.

---

*This document covers concurrency design for AIP and PIR submission, draft, update,
delete, and status-transition routes. For general request rate limiting, see
`server/lib/rateLimiter.ts`.*

---

## Annotation Notes

*Verified against the implementation worktree on April 25, 2026. Markers in the document
body reference entries here by number.*

---

**N1 — Document status**

This document now describes the implemented concurrency hardening, not only the original
proposal. The implemented layers are:

1. Database unique constraints remain the final integrity guarantee.
2. AIP/PIR writes use transaction-scoped PostgreSQL advisory locks.
3. Multi-query parent/child write sequences run inside transactions.
4. Expected duplicate/stale-write failures return `HttpError`/`ConflictError` responses
   instead of generic 500s.
5. Unit tests and guarded DB-backed integration tests cover the key race scenarios.

---

**N2 — asyncHandler updated**

`server/routes/data/shared/asyncHandler.ts` now handles expected errors before falling
through to the generic server-error branch:

```ts
} catch (error) {
  if (error instanceof HttpError) {
    return c.json({ error: error.message, code: error.code }, error.status as any);
  }
  if (isKnownUniqueConflict(error)) {
    return c.json({ error: "A record already exists for this request" }, 409);
  }
  logger.error(logLabel, error);
  return c.json({ error: clientMessage }, 500);
}
```

Admin submission routes now use `server/routes/admin/submissions/asyncHandler.ts`, which
uses the same expected-error mapping.

---

**N3 — Concurrency Code Surface implemented**

The table in "Concurrency Code Surface" has been implemented across the data routes,
submission-admin routes, and PIR review routes. The original "Required control" column is
now satisfied by the code paths listed in "Implemented Changes".

`fetchAIPForUser` and `fetchPIRForUser` can now receive a transaction client as their
fifth parameter, and locked critical sections pass `tx` for the check and dependent
write.

---

**N4 — §1: Domain Errors implemented**

`server/lib/errors.ts` now defines `HttpError` and `ConflictError`.

---

**N5 — §2: asyncHandler update scope completed**

Both the data `asyncHandler` and admin submission routes now map expected `HttpError`
instances and known AIP/PIR uniqueness conflicts. Admin routes use the new
`adminAsyncHandler` wrapper.

---

**N6 — `AIP_div_personnel_unique_idx` reporting shape**

`AIP_div_personnel_unique_idx` was created with a raw SQL migration
(`20260322000000_schema_drift_fix`, line 168), not via Prisma `@@unique`. Do not assume
the Prisma adapter will expose this failure in the same shape as schema-managed uniques.
It may surface the index name, field names, or no useful `target` at all. Empirically
verify which form Deno's Prisma adapter surfaces in the target deployment environment.

The other two constraint names (`AIP_school_id_program_id_year_key` and
`PIR_aip_id_quarter_key`) follow standard Prisma naming from `@@unique` and are
confirmed correct.

The implemented parser accepts both field-array targets and constraint/index-name
targets. It also exposes a separate targetless detector so only known AIP/PIR critical
sections can map a targetless `P2002` to 409.

`server/concurrency.integration.test.ts` now includes a guarded DB test that deliberately
violates `AIP_div_personnel_unique_idx`, logs the observed `meta.target` value, and
asserts that the parser recognizes either a known target or a targetless `P2002`. This
test still needs to be run against the deployment-equivalent PostgreSQL/Prisma adapter
combination to record the empirical target shape.

---

**N7 — §3: Advisory Lock Helper implemented; `hashtext` dependency**

`server/lib/advisoryLock.ts` now contains `withAdvisoryLock`, `withAdvisoryLocks`,
`LOCK_NAMESPACE`, and the AIP/PIR resource-key helpers.

`hashtext()` returns `int4` and is a PostgreSQL-internal function. It has been stable
across major PG versions in practice but is not part of the SQL standard. Document this
dependency in the module so a future database-migration assessment does not miss it.
`pg_advisory_xact_lock(int8)` (single 64-bit key) is an alternative that avoids the
namespace + hash split entirely if namespace isolation turns out not to be needed.

---

**N8 — §5: Lookup helpers updated; positional `db` param ergonomics**

`server/routes/data/shared/lookups.ts` now accepts an optional transaction client:

The implemented signature places `db` as the fifth positional parameter after an optional
`include`. Callers that need `db` but not `include` must write
`fetchAIPForUser(user, programId, year, undefined, tx)`. If this becomes awkward in
practice, consider an options object `{ include?, db? }` as the fourth parameter instead.

---

**N9 — §6: AIP Submit wrapped**

`POST /api/aips` now computes the AIP resource key from the real ownership rule, acquires
the AIP advisory lock, re-fetches using `tx`, and performs the create/update plus
activity replacement inside the same transaction. Expected duplicate/stale states now
return HTTP 409.

---

**N10 — PIR status vocabulary**

`server/routes/admin/submissions/validation.ts` defines `VALID_STATUSES` as:
`Submitted`, `Under Review`, `For CES Review`, `For Cluster Head Review`,
`For Admin Review`, `Approved`, and `Returned`. It does not include `Draft`, because
`Draft` is a persisted PIR state but not an admin status-transition target.

The `schema.prisma` `@default` comment omits `For Admin Review` and `Submitted`, even
though code paths reference both. The schema comment should be updated to match the full
status vocabulary used in production.

Counterargument to the annotation: `Submitted` should not be described as a placeholder.
It is valid in admin validation, notifications, reports, dashboards, and lookup code. The
more precise statement is that the current `POST /data/pirs` submit route does not emit
`Submitted`; it emits review-chain statuses based on role and ownership. `Reviewed` is the
one that appears to be outside the current validated vocabulary.

---

**N11 — §11: Admin status routes guarded**

Admin status routes now acquire the same AIP/PIR locks used by user data routes. PIR
status changes merge remarks inside the PIR lock. The implementation preserves existing
admin last-write-wins status semantics and does not add a new transition matrix.

---

**N12 — §12: `presented` toggle guarded and made idempotent**

`PATCH /api/admin/pirs/:id/presented` now accepts `{ presented: boolean }` and applies the
requested final value under the PIR lock. Empty-body requests still use the legacy toggle
behavior under the same lock. Both frontend callers send explicit desired values.

---

**N13 — Implementation Order completed**

The implementation order listed above has been completed in the current worktree. Two
future improvements remain outside that completed order:

- Expand failure-injection coverage to the full HTTP handler path.
- If theoretical `hashtext(resource)` collisions become unacceptable, replace advisory
  hash locks with a `lock_keys` table and row locks.
