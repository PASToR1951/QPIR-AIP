// server/routes/oauth.ts
// OAuth 2.0 SSO routes for Google Workspace.
// Domain-locked to @deped.gov.ph via hosted-domain and email checks.
//
// Mounted at /api/auth/oauth in server.ts (BEFORE the /api/auth router to avoid shadowing).
//
// Endpoints:
//   GET /google                 — Initiate Google OAuth flow
//   GET /google/callback        — Google authorization code callback

import { type Context, Hono } from "hono";
import { prisma } from "../db/client.ts";
import { logger } from "../lib/logger.ts";
import { getClientIp } from "../lib/clientIp.ts";
import {
  DEFAULT_ALLOWED_ORIGIN,
  getAllowedOrigins,
  getPrimaryAllowedOrigin,
  isAllowedOrigin,
  normalizeOrigin,
} from "../lib/origins.ts";
import { writeUserLog } from "../lib/userActivityLog.ts";
import { createSessionCookie } from "../lib/userSessions.ts";
import {
  base64url,
  base64urlDecode,
  generateCodeChallenge,
  generateCodeVerifier,
  signHmac,
  timingSafeEqual,
} from "../lib/oauth.ts";

const oauthRoutes = new Hono();

// ── Environment helpers ───────────────────────────────────────────────────────

function getEnv(key: string): string {
  return Deno.env.get(key) ?? "";
}

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1" ||
    host === "[::1]";
}

/** URL that the IdP sends the auth code back to (backend base URL) */
function redirectBase(c: Context): string {
  const configured = getEnv("OAUTH_REDIRECT_BASE_URL");
  const requestUrl = new URL(c.req.url);
  if (isLoopbackHost(requestUrl.hostname)) return requestUrl.origin;
  return configured || requestUrl.origin || "http://localhost:3001";
}

