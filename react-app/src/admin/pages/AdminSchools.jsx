import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import { CaretRight, CheckCircle, PencilSimple, Trash, Plus, MagnifyingGlass, X } from '@phosphor-icons/react';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { FormModal } from '../components/FormModal.jsx';
import { SearchableSelect } from '../components/SearchableSelect.jsx';
import { MultiSelect } from '../components/MultiSelect.jsx';
import { SchoolAvatar } from '../../components/ui/SchoolAvatar.jsx';
import { EndOfListCue } from '../../components/ui/EndOfListCue.jsx';
import { getClusterLogoPath, getUploadedLogoUrl } from '../../lib/clusterLogo.js';
import { useTextMeasure } from '../../lib/useTextMeasure.js';

function SchoolNameMarquee({ name, abbreviation }) {
  const displayName = abbreviation ? `${name} (${abbreviation})` : name;
  const { measureText, containerRef, containerWidth } = useTextMeasure({
    font: '900 14px Inter',
    lineHeight: 18,
  });

  const overflows = containerWidth > 0 && measureText(displayName, containerWidth).lineCount > 1;

  return (
    <div
      ref={containerRef}
      className={overflows ? 'school-name-marquee' : 'min-w-0 overflow-hidden'}
      title={displayName}
      aria-label={displayName}
      tabIndex={overflows ? 0 : undefined}
    >
      {overflows ? (
        <span className="school-name-marquee__track">
          <span className="school-name-marquee__text font-black text-slate-900 dark:text-slate-100 text-sm leading-tight">{displayName}</span>
          <span aria-hidden="true" className="school-name-marquee__text font-black text-slate-900 dark:text-slate-100 text-sm leading-tight">{displayName}</span>
        </span>
      ) : (
        <span className="block truncate font-black text-slate-900 dark:text-slate-100 text-sm leading-tight">
          {name}
          {abbreviation && (
            <span className="font-bold text-slate-400 dark:text-slate-500"> ({abbreviation})</span>
          )}
        </span>
      )}
    </div>
  );
}

function IconHoverLabelButton({
  label,
  icon,
  onClick,
  disabled = false,
  title,
  variant = 'default',
  className = '',
}) {
  const tone = disabled
    ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
    : variant === 'danger'
      ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
      : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      className={`group inline-flex items-center gap-1 overflow-hidden rounded-lg px-2 py-1 text-xs font-bold transition-all duration-200 ease-out sm:text-sm ${tone} ${className}`}
    >
      <span className="max-w-14 overflow-hidden whitespace-nowrap opacity-100 transition-all duration-200 ease-out sm:max-w-0 sm:opacity-0 sm:group-hover:max-w-14 sm:group-hover:opacity-100 sm:group-focus-visible:max-w-14 sm:group-focus-visible:opacity-100">
        {label}
      </span>
      <span className="flex shrink-0 items-center">
        {icon}
      </span>
    </button>
  );
}

const API = import.meta.env.VITE_API_URL;
const MotionDiv = motion.div;

const LEVELS = ['Elementary', 'Secondary'];

