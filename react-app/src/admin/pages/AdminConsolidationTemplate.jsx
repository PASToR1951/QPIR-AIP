import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlass,
  FloppyDisk,
  CheckCircle,
  WarningCircle,
} from '@phosphor-icons/react';
import api from '../../lib/api.js';
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
  'For Cluster Head Review',
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

const AdminConsolidationTemplate = () => {
  const { year: defaultYear, quarter: defaultQuarter } = getCurrentQuarterAndYear();

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
        schoolCount: group.schoolCount,
        pirCount: group.pirCount,
      };
    }

    return scopedPrograms.map((program) => ({
      program_id: program.id,
      program: program.title,
      program_owners: viewMode === 'school' && selectedSchool
        ? (selectedSchool.abbreviation || selectedSchool.name)
        : rateMap[program.id]
          ? `${rateMap[program.id].schoolCount} school${rateMap[program.id].schoolCount !== 1 ? 's' : ''}`
          : viewMode === 'division'
            ? 'Division Office'
            : '—',
      pir_count: rateMap[program.id]?.pirCount ?? 0,
      accomplishment_rate: rateMap[program.id]?.physicalRate ?? null,
      ta_schools_pct: notes[program.id]?.ta_schools_pct ?? '',
      gaps: notes[program.id]?.gaps ?? '',
      recommendations: notes[program.id]?.recommendations ?? '',
      management_response: notes[program.id]?.management_response ?? '',
    }));
  }, [scopedPrograms, reportGroups, notes, viewMode, selectedSchool]);

  const visibleRows = useMemo(() => {
    if (!searchQuery) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(row =>
      row.program.toLowerCase().includes(q) ||
      row.program_owners.toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

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
      setSelectedClusterId(String(clusters[0].id));
    }
  };

  const handleDivisionChange = (nextDivision) => {
    setActiveDivision(nextDivision);
  };

  const handleClusterChange = (event) => {
    setLoading(true);
    setError(null);
    setSelectedClusterId(event.target.value);
    setSelectedSchoolId('');
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

  return (
    <div className="flex min-h-full w-full flex-col gap-3">
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
          }`}>
          <CheckCircle size={18} weight="fill" className={toast.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-white/65 dark:bg-dark-surface/45 backdrop-blur-md px-3 py-3 shadow-sm shadow-slate-200/40 dark:shadow-none md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
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
                className="h-9 min-w-[180px] px-3 bg-white/80 dark:bg-dark-surface/70 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                className="h-9 min-w-[220px] px-3 bg-white/80 dark:bg-dark-surface/70 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60"
              >
                <option value="">All schools in cluster</option>
                {schoolOptions.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.abbreviation ? `${school.abbreviation} — ${school.name}` : school.name}
                  </option>
                ))}
              </select>
            </>
          )}
          <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {scopeLabel}
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {QUARTER_LABELS[quarter]} {year || defaultYear}
          </span>
          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">
              <WarningCircle size={13} weight="bold" />
              Saving
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period selectors */}
          <select
            value={year}
            onChange={e => handlePeriodChange(Number(e.target.value), quarter)}
            className="h-9 px-3 bg-white/80 dark:bg-dark-surface/70 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={quarter}
            onChange={e => handlePeriodChange(year, Number(e.target.value))}
            className="h-9 px-3 bg-white/80 dark:bg-dark-surface/70 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          >
            {[1, 2, 3, 4].map(q => (
              <option key={q} value={q}>{QUARTER_LABELS[q]}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <MagnifyingGlass size={16} weight="bold" />
            </div>
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 bg-white/80 dark:bg-dark-surface/70 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-52 md:w-56"
            />
          </div>

          {/* Save indicator */}
          <div className="flex h-9 items-center gap-2 px-3 rounded-xl font-bold text-xs bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 cursor-default">
            {hasUnsavedChanges ? (
              <Spinner size="sm" />
            ) : (
              <FloppyDisk size={16} weight="regular" />
            )}
            {hasUnsavedChanges ? 'Saving...' : 'Auto-saved'}
          </div>
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="relative group flex-1">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-[2.5rem] blur opacity-30 group-hover:opacity-50 transition duration-1000" />
        <div className="relative bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl border border-white/60 dark:border-white/[0.08] rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col min-h-[520px] h-[calc(100dvh-13rem)] md:h-[calc(100dvh-11rem)]">

          {/* Loading / error states */}
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
              <table className="w-full text-left border-collapse min-w-[1320px]">
                <thead className="sticky top-0 z-20 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-white/[0.05] w-12 text-center bg-slate-200/50 dark:bg-white/[0.02]">No.</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-white/[0.05] w-64 bg-slate-200/50 dark:bg-white/[0.02]">Program</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-white/[0.05] w-36 bg-slate-200/50 dark:bg-white/[0.02]">
                      {viewMode === 'division' ? 'Scope' : viewMode === 'school' && selectedSchool ? 'School' : 'Schools'}
                    </th>
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
                          No programs found for this scope in {QUARTER_LABELS[quarter]} {year || defaultYear}.
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((row, idx) => (
                        <Motion.tr
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
                            <span className={`text-xs font-bold ${row.accomplishment_rate === null
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
                        </Motion.tr>
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
                <span>{scopeLabel}</span>
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
