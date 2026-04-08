import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, MagnifyingGlass, Stamp, ArrowUUpLeft } from '@phosphor-icons/react';
import { EndOfListCue } from '../components/ui/EndOfListCue';
import { shouldShowEndOfListCue } from '../components/ui/endOfListCue';

const API = import.meta.env.VITE_API_URL;


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

export default function CESDashboard() {
  const navigate = useNavigate();
  const [pirs, setPirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState(defaultQuarter);
  const [search, setSearch] = useState('');

  // Modal state
  const [modal, setModal] = useState(null); // { type: 'note' | 'return', pirId, program, quarter }
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchPIRs = useCallback(() => {
    setLoading(true);
    const params = quarter ? `?quarter=${encodeURIComponent(quarter)}` : '';
    axios.get(`${API}/api/admin/ces/pirs${params}`, { withCredentials: true })
      .then(r => setPirs(r.data))
      .catch(() => setPirs([]))
      .finally(() => setLoading(false));
  }, [quarter]);

  useEffect(() => { fetchPIRs(); }, [fetchPIRs]);

  const filtered = pirs.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.program?.toLowerCase().includes(q) ||
      p.school?.toLowerCase().includes(q) ||
      p.owner?.toLowerCase().includes(q)
    );
  });
  const showReviewEndCue = shouldShowEndOfListCue(filtered.length);

  const openModal = (type, pir, e) => {
    e.stopPropagation();
    setModal({ type, pirId: pir.id, program: pir.program, quarter: pir.quarter });
    setRemarks('');
    setError('');
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      const endpoint = modal.type === 'note'
        ? `${API}/api/admin/ces/pirs/${modal.pirId}/note`
        : `${API}/api/admin/ces/pirs/${modal.pirId}/return`;
      await axios.post(endpoint, { ces_remarks: remarks }, { withCredentials: true });
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
          PIRs awaiting your review. Note to forward to SDS, or return to the submitter.
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
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 dark:focus:ring-teal-700"
          />
        </div>
        <select
          value={quarter}
          onChange={e => setQuarter(e.target.value)}
          className="text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300 dark:focus:ring-teal-700"
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
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-teal-500 animate-spin" />
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
                <th className="text-left px-5 py-3 hidden sm:table-cell">Submitted</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">By</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-dark-border/40">
              {filtered.map(p => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50 dark:hover:bg-dark-border/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/ces/pirs/${p.id}`)}
                >
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
                  <td className="px-5 py-3.5 hidden sm:table-cell text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">
                    {p.submittedAt ? new Date(p.submittedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell text-slate-500 dark:text-slate-400 text-xs max-w-[120px] truncate">
                    {p.submittedBy ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                      {p.status === 'Under Review' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-700/60">
                          Under Review{p.activeReviewerName ? ` · ${p.activeReviewerName}` : ''}
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={e => openModal('note', p, e)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40 border border-teal-200 dark:border-teal-700/60 transition-colors"
                          >
                            <Stamp size={13} />
                            Note
                          </button>
                          <button
                            onClick={e => openModal('return', p, e)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-700/60 transition-colors"
                          >
                            <ArrowUUpLeft size={13} />
                            Return
                          </button>
                        </>
                      )}
                      <ArrowRight size={15} className="text-slate-300 dark:text-slate-600 ml-1" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-3">
          <EndOfListCue
            count={filtered.length}
            message={search || !quarter ? 'All matching PIRs shown' : 'End of review queue'}
            countLabel="PIR"
            showCount
          />
          {!showReviewEndCue && (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-right">
              {filtered.length} PIR{filtered.length !== 1 ? 's' : ''} pending review
            </p>
          )}
        </div>
      )}

      {/* Action Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-slate-200 dark:border-dark-border w-full max-w-md p-6">
            <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1">
              {modal.type === 'note' ? 'Note / Forward to SDS' : 'Return to Submitter'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {modal.program} — {modal.quarter}
            </p>

            {modal.type === 'note' ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                This PIR will be forwarded to the SDS for final review. You may add optional remarks.
              </p>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                This PIR will be returned to the submitter for corrections. Please provide feedback.
              </p>
            )}

            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              {modal.type === 'note' ? 'Remarks (optional)' : 'Feedback / Reason for return'}
            </label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={3}
              placeholder={modal.type === 'note' ? 'Add notes for SDS…' : 'Explain what needs to be corrected…'}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base text-slate-700 dark:text-slate-200 px-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 dark:focus:ring-teal-700 resize-none"
            />

            {error && (
              <p className="mt-2 text-xs text-red-500">{error}</p>
            )}

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
                  modal.type === 'note'
                    ? 'bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600'
                    : 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500'
                } disabled:opacity-60`}
              >
                {submitting ? 'Saving…' : modal.type === 'note' ? 'Note & Forward' : 'Return PIR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
