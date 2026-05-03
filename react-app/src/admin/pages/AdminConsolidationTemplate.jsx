import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlass,
  FloppyDisk,
  CheckCircle,
  WarningCircle,
  PencilSimple,
  Database,
  Lock,
  ArrowsOut,
  ArrowsIn,
} from '@phosphor-icons/react';
import api from '../../lib/api.js';
import { useUser } from '../../lib/auth.js';
import { Spinner } from '../components/Spinner.jsx';
import { useReportYears } from './adminReports/useReportYears.js';

const FUNCTIONAL_DIVISIONS = ['SGOD', 'CID', 'OSDS'];
const VIEW_MODES = {
  division: 'Division',
  school: 'School',
};
const CONSOLIDATION_STATUSES = [
  'Submitted',
  'Under Review',
  'For CES Review',
  'For Admin Review',
  'Approved',
  'Returned',
];
const DEBOUNCE_MS = 800;

function getCurrentQuarterAndYear() {
  const now = new Date();
  const month = now.getMonth() + 1;
  return { year: now.getFullYear(), quarter: Math.ceil(month / 3) };
}

const QUARTER_LABELS = { 1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4' };

function isProgramEligibleForSchool(program, school) {
  if (!program || !school || program.school_level_requirement === 'Division') return false;
  if (program.school_level_requirement === 'Both') return true;
  if (program.school_level_requirement === school.level) return true;
  if (program.school_level_requirement === 'Select Schools') {
    return !program.restricted_schools?.some((restrictedSchool) => restrictedSchool.id === school.id);
  }
  return false;
}

// Returns the set of fields a given role may write
function getEditableFields(role) {
  if (role === 'Admin') return new Set(['gaps']);
  if (role === 'Observer') return new Set(['management_response']);
  return new Set();
}

const AdminConsolidationTemplate = () => {
  const { year: defaultYear, quarter: defaultQuarter } = getCurrentQuarterAndYear();

  const currentUser = useUser();
  const editableFields = useMemo(() => getEditableFields(currentUser?.role), [currentUser?.role]);
  const canEdit = useCallback((field) => editableFields.has(field), [editableFields]);

  const { year, setYear, availableYears } = useReportYears();
  const [quarter, setQuarter] = useState(defaultQuarter);
  const [reportGroups, setReportGroups] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [schools, setSchools] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('division');
  const [activeDivision, setActiveDivision] = useState('SGOD');
  const [selectedClusterId, setSelectedClusterId] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toast, setToast] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const debounceTimers = useRef({});
  const yearOptions = availableYears.length > 0 ? availableYears : [year || defaultYear];
  const schoolScopeClusterId = viewMode === 'school' && selectedClusterId ? Number(selectedClusterId) : null;
  const schoolScopeSchoolId = viewMode === 'school' && selectedSchoolId ? Number(selectedSchoolId) : null;

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [clustersRes, schoolsRes] = await Promise.allSettled([
        api.get('/api/admin/clusters'),
        api.get('/api/admin/schools'),
      ]);

      if (cancelled) return;

      if (clustersRes.status === 'fulfilled') {
        setClusters(clustersRes.value.data || []);
      } else {
        console.error('clusters error:', clustersRes.reason);
      }

      if (schoolsRes.status === 'fulfilled') {
        setSchools(schoolsRes.value.data || []);
      } else {
        console.error('schools error:', schoolsRes.reason);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams({
      year: String(year),
      quarter: String(quarter),
      groupBy: 'program',
      statuses: CONSOLIDATION_STATUSES.join(','),
    });
    if (schoolScopeClusterId) params.set('cluster', String(schoolScopeClusterId));
    if (schoolScopeSchoolId) params.set('school', String(schoolScopeSchoolId));

    (async () => {
      const [reportRes, programsRes, notesRes] = await Promise.allSettled([
        api.get(`/api/admin/reports/consolidation?${params}`),
        api.get('/api/admin/programs'),
        api.get(`/api/admin/consolidation-notes?year=${year}&quarter=${quarter}${schoolScopeSchoolId ? `&school=${schoolScopeSchoolId}` : ''}`),
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
        // auto_recommendations come from CES remarks on PIRs — pre-fill Recommendations column
        const autoRecs = { ...(notesRes.value.data.auto_recommendations || {}) };
        const noteMap = {};
        for (const note of (notesRes.value.data.notes || [])) {
          noteMap[note.program_id] = {
            ...note,
            recommendations: note.recommendations || autoRecs[note.program_id] || '',
          };
          delete autoRecs[note.program_id];
        }
        for (const [pid, autoRec] of Object.entries(autoRecs)) {
          noteMap[Number(pid)] = { program_id: Number(pid), recommendations: autoRec };
        }
        setNotes(noteMap);
      }

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [year, quarter, viewMode, schoolScopeClusterId, schoolScopeSchoolId]);

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

  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  const schoolOptions = useMemo(() => {
    if (!selectedClusterId) return [];
    return schools.filter((school) => String(school.cluster_id) === String(selectedClusterId));
  }, [schools, selectedClusterId]);

  const selectedSchool = useMemo(
    () => schools.find((school) => String(school.id) === String(selectedSchoolId)) || null,
    [schools, selectedSchoolId],
  );

  const scopedPrograms = useMemo(() => {
    if (viewMode === 'division') {
      return programs.filter(
        (program) => program.school_level_requirement === 'Division' && program.division === activeDivision,
      );
    }

    if (selectedSchool) {
      return programs.filter((program) => isProgramEligibleForSchool(program, selectedSchool));
    }

    if (selectedClusterId) {
      return programs.filter((program) =>
        schoolOptions.some((school) => isProgramEligibleForSchool(program, school))
      );
    }

    return programs.filter((program) => program.school_level_requirement !== 'Division');
  }, [programs, viewMode, activeDivision, selectedSchool, selectedClusterId, schoolOptions]);

  const rows = useMemo(() => {
    const rateMap = {};
    for (const group of reportGroups) {
      rateMap[group.id] = {
        physicalRate: group.physicalRate,
        taSchoolsCount: group.taSchoolsCount ?? 0,
        taSchoolsTotal: group.taSchoolsTotal ?? 0,
      };
    }

    return scopedPrograms.map((program) => ({
      program_id: program.id,
      program: program.title,
      accomplishment_rate: rateMap[program.id]?.physicalRate ?? null,
      taSchoolsCount: rateMap[program.id]?.taSchoolsCount ?? 0,
      taSchoolsTotal: rateMap[program.id]?.taSchoolsTotal ?? 0,
      gaps: notes[program.id]?.gaps ?? '',
      recommendations: notes[program.id]?.recommendations ?? '',
      management_response: notes[program.id]?.management_response ?? '',
    }));
  }, [scopedPrograms, reportGroups, notes]);

  const visibleRows = useMemo(() => {
    if (!searchQuery) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(row => row.program.toLowerCase().includes(q));
  }, [rows, searchQuery]);

  const handleCellChange = useCallback((program_id, field, value) => {
    if (!canEdit(field)) return;

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
  }, [year, quarter, showToast, canEdit]);

  const handlePeriodChange = (newYear, newQuarter) => {
    Object.values(debounceTimers.current).forEach(t => clearTimeout(t));
    debounceTimers.current = {};
    setHasUnsavedChanges(false);
    setLoading(true);
    setError(null);
    setYear(newYear);
    setQuarter(newQuarter);
  };

  const handleViewModeChange = (nextMode) => {
    if (nextMode === viewMode) return;
    setLoading(true);
    setError(null);
    setViewMode(nextMode);
    if (nextMode === 'division') {
      setSelectedSchoolId('');
    } else if (!selectedClusterId && clusters.length > 0) {
      const firstCluster = clusters[0];
      setSelectedClusterId(String(firstCluster.id));
      const firstSchool = schools.find((s) => s.cluster_id === firstCluster.id);
      setSelectedSchoolId(firstSchool ? String(firstSchool.id) : '');
    }
  };

  const handleDivisionChange = (nextDivision) => {
    setActiveDivision(nextDivision);
  };

  const handleClusterChange = (event) => {
    setLoading(true);
    setError(null);
    const newClusterId = event.target.value;
    setSelectedClusterId(newClusterId);
    const firstSchool = schools.find((s) => String(s.cluster_id) === newClusterId);
    setSelectedSchoolId(firstSchool ? String(firstSchool.id) : '');
  };

  const handleSchoolChange = (event) => {
    setLoading(true);
    setError(null);
    setSelectedSchoolId(event.target.value);
  };

  const scopeLabel = viewMode === 'division'
    ? activeDivision
    : selectedSchool
      ? selectedSchool.name
      : selectedClusterId
        ? clusters.find((cluster) => String(cluster.id) === String(selectedClusterId))?.name || 'Selected cluster'
        : 'All schools';

  const editableColCount = ['gaps', 'recommendations', 'management_response'].filter(f => canEdit(f)).length;

  return (
    <div className={isFullscreen
      ? 'fixed inset-0 z-50 flex flex-col gap-3 p-3 bg-white/[0.97] dark:bg-[#0f1117]/[0.97] backdrop-blur-xl'
      : 'flex min-h-full w-full flex-col gap-3'
    }>
      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
          }`}>
          <CheckCircle size={18} weight="fill" className={toast.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} />
          {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-white/65 dark:bg-dark-surface/45 backdrop-blur-md px-3 py-2.5 shadow-sm shadow-slate-200/40 dark:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: scope controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View mode toggle */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-white/[0.06] p-1">
              {Object.entries(VIEW_MODES).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleViewModeChange(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    viewMode === value
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-white/10 dark:text-indigo-300'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Division / School scope */}
            {viewMode === 'division' ? (
              <div className="inline-flex rounded-xl bg-indigo-50 dark:bg-indigo-500/10 p-1">
                {FUNCTIONAL_DIVISIONS.map((division) => (
                  <button
                    key={division}
                    type="button"
                    onClick={() => handleDivisionChange(division)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeDivision === division
                        ? 'bg-white text-indigo-700 shadow-sm dark:bg-white/10 dark:text-indigo-300'
                        : 'text-indigo-700/75 hover:text-indigo-800 dark:text-indigo-300/70 dark:hover:text-indigo-200'
                    }`}
                  >
                    {division}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <select
                  value={selectedClusterId}
                  onChange={handleClusterChange}
                  className="h-8 min-w-[160px] px-3 bg-white/80 dark:bg-dark-surface/70 dark:text-slate-200 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="">Select cluster</option>
                  {clusters.map((cluster) => (
                    <option key={cluster.id} value={cluster.id}>
                      {cluster.name ?? `Cluster ${cluster.cluster_number}`}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedSchoolId}
                  onChange={handleSchoolChange}
                  disabled={!selectedClusterId}
                  className="h-8 min-w-[200px] px-3 bg-white/80 dark:bg-dark-surface/70 dark:text-slate-200 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50"
                >
                  {schoolOptions.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.abbreviation ? `${school.abbreviation} — ${school.name}` : school.name}
                    </option>
                  ))}
                </select>
              </>
            )}

          </div>

          {/* Right: period + search + save indicator */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={year}
              onChange={e => handlePeriodChange(Number(e.target.value), quarter)}
              className="h-8 px-2.5 bg-white/80 dark:bg-dark-surface/70 dark:text-slate-200 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={quarter}
              onChange={e => handlePeriodChange(year, Number(e.target.value))}
              className="h-8 px-2.5 bg-white/80 dark:bg-dark-surface/70 dark:text-slate-200 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              {[1, 2, 3, 4].map(q => (
                <option key={q} value={q}>{QUARTER_LABELS[q]}</option>
              ))}
            </select>

            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <MagnifyingGlass size={14} weight="bold" />
              </div>
              <input
                type="text"
                placeholder="Search programs…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-3 bg-white/80 dark:bg-dark-surface/70 dark:text-slate-200 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-44 md:w-52"
              />
            </div>

            {editableFields.size > 0 && (
              <div className={`flex h-8 items-center gap-1.5 px-3 rounded-xl font-bold text-xs cursor-default transition-colors ${
                hasUnsavedChanges
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}>
                {hasUnsavedChanges ? (
                  <><Spinner size="sm" />Saving…</>
                ) : (
                  <><FloppyDisk size={13} weight="bold" />Saved</>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(f => !f)}
              title={isFullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
            >
              {isFullscreen ? <ArrowsIn size={15} weight="bold" /> : <ArrowsOut size={15} weight="bold" />}
            </button>
          </div>
        </div>
      </div>

      {/* Spreadsheet */}
      <div className={`relative ${isFullscreen ? 'flex-1 flex flex-col min-h-0' : 'flex-1'}`}>
        <div className={`relative bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden shadow-lg shadow-slate-200/30 dark:shadow-none flex flex-col ${
          isFullscreen ? 'flex-1' : 'min-h-[520px] h-[calc(100dvh-12rem)] md:h-[calc(100dvh-10.5rem)]'
        }`}>

          {loading && (
            <div className="flex-1 flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <Spinner />
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
                <thead className="sticky top-0 z-20 backdrop-blur-xl">

                  {/* Column group labels */}
                  <tr className="border-b border-slate-200 dark:border-white/[0.06]">
                    {/* Source data: #, Program, Accomp.%, TA Schools = 4 cols */}
                    <th colSpan={4} className="px-4 py-1.5 bg-slate-100/95 dark:bg-slate-800/95">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        <Database size={11} weight="bold" />
                        Source Data
                      </span>
                    </th>
                    {/* Read-only review columns (Observer: gaps + recommendations) */}
                    {3 - editableColCount > 0 && (
                      <th
                        colSpan={3 - editableColCount}
                        className="px-4 py-1.5 bg-slate-100/95 dark:bg-slate-800/95 border-l border-slate-200 dark:border-white/[0.06]"
                      >
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                          <Lock size={11} weight="bold" />
                          Read-only
                        </span>
                      </th>
                    )}
                    {/* Editable review columns */}
                    {editableColCount > 0 && (
                      <th
                        colSpan={editableColCount}
                        className="px-4 py-1.5 bg-indigo-50/80 dark:bg-indigo-950/40 border-l-2 border-indigo-300 dark:border-indigo-600/60"
                      >
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                          <PencilSimple size={11} weight="bold" />
                          Review Notes
                        </span>
                      </th>
                    )}
                  </tr>

                  {/* Column headers */}
                  <tr>
                    <th className="sticky left-0 z-30 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-white/[0.06] w-10 text-center bg-slate-100/95 dark:bg-slate-800/95">
                      #
                    </th>
                    <th className="sticky left-10 z-30 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-white/[0.06] w-64 bg-slate-100/95 dark:bg-slate-800/95">
                      Program
                    </th>
                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-r border-slate-200 dark:border-white/[0.06] w-28 text-center bg-slate-100/95 dark:bg-slate-800/95">
                      Accomp. %
                    </th>
                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-r border-slate-200 dark:border-white/[0.06] w-36 text-center bg-slate-100/95 dark:bg-slate-800/95">
                      TA Schools
                    </th>

                    {/* Gaps — editable for Admin, read-only for Observer */}
                    <th className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border-b border-r border-slate-200 dark:border-white/[0.06] min-w-[220px] ${
                      canEdit('gaps')
                        ? 'text-indigo-500 dark:text-indigo-400 border-l-2 border-l-indigo-300 dark:border-l-indigo-600/60 bg-indigo-50/80 dark:bg-indigo-950/30'
                        : 'text-slate-400 dark:text-slate-500 bg-slate-100/95 dark:bg-slate-800/95'
                    }`}>
                      Gaps
                    </th>
                    {/* Recommendations — editable (Admin) or read-only (Observer) */}
                    <th className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border-b border-r border-slate-200 dark:border-white/[0.06] min-w-[220px] ${
                      canEdit('recommendations')
                        ? 'text-indigo-500 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/30'
                        : 'text-slate-400 dark:text-slate-500 bg-slate-100/95 dark:bg-slate-800/95'
                    }`}>
                      Recommendations
                    </th>
                    {/* Management Response — editable (Admin + Observer) */}
                    <th className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-white/[0.06] min-w-[220px] ${
                      canEdit('management_response')
                        ? 'text-indigo-500 dark:text-indigo-400 border-l-2 border-l-indigo-300 dark:border-l-indigo-600/60 bg-indigo-50/80 dark:bg-indigo-950/30'
                        : 'text-slate-400 dark:text-slate-500 bg-slate-100/95 dark:bg-slate-800/95'
                    }`}>
                      Mgmt Response
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  <AnimatePresence mode="popLayout">
                    {visibleRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-400 dark:text-slate-500">
                          No programs found for this scope in {QUARTER_LABELS[quarter]} {year || defaultYear}.
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((row, idx) => {
                        const taDisplay = row.taSchoolsTotal > 0
                          ? `${Math.round((row.taSchoolsCount / row.taSchoolsTotal) * 100)}% (${row.taSchoolsCount}/${row.taSchoolsTotal})`
                          : row.taSchoolsCount > 0
                            ? `${row.taSchoolsCount} PIR${row.taSchoolsCount !== 1 ? 's' : ''}`
                            : '—';

                        return (
                          <Motion.tr
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={`row-${row.program_id}`}
                            className="group/row hover:bg-slate-50/80 dark:hover:bg-white/[0.025] transition-colors"
                          >
                            <td className="sticky left-0 z-10 px-3 py-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-center border-r border-slate-100 dark:border-white/[0.05] bg-slate-50/90 dark:bg-slate-800/80 group-hover/row:bg-slate-100/80 dark:group-hover/row:bg-slate-800/90 transition-colors">
                              {idx + 1}
                            </td>
                            <td className="sticky left-10 z-10 px-4 py-3 border-r border-slate-100 dark:border-white/[0.05] bg-slate-50/90 dark:bg-slate-800/80 group-hover/row:bg-slate-100/80 dark:group-hover/row:bg-slate-800/90 transition-colors">
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-100 leading-snug line-clamp-2">
                                {row.program}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-slate-800/40">
                              {row.accomplishment_rate !== null ? (
                                <span className={`inline-flex items-center justify-center h-5 px-2 rounded-md text-[11px] font-black ${
                                  row.accomplishment_rate >= 75
                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                }`}>
                                  {Number(row.accomplishment_rate).toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                              )}
                            </td>
                            {/* TA Schools — read-only, computed from PIR data */}
                            <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-slate-800/40">
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                {taDisplay}
                              </span>
                            </td>

                            {/* Gaps — Admin editable, Observer read-only */}
                            <td className={`p-0 border-r border-slate-100 dark:border-white/[0.05] ${canEdit('gaps') ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : 'bg-slate-50/30 dark:bg-slate-800/20'}`}>
                              {canEdit('gaps') ? (
                                <textarea
                                  value={row.gaps}
                                  onChange={e => handleCellChange(row.program_id, 'gaps', e.target.value)}
                                  placeholder="Enter gaps…"
                                  rows={2}
                                  className="w-full h-full min-h-[56px] px-4 py-3 text-xs text-slate-700 dark:text-slate-200 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:bg-indigo-50 dark:focus:bg-indigo-900/30 outline-none transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 leading-relaxed"
                                />
                              ) : (
                                <div className="min-h-[56px] px-4 py-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                                  {row.gaps || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                </div>
                              )}
                            </td>

                            {/* Recommendations */}
                            <td className={`p-0 border-r border-slate-100 dark:border-white/[0.05] ${canEdit('recommendations') ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : 'bg-slate-50/30 dark:bg-slate-800/20'}`}>
                              {canEdit('recommendations') ? (
                                <textarea
                                  value={row.recommendations}
                                  onChange={e => handleCellChange(row.program_id, 'recommendations', e.target.value)}
                                  placeholder="Enter recommendations…"
                                  rows={2}
                                  className="w-full h-full min-h-[56px] px-4 py-3 text-xs text-slate-700 dark:text-slate-200 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:bg-indigo-50 dark:focus:bg-indigo-900/30 outline-none transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 leading-relaxed"
                                />
                              ) : (
                                <div className="min-h-[56px] px-4 py-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                                  {row.recommendations || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                </div>
                              )}
                            </td>

                            {/* Management Response */}
                            <td className={`p-0 ${canEdit('management_response') ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : 'bg-slate-50/30 dark:bg-slate-800/20'}`}>
                              {canEdit('management_response') ? (
                                <textarea
                                  value={row.management_response}
                                  onChange={e => handleCellChange(row.program_id, 'management_response', e.target.value)}
                                  placeholder="Enter management response…"
                                  rows={2}
                                  className="w-full h-full min-h-[56px] px-4 py-3 text-xs text-slate-700 dark:text-slate-200 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:bg-indigo-50 dark:focus:bg-indigo-900/30 outline-none transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 leading-relaxed"
                                />
                              ) : (
                                <div className="min-h-[56px] px-4 py-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                                  {row.management_response || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                </div>
                              )}
                            </td>
                          </Motion.tr>
                        );
                      })
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && !error && (
            <div className="px-4 py-2 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/[0.05] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {editableFields.size > 0 && (
                  <>
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500">
                      <CheckCircle size={13} weight="fill" />
                      Auto-saved
                    </span>
                    <span className="w-px h-3 bg-slate-200 dark:bg-white/[0.08]" />
                  </>
                )}
                <span>{visibleRows.length} program{visibleRows.length !== 1 ? 's' : ''}</span>
                <span className="w-px h-3 bg-slate-200 dark:bg-white/[0.08]" />
                <span>{scopeLabel}</span>
                <span className="w-px h-3 bg-slate-200 dark:bg-white/[0.08]" />
                <span className="font-bold text-indigo-500 dark:text-indigo-400">
                  {QUARTER_LABELS[quarter]} {year}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-slate-300 dark:text-slate-600">
                {editableFields.size > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-indigo-200 dark:bg-indigo-800/60 inline-block" />
                    Editable by you
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-slate-200 dark:bg-slate-700/60 inline-block" />
                  Read-only
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
