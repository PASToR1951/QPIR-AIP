import { useCallback, useEffect, useMemo, useState } from 'react';
import { MagnifyingGlass, CheckCircle, Users } from '@phosphor-icons/react';
import api from '../../lib/api.js';
import { DataTable } from '../components/DataTable.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { SESSION_STATUS_STYLES, formatSessionDate, getSessionStatus, isSessionRevocable } from '../../lib/sessionDevices.js';

const STATUS_PILLS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Expired', value: 'expired' },
  { label: 'Revoked', value: 'revoked' },
];

function SessionStatusPill({ session }) {
  const status = getSessionStatus(session);
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-bold ${SESSION_STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

export default function AdminSessions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/sessions', {
        params: {
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        },
      });
      setSessions(data);
    } catch (err) {
      showToast(err.friendlyMessage ?? 'Failed to load sessions.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast, statusFilter]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const activeCount = useMemo(
    () => sessions.filter((session) => isSessionRevocable(session)).length,
    [sessions],
  );

  const handleConfirm = async () => {
    if (!confirmAction) return;

    setActionLoading(true);
    try {
      if (confirmAction.type === 'single') {
        await api.delete(`/api/admin/sessions/${confirmAction.session.id}`);
        showToast('Session revoked.');
      } else {
        const { data } = await api.delete(`/api/admin/sessions/user/${confirmAction.user.id}`);
        showToast(`${data.revoked} active session${data.revoked === 1 ? '' : 's'} revoked for ${confirmAction.user.name}.`);
      }

      setConfirmAction(null);
      await loadSessions();
    } catch (err) {
      showToast(err.friendlyMessage ?? 'Failed to revoke session.', 'error');
      setConfirmAction(null);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (value) => (
        <div className="min-w-0">
          <div className="truncate font-bold text-slate-900 dark:text-slate-100">{value.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="truncate text-xs text-slate-500 dark:text-slate-400">{value.email}</span>
            <StatusBadge status={value.role} size="xs" />
          </div>
        </div>
      ),
      cardFullWidth: true,
    },
    {
      key: 'device_label',
      label: 'Device',
      render: (value) => <span className="text-sm text-slate-600 dark:text-slate-300">{value || 'Unknown device'}</span>,
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
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setConfirmAction({ type: 'bulk', user: row.user })}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-dark-border dark:text-slate-300 dark:hover:bg-dark-border/80"
          >
            <Users size={14} />
            Revoke All
          </button>
        </div>
      ),
      cardFullWidth: true,
    },
  ];

  return (
    <>
      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Active Session Monitoring</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {activeCount} active tracked session{activeCount === 1 ? '' : 's'} in the current results.
              </p>
            </div>

            <div className="relative w-full max-w-md">
              <MagnifyingGlass size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-slate-100 dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_PILLS.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setStatusFilter(pill.value)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                  statusFilter === pill.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-dark-border dark:text-slate-400 dark:hover:bg-dark-border/80'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500 dark:border-slate-600" />
          </div>
        ) : (
          <div className="min-h-0 flex-1">
            <DataTable
              columns={columns}
              data={sessions}
              fillHeight
              emptyMessage="No sessions found."
              endMessage={search || statusFilter !== 'all' ? 'All matching sessions shown' : 'End of sessions list'}
              endCountLabel="session"
              showEndCount
            />
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.type === 'bulk' ? 'Revoke All User Sessions' : 'Revoke Session'}
        message={confirmAction?.type === 'bulk'
          ? `Revoke every active session for ${confirmAction?.user?.name}?`
          : `Revoke ${confirmAction?.session?.device_label || 'this session'} for ${confirmAction?.session?.user?.name}?`}
        variant="danger"
        confirmLabel={confirmAction?.type === 'bulk' ? 'Revoke All' : 'Revoke'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
        loading={actionLoading}
      />

      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold shadow-lg transition-all ${
          toast.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
            : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
        }`}>
          <CheckCircle size={18} weight="fill" className={toast.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} />
          {toast.message}
        </div>
      )}
    </>
  );
}