/** URL of the React frontend — used for the final redirect after login */
function frontendUrl(c?: Context): string {
  const requestFrontendOrigin = c
    ? normalizeOrigin(c.req.header("Origin") || c.req.header("Referer"))
    : null;

  if (requestFrontendOrigin && isAllowedOrigin(requestFrontendOrigin)) {
    return requestFrontendOrigin;
  }

  if (c) {
    const requestHostname = new URL(c.req.url).hostname.toLowerCase();
    const matchingOrigin = getAllowedOrigins(
      getEnv("ALLOWED_ORIGIN") || DEFAULT_ALLOWED_ORIGIN,
    ).find((origin) =>
      new URL(origin).hostname.toLowerCase() === requestHostname
    );
    if (matchingOrigin) return matchingOrigin;
  }

  return getPrimaryAllowedOrigin(
    getEnv("ALLOWED_ORIGIN") || DEFAULT_ALLOWED_ORIGIN,
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Build a signed state string and persist the PKCE verifier in OAuthState. */
async function createOAuthState(
  provider: "google",
  options?: {
    frontendOrigin?: string;
    redirectBase?: string;
  },
): Promise<{
  state: string;
  codeVerifier: string;
  codeChallenge: string;
}> {
  const secret = getEnv("OAUTH_STATE_SECRET");
  if (!secret) throw new Error("OAUTH_STATE_SECRET is not configured");

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const nonce = crypto.randomUUID();
  const payloadStr = base64url(
    new TextEncoder().encode(JSON.stringify({
      nonce,
      provider,
      frontendOrigin: options?.frontendOrigin,
      redirectBase: options?.redirectBase,
    })),
  );
  const hmacSig = await signHmac(payloadStr, secret);
  const state = `${payloadStr}.${hmacSig}`;

  await prisma.oAuthState.create({
    data: {
      nonce,
      provider,
      hmac: hmacSig,
      code_verifier: codeVerifier,
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  return { state, codeVerifier, codeChallenge };
}

type OAuthProvider = "google";
type GoogleIdPayload = {
  iss?: string;
  aud?: string;
  exp?: number;
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  hd?: string;
};

type GoogleJwk = JsonWebKey & {
  kid?: string;
  alg?: string;
};

let googleJwksCache: { expiresAt: number; keys: GoogleJwk[] } | null = null;

/** Validate state signature and consume the OAuthState row (single-use). */
async function consumeOAuthState(
  state: string | undefined,
  expectedProvider: OAuthProvider,
): Promise<
  | {
    ok: true;
    codeVerifier: string;
    frontendOrigin?: string;
    redirectBase?: string;
  }
  | { ok: false; error: string }
> {
  if (!state) return { ok: false, error: "missing_state" };

  const secret = getEnv("OAUTH_STATE_SECRET");
  if (!secret) return { ok: false, error: "server_misconfigured" };

  const dotIdx = state.lastIndexOf(".");
  if (dotIdx === -1) return { ok: false, error: "invalid_state" };

  const payloadStr = state.slice(0, dotIdx);
  const receivedHmac = state.slice(dotIdx + 1);
  const expectedHmac = await signHmac(payloadStr, secret);

  if (!timingSafeEqual(receivedHmac, expectedHmac)) {
    return { ok: false, error: "invalid_state" };
  }

  let nonce: string;
  let provider: string;
  let frontendOrigin: string | undefined;
  let stateRedirectBase: string | undefined;
  try {
    const decoded = JSON.parse(
      new TextDecoder().decode(base64urlDecode(payloadStr)),
    );
    nonce = decoded.nonce;
    provider = decoded.provider;
    const decodedFrontendOrigin = normalizeOrigin(decoded.frontendOrigin);
    frontendOrigin = decodedFrontendOrigin &&
        isAllowedOrigin(decodedFrontendOrigin)
      ? decodedFrontendOrigin
      : undefined;
    stateRedirectBase = normalizeOrigin(decoded.redirectBase) ?? undefined;
  } catch {
    return { ok: false, error: "invalid_state" };
  }

  if (provider !== expectedProvider) {
    return { ok: false, error: "invalid_state" };
  }

  const row = await prisma.oAuthState.findUnique({ where: { nonce } });
  if (!row) return { ok: false, error: "state_expired" };

  // Delete unconditionally — single-use even if expired
  await prisma.oAuthState.delete({ where: { nonce } });

  if (row.expires_at < new Date()) return { ok: false, error: "state_expired" };

  return {
    ok: true,
    codeVerifier: row.code_verifier,
    frontendOrigin,
    redirectBase: stateRedirectBase,
  };
}

/** After verifying the user's identity, find/create their DB record and issue a session. */
async function finishOAuthLogin(
  provider: OAuthProvider,
  oauthSubject: string,
  email: string,
): Promise<
  | {
    ok: true;
    user: {
      id: number;
      role: string;
      school_id: number | null;
      school: { cluster_id: number | null } | null;
    };
  }
  | { ok: false; error: "account_pending" | "account_inactive" }
> {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Find by immutable IdP subject (fast path for returning users)
  let user = await prisma.user.findFirst({
    where: { oauth_provider: provider, oauth_subject: oauthSubject },
    include: { school: true },
  });

  if (!user) {
    // 2. Fallback: find by email (existing password-provisioned account)
    const byEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { school: true },
    });

    if (byEmail) {
      // Backfill OAuth fields so future logins use the faster subject lookup
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: { oauth_provider: provider, oauth_subject: oauthSubject },
        include: { school: true },
      });
    } else {
      // 3. Unknown user — create as Pending and require admin activation
      await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: null,
          role: "Pending",
          is_active: false,
          oauth_provider: provider,
          oauth_subject: oauthSubject,
        },
      });
      return { ok: false, error: "account_pending" };
    }
  }

  if (!user.is_active) {
    return {
      ok: false,
      error: user.role === "Pending" ? "account_pending" : "account_inactive",
    };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      role: user.role,
      school_id: user.school_id,
      school: user.school
        ? { cluster_id: user.school.cluster_id ?? null }
        : null,
    },
  };
}

// ── Google Workspace ──────────────────────────────────────────────────────────

function decodeJwtPart(part: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(base64urlDecode(part))) as Record<
    string,
    unknown
  >;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function fetchGoogleJwks(): Promise<GoogleJwk[]> {
  const now = Date.now();
  if (googleJwksCache && googleJwksCache.expiresAt > now) {
    return googleJwksCache.keys;
  }

  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!response.ok) {
    throw new Error(`Google JWKS fetch failed: ${response.status}`);
  }

  const data = await response.json() as { keys?: GoogleJwk[] };
  const cacheControl = response.headers.get("cache-control") ?? "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeMs = maxAgeMatch ? Number(maxAgeMatch[1]) * 1000 : 60 * 60 * 1000;

  googleJwksCache = {
    expiresAt: now + Math.max(60_000, maxAgeMs),
    keys: Array.isArray(data.keys) ? data.keys : [],
  };
  return googleJwksCache.keys;
}

