import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, NotePencil, FloppyDisk } from '@phosphor-icons/react';
import { StatusBadge } from './StatusBadge.jsx';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

/**
 * PIRRemarksModal
 * Isolated panel for admins to view a PIR summary and write/edit official remarks.
 *
 * Props:
 *   open        – boolean
 *   pir         – row object from AdminSubmissions (id, school, program, quarter, status, submittedBy)
 *   onClose     – () => void
 *   onSaved     – (remarks: string) => void  — called after successful save
 */
export function PIRRemarksModal({ open, pir, onClose, onSaved }) {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Load existing remarks when modal opens
  useEffect(() => {
    if (!open || !pir) return;
    setSaved(false);
    setError(null);
    setFetchLoading(true);
    axios
      .get(`${API}/api/admin/submissions/${pir.id}?type=pir`, { headers: authHeaders() })
      .then(r => setRemarks(r.data.remarks ?? ''))
      .catch(() => setRemarks(''))
      .finally(() => setFetchLoading(false));
  }, [open, pir]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      await axios.patch(
        `${API}/api/admin/pirs/${pir.id}/remarks`,
        { remarks },
        { headers: authHeaders() }
      );
      setSaved(true);
      onSaved?.(remarks);
    } catch {
      setError('Failed to save remarks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open || !pir) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-dark-surface border border-dark-border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border shrink-0">
          <div className="flex items-center gap-2 text-slate-100">
            <NotePencil size={18} className="text-accent" />
            <span className="font-black text-sm uppercase tracking-wide">PIR Remarks</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* PIR Summary */}
        <div className="px-6 pt-5 pb-4 bg-dark-base border-b border-dark-border space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">School</p>
              <p className="text-sm font-bold text-slate-200 truncate">{pir.school}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Status</p>
              <StatusBadge status={pir.status} size="xs" />
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Program</p>
              <p className="text-sm font-bold text-slate-200">{pir.program}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Quarter</p>
              <p className="text-sm text-slate-300">{pir.quarter ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Submitted By</p>
              <p className="text-sm text-slate-300 truncate">{pir.submittedBy ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* Remarks Textarea */}
        <div className="px-6 py-5 flex-1">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-wide mb-2">
            Admin Remarks
          </label>
          {fetchLoading ? (
            <div className="flex items-center justify-center h-28">
              <div className="w-5 h-5 rounded-full border-2 border-slate-600 border-t-accent animate-spin" />
            </div>
          ) : (
            <textarea
              value={remarks}
              onChange={e => { setRemarks(e.target.value); setSaved(false); }}
              rows={6}
              placeholder="Write official remarks for this PIR submission…"
              className="w-full px-3 py-2.5 text-sm bg-dark-base border border-dark-border rounded-xl resize-none text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent transition-colors"
            />
          )}
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          {saved && <p className="mt-2 text-xs text-emerald-400 font-bold">Remarks saved successfully.</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-dark-border shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-slate-200 hover:bg-dark-border rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={loading || fetchLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-accent text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <FloppyDisk size={15} />
            {loading ? 'Saving…' : 'Save Remarks'}
          </button>
        </div>
      </div>
    </div>
  );
}
