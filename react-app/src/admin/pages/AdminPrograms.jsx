import React, { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api.js';
import { AnimatePresence, motion } from 'framer-motion';
import { Buildings, BookOpen, PencilSimple, Trash, Plus, CheckCircle, X, UsersThree, ArrowsDownUp, User } from '@phosphor-icons/react';
import { Spinner } from '../components/Spinner.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { FormModal } from '../components/FormModal.jsx';
import { SearchableSelect } from '../components/SearchableSelect.jsx';
import ProgramTemplatesModal from '../components/ProgramTemplatesModal.jsx';
import ProgramMembersModal from '../components/ProgramMembersModal.jsx';
import { UserProfileModal } from '../components/UserProfileModal.jsx';
import { EndOfListCue } from '../../components/ui/EndOfListCue.jsx';

const MotionButton = motion.button;
const MotionDiv = motion.div;

const SCHOOL_LEVELS = ['Elementary', 'Secondary', 'Both', 'Select Schools'];
const DIVISIONS = ['SGOD', 'OSDS', 'CID'];
const LEVEL_LABELS = {
  'Elementary': 'Elementary',
  'Secondary': 'Secondary',
  'Both': 'Elementary & Secondary',
  'Select Schools': 'Selected Schools',
};

const DIVISION_COLORS = {
  SGOD: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400',
  OSDS: 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400',
  CID:  'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
};

const personnelDisplayName = (p) => {
  if (!p) return '';
  if (p.first_name && p.last_name) {
    const mi = p.middle_initial ? ` ${p.middle_initial}.` : '';
    return `${p.first_name}${mi} ${p.last_name}`;
  }
  return p.name || p.email || '';
};

function ProgramTitleBlock({ title, abbreviation, children }) {
  return (
    <div className="min-w-0 max-w-full space-y-1">
      <h3
        title={title}
        className="font-black leading-snug text-slate-900 dark:text-slate-100 break-words [overflow-wrap:anywhere]"
      >
        {title}
      </h3>
      {abbreviation && (
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500 break-words [overflow-wrap:anywhere]">
          {abbreviation}
        </p>
      )}
      {children}
    </div>
  );
}

export default function AdminPrograms() {
  const [view, setView] = useState('programs'); // 'programs' | 'division-programs'

  // ── School Programs state ──────────────────────────────────────────────────
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');

  const [programForm, setProgramForm] = useState({ title: '', abbreviation: '', division: '', school_level_requirement: 'Both' });
  const [editProgram, setEditProgram] = useState(null);
  const [deleteProgram, setDeleteProgram] = useState(null);
  const [addProgramOpen, setAddProgramOpen] = useState(false);

  const [sort, setSort] = useState('az'); // 'az' | 'za' | 'most-aips' | 'fewest-aips'

  // ── Division Programs tab state ───────────────────────────────────────────
  const [divSearch, setDivSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [divSort, setDivSort] = useState('az'); // 'az' | 'za' | 'most-personnel' | 'fewest-personnel'

  // ── Shared state ───────────────────────────────────────────────────────────
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState(null);
  const [templateProgram, setTemplateProgram] = useState(null);
  const [membersProgram, setMembersProgram] = useState(null);
  const [focalProgram, setFocalProgram] = useState(null);
  const [focalSelection, setFocalSelection] = useState([]);
  const [divisionUsers, setDivisionUsers] = useState([]);
  const [viewUser, setViewUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetchers ───────────────────────────────────────────────────────────────
  const fetchPrograms = useCallback(() => {
    setLoadingPrograms(true);
    api.get('/api/admin/programs')
      .then(r => setPrograms(r.data))
      .catch(e => { console.error(e); showToast('Failed to load programs. Please refresh.', 'error'); })
      .finally(() => setLoadingPrograms(false));
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  useEffect(() => {
    api.get('/api/admin/users?role=Division Personnel&status=active')
      .then(r => setDivisionUsers(r.data))
      .catch(() => setDivisionUsers([]));
  }, []);

  // ── School Programs handlers ───────────────────────────────────────────────
  const handleAddProgram = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      await api.post('/api/admin/programs', programForm);
      setAddProgramOpen(false);
      setProgramForm({ title: '', abbreviation: '', division: '', school_level_requirement: 'Both' });
      fetchPrograms();
      showToast('Program added successfully.');
    } catch (e) {
      setFormError(e.friendlyMessage ?? 'Operation failed');
    } finally { setActionLoading(false); }
  };

  const handleEditProgram = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      await api.patch(`/api/admin/programs/${editProgram.id}`, { title: programForm.title, abbreviation: programForm.abbreviation, division: programForm.division || null, school_level_requirement: programForm.school_level_requirement });
      setEditProgram(null);
      fetchPrograms();
      showToast('Program updated successfully.');
    } catch (e) {
      setFormError(e.friendlyMessage ?? 'Operation failed');
    } finally { setActionLoading(false); }
  };

  const handleDeleteProgram = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      await api.delete(`/api/admin/programs/${deleteProgram.id}`);
      setDeleteProgram(null);
      fetchPrograms();
      showToast('Program deleted.');
    } catch (e) {
      setFormError(e.friendlyMessage ?? 'Operation failed');
    } finally { setActionLoading(false); }
  };

  const handleViewUser = async (p) => {
    try {
      setLoadingUser(true);
      const res = await api.get(`/api/admin/users?search=${encodeURIComponent(p.email)}`);
      const user = res.data.find(u => u.id === p.id);
      if (user) {
        setViewUser(user);
      } else {
        showToast('User details not found.', 'error');
      }
    } catch {
      showToast('Failed to load user.', 'error');
    } finally {
      setLoadingUser(false);
    }
  };

  const openFocalModal = (program) => {
    setFocalProgram(program);
    setFocalSelection((program.focal_persons ?? []).map(p => p.id));
    setFormError('');
  };

  const toggleFocalSelection = (userId) => {
    setFocalSelection(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSaveFocalPersons = async () => {
    if (!focalProgram) return;
    setActionLoading(true);
    try {
      setFormError('');
      await api.put(`/api/admin/programs/${focalProgram.id}/focal-persons`, {
        user_ids: focalSelection,
      });
      setFocalProgram(null);
      fetchPrograms();
      showToast('Focal persons updated.');
    } catch (e) {
      setFormError(e.friendlyMessage ?? 'Failed to update focal persons.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Filtered + sorted lists ────────────────────────────────────────────────
  const programRows = programs.filter(p => p.school_level_requirement !== 'Division');
  const effectiveLevelFilter = SCHOOL_LEVELS.includes(levelFilter) ? levelFilter : 'All';

  const sortPrograms = (list, s) => {
    const copy = [...list];
    if (s === 'za') return copy.sort((a, b) => b.title.localeCompare(a.title));
    if (s === 'most-aips') return copy.sort((a, b) => (b._count?.aips ?? 0) - (a._count?.aips ?? 0));
    if (s === 'fewest-aips') return copy.sort((a, b) => (a._count?.aips ?? 0) - (b._count?.aips ?? 0));
    return copy.sort((a, b) => a.title.localeCompare(b.title)); // az default
  };

  const sortDivPrograms = (list, s) => {
    const copy = [...list];
    if (s === 'za') return copy.sort((a, b) => b.title.localeCompare(a.title));
    if (s === 'most-personnel') return copy.sort((a, b) => (b.personnel?.length ?? 0) - (a.personnel?.length ?? 0));
    if (s === 'fewest-personnel') return copy.sort((a, b) => (a.personnel?.length ?? 0) - (b.personnel?.length ?? 0));
    return copy.sort((a, b) => a.title.localeCompare(b.title)); // az default
  };

  const filteredPrograms = sortPrograms(
    programRows.filter(p =>
      (effectiveLevelFilter === 'All' || p.school_level_requirement === effectiveLevelFilter) &&
      (p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.abbreviation && p.abbreviation.toLowerCase().includes(search.toLowerCase())))
    ),
    sort,
  );

  const divisionPrograms = programs.filter(p => p.school_level_requirement === 'Division');
  const filteredDivisionPrograms = divisionPrograms.filter(p =>
    (divisionFilter === 'All' || p.division === divisionFilter) &&
    (p.title.toLowerCase().includes(divSearch.toLowerCase()) ||
      (p.abbreviation && p.abbreviation.toLowerCase().includes(divSearch.toLowerCase())))
  );
  const divisionProgramGroups = DIVISIONS
    .filter(d => divisionFilter === 'All' || d === divisionFilter)
    .map(division => ({
      division,
      programs: sortDivPrograms(filteredDivisionPrograms.filter(p => p.division === division), divSort),
    }))
    .filter(g => g.programs.length > 0);

  const LEVEL_PILLS = ['All', ...SCHOOL_LEVELS];
  const programViewTabs = [
    {
      key: 'programs',
      label: 'School Programs',
      description: 'Used for AIP filing and templates',
      count: programRows.length,
      Icon: BookOpen,
      activeClasses: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-50 shadow-[0_10px_24px_rgba(16,185,129,0.18)] ring-2 ring-emerald-100 dark:ring-emerald-900/40',
      hoverClasses: 'hover:border-emerald-200 dark:hover:border-emerald-800',
      activeIconClasses: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25',
      inactiveIconClasses: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/50',
      activeCountClasses: 'bg-emerald-600 text-white',
    },
    {
      key: 'division-programs',
      label: 'Division Programs',
      description: 'For division personnel assignments',
      count: divisionPrograms.length,
      Icon: Buildings,
      activeClasses: 'border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/20 text-amber-950 dark:text-amber-50 shadow-[0_10px_24px_rgba(245,158,11,0.18)] ring-2 ring-amber-100 dark:ring-amber-900/40',
      hoverClasses: 'hover:border-amber-200 dark:hover:border-amber-800',
      activeIconClasses: 'bg-amber-600 text-white shadow-sm shadow-amber-600/25',
      inactiveIconClasses: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-950/50',
      activeCountClasses: 'bg-amber-600 text-white',
    },
  ];

  return (
    <>
      <div className="space-y-4">

        {/* View Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {programViewTabs.map(tab => {
            const isActive = view === tab.key;
            return (
            <MotionButton
              key={tab.key}
              type="button"
              onClick={() => setView(tab.key)}
              aria-pressed={isActive}
              layout
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors duration-200 ${isActive ? tab.activeClasses : `border-slate-200 dark:border-dark-border bg-white/70 dark:bg-dark-surface/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-dark-surface ${tab.hoverClasses}`}`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${isActive ? tab.activeIconClasses : tab.inactiveIconClasses}`}>
                {React.createElement(tab.Icon, { size: 20, weight: isActive ? 'fill' : 'regular' })}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black">{tab.label}</span>
                <span className="block text-xs font-bold text-slate-400 dark:text-slate-500">{tab.description}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-black ${isActive ? tab.activeCountClasses : 'bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400'}`}>
                {tab.count}
              </span>
            </MotionButton>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {view === 'programs' ? (
            <MotionDiv
              key="school-programs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-4"
            >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs…"
                    className="w-full px-3 py-2 pr-8 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-400" />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                      <X size={15} />
                    </button>
                  )}
                </div>
                <div className="relative shrink-0">
                  <ArrowsDownUp size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select value={sort} onChange={e => setSort(e.target.value)}
                    className="pl-7 pr-3 py-2 text-xs font-bold bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-slate-600 dark:text-slate-400 focus:outline-none focus:border-indigo-400 appearance-none cursor-pointer">
                    <option value="az">A → Z</option>
                    <option value="za">Z → A</option>
                    <option value="most-aips">Most AIPs</option>
                    <option value="fewest-aips">Fewest AIPs</option>
                  </select>
                </div>
                <button onClick={() => { setAddProgramOpen(true); setProgramForm({ title: '', abbreviation: '', division: '', school_level_requirement: 'Both' }); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shrink-0">
                  <Plus size={17} /> <span className="hidden sm:inline">Add Program</span><span className="sm:hidden">Add</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {LEVEL_PILLS.map(l => {
                  const count = l === 'All' ? programRows.length : programRows.filter(p => p.school_level_requirement === l).length;
                  return (
                    <button key={l} onClick={() => setLevelFilter(l)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${effectiveLevelFilter === l ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}>
                      {l === 'All' ? 'All' : (LEVEL_LABELS[l] ?? l)}
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${effectiveLevelFilter === l ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-dark-base text-slate-500 dark:text-slate-400'}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {loadingPrograms ? (
              <div className="flex items-center justify-center h-48">
                <Spinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPrograms.map(prog => (
                  <div key={prog.id} className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 max-w-full flex-1">
                        <ProgramTitleBlock title={prog.title} abbreviation={prog.abbreviation}>
                          <span className="block text-xs font-bold text-slate-400 dark:text-slate-500">{LEVEL_LABELS[prog.school_level_requirement] ?? prog.school_level_requirement}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {prog.division && <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wide rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400">{prog.division}</span>}
                          </div>
                        </ProgramTitleBlock>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setMembersProgram(prog)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                          title="View schools & personnel"
                        >
                          <UsersThree size={16} />
                        </button>
                        <button
                          onClick={() => openFocalModal(prog)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                          title="Assign focal persons"
                        >
                          <User size={16} />
                        </button>
                        <button
                          onClick={() => setTemplateProgram(prog)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                          title="Manage template"
                        >
                          <BookOpen size={16} />
                        </button>
                        <button onClick={() => { setEditProgram(prog); setProgramForm({ title: prog.title, abbreviation: prog.abbreviation ?? '', division: prog.division ?? '', school_level_requirement: prog.school_level_requirement }); }} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"><PencilSimple size={16} /></button>
                        <button onClick={() => setDeleteProgram(prog)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"><Trash size={16} /></button>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 dark:border-dark-border pt-3">
                      <span className="text-xs text-slate-400 dark:text-slate-500">{prog._count?.aips ?? 0} AIPs filed</span>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Focal Persons</p>
                        {prog.focal_persons?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {prog.focal_persons.slice(0, 3).map(p => (
                              <span key={p.id} className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                                {personnelDisplayName(p)}
                              </span>
                            ))}
                            {prog.focal_persons.length > 3 && (
                              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-dark-border dark:text-slate-400">
                                +{prog.focal_persons.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => openFocalModal(prog)}
                            className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                          >
                            No focal person assigned
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <EndOfListCue
                  count={filteredPrograms.length}
                  message={search || effectiveLevelFilter !== 'All' ? 'All matching programs shown' : 'End of program list'}
                  countLabel="program"
                  showCount
                  className="col-span-full pt-1"
                />
                {!filteredPrograms.length && (
                  <p className="col-span-2 text-center text-slate-400 dark:text-slate-600 py-16">No programs found.</p>
                )}
              </div>
            )}
            </MotionDiv>
          ) : (
            <MotionDiv
              key="division-programs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-4"
            >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input value={divSearch} onChange={e => setDivSearch(e.target.value)} placeholder="Search division programs…"
                    className="w-full px-3 py-2 pr-8 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-400" />
                  {divSearch && (
                    <button onClick={() => setDivSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                      <X size={15} />
                    </button>
                  )}
                </div>
                <div className="relative shrink-0">
                  <ArrowsDownUp size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select value={divSort} onChange={e => setDivSort(e.target.value)}
                    className="pl-7 pr-3 py-2 text-xs font-bold bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-slate-600 dark:text-slate-400 focus:outline-none focus:border-indigo-400 appearance-none cursor-pointer">
                    <option value="az">A → Z</option>
                    <option value="za">Z → A</option>
                    <option value="most-personnel">Most Assigned</option>
                    <option value="fewest-personnel">Fewest Assigned</option>
                  </select>
                </div>
                <button onClick={() => { setAddProgramOpen(true); setProgramForm({ title: '', abbreviation: '', division: divisionFilter !== 'All' ? divisionFilter : 'CID', school_level_requirement: 'Division' }); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shrink-0">
                  <Plus size={17} /> <span className="hidden sm:inline">Add Program</span><span className="sm:hidden">Add</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {['All', ...DIVISIONS].map(d => {
                  const count = d === 'All' ? divisionPrograms.length : divisionPrograms.filter(p => p.division === d).length;
                  return (
                    <button key={d} onClick={() => setDivisionFilter(d)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${divisionFilter === d ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}>
                      {d}
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${divisionFilter === d ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-dark-base text-slate-500 dark:text-slate-400'}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {loadingPrograms ? (
              <div className="flex items-center justify-center h-48">
                <Spinner />
              </div>
            ) : divisionProgramGroups.length ? (
              <div className="space-y-5">
                {divisionProgramGroups.map(({ division, programs: groupedPrograms }) => (
                  <section key={division} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wide rounded-lg ${DIVISION_COLORS[division] ?? 'bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400'}`}>
                        {division}
                      </span>
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        {groupedPrograms.length} program{groupedPrograms.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedPrograms.map(prog => {
                        const assignedPersonnel = prog.personnel ?? [];
                        return (
                        <div key={prog.id} className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 max-w-full flex-1">
                              <ProgramTitleBlock title={prog.title} abbreviation={prog.abbreviation} />
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setTemplateProgram(prog)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                                title="Manage template"
                              >
                                <BookOpen size={16} />
                              </button>
                              <button onClick={() => { setEditProgram(prog); setProgramForm({ title: prog.title, abbreviation: prog.abbreviation ?? '', division: prog.division ?? '', school_level_requirement: prog.school_level_requirement }); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"><PencilSimple size={16} /></button>
                              <button onClick={() => setDeleteProgram(prog)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"><Trash size={16} /></button>
                            </div>
                          </div>
                          <div className="border-t border-slate-100 dark:border-dark-border pt-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assigned Personnel</p>
                            {assignedPersonnel.length > 0 ? (
                              <div className="space-y-1">
                                {assignedPersonnel.slice(0, 3).map(p => (
                                  <p key={p.id} onClick={() => handleViewUser(p)} className={`text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${loadingUser ? 'opacity-50 pointer-events-none text-slate-400' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}><User size={12} weight="bold" /> {personnelDisplayName(p)}</p>
                                ))}
                                {assignedPersonnel.length > 3 && <p className="text-xs text-slate-400">+{assignedPersonnel.length - 3} more</p>}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 dark:text-slate-600">No personnel assigned</p>
                            )}
                          </div>
                        </div>
                        );
                      })}
                      <EndOfListCue
                        count={groupedPrograms.length}
                        message={divSearch || divisionFilter !== 'All' ? `All matching ${division} programs shown` : `End of ${division} program list`}
                        countLabel="program"
                        showCount
                        className="col-span-full pt-1"
                      />
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 dark:text-slate-600 py-16">No division programs found.</p>
            )}
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>

      {/* ── School Program Modals ── */}
      <FormModal open={addProgramOpen || !!editProgram} title={editProgram ? 'Edit Program' : 'Add Program'}
        onSave={editProgram ? handleEditProgram : handleAddProgram}
        onCancel={() => { setAddProgramOpen(false); setEditProgram(null); setFormError(''); }} loading={actionLoading}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Program Title</label>
            <input value={programForm.title} onChange={e => setProgramForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Abbreviation <span className="font-normal normal-case text-slate-400">(optional)</span></label>
            <input value={programForm.abbreviation} onChange={e => setProgramForm(f => ({ ...f, abbreviation: e.target.value }))}
              placeholder="e.g. SPED"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Division <span className="font-normal normal-case text-slate-400">(for CES routing)</span></label>
            <SearchableSelect options={[{ value: '', label: 'None' }, ...DIVISIONS.map(d => ({ value: d, label: d }))]} value={programForm.division} onChange={v => setProgramForm(f => ({ ...f, division: v }))} />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">Applicability</label>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1.5">determines which schools or users can see and file this program</p>
            <SearchableSelect options={SCHOOL_LEVELS.map(l => ({ value: l, label: LEVEL_LABELS[l] ?? l }))} value={programForm.school_level_requirement} onChange={v => setProgramForm(f => ({ ...f, school_level_requirement: v }))} />
          </div>
          {formError && <p className="text-xs text-red-500 font-bold">{formError}</p>}
        </div>
      </FormModal>

      <ConfirmModal open={!!deleteProgram} title="Delete Program" message={`Delete "${deleteProgram?.title}"? Existing AIP submissions referencing this program will remain but orphaned.`}
        variant="danger" confirmLabel="Delete" onConfirm={handleDeleteProgram} onCancel={() => setDeleteProgram(null)} loading={actionLoading} />

      <ProgramTemplatesModal
        open={!!templateProgram}
        program={templateProgram}
        onClose={() => setTemplateProgram(null)}
        onSaved={(message) => showToast(message)}
      />

      <ProgramMembersModal
        open={!!membersProgram}
        program={membersProgram}
        onClose={() => setMembersProgram(null)}
      />

      <FormModal
        open={!!focalProgram}
        title="Assign Focal Persons"
        onSave={handleSaveFocalPersons}
        onCancel={() => { setFocalProgram(null); setFormError(''); }}
        loading={actionLoading}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100">
              {focalProgram?.title}
            </p>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              Select one or more active Division Personnel users who can recommend school submissions for this program.
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 dark:border-dark-border">
            {divisionUsers.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                No active Division Personnel users found.
              </p>
            ) : (
              divisionUsers.map(user => {
                const checked = focalSelection.includes(user.id);
                return (
                  <label
                    key={user.id}
                    className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-dark-border ${checked ? 'bg-blue-50/70 dark:bg-blue-950/20' : 'bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-dark-base'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFocalSelection(user.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                        {personnelDisplayName(user)}
                      </span>
                      <span className="block truncate text-xs text-slate-400 dark:text-slate-500">
                        {user.email}
                      </span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
          {formError && <p className="text-xs font-bold text-red-500">{formError}</p>}
        </div>
      </FormModal>

      <UserProfileModal
        open={!!viewUser}
        user={viewUser}
        onClose={() => setViewUser(null)}
        onEdit={() => { setViewUser(null); showToast('Please go to the Users tab to edit users.', 'error'); }}
        onResetPassword={() => { setViewUser(null); showToast('Please go to the Users tab to reset passwords.', 'error'); return Promise.reject(); }}
        onToggle={() => { setViewUser(null); showToast('Please go to the Users tab to toggle account status.', 'error'); }}
        onDelete={() => { setViewUser(null); showToast('Please go to the Users tab to delete users.', 'error'); }}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-bold
          ${toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
          }`}>
          <CheckCircle size={18} weight="fill" className={toast.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} />
          {toast.msg}
        </div>
      )}
    </>
  );
}
