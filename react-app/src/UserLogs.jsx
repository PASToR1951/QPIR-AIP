import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ListBulletsIcon,
  ArrowLeft,
  CaretLeft,
  CaretRight,
  ArrowClockwise,
  SignIn,
  SignOut,
  LockKey,
  PaperPlaneTilt,
  PencilSimple,
  Trash,
  PencilLine,
  X,
  Download,
  ClockCounterClockwise,
  FunnelSimple,
} from '@phosphor-icons/react';
import { auth } from './lib/auth';
import api from './lib/api.js';
import { DashboardHeader } from './components/ui/DashboardHeader.jsx';
import Footer from './components/ui/Footer.jsx';

const ACTION_CONFIG = {
  login:                    { label: 'Logged in',                  Icon: SignIn,           color: 'emerald' },
  logout:                   { label: 'Logged out',                 Icon: SignOut,          color: 'slate'   },
  password_change:          { label: 'Changed password',           Icon: LockKey,          color: 'amber'   },
  aip_submit:               { label: 'Submitted AIP',              Icon: PaperPlaneTilt,   color: 'blue'    },
  aip_update:               { label: 'Updated AIP',                Icon: PencilSimple,     color: 'indigo'  },
  aip_delete:               { label: 'Deleted AIP',                Icon: Trash,            color: 'red'     },
  aip_edit_request:         { label: 'Requested AIP edit',         Icon: PencilLine,       color: 'orange'  },
  aip_cancel_edit_request:  { label: 'Cancelled AIP edit request', Icon: X,                color: 'slate'   },
  pir_submit:               { label: 'Submitted PIR',              Icon: PaperPlaneTilt,   color: 'teal'    },
  pir_update:               { label: 'Updated PIR',                Icon: PencilSimple,     color: 'cyan'    },
  pir_delete:               { label: 'Deleted PIR',                Icon: Trash,            color: 'red'     },
  data_export:              { label: 'Exported personal data',     Icon: Download,         color: 'violet'  },
};

const COLOR_CLASSES = {
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  slate:   { bg: 'bg-slate-100 dark:bg-slate-800',        text: 'text-slate-500 dark:text-slate-400'    },
  amber:   { bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-600 dark:text-amber-400'    },
  blue:    { bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-600 dark:text-blue-400'      },
  indigo:  { bg: 'bg-indigo-100 dark:bg-indigo-900/30',   text: 'text-indigo-600 dark:text-indigo-400'  },
  red:     { bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-500 dark:text-red-400'        },
  orange:  { bg: 'bg-orange-100 dark:bg-orange-900/30',   text: 'text-orange-600 dark:text-orange-400'  },
  teal:    { bg: 'bg-teal-100 dark:bg-teal-900/30',       text: 'text-teal-600 dark:text-teal-400'      },
  cyan:    { bg: 'bg-cyan-100 dark:bg-cyan-900/30',       text: 'text-cyan-600 dark:text-cyan-400'      },
  violet:  { bg: 'bg-violet-100 dark:bg-violet-900/30',   text: 'text-violet-600 dark:text-violet-400'  },
};

function formatRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildDetailsSummary(action, details) {
  if (!details || typeof details !== 'object') return null;
  const d = details;
  if (action === 'login') return d.method ? `via ${d.method.replace('_', ' ')}` : null;
  if (action === 'aip_submit' || action === 'aip_update' || action === 'aip_delete' || action === 'aip_edit_request') {
    const parts = [];
    if (d.programTitle) parts.push(d.programTitle);
    if (d.year) parts.push(`FY ${d.year}`);
    return parts.join(' · ') || null;
  }
  if (action === 'pir_submit' || action === 'pir_update' || action === 'pir_delete') {
    const parts = [];
    if (d.programTitle) parts.push(d.programTitle);
    if (d.quarter) parts.push(d.quarter);
    return parts.join(' · ') || null;
  }
  return null;
}

const FILTER_OPTIONS = [
  { value: '', label: 'All activity' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'password_change', label: 'Password change' },
  { value: 'aip_submit', label: 'AIP submitted' },
  { value: 'aip_update', label: 'AIP updated' },
  { value: 'aip_delete', label: 'AIP deleted' },
  { value: 'aip_edit_request', label: 'AIP edit request' },
  { value: 'pir_submit', label: 'PIR submitted' },
  { value: 'pir_update', label: 'PIR updated' },
  { value: 'pir_delete', label: 'PIR deleted' },
  { value: 'data_export', label: 'Data export' },
];

function LogEntry({ log }) {
  const cfg = ACTION_CONFIG[log.action] || { label: log.action, Icon: ClockCounterClockwise, color: 'slate' };
  const colors = COLOR_CLASSES[cfg.color] || COLOR_CLASSES.slate;
  const summary = buildDetailsSummary(log.action, log.details);

  return (
    <div className="flex items-start gap-3 py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colors.bg}`}>
        <cfg.Icon size={15} weight="fill" className={colors.text} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{cfg.label}</p>
        {summary && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{summary}</p>
        )}
        {log.ip_address && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{log.ip_address}</p>
        )}
      </div>
      <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 mt-0.5 whitespace-nowrap">
        {formatRelative(log.created_at)}
      </span>
    </div>
  );
}

export default function UserLogs() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('user') || 'null');
      setUser(stored);
    } catch { /* ignore */ }
  }, []);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 30 });
    if (actionFilter) params.set('action', actionFilter);
    api.get(`/api/activity-logs?${params}`)
      .then(r => {
        setLogs(r.data.logs);
        setTotal(r.data.total);
        setPages(r.data.pages);
      })
      .catch(() => {
        setLogs([]);
        setTotal(0);
        setPages(1);
      })
      .finally(() => setLoading(false));
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1); }, [actionFilter]);

  const handleLogout = () => {
    navigate('/login', { replace: true });
    void auth.clearSession();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col font-sans">
      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="flex-1 w-full max-w-3xl mx-auto mt-6 px-4 pb-12">
        {/* Back link + title */}
        <div className="mb-5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-4"
          >
            <ArrowLeft size={16} weight="bold" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ListBulletsIcon size={22} className="text-[#E94560]" />
                Activity Log
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Your recent account activity
                {total > 0 && <span className="ml-1 text-slate-400 dark:text-slate-500">· {total} {total === 1 ? 'entry' : 'entries'}</span>}
              </p>
            </div>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-dark-surface/60 border border-slate-200 dark:border-dark-border rounded-xl hover:bg-white dark:hover:bg-dark-surface transition-colors disabled:opacity-50"
            >
              <ArrowClockwise size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-4">
          <FunnelSimple size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E94560]/30 transition-colors cursor-pointer"
          >
            {FILTER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Log list */}
        <div className="bg-white/60 dark:bg-dark-surface/60 backdrop-blur-md border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-[#E94560] animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <ClockCounterClockwise size={36} className="text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No activity recorded yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Actions like logins, AIP and PIR submissions will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-dark-border/60">
              {logs.map(log => <LogEntry key={log.id} log={log} />)}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Page {page} of {pages} · {total} total
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-border disabled:opacity-30 transition-colors"
              >
                <CaretLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page >= pages - 2 ? pages - 4 + i : page - 2 + i;
                if (pg < 1 || pg > pages) return null;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${pg === page ? 'bg-[#E94560] text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border'}`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-border disabled:opacity-30 transition-colors"
              >
                <CaretRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Privacy notice */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-6">
          Activity logs are retained for compliance and security purposes under RA 10173.
        </p>
      </main>

      <Footer />
    </div>
  );
}
