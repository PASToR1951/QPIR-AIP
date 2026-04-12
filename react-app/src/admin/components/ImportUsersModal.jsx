import React, { useState } from 'react';
import {
  XCircle, ArrowLeft, UploadSimple, CheckCircle, Warning,
  FileArrowUp, CaretDown, CaretRight,
} from '@phosphor-icons/react';
import api, { API } from '../../lib/api.js';
import { readSSEJsonStream } from '../../lib/readSSEStream.js';

const VALID_ROLES = new Set([
  'School', 'Division Personnel', 'Admin',
  'CES-SGOD', 'CES-ASDS', 'CES-CID', 'Cluster Coordinator', 'Observer',
]);
const SYSTEM_ROLES = new Set(['Admin', 'CES-SGOD', 'CES-ASDS', 'CES-CID', 'Cluster Coordinator', 'Observer']);

/* ── CSV parser ─────────────────────────────────────────────── */
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0]
    .replace(/^\uFEFF/, '')  // strip BOM
    .split(',')
    .map(h => h.trim().toLowerCase());

  return lines.slice(1).map((line, idx) => {
    const vals = line.split(',').map(v => v.trim());
    const row = Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));

    // Coerce program_ids from semicolon-separated string
    if (row.program_ids) {
      row.program_ids = row.program_ids
        .split(';')
        .map(v => parseInt(v.trim(), 10))
        .filter(n => !isNaN(n) && n > 0);
    } else {
      row.program_ids = [];
    }

    // Coerce school_id / cluster_id
    row.school_id = row.school_id ? parseInt(row.school_id, 10) || null : null;
    row.cluster_id = row.cluster_id ? parseInt(row.cluster_id, 10) || null : null;

    // Client-side validation
    const errs = [];
    const email = (row.email || '').toLowerCase().trim();
    row.email = email;

    if (!email || !email.endsWith('@deped.gov.ph')) {
      errs.push('Email must end with @deped.gov.ph');
    }
    if (!VALID_ROLES.has(row.role)) {
      errs.push(`Unknown role: "${row.role || '(empty)'}"`);
    } else {
      if (SYSTEM_ROLES.has(row.role) && !row.name?.trim()) {
        errs.push(`"name" is required for role "${row.role}"`);
      }
      if (row.role === 'Division Personnel' && (!row.first_name?.trim() || !row.last_name?.trim())) {
        errs.push('first_name and last_name are required for Division Personnel');
      }
      if (row.role === 'School' && !row.school_id) {
        errs.push('Valid school_id is required for School role');
      }
    }

    return { ...row, _row: idx + 2, _valid: errs.length === 0, _errors: errs };
  });
}

/* ── Example CSV ─────────────────────────────────────────────── */
const EXAMPLE_CSV = `email,role,name,first_name,last_name,middle_initial,school_id,cluster_id,program_ids
101234@deped.gov.ph,School,,,,,42,,
juan.delacruz@deped.gov.ph,Division Personnel,,Juan,Dela Cruz,D,,,2;5
juan.delacruz001@deped.gov.ph,Division Personnel,,Juan,Dela Cruz,A,,,3
maria.santos@deped.gov.ph,Cluster Coordinator,Maria Santos,,,,,7,
ces.head@deped.gov.ph,CES-SGOD,Rowena Flores,,,,,,
observer@deped.gov.ph,Observer,Monitoring Observer,,,,,,`;

