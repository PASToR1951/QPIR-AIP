import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { CalendarBlank, ArrowCounterClockwise, FloppyDisk } from '@phosphor-icons/react';
import { AdminLayout } from '../AdminLayout.jsx';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const QUARTER_LABELS = ['Q1 · Jan – Mar', 'Q2 · Apr – Jun', 'Q3 · Jul – Sep', 'Q4 · Oct – Dec'];
const DEFAULT_MONTHS = [{ month: 3, day: 31 }, { month: 6, day: 30 }, { month: 9, day: 30 }, { month: 12, day: 31 }];

function urgencyStyle(daysLeft) {
  if (daysLeft < 0) return 'border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/20';
  if (daysLeft <= 7) return 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/10';
  if (daysLeft <= 14) return 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20';
  return 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface';
}

function daysLeft(dateStr) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function AdminDeadlines() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [deadlines, setDeadlines] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [localDates, setLocalDates] = useState({});
  const [formError, setFormError] = useState('');

  const fetchDeadlines = useCallback(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/api/admin/deadlines?year=${year}`, { headers: authHeaders() }),
      axios.get(`${API}/api/admin/deadlines/history`, { headers: authHeaders() }),
    ]).then(([dr, hr]) => {
      setDeadlines(dr.data);
      setLocalDates(Object.fromEntries(dr.data.map(d => [d.quarter, d.date.slice(0, 10)])));
      setHistory(hr.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(() => { fetchDeadlines(); }, [fetchDeadlines]);

  const handleSave = async (quarter) => {
    setSaving(quarter);
    try {
      setFormError('');
      await axios.post(`${API}/api/admin/deadlines`, { year, quarter, date: localDates[quarter] }, { headers: authHeaders() });
      fetchDeadlines();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setSaving(null); }
  };

  const handleReset = async (deadline) => {
    if (!deadline.id) return;
    setSaving(deadline.quarter);
    try {
      setFormError('');
      await axios.delete(`${API}/api/admin/deadlines/${deadline.id}`, { headers: authHeaders() });
      fetchDeadlines();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setSaving(null); }
  };

  const dateChanged = (q) => {
    const orig = deadlines.find(d => d.quarter === q)?.date?.slice(0, 10);
    return localDates[q] !== orig;
  };

  const impactPreview = (q) => {
    const orig = deadlines.find(d => d.quarter === q)?.date;
    if (!orig || !dateChanged(q)) return null;
    const origDate = new Date(orig);
    const newDate = new Date(localDates[q]);
    const diffDays = Math.round((newDate - origDate) / 86400000);
    if (diffDays < 0) return { type: 'warning', msg: `⚠ Moving deadline earlier by ${Math.abs(diffDays)} days` };
    return { type: 'ok', msg: `✓ Extends deadline by ${diffDays} days` };
  };

  const YEARS = [year - 1, year, year + 1];

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">Fiscal Year</span>
          <div className="flex items-center gap-1">
            {YEARS.map(y => (
              <button key={y} onClick={() => setYear(y)}
                className={`px-4 py-1.5 text-sm font-bold rounded-xl transition-colors ${y === year ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}>
                FY {y}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" />
          </div>
        ) : (
          <>
            {formError && <p className="text-xs text-red-500 font-bold">{formError}</p>}

            {/* Quarter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {deadlines.map((d, i) => {
                const days = daysLeft(d.date);
                const impact = impactPreview(d.quarter);
                return (
                  <div key={d.quarter} className={`rounded-2xl border-2 p-5 space-y-4 transition-colors ${urgencyStyle(days)}`}>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{QUARTER_LABELS[i]}</p>
                      <p className="font-black text-slate-900 dark:text-slate-100 text-xl mt-1">
                        {days < 0 ? 'Overdue' : `${days}d left`}
                      </p>
                      {d.isCustom && <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg">Custom</span>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        <CalendarBlank size={13} className="inline mr-1" />Deadline
                      </label>
                      <input
                        type="date"
                        value={localDates[d.quarter] ?? ''}
                        onChange={e => setLocalDates(ld => ({ ...ld, [d.quarter]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400"
                      />
                    </div>

                    {impact && (
                      <p className={`text-xs font-bold ${impact.type === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {impact.msg}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSave(d.quarter)}
                        disabled={!dateChanged(d.quarter) || saving === d.quarter}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl transition-colors"
                      >
                        <FloppyDisk size={15} />
                        {saving === d.quarter ? 'Saving…' : 'Save'}
                      </button>
                      {d.isCustom && (
                        <button onClick={() => handleReset(d)} disabled={saving === d.quarter}
                          className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                          <ArrowCounterClockwise size={15} /> Reset
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-4">Change History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-dark-border">
                        {['Quarter', 'Previous', 'New Date', 'Changed By', 'Date'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-[11px] font-black text-slate-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-dark-border">
                      {history.slice(0, 20).map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-dark-border/20">
                          <td className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">Q{log.details?.quarter}</td>
                          <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{log.details?.previousDate ? new Date(log.details.previousDate).toLocaleDateString('en-PH') : '—'}</td>
                          <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{log.details?.newDate ? new Date(log.details.newDate).toLocaleDateString('en-PH') : '—'}</td>
                          <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{log.admin?.name ?? log.admin?.email}</td>
                          <td className="px-3 py-2.5 text-slate-400 dark:text-slate-500 text-xs">{new Date(log.created_at).toLocaleDateString('en-PH')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