export default function AdminSchools() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [expanded, setExpanded] = useState({});

  // Cluster modals
  const [clusterForm, setClusterForm] = useState({ cluster_number: '' });
  const [editCluster, setEditCluster] = useState(null);
  const [deleteCluster, setDeleteCluster] = useState(null);
  const [addClusterOpen, setAddClusterOpen] = useState(false);

  // School modals
  const [schoolForm, setSchoolForm] = useState({ name: '', abbreviation: '', level: 'Elementary', cluster_id: null });
  const [editSchool, setEditSchool] = useState(null);
  const [deleteSchool, setDeleteSchool] = useState(null);
  const [addSchoolOpen, setAddSchoolOpen] = useState(false);
  const [restrictSchool, setRestrictSchool] = useState(null);
  const [restrictedIds, setRestrictedIds] = useState([]);
  const [restrictSearch, setRestrictSearch] = useState('');

  const [highlightedSchoolId, setHighlightedSchoolId] = useState(null);
  const [highlightedClusterId, setHighlightedClusterId] = useState(null);
  const [activeLogoSchoolId, setActiveLogoSchoolId] = useState(null);
  const schoolRefs = useRef({});
  const clusterRefs = useRef({});

  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fetchError, setFetchError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(() => {
    setLoading(true);
    return Promise.all([
      axios.get(`${API}/api/admin/clusters`, { withCredentials: true }),
      axios.get(`${API}/api/admin/programs`, { withCredentials: true }),
    ]).then(([cr, pr]) => { setFetchError(null); setClusters(cr.data); setPrograms(pr.data); })
      .catch(e => { console.error(e); setFetchError('Failed to load data. Please refresh and try again.'); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!highlightedSchoolId) return;
    const el = schoolRefs.current[highlightedSchoolId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const t = setTimeout(() => setHighlightedSchoolId(null), 1800);
      return () => clearTimeout(t);
    }
  }, [highlightedSchoolId, clusters]);

  useEffect(() => {
    if (!highlightedClusterId) return;
    const el = clusterRefs.current[highlightedClusterId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const t = setTimeout(() => setHighlightedClusterId(null), 1800);
      return () => clearTimeout(t);
    }
  }, [highlightedClusterId, clusters]);

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const getSelectedSchoolClusterId = () => {
    const clusterId = Number(schoolForm.cluster_id);
    return Number.isInteger(clusterId) && clusters.some(c => c.id === clusterId) ? clusterId : null;
  };

  // Cluster CRUD
  const nextClusterNumber = () => Math.max(0, ...clusters.map(c => c.cluster_number)) + 1;

  const handleAddCluster = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      const num = Number(clusterForm.cluster_number);
      // CONSTRAINT: Clusters have no meaningful name — identified by number only. Do not set name to "Cluster N"; that causes redundant display elsewhere.
      const res = await axios.post(`${API}/api/admin/clusters`, { cluster_number: num, name: String(num) }, { withCredentials: true });
      const newClusterId = res.data.id;
      setAddClusterOpen(false); setClusterForm({ cluster_number: '' });
      setHighlightedClusterId(newClusterId);
      await fetchAll();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };
  const handleEditCluster = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      const num = Number(clusterForm.cluster_number);
      const clusterId = editCluster.id;
      await axios.patch(`${API}/api/admin/clusters/${clusterId}`, { cluster_number: num, name: String(num) }, { withCredentials: true });
      setEditCluster(null);
      setHighlightedClusterId(clusterId);
      await fetchAll();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };

  const handleClusterLogoUpload = async (e) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file || !editCluster) return;

    setLogoUploading(true);
    setFormError('');

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await axios.post(`${API}/api/admin/clusters/${editCluster.id}/logo`, formData, { withCredentials: true });
      const logo = res.data.logo ?? null;
      setEditCluster(c => c ? ({ ...c, logo }) : c);
      await fetchAll();
      showToast('Cluster logo uploaded.');
    } catch (e) {
      showToast(e.response?.data?.error || 'Upload failed.', 'error');
    } finally {
      setLogoUploading(false);
      input.value = '';
    }
  };

  const handleRemoveClusterLogo = async () => {
    if (!editCluster) return;

    setLogoUploading(true);
    setFormError('');

    try {
      await axios.delete(`${API}/api/admin/clusters/${editCluster.id}/logo`, { withCredentials: true });
      setEditCluster(c => c ? ({ ...c, logo: null }) : c);
      await fetchAll();
      showToast('Cluster logo removed.');
    } catch (e) {
      showToast(e.response?.data?.error || 'Failed to remove cluster logo.', 'error');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleDeleteCluster = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      await axios.delete(`${API}/api/admin/clusters/${deleteCluster.id}`, { withCredentials: true });
      setDeleteCluster(null); fetchAll();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };

  // School CRUD
  const handleAddSchool = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      const clusterId = getSelectedSchoolClusterId();
      if (!clusterId) {
        setFormError('Please select a cluster.');
        return;
      }
      const res = await axios.post(`${API}/api/admin/schools`, { ...schoolForm, cluster_id: clusterId }, { withCredentials: true });
      const newSchoolId = res.data.id;
      setExpanded(e => ({ ...e, [clusterId]: true }));
      setAddSchoolOpen(false); setSchoolForm({ name: '', abbreviation: '', level: 'Elementary', cluster_id: null });
      setHighlightedSchoolId(newSchoolId);
      await fetchAll();
      showToast('School added successfully.');
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };
  const handleEditSchool = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      const clusterId = getSelectedSchoolClusterId();
      if (!clusterId) {
        setFormError('Please select a cluster.');
        return;
      }
      const schoolId = editSchool.id;
      await axios.patch(`${API}/api/admin/schools/${schoolId}`, { name: schoolForm.name, abbreviation: schoolForm.abbreviation, level: schoolForm.level, cluster_id: clusterId }, { withCredentials: true });
      setExpanded(e => ({ ...e, [clusterId]: true }));
      setEditSchool(null);
      setHighlightedSchoolId(schoolId);
      await fetchAll();
      showToast('School updated.');
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };
  const handleDeleteSchool = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      await axios.delete(`${API}/api/admin/schools/${deleteSchool.id}`, { withCredentials: true });
      setDeleteSchool(null); fetchAll();
      showToast('School deleted.');
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };
  const handleSaveRestrictions = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      await axios.patch(`${API}/api/admin/schools/${restrictSchool.id}/restrictions`, { restricted_program_ids: restrictedIds }, { withCredentials: true });
      setRestrictSchool(null); fetchAll();
      showToast('Restrictions saved.');
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };

  const handleSchoolLogoUpload = async (e) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file || !editSchool) return;

    setLogoUploading(true);
    setFormError('');

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await axios.post(`${API}/api/admin/schools/${editSchool.id}/logo`, formData, { withCredentials: true });
      const logo = res.data.logo ?? null;
      setEditSchool(s => s ? ({ ...s, logo }) : s);
      fetchAll();
      showToast('Logo uploaded.');
    } catch (e) {
      showToast(e.response?.data?.error || 'Upload failed.', 'error');
    } finally {
      setLogoUploading(false);
      input.value = '';
    }
  };

  const handleRemoveSchoolLogo = async () => {
    if (!editSchool) return;

    setLogoUploading(true);
    setFormError('');

    try {
      await axios.delete(`${API}/api/admin/schools/${editSchool.id}/logo`, { withCredentials: true });
      setEditSchool(s => s ? ({ ...s, logo: null }) : s);
      fetchAll();
      showToast('Logo removed.');
    } catch (e) {
      showToast(e.response?.data?.error || 'Failed to remove logo.', 'error');
    } finally {
      setLogoUploading(false);
    }
  };

  const q = search.trim().toLowerCase();
  const filteredClusters = q
    ? clusters.map(c => ({ ...c, schools: (c.schools || []).filter(s => s.name.toLowerCase().includes(q) || (s.abbreviation || '').toLowerCase().includes(q)) })).filter(c => c.schools.length > 0)
    : clusters;
  const totalMatches = q ? filteredClusters.reduce((n, c) => n + c.schools.length, 0) : null;
  const editSchoolCluster = clusters.find(c => c.id === Number(schoolForm.cluster_id)) ?? null;
  const editSchoolClusterNumber = editSchoolCluster?.cluster_number ?? null;
  const mobileSearchActive = searchOpen || !!search;

  return (
    <>
      <div className="space-y-4">

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative hidden sm:block flex-1 min-w-0">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search schools..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (mobileSearchActive) {
                setSearch('');
                setSearchOpen(false);
              } else {
                setSearchOpen(true);
              }
            }}
            className={`sm:hidden flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${mobileSearchActive ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 shadow-sm ring-2 ring-indigo-100 dark:ring-indigo-900/40' : 'bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-dark-border'}`}
            aria-label={mobileSearchActive ? 'Close search' : 'Search schools'}
            aria-expanded={mobileSearchActive}
          >
            <MagnifyingGlass size={17} weight={mobileSearchActive ? 'bold' : 'regular'} />
          </button>
          {totalMatches !== null && (
            <span className="hidden sm:inline text-xs font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">{totalMatches} result{totalMatches !== 1 ? 's' : ''}</span>
          )}
          <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <button onClick={() => { setAddSchoolOpen(true); setSchoolForm({ name: '', abbreviation: '', level: 'Elementary', cluster_id: null }); }}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
            <Plus size={17} /> <span className="hidden sm:inline">Add School</span><span className="sm:hidden">School</span>
          </button>
          <button onClick={() => { setAddClusterOpen(true); setClusterForm({ cluster_number: nextClusterNumber() }); }}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-border rounded-xl transition-colors">
            <Plus size={17} /> <span className="hidden sm:inline">Add Cluster</span><span className="sm:hidden">Cluster</span>
          </button>
          </div>
          <AnimatePresence initial={false}>
            {mobileSearchActive && (
              <MotionDiv
                key="mobile-school-search"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="relative sm:hidden w-full overflow-hidden"
              >
                <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search schools..."
                  autoFocus
                  className="w-full pl-9 pr-9 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </MotionDiv>
            )}
          </AnimatePresence>
          {totalMatches !== null && (
            <span className="sm:hidden w-full text-xs font-bold text-slate-400 dark:text-slate-500">{totalMatches} result{totalMatches !== 1 ? 's' : ''}</span>
          )}
        </div>

        {fetchError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 text-sm font-medium">
            {fetchError}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClusters.map(cl => {
              const isOpen = q ? true : !!expanded[cl.id];
              const schoolCount = cl.schools?.length ?? 0;
              const userCount = cl.schools?.reduce((sum, s) => sum + (s.users?.length ?? 0), 0) ?? 0;
              const clusterLogo = cl.logo ?? null;
              const bundledClusterLogo = getClusterLogoPath(cl.cluster_number);
              const decorativeClusterLogo = getUploadedLogoUrl(clusterLogo) ?? bundledClusterLogo;
              return (
                <div key={cl.id} ref={el => { clusterRefs.current[cl.id] = el; }} className={`bg-white dark:bg-dark-surface border rounded-2xl overflow-hidden transition-shadow duration-300 ${highlightedClusterId === cl.id ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-600' : 'border-slate-200 dark:border-dark-border'}`}>
                  {/* Cluster header */}
                  <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3.5 sm:py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-border/20 transition-colors" onClick={() => toggleExpand(cl.id)}>
                    <SchoolAvatar
                      clusterNumber={cl.cluster_number}
                      clusterLogo={clusterLogo}
                      name={`Cluster ${cl.cluster_number}`}
                      size={32}
                      rounded="rounded-full"
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="block font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Cluster {cl.cluster_number}</span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-bold">{schoolCount} schools</span>
                        <span className="text-[11px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400">{userCount} user{userCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                      <IconHoverLabelButton
                        label="Edit"
                        icon={<PencilSimple size={19} />}
                        onClick={(e) => { e.stopPropagation(); setEditCluster(cl); setClusterForm({ cluster_number: cl.cluster_number }); }}
                      />
                      <IconHoverLabelButton
                        label="Delete"
                        icon={<Trash size={19} />}
                        onClick={(e) => { e.stopPropagation(); setDeleteCluster(cl); }}
                        disabled={schoolCount > 0}
                        title={schoolCount > 0 ? 'Remove all schools first' : 'Delete cluster'}
                        variant="danger"
                      />
                      <CaretRight size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Schools */}
                  <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <div className="border-t border-slate-100 dark:border-dark-border px-4 sm:px-5 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {cl.schools?.map(school => {
                        const isSchoolActive = highlightedSchoolId === school.id || activeLogoSchoolId === school.id;

                        return (
                        <div
                          key={school.id}
                          ref={el => { schoolRefs.current[school.id] = el; }}
                          onMouseEnter={() => setActiveLogoSchoolId(school.id)}
                          onMouseLeave={() => setActiveLogoSchoolId(null)}
                          onFocus={() => setActiveLogoSchoolId(school.id)}
                          onBlur={e => {
                            if (!e.currentTarget.contains(e.relatedTarget)) setActiveLogoSchoolId(null);
                          }}
                          className={`relative overflow-hidden border rounded-xl p-3.5 sm:p-4 transition-[background-color,border-color,box-shadow] duration-300 ${isSchoolActive ? 'bg-amber-50/60 dark:bg-amber-950/15 border-amber-300 dark:border-amber-700/60 shadow-[0_12px_28px_rgba(245,158,11,0.16)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.24)]' : 'bg-slate-50 dark:bg-dark-base border-slate-200 dark:border-dark-border'} ${highlightedSchoolId === school.id ? 'ring-2 ring-indigo-300 dark:ring-indigo-600' : ''}`}
                        >
                          <img
                            src={decorativeClusterLogo}
                            alt=""
                            aria-hidden="true"
                            className={`school-card-watermark pointer-events-none absolute -right-8 -bottom-10 h-40 w-40 object-contain ${isSchoolActive ? 'school-card-watermark--active' : ''}`}
                            style={{ opacity: isSchoolActive ? 0.36 : 0.07 }}
                            loading="lazy"
                            onError={e => {
                              if (clusterLogo && bundledClusterLogo && e.currentTarget.dataset.fallbackApplied !== 'true') {
                                e.currentTarget.dataset.fallbackApplied = 'true';
                                e.currentTarget.src = bundledClusterLogo;
                              } else {
                                e.currentTarget.style.display = 'none';
                              }
                            }}
                          />
                          <div className="relative z-10 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex flex-1 items-center gap-3 min-w-0">
                                <SchoolAvatar
                                  clusterNumber={cl.cluster_number}
                                  schoolLogo={school.logo ?? null}
                                  clusterLogo={clusterLogo}
                                  name={school.name}
                                  size={36}
                                  rounded="rounded-full"
                                  className="shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <SchoolNameMarquee name={school.name} abbreviation={school.abbreviation} />
                                </div>
                              </div>
                              <IconHoverLabelButton
                                label="Edit"
                                icon={<PencilSimple size={18} />}
                                onClick={() => { setEditSchool(school); setSchoolForm({ name: school.name, abbreviation: school.abbreviation || '', level: school.level, cluster_id: school.cluster_id }); }}
                                className="shrink-0 sm:p-1"
                              />
                            </div>
                            <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">{school.level}</p>
                            <div className="flex items-center justify-between text-[11px] sm:text-xs">
                              <span className={`font-bold ${school.users?.length ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                {school.users?.length ? 'Has user' : 'No user'}
                              </span>
                              {school.users?.length === 1 && (
                                <span className="text-slate-400 dark:text-slate-500 truncate ml-2">
                                  {school.users[0].name || school.users[0].email}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => { setRestrictSchool(school); setRestrictedIds(school.restricted_programs?.map(p => p.id) ?? []); }}
                                className={`text-left text-[11px] sm:text-xs font-bold hover:underline ${school.restricted_programs?.length ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                              >
                                {school.restricted_programs?.length ?? 0} Restricted {(school.restricted_programs?.length ?? 0) === 1 ? 'Program' : 'Programs'}
                              </button>
                              <IconHoverLabelButton
                                label="Delete"
                                icon={<Trash size={17} />}
                                onClick={() => setDeleteSchool(school)}
                                variant="danger"
                                className="sm:p-1"
                              />
                            </div>
                          </div>
                        </div>
                        );
                      })}
                      {!cl.schools?.length && (
                        <p className="text-sm text-slate-400 dark:text-slate-600 col-span-full text-center py-4">No schools in this cluster.</p>
                      )}
                      <EndOfListCue
                        count={cl.schools?.length ?? 0}
                        message={q ? `All matching schools in Cluster ${cl.cluster_number} shown` : `End of Cluster ${cl.cluster_number} schools`}
                        countLabel="school"
                        showCount
                        className="col-span-full pt-1"
                      />
                    </div>
                  </div>
                  </div>
                </div>
              );
            })}
            {!clusters.length && (
              <p className="text-center text-slate-400 dark:text-slate-600 py-16">No clusters yet. Add one to get started.</p>
            )}
          </div>
        )}
      </div>

      {/* Add Cluster — bespoke modal */}
      {(() => {
        const numVal = Number(clusterForm.cluster_number);
        const addNumTaken = !!clusterForm.cluster_number && clusters.some(c => c.cluster_number === numVal);
        const canSave = !!clusterForm.cluster_number && !addNumTaken;
        return (
          <AnimatePresence>
            {addClusterOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setAddClusterOpen(false); setFormError(''); }} />
                <MotionDiv
                  initial={{ opacity: 0, scale: 0.92, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 16 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="relative z-10 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                >
                <form onSubmit={e => { e.preventDefault(); if (canSave && !actionLoading) handleAddCluster(); }}>
                  {/* Header strip */}
                  <div className="px-7 pt-7 pb-2 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">New Cluster</p>
                  </div>

                  {/* Giant number input */}
                  <div className="flex flex-col items-center px-7 py-6">
                    <input
                      type="number"
                      value={clusterForm.cluster_number}
                      onChange={e => setClusterForm(f => ({ ...f, cluster_number: e.target.value }))}
                      autoFocus
                      placeholder="—"
                      className={`w-40 text-center text-8xl font-black bg-transparent border-b-4 focus:outline-none transition-colors pb-1
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                        ${addNumTaken
                          ? 'text-rose-500 dark:text-rose-400 border-rose-400'
                          : canSave
                            ? 'text-indigo-600 dark:text-indigo-400 border-indigo-400'
                            : 'text-slate-300 dark:text-slate-600 border-slate-200 dark:border-dark-border'
                        }`}
                    />
                    <div className="h-6 mt-3 flex items-center justify-center">
                      {addNumTaken
                        ? <p className="text-xs font-bold text-rose-500">Cluster {numVal} already exists.</p>
                        : canSave
                          ? <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400">Cluster {numVal}</p>
                          : <p className="text-xs text-slate-400 dark:text-slate-500">Enter a cluster number</p>
                      }
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex gap-2 px-7 pb-7">
                    <button onClick={() => { setAddClusterOpen(false); setFormError(''); }}
                      className="flex-1 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-base hover:bg-slate-200 dark:hover:bg-dark-border rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={!canSave || actionLoading}
                      className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {actionLoading ? 'Creating…' : 'Create Cluster'}
                    </button>
                  </div>
                  {formError && <p className="text-xs text-red-500 font-bold text-center pb-4">{formError}</p>}
                </form>
                </MotionDiv>
              </div>
            )}
          </AnimatePresence>
        );
      })()}

      {/* Edit Cluster */}
      {(() => {
        const numVal = Number(clusterForm.cluster_number);
        const editNumTaken = !!editCluster && !!clusterForm.cluster_number && clusters.some(c => c.id !== editCluster.id && c.cluster_number === numVal);
        const canSave = !!clusterForm.cluster_number && !editNumTaken;
        return (
          <AnimatePresence>
            {!!editCluster && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setEditCluster(null); setFormError(''); setLogoUploading(false); }} />
                <MotionDiv
                  initial={{ opacity: 0, scale: 0.92, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 16 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="relative z-10 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                >
                <form onSubmit={e => { e.preventDefault(); if (canSave && !actionLoading && !logoUploading) handleEditCluster(); }}>
                  {/* Header strip */}
                  <div className="px-7 pt-7 pb-2 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Edit Cluster</p>
                  </div>

                  {/* Logo */}
                  <div className="px-7 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 text-center mb-3">Cluster Logo</p>
                    <div className="flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border p-3">
                      <SchoolAvatar
                        clusterNumber={clusterForm.cluster_number || editCluster.cluster_number}
                        clusterLogo={editCluster.logo ?? null}
                        name={`Cluster ${clusterForm.cluster_number || editCluster.cluster_number}`}
                        size={56}
                        rounded="rounded-full"
                        className="shrink-0"
                      />
                      <div className="min-w-0 flex flex-1 flex-col gap-2">
                        <label className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/30 ${logoUploading ? 'pointer-events-none opacity-50' : ''}`}>
                          {logoUploading ? 'Uploading...' : 'Upload Logo'}
                          <input
                            type="file"
                            accept="image/webp,image/png,image/jpeg,image/gif"
                            className="hidden"
                            disabled={logoUploading}
                            onChange={handleClusterLogoUpload}
                          />
                        </label>
                        {editCluster.logo && (
                          <button
                            type="button"
                            onClick={handleRemoveClusterLogo}
                            disabled={logoUploading}
                            className="text-left text-xs font-bold text-rose-500 hover:underline disabled:opacity-50"
                          >
                            Remove and use bundled default
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1.5 text-center text-[11px] text-slate-400 dark:text-slate-500">
                      Max 2 MB - WebP, PNG, JPEG, or GIF
                    </p>
                  </div>

                  {/* Giant number input */}
                  <div className="flex flex-col items-center px-7 py-5">
                    <input
                      type="number"
                      value={clusterForm.cluster_number}
                      onChange={e => setClusterForm(f => ({ ...f, cluster_number: e.target.value }))}
                      autoFocus
                      placeholder="—"
                      className={`w-40 text-center text-8xl font-black bg-transparent border-b-4 focus:outline-none transition-colors pb-1
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                        ${editNumTaken
                          ? 'text-rose-500 dark:text-rose-400 border-rose-400'
                          : canSave
                            ? 'text-indigo-600 dark:text-indigo-400 border-indigo-400'
                            : 'text-slate-300 dark:text-slate-600 border-slate-200 dark:border-dark-border'
                        }`}
                    />
                    <div className="h-6 mt-3 flex items-center justify-center">
                      {editNumTaken
                        ? <p className="text-xs font-bold text-rose-500">Cluster {numVal} already exists.</p>
                        : canSave
                          ? <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400">Cluster {numVal}</p>
                          : <p className="text-xs text-slate-400 dark:text-slate-500">Enter a cluster number</p>
                      }
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex gap-2 px-7 pb-7">
                    <button type="button" onClick={() => { setEditCluster(null); setFormError(''); setLogoUploading(false); }}
                      className="flex-1 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-base hover:bg-slate-200 dark:hover:bg-dark-border rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={!canSave || actionLoading || logoUploading}
                      className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {actionLoading ? 'Saving…' : 'Save Cluster'}
                    </button>
                  </div>
                  {formError && <p className="text-xs text-red-500 font-bold text-center pb-4">{formError}</p>}
                </form>
                </MotionDiv>
              </div>
            )}
          </AnimatePresence>
        );
      })()}

      {/* Delete Cluster */}
      <ConfirmModal open={!!deleteCluster} title="Delete Cluster" message={`Delete Cluster ${deleteCluster?.cluster_number}? This cannot be undone.`}
        variant="danger" confirmLabel="Delete" onConfirm={handleDeleteCluster} onCancel={() => setDeleteCluster(null)} loading={actionLoading} />

      {/* Add School */}
      <FormModal open={addSchoolOpen} title="Add School" onSave={handleAddSchool} onCancel={() => { setAddSchoolOpen(false); setFormError(''); }} loading={actionLoading}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">School Name</label>
            <input value={schoolForm.name} onChange={e => setSchoolForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Abbreviation <span className="font-normal normal-case text-slate-400">(optional)</span></label>
            <input value={schoolForm.abbreviation} onChange={e => setSchoolForm(f => ({ ...f, abbreviation: e.target.value }))} placeholder="e.g. GNAS"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Level</label>
            <SearchableSelect options={LEVELS.map(l => ({ value: l, label: l }))} value={schoolForm.level} onChange={v => setSchoolForm(f => ({ ...f, level: v }))} />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Cluster</label>
            <SearchableSelect options={clusters.map(c => ({ value: c.id, label: `Cluster ${c.cluster_number}` }))} value={schoolForm.cluster_id} onChange={v => setSchoolForm(f => ({ ...f, cluster_id: Number(v) }))} />
          </div>
          {formError && <p className="text-xs text-red-500 font-bold">{formError}</p>}
        </div>
      </FormModal>

      {/* Edit School */}
      <FormModal open={!!editSchool} title="Edit School" onSave={handleEditSchool} onCancel={() => { setEditSchool(null); setFormError(''); setLogoUploading(false); }} loading={actionLoading} saveDisabled={logoUploading}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">School Logo</label>
            <div className="flex items-center gap-4">
              <SchoolAvatar
                clusterNumber={editSchoolClusterNumber}
                schoolLogo={editSchool?.logo ?? null}
                clusterLogo={editSchoolCluster?.logo ?? null}
                name={editSchool?.name ?? ''}
                size={56}
                rounded="rounded-full"
                className="shrink-0"
              />
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors disabled:opacity-50">
                  {logoUploading ? 'Uploading...' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/webp,image/png,image/jpeg,image/gif"
                    className="hidden"
                    disabled={logoUploading}
                    onChange={handleSchoolLogoUpload}
                  />
                </label>
                {editSchool?.logo && (
                  <button
                    type="button"
                    onClick={handleRemoveSchoolLogo}
                    disabled={logoUploading}
                    className="text-left text-xs font-bold text-rose-500 hover:underline disabled:opacity-50"
                  >
                    Remove and use cluster default
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
              Max 2 MB - WebP, PNG, JPEG, or GIF
            </p>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">School Name</label>
            <input value={schoolForm.name} onChange={e => setSchoolForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Abbreviation <span className="font-normal normal-case text-slate-400">(optional)</span></label>
            <input value={schoolForm.abbreviation} onChange={e => setSchoolForm(f => ({ ...f, abbreviation: e.target.value }))} placeholder="e.g. GNAS"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Level</label>
            <SearchableSelect options={LEVELS.map(l => ({ value: l, label: l }))} value={schoolForm.level} onChange={v => setSchoolForm(f => ({ ...f, level: v }))} />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Cluster</label>
            <SearchableSelect options={clusters.map(c => ({ value: c.id, label: `Cluster ${c.cluster_number}` }))} value={schoolForm.cluster_id} onChange={v => setSchoolForm(f => ({ ...f, cluster_id: Number(v) }))} />
          </div>
          {formError && <p className="text-xs text-red-500 font-bold">{formError}</p>}
        </div>
      </FormModal>

      {/* Delete School */}
      <ConfirmModal open={!!deleteSchool} title="Delete School" message={`Delete "${deleteSchool?.name}"? All associated submissions will also be removed.`}
        variant="danger" confirmLabel="Delete" onConfirm={handleDeleteSchool} onCancel={() => setDeleteSchool(null)} loading={actionLoading} />

      {/* Program Restrictions */}
      <FormModal open={!!restrictSchool} title={`Program Restrictions — ${restrictSchool?.name}`} onSave={handleSaveRestrictions} onCancel={() => { setRestrictSchool(null); setFormError(''); setRestrictSearch(''); }} loading={actionLoading} saveLabel="Save Restrictions">
        {formError && <p className="text-xs text-red-500 font-bold mb-3">{formError}</p>}
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          <strong>Checked</strong> = program is available to this school. <strong>Unchecked</strong> = restricted.
        </p>
        <div className="relative mb-3">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={restrictSearch}
            onChange={e => setRestrictSearch(e.target.value)}
            placeholder="Search programs..."
            className="w-full pl-8 pr-8 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
          />
          {restrictSearch && (
            <button onClick={() => setRestrictSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="space-y-2">
          {programs.filter(p => p.school_level_requirement !== 'Division' && (!restrictSearch.trim() || p.title.toLowerCase().includes(restrictSearch.trim().toLowerCase()))).map(p => {
            const isRestricted = restrictedIds.includes(p.id);
            return (
              <label key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-border/20 cursor-pointer">
                <input type="checkbox" checked={!isRestricted}
                  onChange={() => setRestrictedIds(ids => ids.includes(p.id) ? ids.filter(i => i !== p.id) : [...ids, p.id])}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.title}</span>
              </label>
            );
          })}
        </div>
      </FormModal>

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
