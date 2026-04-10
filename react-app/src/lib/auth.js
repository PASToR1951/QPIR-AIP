import { useEffect, useState } from 'react';

const SESSION_EVENT = 'auth:session-updated';

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

export const auth = {
  getUser:    ()  => parseStoredUser(),
  getExpiry:  ()  => parseInt(sessionStorage.getItem('tokenExpiry') || '0', 10),
  isExpired:  ()  => Date.now() / 1000 >= auth.getExpiry(),
  isObserver: () => auth.getUser()?.role === 'Observer',
  isAdminPanelRole: (role = auth.getUser()?.role) => ['Admin', 'Observer'].includes(role),
  setSession: (user, exp) => {
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('tokenExpiry', String(exp));
    dispatchSessionUpdate(user);
  },
  refreshSession: async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('SESSION_REFRESH_FAILED');

    const { expiresAt, ...user } = await res.json();
    auth.setSession(user, expiresAt);
    return user;
  },
  clearSession: async () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('tokenExpiry');
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith('onboarding:loginPrompt:'))
      .forEach((key) => sessionStorage.removeItem(key));
    dispatchSessionUpdate(null);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: 'POST', credentials: 'include'
      });
    } catch {
      // Ignore network errors on logout
    }
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
