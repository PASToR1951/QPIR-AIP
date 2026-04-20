import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlass,
  FileXls,
  FloppyDisk,
  CheckCircle,
  WarningCircle,
  SpinnerGap,
} from '@phosphor-icons/react';
import api from '../../lib/api.js';

const DIVISIONS = ['SGOD', 'CID', 'OSDS'];
const ALL_STATUSES = 'Draft,Submitted,Under Review,For CES Review,For Cluster Head Review,Approved,Returned';
const DEBOUNCE_MS = 800;

function getCurrentQuarterAndYear() {
  const now = new Date();
  const month = now.getMonth() + 1;
  return { year: now.getFullYear(), quarter: Math.ceil(month / 3) };
}

const QUARTER_LABELS = { 1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4' };
const YEAR_OPTIONS = [2024, 2025, 2026, 2027];

const AdminConsolidationTemplate = () => {
  const { year: defaultYear, quarter: defaultQuarter } = getCurrentQuarterAndYear();

  const [year, setYear] = useState(defaultYear);
  const [quarter, setQuarter] = useState(defaultQuarter);
  const [reportGroups, setReportGroups] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSheet, setActiveSheet] = useState('SGOD');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toast, setToast] = useState(null);
  const debounceTimers = useRef({});

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      year: String(year),
      quarter: String(quarter),
      groupBy: 'program',
      statuses: ALL_STATUSES,
    });

    (async () => {
      const [reportRes, programsRes, notesRes] = await Promise.allSettled([
        api.get(`/api/admin/reports/consolidation?${params}`),
        api.get('/api/admin/programs'),
        api.get(`/api/admin/consolidation-notes?year=${year}&quarter=${quarter}`),
      ]);

      if (cancelled) return;

      if (reportRes.status === 'rejected') console.error('consolidation report error:', reportRes.reason);
      if (programsRes.status === 'rejected') console.error('programs error:', programsRes.reason);
      if (notesRes.status === 'rejected') console.error('consolidation notes error:', notesRes.reason);

      if (reportRes.status === 'rejected' && programsRes.status === 'rejected') {
        setError('Failed to load consolidation data. Check your connection and try again.');
        setLoading(false);
        return;
      }

      setReportGroups(reportRes.status === 'fulfilled' ? (reportRes.value.data.groups || []) : []);
      setPrograms(programsRes.status === 'fulfilled' ? (programsRes.value.data || []) : []);

      if (notesRes.status === 'fulfilled') {
        const noteMap = {};
        for (const note of (notesRes.value.data.notes || [])) {
          noteMap[note.program_id] = note;
        }
        setNotes(noteMap);
      }

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [year, quarter]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const sheets = useMemo(() => {
    const rateMap = {};
    for (const group of reportGroups) {
      rateMap[group.id] = {
        physicalRate: group.physicalRate,
        schoolCount: group.schoolCount,
        pirCount: group.pirCount,
      };
    }

    return DIVISIONS.map(div => ({
      id: div,
      label: div,
      rows: programs
        .filter(p => p.division === div)
        .map(p => ({
          program_id: p.id,
          program: p.title,
          program_owners: rateMap[p.id]
            ? `${rateMap[p.id].schoolCount} school${rateMap[p.id].schoolCount !== 1 ? 's' : ''}`
            : '—',
          pir_count: rateMap[p.id]?.pirCount ?? 0,
          accomplishment_rate: rateMap[p.id]?.physicalRate ?? null,
          ta_schools_pct: notes[p.id]?.ta_schools_pct ?? '',
          gaps: notes[p.id]?.gaps ?? '',
          recommendations: notes[p.id]?.recommendations ?? '',
          management_response: notes[p.id]?.management_response ?? '',
        })),
    })).filter(s => s.rows.length > 0);
  }, [programs, reportGroups, notes]);

  const visibleRows = useMemo(() => {
    const activeSheetData = sheets.find(s => s.id === activeSheet)?.rows || [];
    if (!searchQuery) return activeSheetData;
    const q = searchQuery.toLowerCase();
    return activeSheetData.filter(row =>
      row.program.toLowerCase().includes(q) ||
      row.program_owners.toLowerCase().includes(q)
    );
  }, [sheets, activeSheet, searchQuery]);

  const handleCellChange = useCallback((program_id, field, value) => {
    setNotes(prev => ({
      ...prev,
      [program_id]: { ...(prev[program_id] || {}), [field]: value, program_id },
    }));
    setHasUnsavedChanges(true);

    const key = `${program_id}_${field}`;
    clearTimeout(debounceTimers.current[key]);

    debounceTimers.current[key] = setTimeout(async () => {
      try {
        await api.put('/api/admin/consolidation-notes', {
          year, quarter, program_id, field, value,
        });
        debounceTimers.current[key] = null;
        const anyPending = Object.values(debounceTimers.current).some(Boolean);
        if (!anyPending) setHasUnsavedChanges(false);
      } catch (e) {
        console.error('Auto-save failed', e);
        showToast('error', 'Auto-save failed. Please try again.');
        debounceTimers.current[key] = null;
      }
    }, DEBOUNCE_MS);
  }, [year, quarter, showToast]);

  const handlePeriodChange = (newYear, newQuarter) => {
    Object.values(debounceTimers.current).forEach(t => clearTimeout(t));
    debounceTimers.current = {};
    setHasUnsavedChanges(false);
    setYear(newYear);
    setQuarter(newQuarter);
  };

  const activeSheetsAvailable = sheets.length > 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
        }`}>
          <CheckCircle size={18} weight="fill" className={toast.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white">
              <FileXls size={28} weight="fill" />
            </div>
            Consolidation Template
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-2">
            Quarterly Program Implementation Review
            {hasUnsavedChanges && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                <WarningCircle size={14} weight="bold" /> Saving…
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Period selectors */}
          <select
            value={year}
            onChange={e => handlePeriodChange(Number(e.target.value), quarter)}
            className="px-3 py-2.5 bg-white/50 dark:bg-dark-surface/50 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            {YEAR_OPTIONS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={quarter}
            onChange={e => handlePeriodChange(year, Number(e.target.value))}
            className="px-3 py-2.5 bg-white/50 dark:bg-dark-surface/50 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            {[1, 2, 3, 4].map(q => (
              <option key={q} value={q}>{QUARTER_LABELS[q]}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <MagnifyingGlass size={18} weight="bold" />
            </div>
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white/50 dark:bg-dark-surface/50 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full md:w-56"
            />
          </div>

          {/* Save indicator */}
          <button
            disabled
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-default"
          >
            {hasUnsavedChanges ? (
              <SpinnerGap size={20} className="animate-spin" />
            ) : (
              <FloppyDisk size={20} weight="regular" />
            )}
            {hasUnsavedChanges ? 'Saving...' : 'Auto-saved'}
          </button>
        </div>
      </div>

      {/* Division Tabs */}
      {!loading && activeSheetsAvailable && (
        <div className="flex flex-wrap gap-2 p-1.5 bg-white/40 dark:bg-dark-surface/40 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-white/[0.05]">
          {sheets.map(sheet => (
            <button
              key={sheet.id}
              onClick={() => setActiveSheet(sheet.id)}
              className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeSheet === sheet.id
                  ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'
              }`}
            >
              {sheet.label}
            </button>
          ))}
        </div>
      )}

      {/* Spreadsheet */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-[2.5rem] blur opacity-30 group-hover:opacity-50 transition duration-1000" />
        <div className="relative bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl border border-white/60 dark:border-white/[0.08] rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col h-[65vh]">

          {/* Loading / error states */}
          {loading && (
            <div className="flex-1 flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <SpinnerGap size={24} className="animate-spin text-indigo-500" />
              <span className="text-sm font-medium">Loading consolidation data…</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex-1 flex items-center justify-center px-8">
              <div className="text-center space-y-2">
                <WarningCircle size={32} className="text-rose-400 mx-auto" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1400px]">
                <thead className="sticky top-0 z-20 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-white/[0.05] w-12 text-center bg-slate-200/50 dark:bg-white/[0.02]">No.</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-white/[0.05] w-64 bg-slate-200/50 dark:bg-white/[0.02]">Program</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-white/[0.05] w-36 bg-slate-200/50 dark:bg-white/[0.02]">Schools</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-white/[0.05] w-28 text-center bg-slate-200/50 dark:bg-white/[0.02]">PIRs</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-white/[0.05] w-32 text-center bg-slate-200/50 dark:bg-white/[0.02]">Accomp. %</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b border-r border-slate-200 dark:border-white/[0.05] w-32 text-center">TA Provided %</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b border-r border-slate-200 dark:border-white/[0.05] min-w-[200px]">Gaps</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b border-r border-slate-200 dark:border-white/[0.05] min-w-[200px]">Recommendations</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b border-slate-200 dark:border-white/[0.05] min-w-[200px]">Mgmt Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/[0.05] bg-white dark:bg-transparent">
                  <AnimatePresence mode="popLayout">
                    {visibleRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                          No programs found for {QUARTER_LABELS[quarter]} {year}.
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((row, idx) => (
                        <motion.tr
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          key={`row-${row.program_id}`}
                          className="hover:bg-indigo-50/30 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Read-only */}
                          <td className="px-4 py-2 text-xs font-medium text-slate-400 text-center border-r border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.01]">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-2 border-r border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.01]">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-2">
                              {row.program}
                            </span>
                          </td>
                          <td className="px-4 py-2 border-r border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.01]">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {row.program_owners}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center border-r border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.01]">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              {row.pir_count}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center border-r border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.01]">
                            <span className={`text-xs font-bold ${
                              row.accomplishment_rate === null
                                ? 'text-slate-400'
                                : row.accomplishment_rate >= 75
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              {row.accomplishment_rate !== null
                                ? `${Number(row.accomplishment_rate).toFixed(1)}%`
                                : '—'}
                            </span>
                          </td>

                          {/* Editable */}
                          <td className="p-0 border-r border-slate-100 dark:border-white/[0.05]">
                            <input
                              type="text"
                              value={row.ta_schools_pct}
                              onChange={e => handleCellChange(row.program_id, 'ta_schools_pct', e.target.value)}
                              placeholder="e.g. 80%"
                              className="w-full h-full min-h-[48px] px-4 py-2 text-sm text-center text-slate-700 dark:text-slate-200 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 focus:bg-indigo-50/50 dark:focus:bg-indigo-500/10 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                            />
                          </td>
                          <td className="p-0 border-r border-slate-100 dark:border-white/[0.05]">
                            <textarea
                              value={row.gaps}
                              onChange={e => handleCellChange(row.program_id, 'gaps', e.target.value)}
                              placeholder="Enter gaps..."
                              rows={2}
                              className="w-full h-full min-h-[48px] px-4 py-3 text-xs text-slate-700 dark:text-slate-200 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 focus:bg-indigo-50/50 dark:focus:bg-indigo-500/10 outline-none transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 leading-relaxed"
                            />
                          </td>
                          <td className="p-0 border-r border-slate-100 dark:border-white/[0.05]">
                            <textarea
                              value={row.recommendations}
                              onChange={e => handleCellChange(row.program_id, 'recommendations', e.target.value)}
                              placeholder="Enter recommendations..."
                              rows={2}
                              className="w-full h-full min-h-[48px] px-4 py-3 text-xs text-slate-700 dark:text-slate-200 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 focus:bg-indigo-50/50 dark:focus:bg-indigo-500/10 outline-none transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 leading-relaxed"
                            />
                          </td>
                          <td className="p-0">
                            <textarea
                              value={row.management_response}
                              onChange={e => handleCellChange(row.program_id, 'management_response', e.target.value)}
                              placeholder="Enter management response..."
                              rows={2}
                              className="w-full h-full min-h-[48px] px-4 py-3 text-xs text-slate-700 dark:text-slate-200 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 focus:bg-indigo-50/50 dark:focus:bg-indigo-500/10 outline-none transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 leading-relaxed"
                            />
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && !error && (
            <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/[0.05] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  Edits auto-saved to database
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span>{visibleRows.length} program{visibleRows.length !== 1 ? 's' : ''} in view</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="text-indigo-500 font-semibold">
                  {QUARTER_LABELS[quarter]} {year}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminConsolidationTemplate;
