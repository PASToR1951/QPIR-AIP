import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Stamp, ArrowUUpLeft } from '@phosphor-icons/react';

const API = import.meta.env.VITE_API_URL;


const formatCurrency = (val) => {
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n);
};

function SectionHeading({ label }) {
  return (
    <h2 className="font-black text-sm text-slate-700 dark:text-slate-200 uppercase tracking-widest border-l-4 border-teal-400 pl-3 mb-4">
      {label}
    </h2>
  );
}

export default function CESPIRReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pir, setPir] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'note' | 'return'
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [reviewCountdown, setReviewCountdown] = useState(3 * 60); // seconds
  const [isUnderReview, setIsUnderReview] = useState(false);
  const countdownRef = useRef(null);
  const startReviewFiredRef = useRef(false);

  useEffect(() => {
    axios.get(`${API}/api/admin/pirs/${id}`, { withCredentials: true })
      .then(r => {
        setPir(r.data);
        // If already under review (e.g. re-opened), skip timer
        if (r.data?.status === 'Under Review') {
          setIsUnderReview(true);
          setReviewCountdown(0);
        }
      })
      .catch(() => setPir(null))
      .finally(() => setLoading(false));
  }, [id]);

  // 3-minute countdown — starts once PIR is loaded and not already Under Review
  useEffect(() => {
    if (loading || isUnderReview || startReviewFiredRef.current) return;

    countdownRef.current = setInterval(() => {
      setReviewCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          if (!startReviewFiredRef.current) {
            startReviewFiredRef.current = true;
            axios.post(`${API}/api/admin/ces/pirs/${id}/start-review`, {}, { withCredentials: true })
              .then(() => setIsUnderReview(true))
              .catch(() => {}); // silently fail — status update is best-effort
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [loading, isUnderReview, id]);

  const handleAction = async () => {
    setSubmitting(true);
    setError('');
    try {
      const endpoint = modal === 'note'
        ? `${API}/api/admin/ces/pirs/${id}/note`
        : `${API}/api/admin/ces/pirs/${id}/return`;
      await axios.post(endpoint, { ces_remarks: remarks }, { withCredentials: true });
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-teal-500 animate-spin" />
      </div>
    );
  }

  if (!pir) {
    return (
      <div className="p-12 text-center text-sm text-slate-400 dark:text-slate-500">
        PIR not found.
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-full bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center">
          <Stamp size={28} className="text-teal-600 dark:text-teal-400" />
        </div>
        <p className="text-base font-bold text-slate-700 dark:text-slate-200">
          {modal === 'note' ? 'PIR forwarded to SDS.' : 'PIR returned to submitter.'}
        </p>
        <button
          onClick={() => navigate('/ces')}
          className="mt-2 px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors"
        >
          Back to Queue
        </button>
      </div>
    );
  }

  const canAct = pir.status === 'For CES Review' || pir.status === 'Under Review';
  const countdownMins = Math.floor(reviewCountdown / 60);
  const countdownSecs = String(reviewCountdown % 60).padStart(2, '0');

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/ces')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Queue
        </button>

        {canAct && (
          <div className="flex items-center gap-2">
            {!isUnderReview && reviewCountdown > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-dark-border tabular-nums">
                Flagging as Under Review in {countdownMins}:{countdownSecs}
              </span>
            )}
            {isUnderReview && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-700/60">
                Under Review
              </span>
            )}
            <button
              onClick={() => { setModal('return'); setRemarks(''); setError(''); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-700/60 transition-colors"
            >
              <ArrowUUpLeft size={13} />
              Return to Submitter
            </button>
            <button
              onClick={() => { setModal('note'); setRemarks(''); setError(''); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 transition-colors"
            >
              <Stamp size={13} />
              Note / Forward to SDS
            </button>
          </div>
        )}
      </div>

      {/* PIR Header */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1">{pir.program}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{pir.school} · {pir.quarter}</p>
          </div>
          <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-700/60 whitespace-nowrap">
            {pir.status}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div><span className="text-slate-400 dark:text-slate-500 block mb-0.5">Program Owner</span><span className="font-semibold text-slate-700 dark:text-slate-200">{pir.owner || '—'}</span></div>
          <div><span className="text-slate-400 dark:text-slate-500 block mb-0.5">Budget (Division)</span><span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(pir.budgetFromDivision)}</span></div>
          <div><span className="text-slate-400 dark:text-slate-500 block mb-0.5">Budget (CO-PSF)</span><span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(pir.budgetFromCoPSF)}</span></div>
        </div>
      </div>

      {/* Performance Indicators */}
      {pir.indicatorQuarterlyTargets?.length > 0 && (
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-6 mb-6 shadow-sm">
          <SectionHeading label="Performance Indicators" />
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-black border-b border-slate-100 dark:border-dark-border">
                <th className="text-left pb-2">Indicator</th>
                <th className="text-right pb-2">Annual Target</th>
                <th className="text-right pb-2">Quarterly Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-dark-border/40">
              {pir.indicatorQuarterlyTargets.map((ind, i) => (
                <tr key={i} className="text-slate-600 dark:text-slate-300">
                  <td className="py-2 pr-4">{ind.description}</td>
                  <td className="py-2 text-right font-mono">{ind.annual_target}</td>
                  <td className="py-2 text-right font-mono font-bold">{ind.quarterly_target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Activities */}
      {pir.activities?.length > 0 && (
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-6 mb-6 shadow-sm">
          <SectionHeading label="Activity Reviews" />
          <div className="space-y-4">
            {pir.activities.map((a, i) => (
              <div key={i} className="border border-slate-100 dark:border-dark-border rounded-xl p-4 text-sm">
                <div className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{a.name || `Activity ${i + 1}`}</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div><span className="font-bold">Complied:</span> {a.complied === null ? 'Unplanned' : a.complied ? 'Yes' : 'No'}</div>
                  <div><span className="font-bold">Period:</span> {a.implementation_period || '—'}</div>
                  <div><span className="font-bold">Physical:</span> {a.physAcc} / {a.physTarget}</div>
                  <div><span className="font-bold">Financial:</span> {formatCurrency(a.finAcc)} / {formatCurrency(a.finTarget)}</div>
                </div>
                {a.actualTasksConducted && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300"><span className="font-bold">Tasks:</span> {a.actualTasksConducted}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {pir.actionItems?.length > 0 && (
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-6 mb-6 shadow-sm">
          <SectionHeading label="Action Items" />
          <div className="space-y-3">
            {pir.actionItems.map((item, i) => (
              <div key={i} className="text-sm text-slate-600 dark:text-slate-300 border-l-2 border-slate-200 dark:border-dark-border pl-3">
                {item.action}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note/Return Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-slate-200 dark:border-dark-border w-full max-w-md p-6">
            <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1">
              {modal === 'note' ? 'Note / Forward to SDS' : 'Return to Submitter'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{pir.program} — {pir.quarter}</p>

            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              {modal === 'note' ? 'Remarks (optional)' : 'Feedback / Reason for return'}
            </label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={3}
              placeholder={modal === 'note' ? 'Add notes for SDS…' : 'Explain what needs to be corrected…'}
              className="w-full text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base text-slate-700 dark:text-slate-200 px-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 dark:focus:ring-teal-700 resize-none"
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
                onClick={handleAction}
                disabled={submitting}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition-colors ${
                  modal === 'note'
                    ? 'bg-teal-600 hover:bg-teal-700'
                    : 'bg-amber-500 hover:bg-amber-600'
                } disabled:opacity-60`}
              >
                {submitting ? 'Saving…' : modal === 'note' ? 'Note & Forward' : 'Return PIR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
