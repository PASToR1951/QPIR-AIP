import React, { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import { CaretRight, PencilSimple, Trash, Plus, MagnifyingGlass, X } from '@phosphor-icons/react';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { FormModal } from '../components/FormModal.jsx';
import { SearchableSelect } from '../components/SearchableSelect.jsx';
import { MultiSelect } from '../components/MultiSelect.jsx';

const API = import.meta.env.VITE_API_URL;

const LEVELS = ['Elementary', 'Secondary', 'Both'];

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

  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fetchError, setFetchError] = useState(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/api/admin/clusters`, { withCredentials: true }),
      axios.get(`${API}/api/admin/programs`, { withCredentials: true }),
    ]).then(([cr, pr]) => { setClusters(cr.data); setPrograms(pr.data); })
      .catch(e => { console.error(e); setFetchError('Failed to load data. Please refresh and try again.'); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // Cluster CRUD
  const nextClusterNumber = () => Math.max(0, ...clusters.map(c => c.cluster_number)) + 1;

  const handleAddCluster = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      const num = Number(clusterForm.cluster_number);
      // CONSTRAINT: Clusters have no meaningful name — identified by number only. Do not set name to "Cluster N"; that causes redundant display elsewhere.
      await axios.post(`${API}/api/admin/clusters`, { cluster_number: num, name: String(num) }, { withCredentials: true });
      setAddClusterOpen(false); setClusterForm({ cluster_number: '' }); fetchAll();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };
  const handleEditCluster = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      const num = Number(clusterForm.cluster_number);
      await axios.patch(`${API}/api/admin/clusters/${editCluster.id}`, { cluster_number: num, name: String(num) }, { withCredentials: true });
      setEditCluster(null); fetchAll();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
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
      await axios.post(`${API}/api/admin/schools`, schoolForm, { withCredentials: true });
      setAddSchoolOpen(false); setSchoolForm({ name: '', abbreviation: '', level: 'Elementary', cluster_id: null }); fetchAll();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };
  const handleEditSchool = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      await axios.patch(`${API}/api/admin/schools/${editSchool.id}`, { name: schoolForm.name, abbreviation: schoolForm.abbreviation, level: schoolForm.level, cluster_id: schoolForm.cluster_id }, { withCredentials: true });
      setEditSchool(null); fetchAll();
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
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };

  const q = search.trim().toLowerCase();
  const filteredClusters = q
    ? clusters.map(c => ({ ...c, schools: (c.schools || []).filter(s => s.name.toLowerCase().includes(q) || (s.abbreviation || '').toLowerCase().includes(q)) })).filter(c => c.schools.length > 0)
    : clusters;
  const totalMatches = q ? filteredClusters.reduce((n, c) => n + c.schools.length, 0) : null;

  return (
    <>
      <div className="space-y-4">

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-0">
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
          {totalMatches !== null && (
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">{totalMatches} result{totalMatches !== 1 ? 's' : ''}</span>
          )}
          <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => { setAddSchoolOpen(true); setSchoolForm({ name: '', level: 'Elementary', cluster_id: null }); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
            <Plus size={17} /> <span className="hidden sm:inline">Add School</span><span className="sm:hidden">School</span>
          </button>
          <button onClick={() => { setAddClusterOpen(true); setClusterForm({ cluster_number: nextClusterNumber() }); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-border rounded-xl transition-colors">
            <Plus size={17} /> <span className="hidden sm:inline">Add Cluster</span><span className="sm:hidden">Cluster</span>
          </button>
          </div>
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
              return (
                <div key={cl.id} className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden">
                  {/* Cluster header */}
                  <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-border/20 transition-colors" onClick={() => toggleExpand(cl.id)}>
                    <span className="font-black text-slate-900 dark:text-slate-100">Cluster {cl.cluster_number}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">{schoolCount} schools</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{userCount} user{userCount !== 1 ? 's' : ''}</span>
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setEditCluster(cl); setClusterForm({ cluster_number: cl.cluster_number }); }} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"><PencilSimple size={17} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteCluster(cl); }} className={`p-1.5 rounded-lg transition-colors ${schoolCount > 0 ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'}`} disabled={schoolCount > 0} title={schoolCount > 0 ? 'Remove all schools first' : 'Delete cluster'}><Trash size={17} /></button>
                      <CaretRight size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Schools */}
                  <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <div className="border-t border-slate-100 dark:border-dark-border px-5 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {cl.schools?.map(school => (
                        <div key={school.id} className="border border-slate-200 dark:border-dark-border rounded-xl p-4 bg-slate-50 dark:bg-dark-base space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="font-black text-slate-900 dark:text-slate-100 text-sm truncate">{school.name}</p>
                              {school.abbreviation && (
                                <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400">{school.abbreviation}</p>
                              )}
                            </div>
                            <button onClick={() => { setEditSchool(school); setSchoolForm({ name: school.name, abbreviation: school.abbreviation || '', level: school.level, cluster_id: school.cluster_id }); }} className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors shrink-0"><PencilSimple size={16} /></button>
                          </div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{school.level}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-bold ${school.users?.length ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                              {school.users?.length ? `${school.users.length} user${school.users.length !== 1 ? 's' : ''}` : 'No users'}
                            </span>
                            {school.users?.length === 1 && (
                              <span className="text-slate-400 dark:text-slate-500 truncate ml-2">{school.users[0].email}</span>
                            )}
                          </div>
                          {school.restricted_programs?.length > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">{school.restricted_programs.length} restricted programs</p>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            <button onClick={() => { setRestrictSchool(school); setRestrictedIds(school.restricted_programs?.map(p => p.id) ?? []); }} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Manage Restrictions</button>
                            <button onClick={() => setDeleteSchool(school)} className="ml-auto p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"><Trash size={15} /></button>
                          </div>
                        </div>
                      ))}
                      {!cl.schools?.length && (
                        <p className="text-sm text-slate-400 dark:text-slate-600 col-span-full text-center py-4">No schools in this cluster.</p>
                      )}
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setAddClusterOpen(false); setFormError(''); }} />
                <motion.div
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
                </motion.div>
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setEditCluster(null); setFormError(''); }} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 16 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="relative z-10 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                >
                <form onSubmit={e => { e.preventDefault(); if (canSave && !actionLoading) handleEditCluster(); }}>
                  {/* Header strip */}
                  <div className="px-7 pt-7 pb-2 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Edit Cluster</p>
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
                    <button type="button" onClick={() => { setEditCluster(null); setFormError(''); }}
                      className="flex-1 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-base hover:bg-slate-200 dark:hover:bg-dark-border rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={!canSave || actionLoading}
                      className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {actionLoading ? 'Saving…' : 'Save Cluster'}
                    </button>
                  </div>
                  {formError && <p className="text-xs text-red-500 font-bold text-center pb-4">{formError}</p>}
                </form>
                </motion.div>
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
            <input value={schoolForm.abbreviation} onChange={e => setSchoolForm(f => ({ ...f, abbreviation: e.target.value }))} placeholder="e.g. SNES"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Level</label>
            <SearchableSelect options={LEVELS.map(l => ({ value: l, label: l }))} value={schoolForm.level} onChange={v => setSchoolForm(f => ({ ...f, level: v }))} />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Cluster</label>
            <SearchableSelect options={clusters.map(c => ({ value: c.id, label: `Cluster ${c.cluster_number}` }))} value={schoolForm.cluster_id} onChange={v => setSchoolForm(f => ({ ...f, cluster_id: v }))} />
          </div>
          {formError && <p className="text-xs text-red-500 font-bold">{formError}</p>}
        </div>
      </FormModal>

      {/* Edit School */}
      <FormModal open={!!editSchool} title="Edit School" onSave={handleEditSchool} onCancel={() => { setEditSchool(null); setFormError(''); }} loading={actionLoading}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">School Name</label>
            <input value={schoolForm.name} onChange={e => setSchoolForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Abbreviation <span className="font-normal normal-case text-slate-400">(optional)</span></label>
            <input value={schoolForm.abbreviation} onChange={e => setSchoolForm(f => ({ ...f, abbreviation: e.target.value }))} placeholder="e.g. SNES"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Level</label>
            <SearchableSelect options={LEVELS.map(l => ({ value: l, label: l }))} value={schoolForm.level} onChange={v => setSchoolForm(f => ({ ...f, level: v }))} />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Cluster</label>
            <SearchableSelect options={clusters.map(c => ({ value: c.id, label: `Cluster ${c.cluster_number}` }))} value={schoolForm.cluster_id} onChange={v => setSchoolForm(f => ({ ...f, cluster_id: v }))} />
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
    </>
  );
}
