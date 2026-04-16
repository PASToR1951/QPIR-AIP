import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, MagnifyingGlass, Plus, X } from '@phosphor-icons/react';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { FormModal } from '../components/FormModal.jsx';
import { SearchableSelect } from '../components/SearchableSelect.jsx';
import { useSchoolsData } from './adminSchools/useSchoolsData.js';
import { ClusterCard } from './adminSchools/ClusterCard.jsx';
import { ClusterNumberModal } from './adminSchools/ClusterNumberModal.jsx';
import { SchoolFormFields, SchoolLogoField, SchoolHeadFields } from './adminSchools/SchoolFormFields.jsx';

const MotionDiv = motion.div;

export default function AdminSchools() {
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [clusterForm, setClusterForm] = useState({ cluster_number: '' });
  const [addClusterOpen, setAddClusterOpen] = useState(false);
  const [editClusterTarget, setEditClusterTarget] = useState(null);
  const [deleteCluster, setDeleteCluster] = useState(null);

  const [schoolForm, setSchoolForm] = useState({ name: '', abbreviation: '', level: 'Elementary', cluster_id: null });
  const [schoolHeadForm, setSchoolHeadForm] = useState({ salutation: '', first_name: '', middle_initial: '', last_name: '', position: '' });
  const [editSchool, setEditSchool] = useState(null);
  const [deleteSchool, setDeleteSchool] = useState(null);
  const [addSchoolOpen, setAddSchoolOpen] = useState(false);
  const [restrictSchool, setRestrictSchool] = useState(null);
  const [restrictedIds, setRestrictedIds] = useState([]);
  const [restrictSearch, setRestrictSearch] = useState('');

  const [headAssignCluster, setHeadAssignCluster] = useState(null);
  const [headAssignUserId, setHeadAssignUserId] = useState(null);
  const [headAssignLoading, setHeadAssignLoading] = useState(false);

  const [highlightedSchoolId, setHighlightedSchoolId] = useState(null);
  const [highlightedClusterId, setHighlightedClusterId] = useState(null);
  const [activeLogoSchoolId, setActiveLogoSchoolId] = useState(null);
  const schoolRefs = useRef({});
  const clusterRefs = useRef({});

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const {
    clusters, programs, loading, fetchError, actionLoading, logoUploading, formError, setFormError,
    addCluster, editCluster, deleteCluster: doDeleteCluster, uploadClusterLogo, removeClusterLogo, assignClusterHead,
    addSchool, editSchool: doEditSchool, deleteSchool: doDeleteSchool, saveRestrictions, uploadSchoolLogo, removeSchoolLogo,
  } = useSchoolsData();

  useEffect(() => {
    if (!highlightedSchoolId) return;
    const el = schoolRefs.current[highlightedSchoolId];
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); const t = setTimeout(() => setHighlightedSchoolId(null), 1800); return () => clearTimeout(t); }
  }, [highlightedSchoolId, clusters]);

  useEffect(() => {
    if (!highlightedClusterId) return;
    const el = clusterRefs.current[highlightedClusterId];
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); const t = setTimeout(() => setHighlightedClusterId(null), 1800); return () => clearTimeout(t); }
  }, [highlightedClusterId, clusters]);

  const getClusterIdFromForm = () => {
    const id = Number(schoolForm.cluster_id);
    return Number.isInteger(id) && clusters.some(c => c.id === id) ? id : null;
  };

  const q = search.trim().toLowerCase();
  const filteredClusters = q
    ? clusters.map(c => ({ ...c, schools: (c.schools || []).filter(s => s.name.toLowerCase().includes(q) || (s.abbreviation || '').toLowerCase().includes(q)) })).filter(c => c.schools.length > 0)
    : clusters;
  const totalMatches = q ? filteredClusters.reduce((n, c) => n + c.schools.length, 0) : null;
  const mobileSearchActive = searchOpen || !!search;
  const editSchoolCluster = clusters.find(c => c.id === Number(schoolForm.cluster_id)) ?? null;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative hidden sm:block flex-1 min-w-0">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search schools..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"><X size={14} /></button>}
          </div>
          <button type="button" onClick={() => { if (mobileSearchActive) { setSearch(''); setSearchOpen(false); } else setSearchOpen(true); }}
            className={`sm:hidden flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${mobileSearchActive ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 text-indigo-600' : 'bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border text-slate-500 hover:text-indigo-600'}`}>
            <MagnifyingGlass size={17} weight={mobileSearchActive ? 'bold' : 'regular'} />
          </button>
          {totalMatches !== null && <span className="hidden sm:inline text-xs font-bold text-slate-400 whitespace-nowrap">{totalMatches} result{totalMatches !== 1 ? 's' : ''}</span>}
          <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
            <button onClick={() => { setAddSchoolOpen(true); setSchoolForm({ name: '', abbreviation: '', level: 'Elementary', cluster_id: null }); setFormError(''); }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
              <Plus size={17} /><span className="hidden sm:inline">Add School</span><span className="sm:hidden">School</span>
            </button>
            <button onClick={() => { setAddClusterOpen(true); setClusterForm({ cluster_number: Math.max(0, ...clusters.map(c => c.cluster_number)) + 1 }); setFormError(''); }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-border rounded-xl transition-colors">
              <Plus size={17} /><span className="hidden sm:inline">Add Cluster</span><span className="sm:hidden">Cluster</span>
            </button>
          </div>
          <AnimatePresence initial={false}>
            {mobileSearchActive && (
              <MotionDiv key="mobile-school-search" initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -6, height: 0 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="relative sm:hidden w-full overflow-hidden">
                <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search schools..." autoFocus
                  className="w-full pl-9 pr-9 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400" />
                {search && <button type="button" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"><X size={14} /></button>}
              </MotionDiv>
            )}
          </AnimatePresence>
          {totalMatches !== null && <span className="sm:hidden w-full text-xs font-bold text-slate-400">{totalMatches} result{totalMatches !== 1 ? 's' : ''}</span>}
        </div>

        {fetchError && <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 text-sm font-medium">{fetchError}</div>}

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {filteredClusters.map(cl => (
              <ClusterCard key={cl.id} cluster={cl}
                isOpen={q ? true : !!expanded[cl.id]}
                isHighlighted={highlightedClusterId === cl.id}
                clusterRef={el => { clusterRefs.current[cl.id] = el; }}
                schoolRefs={schoolRefs}
                onToggle={() => setExpanded(e => ({ ...e, [cl.id]: !e[cl.id] }))}
                onEdit={(c) => { setEditClusterTarget(c); setClusterForm({ cluster_number: c.cluster_number }); setFormError(''); }}
                onDeleteCluster={(c) => setDeleteCluster(c)}
                onEditSchool={(school) => { setEditSchool(school); setSchoolForm({ name: school.name, abbreviation: school.abbreviation || '', level: school.level, cluster_id: school.cluster_id }); const u = school.users?.[0]; setSchoolHeadForm({ salutation: u?.salutation || '', first_name: u?.first_name || '', middle_initial: u?.middle_initial || '', last_name: u?.last_name || '', position: u?.position || '' }); setFormError(''); }}
                onDeleteSchool={(school) => setDeleteSchool(school)}
                onRestrictSchool={(school) => { setRestrictSchool(school); setRestrictedIds(school.restricted_programs?.map(p => p.id) ?? []); setRestrictSearch(''); }}
                highlightedSchoolId={highlightedSchoolId}
                activeLogoSchoolId={activeLogoSchoolId}
                onSchoolHover={(id) => setActiveLogoSchoolId(id)}
                onSchoolHoverEnd={() => setActiveLogoSchoolId(null)}
                onSchoolFocus={(id) => setActiveLogoSchoolId(id)}
                onSchoolBlur={e => { if (!e.currentTarget?.contains(e.relatedTarget)) setActiveLogoSchoolId(null); }}
                onAssignHead={(c) => { setHeadAssignCluster(c); setHeadAssignUserId(c.cluster_head?.id ?? null); }}
                searchQuery={q}
              />
            ))}
            {!clusters.length && <p className="text-center text-slate-400 dark:text-slate-600 py-16">No clusters yet. Add one to get started.</p>}
          </div>
        )}
      </div>

      <ClusterNumberModal mode="add" open={addClusterOpen}
        onClose={() => { setAddClusterOpen(false); setFormError(''); }}
        clusters={clusters} clusterForm={clusterForm} setClusterForm={setClusterForm}
        onSave={async () => { const r = await addCluster(clusterForm); if (r.ok) { setAddClusterOpen(false); setHighlightedClusterId(r.id); } }}
        actionLoading={actionLoading} logoUploading={false} formError={formError} />

      <ClusterNumberModal mode="edit" open={!!editClusterTarget}
        onClose={() => { setEditClusterTarget(null); setFormError(''); }}
        clusters={clusters} clusterForm={clusterForm} setClusterForm={setClusterForm} editCluster={editClusterTarget}
        onSave={async () => {
          if (clusterForm._pendingLogoFile) { const r = await uploadClusterLogo(editClusterTarget.id, clusterForm._pendingLogoFile, () => {}); if (!r.ok) { showToast(r.message, 'error'); return; } }
          if (clusterForm._removeLogo) { const r = await removeClusterLogo(editClusterTarget.id, () => {}); if (!r.ok) { showToast(r.message, 'error'); return; } }
          const r = await editCluster(editClusterTarget.id, clusterForm);
          if (r.ok) { setEditClusterTarget(null); setHighlightedClusterId(editClusterTarget.id); }
        }}
        actionLoading={actionLoading} logoUploading={logoUploading} formError={formError} />

      <ConfirmModal open={!!deleteCluster} title="Delete Cluster" message={`Delete Cluster ${deleteCluster?.cluster_number}? This cannot be undone.`}
        variant="danger" confirmLabel="Delete"
        onConfirm={async () => { const r = await doDeleteCluster(deleteCluster.id); if (r.ok) setDeleteCluster(null); }}
        onCancel={() => setDeleteCluster(null)} loading={actionLoading} />

      <FormModal open={addSchoolOpen} title="Add School"
        onSave={async () => { const clusterId = getClusterIdFromForm(); if (!clusterId) { setFormError('Please select a cluster.'); return; } const r = await addSchool(schoolForm, clusterId); if (r.ok) { setAddSchoolOpen(false); setExpanded(e => ({ ...e, [clusterId]: true })); setHighlightedSchoolId(r.id); showToast('School added successfully.'); } }}
        onCancel={() => { setAddSchoolOpen(false); setFormError(''); }} loading={actionLoading}>
        <div className="space-y-4">
          <SchoolFormFields schoolForm={schoolForm} setSchoolForm={setSchoolForm} clusters={clusters} />
          {formError && <p className="text-xs text-red-500 font-bold">{formError}</p>}
        </div>
      </FormModal>

      <FormModal open={!!editSchool} title="Edit School"
        onSave={async () => { const clusterId = getClusterIdFromForm(); if (!clusterId) { setFormError('Please select a cluster.'); return; } const r = await doEditSchool(editSchool.id, schoolForm, clusterId, editSchool.users?.[0], schoolHeadForm); if (r.ok) { setEditSchool(null); setExpanded(e => ({ ...e, [clusterId]: true })); setHighlightedSchoolId(editSchool.id); showToast('School updated.'); } }}
        onCancel={() => { setEditSchool(null); setFormError(''); }}
        loading={actionLoading} saveDisabled={logoUploading}>
        <div className="space-y-4">
          <SchoolLogoField editSchool={editSchool} editSchoolClusterNumber={editSchoolCluster?.cluster_number ?? null} editSchoolCluster={editSchoolCluster}
            logoUploading={logoUploading}
            onUpload={(file, input) => uploadSchoolLogo(editSchool.id, file, logo => setEditSchool(s => s ? ({ ...s, logo }) : s)).then(r => { if (!r.ok) showToast(r.message, 'error'); else showToast('Logo uploaded.'); input.value = ''; })}
            onRemove={() => removeSchoolLogo(editSchool.id, () => setEditSchool(s => s ? ({ ...s, logo: null }) : s)).then(r => { if (!r.ok) showToast(r.message, 'error'); else showToast('Logo removed.'); })} />
          <SchoolFormFields schoolForm={schoolForm} setSchoolForm={setSchoolForm} clusters={clusters} />
          {editSchool?.users?.length > 0 && <SchoolHeadFields schoolHeadForm={schoolHeadForm} setSchoolHeadForm={setSchoolHeadForm} />}
          {formError && <p className="text-xs text-red-500 font-bold">{formError}</p>}
        </div>
      </FormModal>

      <ConfirmModal open={!!deleteSchool} title="Delete School" message={`Delete "${deleteSchool?.name}"? All associated submissions will also be removed.`}
        variant="danger" confirmLabel="Delete"
        onConfirm={async () => { const r = await doDeleteSchool(deleteSchool.id); if (r.ok) { setDeleteSchool(null); showToast('School deleted.'); } }}
        onCancel={() => setDeleteSchool(null)} loading={actionLoading} />

      <FormModal open={!!restrictSchool} title={`Program Restrictions — ${restrictSchool?.name}`}
        onSave={async () => { const r = await saveRestrictions(restrictSchool.id, restrictedIds); if (r.ok) { setRestrictSchool(null); showToast('Restrictions saved.'); } }}
        onCancel={() => { setRestrictSchool(null); setFormError(''); setRestrictSearch(''); }} loading={actionLoading} saveLabel="Save Restrictions">
        {formError && <p className="text-xs text-red-500 font-bold mb-3">{formError}</p>}
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3"><strong>Checked</strong> = available. <strong>Unchecked</strong> = restricted.</p>
        <div className="relative mb-3">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input value={restrictSearch} onChange={e => setRestrictSearch(e.target.value)} placeholder="Search programs..."
            className="w-full pl-8 pr-8 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400" />
          {restrictSearch && <button onClick={() => setRestrictSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"><X size={13} /></button>}
        </div>
        <div className="space-y-2">
          {programs.filter(p => {
            if (p.school_level_requirement === 'Division') return false;
            const schoolLevel = restrictSchool?.level;
            if (schoolLevel === 'Elementary' && p.school_level_requirement === 'Secondary') return false;
            if (schoolLevel === 'Secondary' && p.school_level_requirement === 'Elementary') return false;
            return !restrictSearch.trim() || p.title.toLowerCase().includes(restrictSearch.trim().toLowerCase());
          }).map(p => (
            <label key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-border/20 cursor-pointer">
              <input type="checkbox" checked={!restrictedIds.includes(p.id)}
                onChange={() => setRestrictedIds(ids => ids.includes(p.id) ? ids.filter(i => i !== p.id) : [...ids, p.id])}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.title}</span>
            </label>
          ))}
        </div>
      </FormModal>

      <FormModal open={!!headAssignCluster} title={`Assign Cluster Head — Cluster ${headAssignCluster?.cluster_number ?? ''}`}
        onSave={async () => { setHeadAssignLoading(true); const r = await assignClusterHead(headAssignCluster.id, headAssignUserId); setHeadAssignLoading(false); if (r.ok) { showToast(headAssignUserId ? 'Cluster head assigned.' : 'Cluster head unassigned.'); setHeadAssignCluster(null); } else showToast(r.message, 'error'); }}
        onCancel={() => { setHeadAssignCluster(null); setHeadAssignUserId(null); }} loading={headAssignLoading} saveLabel="Save">
        {headAssignCluster?.coordinator_users?.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">Select a Cluster Coordinator to designate as head of this cluster.</p>
            <SearchableSelect options={[{ value: null, label: '— Unassign —' }, ...headAssignCluster.coordinator_users.map(u => ({ value: u.id, label: u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') }))]}
              value={headAssignUserId} onChange={v => setHeadAssignUserId(v === null || v === '' ? null : Number(v))} />
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">No coordinators in this cluster.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Assign a Cluster Coordinator in the Users tab first.</p>
          </div>
        )}
      </FormModal>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-bold ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'}`}>
          <CheckCircle size={18} weight="fill" className={toast.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} />
          {toast.msg}
        </div>
      )}
    </>
  );
}
