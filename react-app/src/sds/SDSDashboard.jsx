import { useState, useEffect } from 'react';
import axios from 'axios';
import { MagnifyingGlass, CheckCircle, ArrowUUpLeft } from '@phosphor-icons/react';

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

const RETURN_OPTS = [
  { value: 'submitter', label: 'Return to Submitter', desc: 'Submitter will be notified to make corrections.' },
  { value: 'ces', label: 'Return to CES', desc: 'CES reviewer will be notified to re-review.' },
];

export default function SDSDashboard() {
  const [pirs, setPirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState(defaultQuarter);
  const [search, setSearch] = useState('');

  // Modal state
  const [modal, setModal] = useState(null); // { type: 'approve' | 'return', pir }
  const [remarks, setRemarks] = useState('');
  const [returnTo, setReturnTo] = useState('submitter');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchPIRs = () => {
    setLoading(true);
    const params = quarter ? `?quarter=${encodeURIComponent(quarter)}` : '';
    axios.get(`${API}/api/admin/sds/pirs${params}`, { headers: authHeaders() })
      .then(r => setPirs(r.data))
      .catch(() => setPirs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPIRs(); }, [quarter]);

  const filtered = pirs.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.program?.toLowerCase().includes(q) ||
      p.school?.toLowerCase().includes(q) ||
      p.owner?.toLowerCase().includes(q)
    );
  });

  const openModal = (type, pir, e) => {
    e.stopPropagation();
    setModal({ type, pir });
    setRemarks('');
    setReturnTo('submitter');
    setError('');
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (modal.type === 'approve') {
        await axios.post(`${API}/api/admin/sds/pirs/${modal.pir.id}/approve`, { sds_remarks: remarks }, { headers: authHeaders() });
      } else {
        await axios.post(`${API}/api/admin/sds/pirs/${modal.pir.id}/return`, { sds_remarks: remarks, returnTo }, { headers: authHeaders() });
      }
      setModal(null);
      fetchPIRs();
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 mb-1">
          PIR Review Queue
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          PIRs noted by CES and awaiting your final review.
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
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700"
          />
        </div>
        <select
          value={quarter}
          onChange={e => setQuarter(e.target.value)}
          className="text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700"
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
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-purple-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400 dark:text-slate-500">
            No PIRs pending your review{quarter ? ` for ${quarter}` : ''}.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-dark-border text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-black">
                <th className="text-left px-5 py-3">Program</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">School / Owner</th>
                <th className="text-left px-5 py-3">Quarter</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">CES Reviewer</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">CES Noted</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-dark-border/40">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-dark-border/20 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-200 max-w-[180px] truncate">
                    {p.program}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-slate-500 dark:text-slate-400">
                    <div>{p.school}</div>
                    {p.owner && <div className="text-xs text-slate-400 dark:text-slate-500">{p.owner}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {p.quarter}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-slate-500 dark:text-slate-400 text-xs">
                    {p.cesReviewer ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">
                    {p.cesNotedAt ? new Date(p.cesNotedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={e => openModal('approve', p, e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/60 transition-colors"
                      >
                        <CheckCircle size={13} />
                        Approve
                      </button>
                      <button
                        onClick={e => openModal('return', p, e)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-700/60 transition-colors"
                      >
                        <ArrowUUpLeft size={13} />
                        Return
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-right">
        {filtered.length} PIR{filtered.length !== 1 ? 's' : ''} pending review
      </p>

      {/* Action Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-slate-200 dark:border-dark-border w-full max-w-md p-6">
            <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1">
              {modal.type === 'approve' ? 'Approve PIR' : 'Return PIR'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {modal.pir.program} — {modal.pir.quarter}
            </p>

            {modal.type === 'approve' ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                This PIR will be marked as Approved. The submitter will be notified.
              </p>
            ) : (
              <div className="mb-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Select where to return this PIR:</p>
                <div className="space-y-2">
                  {RETURN_OPTS.map(opt => (
                    <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${returnTo === opt.value ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30' : 'border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-border/20'}`}>
                      <input type="radio" name="returnTo" value={opt.value} checked={returnTo === opt.value} onChange={() => setReturnTo(opt.value)} className="mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{opt.label}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              {modal.type === 'approve' ? 'Remarks (optional)' : 'Feedback / Reason for return'}
            </label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={3}
              placeholder={modal.type === 'approve' ? 'Add final remarks…' : 'Explain what needs to be corrected…'}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base text-slate-700 dark:text-slate-200 px-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700 resize-none"
            />

            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => setModal(null)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-border/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition-colors ${
                  modal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-500 hover:bg-amber-600'
                } disabled:opacity-60`}
              >
                {submitting ? 'Saving…' : modal.type === 'approve' ? 'Approve PIR' : 'Return PIR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
