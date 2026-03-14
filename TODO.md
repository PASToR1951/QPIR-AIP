# AIP-PIR Portal — TODO List

> **Note:** All security fixes are blocked until the Admin Function is complete.
> Do not implement any security task before Task 1 is done.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Pending |
| `[~]` | In Progress |
| `[x]` | Completed |

---

## 🏗️ Prerequisites

- [ ] **Build Admin Function** — required before all security fixes below can be implemented

---

## 🔒 Security Fixes

> Reference: `SECURITY_AUDIT.md` for full exploit details and recommended code fixes.

### P0 — Do Immediately (after Admin Function is done)

- [ ] **VULN-01** — Add JWT authentication middleware to all `/api` data routes
- [ ] **VULN-04** — Remove hardcoded JWT secret fallback — fail loudly if `JWT_SECRET` is unset
- [ ] **VULN-05** — Restrict CORS to frontend origin only — remove wildcard `cors()`

### P1 — Same Sprint

- [ ] **VULN-02** — Fix IDOR on draft read/delete — verify `userId` from token, not URL param
- [ ] **VULN-03** — Fix IDOR on draft creation — derive `user_id` from JWT, never from request body
- [ ] **VULN-06** — Enforce school ownership on AIP/PIR creation — lock `school_id` to token identity
- [ ] **VULN-14** — Validate `role` on registration — whitelist allowed self-register roles only
- [ ] **VULN-22** — Gate registration behind admin invite or admin-only endpoint
- [ ] **VULN-23** — Add `Authorization` header to all frontend axios calls via global interceptor

### P2 — Next Sprint

- [ ] **VULN-07** — Add input validation on registration — email format, password min length, field limits
- [ ] **VULN-11** — Add rate limiting on login and register endpoints
- [ ] **VULN-10** — Sanitize draft file paths before `Deno.readTextFile`/`remove` — prevent path traversal
- [ ] **VULN-13** — Remove `dev_pir_unlocked` localStorage bypass from `PIRRouteGuard`
- [ ] **VULN-24** — Wrap all `JSON.parse(localStorage)` calls in try-catch
- [ ] **VULN-25** — Add `--allow-write=data/drafts` to Deno task permission flags

### P3 — Hardening Pass

- [ ] **VULN-12** — Move JWT token from `localStorage` to `HttpOnly` cookie
- [ ] **VULN-15** — Minimize JWT payload — remove `name` and `school_name` from token claims
- [ ] **VULN-08** — Rotate database credentials — replace weak `password` with a strong random secret
- [ ] **VULN-19** — Add security response headers — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- [ ] **VULN-20** — Add `Content-Security-Policy` header to frontend
- [ ] **VULN-27** — Check JWT expiry on client in `ProtectedRoute` — redirect to login on expiry
- [ ] **VULN-26** — Replace cascade deletes with `Restrict` + soft delete on AIP/PIR relations

### P4 — Nice to Have

- [ ] **VULN-28** — Remove `fillDevData()` utility from production bundle
- [ ] **VULN-21** — Add audit logging for auth events and AIP/PIR mutations
- [ ] **VULN-18** — Add CSRF protection — `SameSite` cookies and token validation

---

## 📦 Release

- [ ] Bump version to `1.0.1-beta` and update `version.js` changelog with `🔒 security` entries

---

## 📋 Backlog (Future Features)

- [ ] Admin Function
  - [ ] Admin dashboard — view all registered accounts
  - [ ] Account approval / invite-code registration flow
  - [ ] Role management — assign / revoke Division Personnel access
  - [ ] School-user mapping management
  - [ ] View all submitted AIPs and PIRs across all schools
  - [ ] Soft delete / archive records

---

*Last updated: 2026-03-15*
*Security findings reference: `SECURITY_AUDIT.md`*