function isExpectedGooglePayload(
  payload: GoogleIdPayload,
  clientId: string,
): payload is GoogleIdPayload & { sub: string; email: string } {
  const now = Math.floor(Date.now() / 1000);
  const email = (payload.email ?? "").toLowerCase();
  return (
    (payload.iss === "https://accounts.google.com" ||
      payload.iss === "accounts.google.com") &&
    payload.aud === clientId &&
    typeof payload.exp === "number" &&
    payload.exp > now &&
    payload.email_verified === true &&
    payload.hd === "deped.gov.ph" &&
    email.endsWith("@deped.gov.ph") &&
    typeof payload.sub === "string" &&
    payload.sub.length > 0
  );
}

async function verifyGoogleIdToken(
  idToken: string,
  clientId: string,
): Promise<(GoogleIdPayload & { sub: string; email: string }) | null> {
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;

  const header = decodeJwtPart(parts[0]) as { alg?: string; kid?: string };
  if (header.alg !== "RS256" || !header.kid) return null;

  const jwks = await fetchGoogleJwks();
  const jwk = jwks.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) return null;

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    toArrayBuffer(base64urlDecode(parts[2])),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!verified) return null;

  const payload = decodeJwtPart(parts[1]) as GoogleIdPayload;
  return isExpectedGooglePayload(payload, clientId) ? payload : null;
}

oauthRoutes.get("/google", async (c) => {
  const clientId = getEnv("GOOGLE_CLIENT_ID");
  if (!clientId) {
    logger.error("Google OAuth is not configured (missing GOOGLE_CLIENT_ID)");
    return c.redirect(`${frontendUrl(c)}/login?error=oauth_misconfigured`);
  }

  try {
    const base = redirectBase(c);
    const { state, codeChallenge } = await createOAuthState("google", {
      frontendOrigin: frontendUrl(c),
      redirectBase: base,
    });
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: `${base}/api/auth/oauth/google/callback`,
      scope: "openid profile email",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "select_account",
      hd: "deped.gov.ph", // Hint: restrict Google account picker to this domain
      access_type: "online",
    });
    return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  } catch (err) {
    logger.error("Google OAuth initiation failed", err);
    return c.redirect(`${frontendUrl(c)}/login?error=oauth_error`);
  }
});

oauthRoutes.get("/google/callback", async (c) => {
  const { code, state, error } = c.req.query();
  const fallbackFrontend = frontendUrl();

  if (error) {
    const stateResult = await consumeOAuthState(state, "google");
    const fe = stateResult.ok
      ? stateResult.frontendOrigin || fallbackFrontend
      : fallbackFrontend;
    return c.redirect(`${fe}/login?error=oauth_denied`);
  }

  const stateResult = await consumeOAuthState(state, "google");
  if (!stateResult.ok) {
    return c.redirect(`${fallbackFrontend}/login?error=${stateResult.error}`);
  }

  const fe = stateResult.frontendOrigin || fallbackFrontend;
  const callbackRedirectBase = stateResult.redirectBase || redirectBase(c);
  const clientId = getEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getEnv("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    logger.error(
      "Google OAuth callback is not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)",
    );
    return c.redirect(`${fe}/login?error=oauth_misconfigured`);
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${callbackRedirectBase}/api/auth/oauth/google/callback`,
        grant_type: "authorization_code",
        code_verifier: stateResult.codeVerifier,
      }).toString(),
    });
    const tokenData = await tokenRes.json() as Record<string, string>;

    if (!tokenData.id_token) {
      logger.error("Google token exchange: no id_token in response", {
        error: tokenData.error,
      });
      return c.redirect(`${fe}/login?error=token_exchange_failed`);
    }

    const idPayload = await verifyGoogleIdToken(tokenData.id_token, clientId);
    if (!idPayload) {
      logger.warn("Google OAuth callback rejected invalid id_token");
      return c.redirect(`${fe}/login?error=token_validation_failed`);
    }

    const email = idPayload.email.toLowerCase();
    if (idPayload.hd !== "deped.gov.ph" || !email.endsWith("@deped.gov.ph")) {
      return c.redirect(`${fe}/login?error=domain_not_allowed`);
    }

    const oauthSubject = idPayload.sub; // sub = immutable Google user ID
    const result = await finishOAuthLogin("google", oauthSubject, email);

    if (!result.ok) return c.redirect(`${fe}/login?error=${result.error}`);

    await createSessionCookie(c, result.user);
    writeUserLog({
      userId: result.user.id,
      action: "login",
      details: { method: "oauth", provider: "google" },
      ipAddress: getClientIp(c),
    });
    return c.redirect(`${fe}/oauth/callback`);
  } catch (err) {
    logger.error("Google OAuth callback error", err);
    return c.redirect(`${fe}/login?error=oauth_error`);
  }
});

export default oauthRoutes;
