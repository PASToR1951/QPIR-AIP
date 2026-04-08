import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from './lib/auth';

const ERROR_MESSAGES = {
  oauth_denied:          'You cancelled the sign-in request.',
  domain_not_allowed:    'Only @deped.gov.ph accounts are allowed.',
  account_pending:       'Your account is pending admin approval. Please contact your administrator.',
  account_inactive:      'Your account has been deactivated. Please contact your administrator.',
  invalid_state:         'Invalid sign-in session. Please try again.',
  state_expired:         'Sign-in session expired. Please try again.',
  token_exchange_failed: 'Could not complete sign-in. Please try again.',
  oauth_misconfigured:   'This sign-in method is not yet configured. Please use email and password.',
  oauth_error:           'An unexpected error occurred during sign-in. Please try again.',
};

function roleToDashboard(role) {
  if (auth.isAdminPanelRole(role)) return '/admin';
  if (['CES-SGOD', 'CES-ASDS', 'CES-CID'].includes(role)) return '/ces';
  if (role === 'Cluster Coordinator') return '/cluster-head';
  return '/';
}

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('Completing sign-in…');

  useEffect(() => {
    const error = searchParams.get('error');

    if (error) {
      const message = ERROR_MESSAGES[error] ?? 'Sign-in failed. Please try again.';
      navigate(`/login?message=${encodeURIComponent(message)}`, { replace: true });
      return;
    }

    // Cookie is already set by the server, so confirm it before entering the app.
    auth.refreshSession()
      .then((user) => {
        navigate(roleToDashboard(user.role), { replace: true });
      })
      .catch(() => {
        setStatusMessage('Sign-in failed. Redirecting…');
        navigate('/login?message=' + encodeURIComponent('Sign-in failed. Please try again.'), {
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
