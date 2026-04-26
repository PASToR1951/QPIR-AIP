import { useEffect, useState } from 'react';

const SESSION_EVENT = 'auth:session-updated';
const LOGOUT_BLOCK_KEY = 'auth:explicitLogout';
const EXPLICIT_LOGOUT_ERROR = 'EXPLICITLY_LOGGED_OUT';
const SESSION_STORAGE_KEYS = ['token', 'user', 'tokenExpiry', 'idleExpiry', 'idleTimeoutSeconds'];
const SENSITIVE_LOCAL_PREFIXES = ['aip_draft_', 'pir_draft_', 'onboarding:'];
const SENSITIVE_SESSION_PREFIXES = ['onboarding:'];

function parseStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function dispatchSessionUpdate(user) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: user }));
}

function safeRemoveStorageKeys(storage, keys) {
  try {
    keys.forEach((key) => storage.removeItem(key));
  } catch {
    // Storage can fail in private browsing or hardened browser modes.
  }
}

function safeRemoveByPrefix(storage, prefixes) {
  try {
    Object.keys(storage)
      .filter((key) => prefixes.some((prefix) => key.startsWith(prefix)))
      .forEach((key) => storage.removeItem(key));
  } catch {
    // Ignore storage failures; server-side session validation remains authoritative.
  }
}

function setLogoutBlock() {
  try {
    localStorage.setItem(LOGOUT_BLOCK_KEY, String(Date.now()));
  } catch {
    // Non-critical; logout still clears the server cookie when the request succeeds.
  }
}

function clearLogoutBlock() {
  try {
    localStorage.removeItem(LOGOUT_BLOCK_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function hasLogoutBlock() {
  try {
    return Boolean(localStorage.getItem(LOGOUT_BLOCK_KEY));
  } catch {
    return false;
  }
}

function storeSessionMetadata({ expiresAt }) {
  sessionStorage.setItem('tokenExpiry', String(expiresAt));
  sessionStorage.removeItem('idleExpiry');
  sessionStorage.removeItem('idleTimeoutSeconds');
}

function splitSessionResponse(payload) {
  const { expiresAt, ...user } = payload;
  return {
    user,
    metadata: { expiresAt },
  };
}

export const auth = {
  getUser:    ()  => parseStoredUser(),
  getExpiry:  ()  => Number.parseInt(sessionStorage.getItem('tokenExpiry') || '0', 10) || 0,
  isExpired:  ()  => Date.now() / 1000 >= auth.getExpiry(),
  isObserver: () => auth.getUser()?.role === 'Observer',
  isAdminPanelRole: (role = auth.getUser()?.role) => ['Admin', 'Observer'].includes(role),
  setSession: (user, exp) => {
    clearLogoutBlock();
    sessionStorage.setItem('user', JSON.stringify(user));
    storeSessionMetadata({ expiresAt: exp });
    dispatchSessionUpdate(user);
  },
  refreshSession: async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('SESSION_REFRESH_FAILED');

    const { user, metadata } = splitSessionResponse(await res.json());
    auth.setSession(user, metadata.expiresAt);
    return user;
  },
  restoreSession: async () => {
    if (hasLogoutBlock()) throw new Error(EXPLICIT_LOGOUT_ERROR);
    return auth.refreshSession();
  },
  isExplicitLogoutError: (err) => err?.message === EXPLICIT_LOGOUT_ERROR,
  clearBrowserSession: ({ clearDrafts = false } = {}) => {
    safeRemoveStorageKeys(sessionStorage, SESSION_STORAGE_KEYS);
    safeRemoveByPrefix(sessionStorage, SENSITIVE_SESSION_PREFIXES);
    if (clearDrafts) {
      safeRemoveByPrefix(localStorage, SENSITIVE_LOCAL_PREFIXES);
    }
    dispatchSessionUpdate(null);
  },
  expireSession: async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: 'POST', credentials: 'include'
      });
    } catch {
      // The server may already consider the session invalid; local cleanup still applies.
    }
    auth.clearBrowserSession({ clearDrafts: false });
  },
  logout: async ({ clearDrafts = true } = {}) => {
    setLogoutBlock();
    let logoutError = null;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: 'POST', credentials: 'include'
      });
      if (!res.ok) throw new Error('LOGOUT_CONFIRMATION_FAILED');
    } catch (err) {
      logoutError = err;
    } finally {
      auth.clearBrowserSession({ clearDrafts });
    }

    if (logoutError) {
      throw logoutError;
    }
  },
  clearSession: async (options) => {
    await auth.logout(options);
  }
};

export function useUser() {
  const [user, setUser] = useState(() => auth.getUser());

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'user') setUser(auth.getUser());
    };
    const sessionHandler = (e) => setUser(e.detail ?? auth.getUser());
    window.addEventListener('storage', handler);
    window.addEventListener(SESSION_EVENT, sessionHandler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener(SESSION_EVENT, sessionHandler);
    };
  }, []);

  return user;
}
