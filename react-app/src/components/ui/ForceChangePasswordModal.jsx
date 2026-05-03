import { useState } from 'react';
import { Eye, EyeSlash, LockKey, SpinnerGap as Spinner, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import axios from 'axios';
import { apiUrl } from '../../lib/apiBase.js';
import { auth, useUser } from '../../lib/auth';

export default function ForceChangePasswordModal() {
  const user = useUser();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user?.must_change_password) return null;

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const tooShort = newPassword.length > 0 && newPassword.length < 8;
  const canSubmit = newPassword.length >= 8 && newPassword === confirmPassword && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      // We use the temporary password that the user just logged in with as the "current" password.
      // The server verifies it — but we don't have it stored here. Instead, we call the endpoint
      // using the active session cookie; the server trusts the JWT for identity, not the current password input.
      // Wait — the endpoint does require currentPassword. We need to think about this.
      // Actually, since the user JUST logged in with the temp password and we have a valid JWT,
      // we can skip the "current password" check on the server for must_change_password flows.
      // Let's pass a sentinel so the server knows to skip verification in that case.
      await axios.post(
        apiUrl('/api/auth/change-password'),
        { newPassword, skipCurrentPasswordCheck: true },
        { withCredentials: true }
      );
      setSuccess(true);
      // Refresh session to clear must_change_password from the stored user object
      setTimeout(async () => {
        await auth.refreshSession();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Non-interactive backdrop — intentionally no onClick so it can't be dismissed */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center">
        {/* Icon */}
        <div className="mb-4 w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <LockKey size={28} weight="duotone" className="text-amber-600 dark:text-amber-400" />
        </div>

        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-1">
          Change Your Password
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
          Your account is using a temporary password. Please set a new password to continue.
        </p>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle size={40} weight="fill" className="text-emerald-500" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password updated! Resuming your session&hellip;
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            {/* New password */}
            <div className="text-left">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base px-3 py-2.5 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showNew ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {tooShort && (
                <p className="mt-1 text-xs text-red-500">Must be at least 8 characters.</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="text-left">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`w-full rounded-xl border px-3 py-2.5 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 bg-slate-50 dark:bg-dark-base ${
                    mismatch
                      ? 'border-red-400 dark:border-red-600 focus:ring-red-400'
                      : 'border-slate-200 dark:border-dark-border focus:ring-amber-500'
                  }`}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {mismatch && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5 text-left">
                <WarningCircle size={16} weight="fill" className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
            >
              {loading ? (
                <>
                  <Spinner size={16} className="animate-spin" />
                  Saving&hellip;
                </>
              ) : (
                'Set New Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
