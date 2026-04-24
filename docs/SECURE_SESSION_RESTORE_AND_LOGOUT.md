# Secure Session Restore and Logout Cleanup

## Summary

The application restores signed-in users across tab, browser, and device restarts only while the server-side session remains valid. Authentication secrets stay out of JavaScript-accessible storage. Session validity is enforced by the backend through the HttpOnly JWT cookie, the `user_sessions` record, absolute expiry, role-based idle expiry, revocation state, role matching, and active-user checks.

Logout is treated as a security boundary. The backend revokes the current session and expires the HttpOnly cookie, while the frontend clears app-managed browser state, including local AIP and PIR drafts. The app does not store plaintext credentials or bearer tokens in browser storage, and it does not claim to remove entries from browser password managers.

This change supports the Data Privacy Act of 2012 expectation that personal data systems use reasonable organizational, technical, and physical security measures to protect confidentiality, integrity, and availability.

## Session Policy

| Policy | Value |
| --- | --- |
| Absolute session lifetime | 24 hours |
| Broad-access idle timeout | 15 minutes |
| Regular data-entry idle timeout | 30 minutes |
| Token storage | HttpOnly cookie only |
| JavaScript auth storage | Non-secret user and expiry metadata only |

Broad-access roles use the 15-minute idle timeout:

- `Admin`
- `Observer`
- CES roles
- `Cluster Coordinator`

Regular data-entry roles use the 30-minute idle timeout:

- `School`
- `Division Personnel`

## Backend Behavior

`getUserFromToken` validates the current request against the signed JWT and tracked session row. It rejects requests when any of these are true:

- the token is missing a `sid`;
- the session row does not exist;
- the session belongs to a different user;
- the session role no longer matches the token role;
- the session has been revoked;
- the session has passed its absolute expiry;
- the session has passed its role-based idle expiry;
- the user is inactive.

When a session is idle-expired, the server marks the current `user_sessions` row revoked before returning `401`. Active sessions periodically update `last_seen_at` so the idle window can move forward without rewriting the session on every request.

`GET /api/auth/me` returns only non-secret metadata needed by the frontend:

- `expiresAt`
- `idleExpiresAt`
- `idleTimeoutSeconds`

## Frontend Behavior

Protected routes now perform a session bootstrap before route guards decide whether to redirect. If `sessionStorage` is empty after a tab, browser, or device restart, the app calls `/api/auth/me` with credentials. A successful response restores only non-secret user metadata and expiry hints into `sessionStorage`. A failed response clears local app session state and redirects to `/login`.

The login page also checks `/api/auth/me` so users with a still-valid cookie are silently redirected away from `/login`. When the user explicitly logged out, silent restore is blocked and the login page shows a clear signed-out notice.

## Logout Cleanup

Frontend logout awaits `POST /api/auth/logout` before navigating to `/login`. The backend revokes only the current `sid`, expires the `token` cookie with matching cookie attributes, and writes the logout audit entry.

After the server confirms logout, the frontend clears:

- auth and session metadata from `sessionStorage`;
- legacy `token` keys;
- onboarding and session prompt keys;
- local `aip_draft_*` and `pir_draft_*` drafts;
- per-user local onboarding cache keys.

Accessibility preferences are intentionally preserved. Browser password-manager entries are outside the app's reliable control and are not deleted by this flow.

If server logout fails because of a network or server issue, the UI warns that logout could not be confirmed. The browser still blocks silent auto-restore locally for that explicit logout attempt.

## Verification

Backend checks:

- role-based idle timeout selection;
- active session validation;
- idle-expired session revocation;
- absolute-expired session rejection;
- revoked session rejection;
- inactive-user rejection;
- role-mismatch rejection;
- logout cookie clearing and current-session revocation.

Frontend checks:

- login, refresh page, and remain signed in;
- close and reopen browser within the absolute and idle windows, then restore session;
- broad-access user idles for 15 minutes and is redirected on next request;
- School or Division Personnel user idles for 30 minutes and is redirected on next request;
- logout removes app-managed browser session data and local AIP/PIR drafts;
- reload after logout does not restore the session;
- externally revoked sessions return `401` and return the user to login.
