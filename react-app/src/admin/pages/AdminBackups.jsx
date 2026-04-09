import React, { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api.js';
import {
  Database, CheckCircle, Warning, X, CloudArrowUp,
  ArrowClockwise, Terminal, Clock, HardDrive, CalendarBlank,
  ShieldCheck, Info,
} from '@phosphor-icons/react';

function formatBytes(bytes) {
  if (bytes === 0 || bytes == null) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: true,
  });
}

function AlertBadge({ level }) {
  const styles = {
    ok:       'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
    warn:     'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
    critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50',
    unknown:  'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  };
  const icons = {
    ok:       <CheckCircle size={13} weight="fill" />,
    warn:     <Warning size={13} weight="fill" />,
    critical: <X size={13} weight="bold" />,
    unknown:  <Info size={13} />,
  };
  const labels = { ok: 'Healthy', warn: 'Warning', critical: 'Critical', unknown: 'Unknown' };
  const key = styles[level] ? level : 'unknown';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${styles[key]}`}>
      {icons[key]}
      {labels[key]}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'slate' }) {
  const colorMap = {
    slate:   'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
    amber:   'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
    blue:    'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
    violet:  'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30',
  };
  return (
    <div className="bg-white/60 dark:bg-dark-surface/60 backdrop-blur-sm border border-white/60 dark:border-dark-border rounded-2xl p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color] || colorMap.slate}`}>
        <Icon size={18} weight="fill" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">{value ?? '—'}</p>
        {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function BackupFileRow({ file, type }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${type === 'hourly' ? 'bg-blue-400' : 'bg-violet-400'}`} />
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">{file.name}</span>
      </div>
      <div className="flex items-center gap-4 shrink-0 ml-3">
        <span className="text-xs text-slate-400 dark:text-slate-500">{formatBytes(file.size)}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 w-20 text-right">{formatRelative(file.modified)}</span>
      </div>
    </div>
  );
}

export default function AdminBackups() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('hourly');

  const fetchStatus = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/api/admin/backup/status')
      .then(r => setStatus(r.data))
      .catch(e => {
        console.error(e);
        setError('Failed to load backup status. The backup service may not be running.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleTrigger = async () => {
    setTriggering(true);
    setTriggerMsg(null);
    try {
      await api.post('/api/admin/backup/trigger', {});
      setTriggerMsg({ type: 'ok', text: 'Backup started in background. Refresh status in ~30 seconds.' });
      setTimeout(fetchStatus, 10000);
    } catch (e) {
      const msg = e.friendlyMessage ?? 'Failed to trigger backup.';
      setTriggerMsg({ type: 'err', text: msg });
    } finally {
      setTriggering(false);
    }
  };

  const alertLevel = status?.alert_level ?? 'unknown';
  const cloudStatus = status?.cloud_sync_status ?? 'disabled';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Database size={22} className="text-[#E94560]" />
            Backup Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor backup health and trigger manual backups. Restore operations must be performed via CLI.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-dark-surface/60 border border-white/60 dark:border-dark-border rounded-xl hover:bg-white dark:hover:bg-dark-surface transition-colors disabled:opacity-50"
        >
          <ArrowClockwise size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400 text-sm">
          <Warning size={18} weight="fill" className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Status Overview */}
      <div className="bg-white/60 dark:bg-dark-surface/60 backdrop-blur-sm border border-white/60 dark:border-dark-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <ShieldCheck size={16} className="text-slate-500 dark:text-slate-400" />
            System Status
          </h2>
          {status && <AlertBadge level={alertLevel} />}
        </div>

        {loading && !status ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-pink-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={Clock}
              label="Last Hourly Backup"
              value={formatRelative(status?.last_hourly_backup)}
              sub={formatDateTime(status?.last_hourly_backup)}
              color={status?.hourly_age_minutes > 120 ? 'amber' : 'blue'}
            />
            <StatCard
              icon={CalendarBlank}
              label="Last Daily Backup"
              value={formatRelative(status?.last_daily_backup)}
              sub={formatDateTime(status?.last_daily_backup)}
              color={status?.daily_age_minutes > 1560 ? 'amber' : 'violet'}
            />
            <StatCard
              icon={HardDrive}
              label="Stored Backups"
              value={`${status?.hourly_count ?? 0}h / ${status?.daily_count ?? 0}d`}
              sub="hourly / daily"
              color="slate"
            />
            <StatCard
              icon={CloudArrowUp}
              label="Cloud Sync"
              value={cloudStatus === 'disabled' ? 'Disabled' : cloudStatus === 'enabled' ? 'Enabled' : cloudStatus}
              sub={cloudStatus === 'disabled' ? 'Set BACKUP_CLOUD_ENABLED=true' : 'via rclone'}
              color={cloudStatus === 'enabled' ? 'emerald' : 'slate'}
            />
          </div>
        )}

        {status?.updated_at && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
            Status updated {formatRelative(status.updated_at)}
          </p>
        )}
      </div>

      {/* Manual Trigger */}
      <div className="bg-white/60 dark:bg-dark-surface/60 backdrop-blur-sm border border-white/60 dark:border-dark-border rounded-2xl p-5">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Manual Backup</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Trigger an immediate hourly backup. Runs in the background — refresh status after ~30 seconds.
        </p>
        <button
          onClick={handleTrigger}
          disabled={triggering || loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#E94560] hover:bg-[#c23152] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#E94560]/20"
        >
          {triggering ? (
            <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Running...</>
          ) : (
            <><Database size={16} /> Trigger Backup Now</>
          )}
        </button>
        {triggerMsg && (
          <div className={`mt-3 flex items-start gap-2 text-xs p-2.5 rounded-xl border ${
            triggerMsg.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400'
          }`}>
            {triggerMsg.type === 'ok'
              ? <CheckCircle size={14} weight="fill" className="shrink-0 mt-0.5" />
              : <Warning size={14} weight="fill" className="shrink-0 mt-0.5" />
            }
            {triggerMsg.text}
          </div>
        )}
      </div>

      {/* Backup History */}
      <div className="bg-white/60 dark:bg-dark-surface/60 backdrop-blur-sm border border-white/60 dark:border-dark-border rounded-2xl p-5">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Backup History</h2>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 w-fit">
          {[
            { key: 'hourly', label: 'Hourly', count: status?.hourly_files?.length },
            { key: 'daily',  label: 'Daily',  count: status?.daily_files?.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === key
                  ? 'bg-white dark:bg-dark-surface text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {label}
              {count != null && (
                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-pink-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-0.5 max-h-72 overflow-y-auto">
            {(activeTab === 'hourly' ? status?.hourly_files : status?.daily_files)?.map(file => (
              <BackupFileRow key={file.name} file={file} type={activeTab} />
            ))}
            {((activeTab === 'hourly' ? status?.hourly_files : status?.daily_files) ?? []).length === 0 && (
              <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-8">
                No {activeTab} backups found yet.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Restore Instructions */}
      <div className="bg-amber-50/60 dark:bg-amber-900/10 backdrop-blur-sm border border-amber-200/60 dark:border-amber-800/30 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Terminal size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">
              Restore Operations — CLI Only
            </h2>
            <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
              Database restores are intentionally not available through this UI. Restore operations stop the backend
              service and drop the live database — they must be run by an administrator with server access.
            </p>
            <div className="bg-slate-900 dark:bg-black/40 rounded-xl p-3 font-mono text-xs text-emerald-400 dark:text-emerald-300 space-y-1">
              <p className="text-slate-500 dark:text-slate-400"># Connect to the backup container</p>
              <p>docker compose exec backup /app/scripts/backup/restore.sh</p>
              <p className="text-slate-500 dark:text-slate-400 mt-2"># Or for disaster recovery on a new server</p>
              <p>docker compose run --rm backup /app/scripts/backup/restore.sh</p>
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-2">
              See <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded text-amber-700 dark:text-amber-400">server/scripts/backup/README.md</code> for
              the full disaster recovery runbook.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
