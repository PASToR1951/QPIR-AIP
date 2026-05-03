import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from './lib/auth';
import { getOAuthErrorMessage, LOGIN_COPY } from './lib/authCopy.js';

function roleToDashboard(role) {
  if (auth.isAdminPanelRole(role)) return '/admin';
  if (['CES-SGOD', 'CES-ASDS', 'CES-CID'].includes(role)) return '/ces';
  return '/';
}

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('Completing sign-in…');

  useEffect(() => {
    const error = searchParams.get('error');

    if (error) {
      const message = getOAuthErrorMessage(error);
      navigate(`/login?message=${encodeURIComponent(message)}`, { replace: true });
      return;
    }

    // Cookie is already set by the server, so confirm it before entering the app.
    auth.refreshSession()
      .then((user) => {
        navigate(roleToDashboard(user.role), { replace: true });
      })
      .catch(() => {
        setStatusMessage('Sign-in could not be completed. Redirecting…');
        navigate('/login?message=' + encodeURIComponent(LOGIN_COPY.oauthRedirectError), {
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
