import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XCircle, Desktop, SignOut, ShieldCheck } from '@phosphor-icons/react';
import api from '../../lib/api.js';
import { ConfirmationModal } from './ConfirmationModal.jsx';
import { SESSION_STATUS_STYLES, formatSessionDate, getSessionStatus, isSessionRevocable } from '../../lib/sessionDevices.js';

function StatusPill({ session }) {
  const status = getSessionStatus(session);
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold ${SESSION_STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

export default function MyDevicesModal({ open, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/auth/sessions');
      setSessions(data.filter((session) => !session.revoked_at));
    } catch (err) {
      setError(err.friendlyMessage ?? 'Unable to load your devices right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadSessions();
  }, [loadSessions, open]);

  const otherRevocableSessions = useMemo(
    () => sessions.filter((session) => !session.is_current && isSessionRevocable(session)),
    [sessions],
  );

  const handleConfirm = async () => {
    if (!confirmAction || working) return;

    setWorking(true);
    setNotice('');
    try {
      if (confirmAction.type === 'single') {
        await api.delete(`/api/auth/sessions/${confirmAction.session.id}`);
        setSessions((current) => current.filter((session) => session.id !== confirmAction.session.id));
        setNotice('Device signed out.');
      } else {
        const { data } = await api.delete('/api/auth/sessions');
        setSessions((current) =>
          current.filter((session) => session.is_current || !isSessionRevocable(session)),
        );
        setNotice(`${data.revoked} other device${data.revoked === 1 ? '' : 's'} signed out.`);
      }
    } catch (err) {
      setError(err.friendlyMessage ?? 'Failed to update your devices.');
    } finally {
      setWorking(false);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[120]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />

            <div className="relative z-10 flex min-h-full items-start justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] dark:border-dark-border dark:bg-dark-surface dark:shadow-[0_24px_64px_-8px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-dark-border">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500">My Devices</p>
                    <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">Manage Signed-In Devices</h3>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                      Review the browsers that still have access to your account. Use the regular logout button for this current device.
                    </p>
                  </div>
                  <button onClick={onClose} className="text-slate-300 transition-colors hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-300">
                    <XCircle size={24} weight="fill" />
                  </button>
                </div>

                <div className="space-y-4 px-6 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-dark-border dark:bg-dark-base">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                        <ShieldCheck size={20} weight="fill" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">Other Active Devices</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {otherRevocableSessions.length} device{otherRevocableSessions.length === 1 ? '' : 's'} can still access your account.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmAction({ type: 'all' })}
                      disabled={otherRevocableSessions.length === 0 || working}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                    >
                      Sign Out All Other Devices
                    </button>
                  </div>

                  {notice && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">
                      {notice}
                    </div>
                  )}

                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
                      {error}
                    </div>
                  )}

                  <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                    {loading ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500 dark:border-slate-600" />
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-dark-border">
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No tracked devices found.</p>
                      </div>
                    ) : (
                      sessions.map((session) => (
                        <div key={session.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-dark-border dark:bg-dark-surface">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-dark-base dark:text-slate-300">
                                  <Desktop size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">
                                    {session.device_label || 'Unknown device'}
                                  </p>
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <StatusPill session={session} />
                                    {session.is_current && (
                                      <span className="inline-flex items-center rounded-lg bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                                        This device
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-3">
                                <span>Signed in: {formatSessionDate(session.created_at)}</span>
                                <span>Last seen: {formatSessionDate(session.last_seen_at)}</span>
                                <span>Expires: {formatSessionDate(session.expires_at)}</span>
                              </div>
                            </div>

                            {!session.is_current && isSessionRevocable(session) && (
                              <button
                                onClick={() => setConfirmAction({ type: 'single', session })}
                                disabled={working}
                                className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/40"
                              >
                                <SignOut size={16} />
                                Sign Out
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={confirmAction?.type === 'all' ? 'Sign Out Other Devices' : 'Sign Out Device'}
        message={confirmAction?.type === 'all'
          ? 'This will immediately sign out every other active device connected to your account.'
          : `Sign out ${confirmAction?.session?.device_label || 'this device'}?`}
        confirmText={confirmAction?.type === 'all' ? 'Sign Out All' : 'Sign Out'}
        type="warning"
      />
    </>
  );
}
