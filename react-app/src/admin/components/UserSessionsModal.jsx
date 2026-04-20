import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../lib/api.js';
import { Spinner } from './Spinner.jsx';
import { DataTable } from './DataTable.jsx';
import { FormModal } from './FormModal.jsx';
import { ConfirmModal } from './ConfirmModal.jsx';
import { SESSION_STATUS_STYLES, formatSessionDate, getSessionStatus, isSessionRevocable } from '../../lib/sessionDevices.js';

function SessionStatusPill({ session }) {
  const status = getSessionStatus(session);
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold ${SESSION_STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

export function UserSessionsModal({ open, user, onClose, showToast }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [error, setError] = useState('');

  const loadSessions = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/admin/sessions', {
        params: { userId: user.id },
      });
      setSessions(data);
    } catch (err) {
      setError(err.friendlyMessage ?? 'Unable to load sessions right now.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!open) return;
    void loadSessions();
  }, [open, loadSessions]);

  const activeSessions = useMemo(
    () => sessions.filter((session) => isSessionRevocable(session)),
    [sessions],
  );

  const displayName = user?.name || user?.email || 'this user';

  const handleConfirm = async () => {
    if (!confirmAction) return;

    setActionLoading(true);
    try {
      if (confirmAction.type === 'single') {
        await api.delete(`/api/admin/sessions/${confirmAction.session.id}`);
        showToast?.('Session revoked.');
      } else if (confirmAction.type === 'all') {
        const { data } = await api.delete(`/api/admin/sessions/user/${user.id}`);
        showToast?.(`${data.revoked} active session${data.revoked === 1 ? '' : 's'} revoked.`);
      }

      setConfirmAction(null);
      await loadSessions();
    } catch (err) {
      showToast?.(err.friendlyMessage ?? 'Failed to revoke session.', 'error');
      setConfirmAction(null);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'device_label',
      label: 'Device',
      render: (value) => <span className="font-bold text-slate-900 dark:text-slate-100">{value || 'Unknown device'}</span>,
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (value) => <span className="text-sm text-slate-500 dark:text-slate-400">{value || '—'}</span>,
    },
    {
      key: 'created_at',
      label: 'Login Time',
      render: (value) => <span className="text-sm text-slate-500 dark:text-slate-400">{formatSessionDate(value)}</span>,
    },
    {
      key: 'last_seen_at',
      label: 'Last Seen',
      render: (value) => <span className="text-sm text-slate-500 dark:text-slate-400">{formatSessionDate(value)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <SessionStatusPill session={row} />,
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
          {isSessionRevocable(row) ? (
            <button
              onClick={() => setConfirmAction({ type: 'single', session: row })}
              className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/40"
            >
              Revoke
            </button>
          ) : (
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <FormModal
        open={open}
        title={`Sessions — ${displayName}`}
        subtitle={activeSessions.length > 0 ? `${activeSessions.length} active tracked session${activeSessions.length === 1 ? '' : 's'}` : 'No active tracked sessions'}
        onSave={() => setConfirmAction({ type: 'all' })}
        onCancel={onClose}
        loading={actionLoading}
        saveLabel="Revoke All Sessions"
        saveDisabled={activeSessions.length === 0}
        wide
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review this user&apos;s recent devices and revoke any active session immediately.
          </p>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={sessions}
              pageSize={8}
              emptyMessage="No tracked sessions for this user."
            />
          )}
        </div>
      </FormModal>

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.type === 'all' ? 'Revoke All Sessions' : 'Revoke Session'}
        message={confirmAction?.type === 'all'
          ? `Revoke every active session for ${displayName}? They will need to sign in again on those devices.`
          : `Revoke ${confirmAction?.session?.device_label || 'this session'} for ${displayName}?`}
        variant="danger"
        confirmLabel={confirmAction?.type === 'all' ? 'Revoke All' : 'Revoke'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
        loading={actionLoading}
      />
    </>
  );
}

export default UserSessionsModal;
