export const SIGN_IN_FAILED_TITLE = "We couldn't sign you in";

export const OAUTH_ERROR_MESSAGES = {
  oauth_denied: 'Google sign-in was cancelled. Please try again.',
  domain_not_allowed: 'Please use your DepEd email account to sign in.',
  account_pending: 'Your account is waiting for admin approval. Please contact your administrator.',
  account_inactive: 'Your account is inactive. Please contact your administrator.',
  invalid_state: 'Your sign-in session was not valid. Please try again.',
  state_expired: 'Your sign-in session expired. Please try again.',
  token_exchange_failed: 'We could not complete Google sign-in. Please try again.',
  oauth_misconfigured: 'Google sign-in is not ready yet. Please use Email & Password for now.',
  oauth_error: 'We could not complete Google sign-in. Please try again.',
};

export const LOGIN_COPY = {
  genericError: 'We could not sign you in. Please try again.',
  invalidCredentials: 'We could not find an account that matches that email and password. Please try again.',
  sessionRefreshError: 'Sign-in reached the server, but this browser did not keep the session. Refresh the page and try again.',
  oauthRedirectError: 'We could not finish signing you in. Please try again.',
};

export function getOAuthErrorMessage(errorCode) {
  return OAUTH_ERROR_MESSAGES[errorCode] ?? LOGIN_COPY.genericError;
}
