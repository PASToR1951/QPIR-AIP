import React, { useMemo, useState } from 'react';
import {
  XCircle, ArrowLeft, UploadSimple, CheckCircle,
  FileArrowUp, CaretDown, CaretRight,
} from '@phosphor-icons/react';
import api, { API } from '../../lib/api.js';
import { readSSEJsonStream } from '../../lib/readSSEStream.js';
import { parseCSV } from './importUsersModal/importUsersCsv.js';
import { PasteStep } from './importUsersModal/PasteStep.jsx';
import { PreviewStep } from './importUsersModal/PreviewStep.jsx';
import { ResultsStep } from './importUsersModal/ResultsStep.jsx';
import { WelcomeBatchProgress } from './importUsersModal/WelcomeBatchProgress.jsx';

/* ── Main component ──────────────────────────────────────────── */
export function ImportUsersModal({ open, onClose, onImportComplete }) {
  const initialWelcomeProgress = useMemo(() => ({
    running: false,
    total: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    items: [],
    error: '',
  }), []);
  const [step, setStep] = useState(1);
  const [csvText, setCsvText] = useState('');
  const [parsed, setParsed] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [parseError, setParseError] = useState('');
  const [apiError, setApiError] = useState('');
  const [welcomeProgress, setWelcomeProgress] = useState(initialWelcomeProgress);

  if (!open) return null;

  const handleClose = () => {
    setStep(1);
    setCsvText('');
    setParsed([]);
    setResults(null);
    setParseError('');
    setApiError('');
    setWelcomeProgress(initialWelcomeProgress);
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
