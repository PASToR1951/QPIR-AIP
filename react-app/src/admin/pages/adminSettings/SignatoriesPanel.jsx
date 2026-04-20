import React, { useEffect, useState, useMemo } from 'react';
import { Signature, MagnifyingGlass, WarningCircle, X } from '@phosphor-icons/react';
import { Spinner } from '../../components/Spinner.jsx';
import api from '../../../lib/api.js';
import { SettingsCard } from './SettingsUI.jsx';

// Maps raw "source" strings from the API to a display label + color
const SOURCE_CONFIG = {
  cluster_head:    { label: 'Cluster Head',      bg: 'bg-violet-100 dark:bg-violet-950/40',  text: 'text-violet-700 dark:text-violet-300' },
  ces_sgod:        { label: 'CES – SGOD',         bg: 'bg-blue-100 dark:bg-blue-950/40',      text: 'text-blue-700 dark:text-blue-300' },
  ces_cid:         { label: 'CES – CID',          bg: 'bg-blue-100 dark:bg-blue-950/40',      text: 'text-blue-700 dark:text-blue-300' },
  ces_osds:        { label: 'CES – OSDS',         bg: 'bg-blue-100 dark:bg-blue-950/40',      text: 'text-blue-700 dark:text-blue-300' },
  ces_unknown:     { label: 'CES (Unknown)',      bg: 'bg-blue-100 dark:bg-blue-950/40',      text: 'text-blue-700 dark:text-blue-300' },
  division_config: { label: 'Division Config',   bg: 'bg-amber-100 dark:bg-amber-950/40',    text: 'text-amber-700 dark:text-amber-300' },
  none:            { label: 'Not configured',     bg: 'bg-rose-100 dark:bg-rose-950/40',      text: 'text-rose-700 dark:text-rose-300' },
};

function SourceBadge({ source }) {
  const cfg = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.none;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function RoleTag({ role }) {
  const colors = {
    'School':              'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
    'Division Personnel':  'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300',
    'Cluster Coordinator': 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300',
    'CES-SGOD':            'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300',
    'CES-CID':             'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300',
    'CES-ASDS':            'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide ${colors[role] ?? 'bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400'}`}>
      {role}
    </span>
  );
}

export function SignatoriesPanel() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/api/admin/settings/signatories')
      .then(r => { setRows(r.data); setError(null); })
      .catch(() => setError('Could not load signatory data. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      r.user.name.toLowerCase().includes(q) ||
      r.user.role.toLowerCase().includes(q) ||
      (r.user.school ?? '').toLowerCase().includes(q) ||
      (r.user.cluster ?? '').toLowerCase().includes(q) ||
      r.signatory.name.toLowerCase().includes(q) ||
      r.signatory.title.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const unconfiguredCount = rows.filter(r => r.signatory.source === 'none').length;

  return (
    <SettingsCard
      icon={Signature}
      iconBg="bg-indigo-100 dark:bg-indigo-950/40"
      iconColor="text-indigo-600 dark:text-indigo-400"
      title="Signatories"
      description="Shows the resolved signatory that will appear on each user's documents (AIP / PIR). School users sign under their Cluster Head; Division Personnel sign under their functional division's CES chief."
    >
      {/* Warning when some users have no signatory */}
      {!loading && unconfiguredCount > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 px-4 py-3">
          <WarningCircle size={16} weight="fill" className="shrink-0 mt-0.5 text-rose-500" />
          <p className="text-xs font-bold text-rose-700 dark:text-rose-400">
            {unconfiguredCount} user{unconfiguredCount !== 1 ? 's' : ''} {unconfiguredCount !== 1 ? 'have' : 'has'} no signatory configured.
            {' '}Assign a Cluster Head in <strong>Schools</strong> or add a CES user account to resolve this.
          </p>
        </div>
      )}

      {/* Search */}
      {!loading && (
        <div className="relative">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by name, role, school, or signatory…"
            className="w-full pl-8 pr-8 py-2 text-sm bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
          <Spinner />
          <span className="text-sm font-bold">Loading signatories…</span>
        </div>
      ) : error ? (
        <p className="text-xs font-bold text-rose-600 py-4 text-center">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-600 py-4 text-center">No users match your search.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-dark-border">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-dark-base border-b border-slate-200 dark:border-dark-border">
                <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">User</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Role / Affiliation</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Signatory Name</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hidden sm:table-cell">Signatory Title</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {filtered.map(r => (
                <tr key={r.user.id} className="hover:bg-slate-50/60 dark:hover:bg-dark-base/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {r.user.name || <span className="italic text-slate-400">No name</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <RoleTag role={r.user.role} />
                      {(r.user.school || r.user.cluster) && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {r.user.school ?? r.user.cluster}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {r.signatory.name || <span className="italic text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell whitespace-nowrap">
                    {r.signatory.title || <span className="italic text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <SourceBadge source={r.signatory.source} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length < rows.length && (
            <p className="px-4 py-2 text-[10px] text-slate-400 dark:text-slate-600 text-right">
              Showing {filtered.length} of {rows.length} users
            </p>
          )}
        </div>
      )}
    </SettingsCard>
  );
}