/* ── Step 1: Paste ───────────────────────────────────────────── */
function PasteStep({ csvText, setCsvText, parseError }) {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        Paste a CSV list of users below. Pre-created accounts auto-link when a user first signs in via OAuth — no manual activation needed.
      </p>

      {/* Format guide */}
      <div className="border border-slate-200 dark:border-dark-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setGuideOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide hover:bg-slate-50 dark:hover:bg-dark-border/40 transition-colors"
        >
          <span>CSV Format Guide</span>
          {guideOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
        </button>
        {guideOpen && (
          <div className="px-4 pb-4 border-t border-slate-100 dark:border-dark-border space-y-3">
            <table className="w-full text-xs mt-3">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400">
                  <th className="pr-3 pb-1.5 font-black">Column</th>
                  <th className="pr-3 pb-1.5 font-black">Required for</th>
                  <th className="pb-1.5 font-black">Notes</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-dark-border">
                {[
                  ['email', 'All roles', 'Must end @deped.gov.ph'],
                  ['role', 'All roles', 'School | Division Personnel | Admin | CES-SGOD | CES-ASDS | CES-CID | Cluster Coordinator | Observer'],
                  ['name', 'Admin, CES-*, Cluster Coordinator, Observer', 'Full display name'],
                  ['first_name', 'Division Personnel', 'Given name'],
                  ['last_name', 'Division Personnel', 'Surname'],
                  ['middle_initial', 'Division Personnel', 'Optional (e.g. "D")'],
                  ['school_id', 'School', 'Numeric ID from Schools list'],
                  ['cluster_id', 'Cluster Coordinator', 'Optional numeric cluster ID'],
                  ['program_ids', 'Division Personnel', 'Optional; semicolon-separated IDs e.g. "2;5;8"'],
                ].map(([col, req, note]) => (
                  <tr key={col}>
                    <td className="pr-3 py-1.5 font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{col}</td>
                    <td className="pr-3 py-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{req}</td>
                    <td className="py-1.5 text-slate-500 dark:text-slate-400">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div>
              <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Example</p>
              <pre className="text-[11px] bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-lg p-3 overflow-x-auto text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre">
                {EXAMPLE_CSV}
              </pre>
              <button
                type="button"
                onClick={() => setCsvText(EXAMPLE_CSV)}
                className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Load example into editor
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Textarea */}
      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
          CSV Data
        </label>
        <textarea
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          rows={10}
          spellCheck={false}
          placeholder={`email,role,name,...\n101234@deped.gov.ph,School,,,,,42,,\njuan.delacruz@deped.gov.ph,Division Personnel,,Juan,Dela Cruz,...`}
          className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-y"
        />
        {parseError && (
          <p className="mt-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">{parseError}</p>
        )}
      </div>
    </div>
  );
}

/* ── Step 2: Preview ─────────────────────────────────────────── */
function PreviewStep({ parsed }) {
  const validCount = parsed.filter(r => r._valid).length;
  const invalidCount = parsed.length - validCount;

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-black">
          <CheckCircle size={13} weight="fill" /> {validCount} valid
        </span>
        {invalidCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs font-black">
            <Warning size={13} weight="fill" /> {invalidCount} invalid — will be skipped
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-dark-border rounded-xl">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-dark-base">
            <tr className="text-left text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[11px] font-black">
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Email</th>
              <th className="px-3 py-2.5">Role</th>
              <th className="px-3 py-2.5">Name / Names</th>
              <th className="px-3 py-2.5">School ID</th>
              <th className="px-3 py-2.5">Programs</th>
              <th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
            {parsed.map((row) => (
              <tr key={row._row} className={row._valid ? '' : 'bg-rose-50/40 dark:bg-rose-950/10'}>
                <td className="px-3 py-2 text-slate-400">{row._row}</td>
                <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-[220px] truncate" title={row.email}>
                  {row.email || <span className="text-slate-400 italic">(empty)</span>}
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.role || '—'}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                  {row.name || [row.first_name, row.middle_initial, row.last_name].filter(Boolean).join(' ') || '—'}
                </td>
                <td className="px-3 py-2 text-slate-500">{row.school_id || '—'}</td>
                <td className="px-3 py-2 text-slate-500">
                  {row.program_ids?.length > 0 ? row.program_ids.join(', ') : '—'}
                </td>
                <td className="px-3 py-2">
                  {row._valid ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-black whitespace-nowrap">
                      <CheckCircle size={11} weight="fill" /> Valid
                    </span>
                  ) : (
                    <div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-[11px] font-black whitespace-nowrap">
                        <Warning size={11} weight="fill" /> Invalid
                      </span>
                      <ul className="mt-1 space-y-0.5">
                        {row._errors.map((e, i) => (
                          <li key={i} className="text-[11px] text-rose-600 dark:text-rose-400">{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Step 3: Results ─────────────────────────────────────────── */
function ResultsStep({ results }) {
  return (
    <div className="space-y-5">
      {/* Stat blocks */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
          <CheckCircle size={26} weight="fill" className="text-emerald-500" />
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{results.imported}</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500">Imported</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
          <Warning size={26} weight="fill" className="text-amber-500" />
          <span className="text-2xl font-black text-amber-700 dark:text-amber-400">{results.skipped}</span>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-500">Skipped</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
          <XCircle size={26} weight="fill" className="text-rose-500" />
          <span className="text-2xl font-black text-rose-700 dark:text-rose-400">{results.errors.length}</span>
          <span className="text-xs font-bold text-rose-600 dark:text-rose-500">Errors</span>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Skipped accounts already existed and were left unchanged.
      </p>

      {/* Error list */}
      {results.errors.length > 0 && (
        <div>
          <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide mb-2">
            Errors ({results.errors.length})
          </p>
          <div className="border border-rose-200 dark:border-rose-900/40 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-rose-50 dark:bg-rose-950/20 sticky top-0">
                <tr className="text-left text-rose-600 dark:text-rose-400 text-[11px] font-black uppercase tracking-wide">
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100 dark:divide-rose-900/20">
                {results.errors.map((e, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-300">{e.email}</td>
                    <td className="px-3 py-1.5 text-rose-600 dark:text-rose-400">{e.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function WelcomeBatchProgress({ progress, results }) {
  const completed = progress.sent + progress.failed + progress.skipped;
  const percent = progress.total > 0 ? Math.round((completed / progress.total) * 100) : 0;

  return (
    <div className="space-y-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/70 dark:bg-indigo-950/15 p-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-500 dark:text-indigo-400">Welcome Emails</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {progress.running ? 'Sending account invitations…' : 'Welcome email batch'}
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {completed} of {progress.total || results?.created_user_ids?.length || 0}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/80 dark:bg-dark-base overflow-hidden border border-indigo-100 dark:border-indigo-900/30">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
          Do not close this window while the email batch is running.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Sent', value: progress.sent, tone: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Skipped', value: progress.skipped, tone: 'text-amber-600 dark:text-amber-400' },
          { label: 'Failed', value: progress.failed, tone: 'text-rose-600 dark:text-rose-400' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-white/80 dark:border-dark-border bg-white/80 dark:bg-dark-base px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">{card.label}</p>
            <p className={`mt-1 text-lg font-black ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {progress.error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-400">
          {progress.error}
        </div>
      )}

      {progress.items.length > 0 && (
        <div className="max-h-56 overflow-y-auto rounded-xl border border-white/80 dark:border-dark-border bg-white/80 dark:bg-dark-base">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-dark-base border-b border-slate-100 dark:border-dark-border">
              <tr className="text-left text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {progress.items.map((item) => {
                const tone = item.status === 'sent'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : item.status === 'failed'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-amber-600 dark:text-amber-400';
                return (
                  <tr key={`${item.user_id}-${item.email}`}>
                    <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{item.email || `User #${item.user_id}`}</td>
                    <td className={`px-3 py-2 font-black capitalize ${tone}`}>{item.status}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{item.error || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export function ImportUsersModal({ open, onClose, onImportComplete }) {
  const [step, setStep] = useState(1);
  const [csvText, setCsvText] = useState('');
  const [parsed, setParsed] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [parseError, setParseError] = useState('');
  const [apiError, setApiError] = useState('');
  const [welcomeProgress, setWelcomeProgress] = useState({
    running: false,
    total: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    items: [],
    error: '',
  });

  if (!open) return null;

  const handleClose = () => {
    setStep(1);
    setCsvText('');
    setParsed([]);
    setResults(null);
    setParseError('');
    setApiError('');
    setWelcomeProgress({
      running: false,
      total: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      items: [],
      error: '',
    });
    onClose();
  };

  const startWelcomeBatch = async (userIds) => {
    setWelcomeProgress({
      running: true,
      total: userIds.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      items: [],
      error: '',
    });

    try {
      const response = await fetch(`${API}/api/admin/email/send-welcome-batch`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'text/event-stream',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_ids: userIds }),
      });

      await readSSEJsonStream(response, (payload) => {
        if (payload.type === 'started') {
          setWelcomeProgress((prev) => ({
            ...prev,
            running: true,
            total: payload.total ?? prev.total,
          }));
          return;
        }

        if (payload.type === 'item') {
          setWelcomeProgress((prev) => {
            const existingIndex = prev.items.findIndex((item) => item.user_id === payload.user_id);
            const nextItems = existingIndex === -1
              ? [...prev.items, payload]
              : prev.items.map((item, index) => index === existingIndex ? payload : item);

            const counts = nextItems.reduce((acc, item) => {
              if (item.status === 'sent') acc.sent += 1;
              else if (item.status === 'failed') acc.failed += 1;
              else acc.skipped += 1;
              return acc;
            }, { sent: 0, failed: 0, skipped: 0 });

            return {
              ...prev,
              items: nextItems,
              ...counts,
            };
          });
          return;
        }

        if (payload.type === 'complete') {
          setWelcomeProgress((prev) => ({
            ...prev,
            running: false,
            total: payload.total ?? prev.total,
            sent: payload.sent ?? prev.sent,
            failed: payload.failed ?? prev.failed,
            skipped: payload.skipped ?? prev.skipped,
          }));
        }
      });
    } catch (error) {
      setWelcomeProgress((prev) => ({
        ...prev,
        running: false,
        error: error.message || 'Welcome email batch failed.',
      }));
    }
  };

  const handlePreview = () => {
    setParseError('');
    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      setParseError('No data rows found. Make sure your CSV includes a header row and at least one data row.');
      return;
    }
    setParsed(rows);
    setStep(2);
  };

  const handleImport = async () => {
    setApiError('');
    setImporting(true);
    const validRows = parsed
      .filter(r => r._valid)
      .map(({ email, role, name, first_name, last_name, middle_initial, school_id, cluster_id, program_ids }) => ({
        email, role,
        ...(name?.trim() && { name }),
        ...(first_name?.trim() && { first_name }),
        ...(last_name?.trim() && { last_name }),
        ...(middle_initial?.trim() && { middle_initial }),
        ...(school_id && { school_id }),
        ...(cluster_id && { cluster_id }),
        ...(program_ids?.length > 0 && { program_ids }),
      }));

    try {
      const res = await api.post('/api/admin/users/import', { users: validRows });
      setResults(res.data);
      setStep(3);
      if (Array.isArray(res.data?.created_user_ids) && res.data.created_user_ids.length > 0) {
        void startWelcomeBatch(res.data.created_user_ids);
      }
    } catch (err) {
      setApiError(err.friendlyMessage ?? 'Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsed.filter(r => r._valid).length;

  const stepLabel = step === 1 ? 'Paste CSV' : step === 2 ? 'Preview' : 'Results';
  const panelSizeClass = step === 2 ? 'w-[min(96vw,80rem)]' : 'w-[min(96vw,64rem)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className={`relative z-10 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.22)] dark:shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] flex flex-col max-w-[calc(100vw-2rem)] max-h-[90vh] min-w-[min(32rem,calc(100vw-2rem))] min-h-[min(24rem,80vh)] resize overflow-hidden ${panelSizeClass}`}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-dark-border shrink-0">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="p-1.5 -ml-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <FileArrowUp size={16} weight="bold" className="text-indigo-500" />
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Import Directory</h2>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {[1, 2, 3].map(s => (
                <span
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${s === step ? 'w-5 bg-indigo-500' : s < step ? 'w-1.5 bg-indigo-300 dark:bg-indigo-700' : 'w-1.5 bg-slate-200 dark:bg-dark-border'}`}
                />
              ))}
              <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1">
                Step {step} of 3 — {stepLabel}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
          >
            <XCircle size={22} weight="fill" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <PasteStep
              csvText={csvText}
              setCsvText={setCsvText}
              parseError={parseError}
            />
          )}
          {step === 2 && <PreviewStep parsed={parsed} />}
          {step === 3 && <ResultsStep results={results} />}
          {step === 3 && results?.created_user_ids?.length > 0 && (
            <div className="mt-5">
              <WelcomeBatchProgress progress={welcomeProgress} results={results} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-between gap-3">
          {/* Left side: back or error */}
          <div className="flex-1">
            {apiError && (
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{apiError}</p>
            )}
          </div>

          {/* Right side: action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border rounded-xl transition-colors"
            >
              {step === 3 ? 'Close' : 'Cancel'}
            </button>

            {step === 1 && (
              <button
                onClick={handlePreview}
                disabled={!csvText.trim()}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <UploadSimple size={16} weight="bold" />
                Preview
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleImport}
                disabled={importing || validCount === 0}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileArrowUp size={16} weight="bold" />
                {importing ? 'Importing…' : `Import ${validCount} user${validCount !== 1 ? 's' : ''}`}
              </button>
            )}

            {step === 3 && (
              <button
                onClick={() => {
                  onImportComplete();
                  handleClose();
                }}
                disabled={welcomeProgress.running}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
              >
                <CheckCircle size={16} weight="bold" />
                Done
              </button>
            )}
          </div>
        </div>
        <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-slate-300/80 dark:border-slate-600/80" aria-hidden="true" />
      </div>
    </div>
  );
}

export default ImportUsersModal;
