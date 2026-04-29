import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUUpLeft, CheckCircle, Stamp } from '@phosphor-icons/react';
import api from '../lib/api.js';

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <h2 className="mb-4 border-l-4 border-teal-400 pl-3 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function CESAIPReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [aip, setAip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get(`/api/admin/ces/aips/${id}`)
      .then(res => setAip(res.data))
      .catch(() => setAip(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async () => {
    if (modal === 'return' && !remarks.trim()) {
      setError('Remarks are required when returning an AIP.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/api/admin/ces/aips/${id}/${modal}`, { ces_remarks: remarks });
      setDone(true);
    } catch (err) {
      setError(err.friendlyMessage ?? 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-teal-500 dark:border-slate-600" />
      </div>
    );
  }

  if (!aip) return <div className="p-12 text-center text-sm text-slate-400">AIP not found.</div>;

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/40">
          <CheckCircle size={30} className="text-teal-600 dark:text-teal-300" weight="fill" />
        </div>
        <p className="text-base font-bold text-slate-700 dark:text-slate-200">
          {modal === 'approve' ? 'AIP approved.' : 'AIP returned to school.'}
        </p>
        <button onClick={() => navigate('/ces')} className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-teal-700">
          Back to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => navigate('/ces')} className="flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeft size={14} />
          Back to Queue
        </button>
        {aip.status === 'For CES Review' && (
          <div className="flex items-center gap-2">
            <button onClick={() => { setModal('return'); setRemarks(''); setError(''); }} className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300">
              <ArrowUUpLeft size={13} />
              Return
            </button>
            <button onClick={() => { setModal('approve'); setRemarks(''); setError(''); }} className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-teal-700">
              <Stamp size={13} />
              Approve
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">{aip.program}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{aip.school} · FY {aip.year}</p>
            {aip.focalPerson && (
              <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                Recommended by {aip.focalPerson}
              </p>
            )}
          </div>
          <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-teal-700 dark:border-teal-700/60 dark:bg-teal-950/40 dark:text-teal-300">
            {aip.status}
          </span>
        </div>
        {aip.focalRemarks && (
          <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
            {aip.focalRemarks}
          </div>
        )}
      </div>

      <Section title="Plan Details">
        <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
          <div><span className="block text-xs font-bold text-slate-400">Outcome</span>{aip.outcome || '—'}</div>
          <div><span className="block text-xs font-bold text-slate-400">SIP Title</span>{aip.sipTitle || '—'}</div>
          <div><span className="block text-xs font-bold text-slate-400">Target</span>{aip.targetDescription || '—'}</div>
          <div><span className="block text-xs font-bold text-slate-400">Project Coordinator</span>{aip.projectCoordinator || '—'}</div>
        </div>
      </Section>

      <Section title="Activities">
        <div className="space-y-3">
          {(aip.activities ?? []).map(activity => (
            <div key={activity.id} className="rounded-xl border border-slate-100 p-4 text-sm dark:border-dark-border">
              <p className="font-bold text-slate-700 dark:text-slate-200">{activity.name || 'Untitled Activity'}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{activity.phase} · {activity.implementationPeriod || 'No period'} · {formatCurrency(activity.budgetAmount)}</p>
              <p className="mt-2 whitespace-pre-wrap text-slate-600 dark:text-slate-300">{activity.outputs || '—'}</p>
            </div>
          ))}
        </div>
      </Section>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-dark-border dark:bg-dark-surface">
            <h2 className="mb-1 text-base font-black text-slate-800 dark:text-slate-100">
              {modal === 'approve' ? 'Approve AIP' : 'Return AIP'}
            </h2>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">{aip.program} · FY {aip.year}</p>
            <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
              {modal === 'approve' ? 'Remarks (optional)' : 'Remarks / reason for return'}
            </label>
            <textarea
              rows={4}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-300 dark:border-dark-border dark:bg-dark-base dark:text-slate-200 dark:focus:ring-teal-700"
            />
            {error && <p className="mt-2 text-xs font-bold text-red-500">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setModal(null)} disabled={submitting} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-dark-border">
                Cancel
              </button>
              <button onClick={handleAction} disabled={submitting} className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition-colors ${modal === 'approve' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-amber-600 hover:bg-amber-700'} disabled:opacity-60`}>
                {submitting ? 'Saving...' : modal === 'approve' ? 'Approve' : 'Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
