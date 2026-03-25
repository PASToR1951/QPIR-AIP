import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, MagnifyingGlass } from '@phosphor-icons/react';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const QUARTERS = ['1st', '2nd', '3rd', '4th'];
const currentQ = Math.ceil((new Date().getMonth() + 1) / 3);
const currentYear = new Date().getFullYear();
const defaultQuarter = `${QUARTERS[currentQ - 1]} Quarter CY ${currentYear}`;

const buildQuarterOptions = () => {
  const opts = [{ value: '', label: 'All Quarters' }];
  for (let y = currentYear; y >= currentYear - 1; y--) {
    for (let q = 4; q >= 1; q--) {
      if (y === currentYear && q > currentQ) continue;
      opts.push({ value: `${QUARTERS[q - 1]} Quarter CY ${y}`, label: `${QUARTERS[q - 1]} Quarter CY ${y}` });
    }
  }
  return opts;
};

const STATUS_STYLES = {
  Submitted: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700/60',
  Approved: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/60',
  Returned: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700/60',
};

export default function ReviewerDashboard() {
  const navigate = useNavigate();
  const [pirs, setPirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState(defaultQuarter);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = quarter ? `?quarter=${encodeURIComponent(quarter)}` : '';
    axios.get(`${API}/api/admin/pirs${params}`, { headers: authHeaders() })
      .then(r => setPirs(r.data))
      .catch(() => setPirs([]))
      .finally(() => setLoading(false));
  }, [quarter]);

  const filtered = pirs.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.program?.toLowerCase().includes(q) ||
      p.school?.toLowerCase().includes(q) ||
      p.owner?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 mb-1">
          PIR Submissions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Review submitted Program Implementation Reports and add management responses.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search program, school, owner…"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
          />
        </div>
        <select
          value={quarter}
          onChange={e => setQuarter(e.target.value)}
          className="text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
        >
          {buildQuarterOptions().map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400 dark:text-slate-500">
            No PIR submissions found{quarter ? ` for ${quarter}` : ''}.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-dark-border text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-black">
                <th className="text-left px-5 py-3">Program</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">School / Owner</th>
                <th className="text-left px-5 py-3">Quarter</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Submitted</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-dark-border/40">
              {filtered.map(p => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50 dark:hover:bg-dark-border/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/reviewer/pirs/${p.id}`)}
                >
                  <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-200 max-w-[200px] truncate">
                    {p.program}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-slate-500 dark:text-slate-400">
                    <div>{p.school}</div>
                    {p.owner && <div className="text-xs text-slate-400 dark:text-slate-500">{p.owner}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {p.quarter}
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">
                    {p.submittedAt ? new Date(p.submittedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${STATUS_STYLES[p.status] ?? STATUS_STYLES.Submitted}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-400 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-right">
        {filtered.length} submission{filtered.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
