# Secure Session Restore and Logout Cleanup

## Summary

The application restores signed-in users across tab, browser, and device restarts only while the server-side session remains valid. Authentication secrets stay out of JavaScript-accessible storage. Session validity is enforced by the backend through the HttpOnly JWT cookie, the `user_sessions` record, absolute expiry, revocation state, role matching, and active-user checks.

Logout is treated as a security boundary. The backend revokes the current session and expires the HttpOnly cookie, while the frontend clears app-managed browser state, including local AIP and PIR drafts. The app does not store plaintext credentials or bearer tokens in browser storage, and it does not claim to remove entries from browser password managers.

This change supports the Data Privacy Act of 2012 expectation that personal data systems use reasonable organizational, technical, and physical security measures to protect confidentiality, integrity, and availability.

## Session Policy

| Policy | Value |
| --- | --- |
| Absolute session lifetime | 24 hours |
| Idle timeout | None; users remain signed in until absolute expiry or revocation |
| Token storage | HttpOnly cookie only |
| JavaScript auth storage | Non-secret user and expiry metadata only |

## Backend Behavior

`getUserFromToken` validates the current request against the signed JWT and tracked session row. It rejects requests when any of these are true:

- the token is missing a `sid`;
- the session row does not exist;
- the session belongs to a different user;
- the session role no longer matches the token role;
- the session has been revoked;
- the session has passed its absolute expiry;
- the user is inactive.

Active sessions periodically update `last_seen_at` so device-management views can show recent activity without rewriting the session on every request. `last_seen_at` is no longer used to invalidate sessions.

`GET /api/auth/me` returns only non-secret metadata needed by the frontend:

- `expiresAt`

## Frontend Behavior

Protected routes now perform a session bootstrap before route guards decide whether to redirect. If `sessionStorage` is empty after a tab, browser, or device restart, the app calls `/api/auth/me` with credentials. A successful response restores only non-secret user metadata and expiry hints into `sessionStorage`. A failed response clears local app session state and redirects to `/login`.

The login page also checks `/api/auth/me` so users with a still-valid cookie are silently redirected away from `/login`. When the user explicitly logged out, silent restore is blocked and the login page shows a clear signed-out notice.

## Logout Cleanup

Frontend logout awaits `POST /api/auth/logout` before navigating to `/login`. The backend revokes only the current `sid`, expires the `token` cookie with matching cookie attributes, and writes the logout audit entry.

After the server confirms logout, the frontend clears:

- auth and session metadata from `sessionStorage`;
- legacy `token` keys;
- legacy idle-expiry metadata;
- onboarding and session prompt keys;
- local `aip_draft_*` and `pir_draft_*` drafts;
- per-user local onboarding cache keys.

Accessibility preferences are intentionally preserved. Browser password-manager entries are outside the app's reliable control and are not deleted by this flow.

If server logout fails because of a network or server issue, the UI warns that logout could not be confirmed. The browser still blocks silent auto-restore locally for that explicit logout attempt.

## Verification

Backend checks:

- active session validation;
- absolute-expired session rejection;
- revoked session rejection;
- inactive-user rejection;
- role-mismatch rejection;
- logout cookie clearing and current-session revocation.

Frontend checks:

- login, refresh page, and remain signed in;
- close and reopen browser within the absolute session lifetime, then restore session;
- users remain signed in after periods of inactivity while the absolute session is still valid;
- logout removes app-managed browser session data and local AIP/PIR drafts;
- reload after logout does not restore the session;
- externally revoked sessions return `401` and return the user to login.
