import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiUrl } from './lib/apiBase.js';
import { auth } from './lib/auth';

function roleToDashboard(role) {
  if (auth.isAdminPanelRole(role)) return '/admin';
  if (['CES-SGOD', 'CES-ASDS', 'CES-CID'].includes(role)) return '/ces';
  return '/';
}

function normalizeRedirect(target) {
  if (!target || !target.startsWith('/') || target.startsWith('//')) return null;
  return target;
}

export default function MagicLinkCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('Verifying your sign-in link…');

  useEffect(() => {
    const token = searchParams.get('token');
    const redirect = normalizeRedirect(searchParams.get('redirect'));

    if (!token) {
      navigate('/login?message=' + encodeURIComponent('Magic link token is missing.'), {
        replace: true,
      });
      return;
    }

    fetch(apiUrl('/api/auth/magic-link/verify'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || 'Magic link could not be completed.');
        }

        auth.setSession(payload.user, payload.expiresAt);
        navigate(redirect || roleToDashboard(payload.user?.role), { replace: true });
      })
      .catch((error) => {
        setStatusMessage('Magic link could not be completed. Redirecting…');
        navigate('/login?message=' + encodeURIComponent(error.message || 'Magic link could not be completed.'), {
          replace: true,
        });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-slate-50 dark:bg-dark-base min-h-[100svh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400">
        <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" />
        <p className="text-sm font-medium">{statusMessage}</p>
      </div>
    </div>
  );
}
