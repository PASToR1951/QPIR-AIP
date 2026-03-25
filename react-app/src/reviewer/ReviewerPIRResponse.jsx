import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, FloppyDisk, CheckCircle } from '@phosphor-icons/react';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const FACTOR_TYPES = ['Governance', 'Learning Outcome', 'Access', 'Management'];

const formatCurrency = (val) => {
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n);
};

function ReadOnlyTextarea({ value }) {
  return (
    <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap min-h-[2rem] leading-relaxed">
      {value || <span className="italic text-slate-300 dark:text-slate-600">—</span>}
    </div>
  );
}

function AutoResizeTextarea({ value, onChange, placeholder }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={2}
      className="w-full resize-none text-sm rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-200 placeholder-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 overflow-hidden leading-relaxed"
    />
  );
}

function SectionHeading({ label }) {
  return (
    <h2 className="font-black text-sm text-slate-700 dark:text-slate-200 uppercase tracking-widest border-l-4 border-blue-400 pl-3 mb-4">
      {label}
    </h2>
  );
}

export default function ReviewerPIRResponse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pir, setPir] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionItems, setActionItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API}/api/admin/pirs/${id}`, { headers: authHeaders() })
      .then(r => {
        setPir(r.data);
        const items = r.data.actionItems ?? [];
        // Ensure 5 rows
        const filled = Array(5).fill(null).map((_, i) => ({
          action: items[i]?.action ?? '',
          response_asds: items[i]?.response_asds ?? '',
          response_sds: items[i]?.response_sds ?? '',
        }));
        setActionItems(filled);
      })
      .catch(() => setError('Failed to load PIR.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleResponseChange = (index, field, value) => {
    setActionItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await axios.patch(
        `${API}/api/admin/pirs/${id}/management-response`,
        { action_items: actionItems },
        { headers: authHeaders() }
      );
      setSaved(true);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-7 h-7 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  if (!pir || error) {
    return (
      <div className="text-center py-24 text-slate-500 dark:text-slate-400 text-sm">
        {error || 'PIR not found.'}
        <button onClick={() => navigate('/reviewer')} className="block mx-auto mt-4 text-blue-500 hover:underline">
          Back to submissions
        </button>
      </div>
    );
  }

  const aipActivities = pir.activities?.filter(a => !a.isUnplanned) ?? [];
  const unplannedActivities = pir.activities?.filter(a => a.isUnplanned) ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <button
            onClick={() => navigate('/reviewer')}
            className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold uppercase tracking-widest mb-3 transition-colors"
          >
            <ArrowLeft size={13} />
            Back
          </button>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{pir.program}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {pir.school} — {pir.quarter}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={15} weight="fill" />
              Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <FloppyDisk size={15} />
            {saving ? 'Saving…' : 'Save Responses'}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Section A — Program Profile */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-6 shadow-sm">
          <SectionHeading label="A. Program Profile" />
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Program Title</dt>
              <dd className="text-slate-700 dark:text-slate-200 font-semibold">{pir.program}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">School / Unit</dt>
              <dd className="text-slate-700 dark:text-slate-200">{pir.school}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Program Owner</dt>
              <dd className="text-slate-700 dark:text-slate-200">{pir.owner || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Quarter</dt>
              <dd className="text-slate-700 dark:text-slate-200">{pir.quarter}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Budget — From Division</dt>
              <dd className="text-slate-700 dark:text-slate-200">{formatCurrency(pir.budgetFromDivision)}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Budget — From CO-PSF</dt>
              <dd className="text-slate-700 dark:text-slate-200">{formatCurrency(pir.budgetFromCoPSF)}</dd>
            </div>
          </dl>
        </div>

        {/* Section B — Performance Indicators */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-6 shadow-sm">
          <SectionHeading label="B. Performance Indicators" />
          {pir.indicatorQuarterlyTargets?.length === 0 ? (
            <p className="text-sm italic text-slate-400 dark:text-slate-500">No performance indicators specified.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-black border-b border-slate-100 dark:border-dark-border">
                    <th className="text-left pb-2 pr-4 w-[50%]">Annual Performance Indicator</th>
                    <th className="text-left pb-2 pr-4">Annual Target</th>
                    <th className="text-left pb-2">This Quarter's Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-dark-border/40">
                  {pir.indicatorQuarterlyTargets.map((ind, i) => (
                    <tr key={i}>
                      <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">{ind.description}</td>
                      <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{ind.annual_target || '—'}</td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">{ind.quarterly_target || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section C — Monitoring & Evaluation */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-6 shadow-sm">
          <SectionHeading label="C. Monitoring & Evaluation" />
          <div className="space-y-4">
            {aipActivities.map((act, i) => (
              <ActivityRow key={act.id ?? i} index={i + 1} act={act} />
            ))}
            {unplannedActivities.length > 0 && (
              <>
                <div className="pt-4 pb-1 border-t-2 border-dashed border-slate-200 dark:border-dark-border">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Activities Conducted But Not Included in AIP
                  </p>
                </div>
                {unplannedActivities.map((act, i) => (
                  <ActivityRow key={act.id ?? `u${i}`} index={i + 1} act={act} />
                ))}
              </>
            )}
            {pir.activities?.length === 0 && (
              <p className="text-sm italic text-slate-400 dark:text-slate-500">No activities recorded.</p>
            )}
          </div>
        </div>

        {/* Section D — Factors */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border p-6 shadow-sm">
          <SectionHeading label="D. Factors Affecting Implementation" />
          <div className="space-y-4">
            {FACTOR_TYPES.map(type => {
              const f = pir.factors?.[type];
              if (!f) return null;
              return (
                <div key={type} className="rounded-xl border border-slate-100 dark:border-dark-border overflow-hidden">
                  <div className="px-4 py-2 bg-slate-50 dark:bg-dark-border/30 border-b border-slate-100 dark:border-dark-border">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{type}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-dark-border">
                    <div className="p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Facilitating</p>
                      <ReadOnlyTextarea value={f.facilitating} />
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Hindering</p>
                      <ReadOnlyTextarea value={f.hindering} />
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Recommendations</p>
                      <ReadOnlyTextarea value={f.recommendations} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section E — Action Items (editable) */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-blue-200 dark:border-blue-800/60 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <SectionHeading label="E. Action Items & Management Response" />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-5 -mt-2">
            The program owner's action items are read-only. Fill in the management response columns below.
          </p>

          <div className="space-y-4">
            {actionItems.map((item, i) => (
              <div key={i} className="rounded-xl border border-slate-100 dark:border-dark-border overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 dark:bg-dark-border/30 border-b border-slate-100 dark:border-dark-border">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Item {i + 1}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-dark-border">
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                      Action Item / Ways Forward
                      <span className="ml-1.5 font-normal normal-case text-slate-300 dark:text-slate-600">(read-only)</span>
                    </p>
                    <ReadOnlyTextarea value={item.action} />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                      Management Response — ASDS / FD Chief
                    </p>
                    <AutoResizeTextarea
                      value={item.response_asds}
                      onChange={e => handleResponseChange(i, 'response_asds', e.target.value)}
                      placeholder="Enter response…"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                      Management Response — SDS
                    </p>
                    <AutoResizeTextarea
                      value={item.response_sds}
                      onChange={e => handleResponseChange(i, 'response_sds', e.target.value)}
                      placeholder="Enter response…"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 mt-4">{error}</p>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <FloppyDisk size={15} />
              {saving ? 'Saving…' : 'Save Responses'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ index, act }) {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-dark-border overflow-hidden text-sm">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-dark-border/30 border-b border-slate-100 dark:border-dark-border">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">#{index}</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200 flex-1">{act.name || 'Unplanned Activity'}</span>
        {!act.isUnplanned && act.complied !== null && (
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
            act.complied
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/60'
              : 'bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-700/60'
          }`}>
            {act.complied ? '✓ Complied' : '✗ Not Complied'}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-50 dark:divide-dark-border/40 border-b border-slate-50 dark:border-dark-border/40 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        <div className="px-3 py-1.5">Phys. Target</div>
        <div className="px-3 py-1.5">Fin. Target</div>
        <div className="px-3 py-1.5">Phys. Acc.</div>
        <div className="px-3 py-1.5">Fin. Acc.</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-50 dark:divide-dark-border/40 border-b border-slate-100 dark:border-dark-border text-center text-sm">
        <div className="px-3 py-2 text-slate-600 dark:text-slate-300">{act.physTarget ?? '—'}</div>
        <div className="px-3 py-2 text-slate-600 dark:text-slate-300">{formatCurrency(act.finTarget)}</div>
        <div className="px-3 py-2 text-slate-600 dark:text-slate-300">{act.physAcc ?? '—'}</div>
        <div className="px-3 py-2 text-slate-600 dark:text-slate-300">{formatCurrency(act.finAcc)}</div>
      </div>
      {(act.actualTasksConducted || act.contributoryIndicators || act.movsExpectedOutputs || act.adjustments || act.actions) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-50 dark:divide-dark-border/40 p-0">
          {act.actualTasksConducted && (
            <div className="p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Actual Tasks Conducted</p>
              <ReadOnlyTextarea value={act.actualTasksConducted} />
            </div>
          )}
          {act.contributoryIndicators && (
            <div className="p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Contributory Indicators</p>
              <ReadOnlyTextarea value={act.contributoryIndicators} />
            </div>
          )}
          {act.movsExpectedOutputs && (
            <div className="p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">MOVs / Expected Outputs</p>
              <ReadOnlyTextarea value={act.movsExpectedOutputs} />
            </div>
          )}
          {act.adjustments && (
            <div className="p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Adjustments</p>
              <ReadOnlyTextarea value={act.adjustments} />
            </div>
          )}
          {act.actions && (
            <div className="p-3 md:col-span-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Actions to Address Gap</p>
              <ReadOnlyTextarea value={act.actions} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
