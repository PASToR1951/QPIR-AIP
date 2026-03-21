import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { CaretDown, CaretRight, PencilSimple, Trash, Plus } from '@phosphor-icons/react';
import { AdminLayout } from '../AdminLayout.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { FormModal } from '../components/FormModal.jsx';
import { SearchableSelect } from '../components/SearchableSelect.jsx';
import { MultiSelect } from '../components/MultiSelect.jsx';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const LEVELS = ['Elementary', 'Secondary', 'Both'];

function compliancePct(school, year) {
  if (!school.aips?.length) return 0;
  const yearAips = school.aips.filter(a => a.year === year);
  if (yearAips.length === 0) return 0;
  return 100;
}

export default function AdminSchools() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [year] = useState(new Date().getFullYear());

  // Cluster modals
  const [clusterForm, setClusterForm] = useState({ cluster_number: '', name: '' });
  const [editCluster, setEditCluster] = useState(null);
  const [deleteCluster, setDeleteCluster] = useState(null);
  const [addClusterOpen, setAddClusterOpen] = useState(false);

  // School modals
  const [schoolForm, setSchoolForm] = useState({ name: '', level: 'Elementary', cluster_id: null });
  const [editSchool, setEditSchool] = useState(null);
  const [deleteSchool, setDeleteSchool] = useState(null);
  const [addSchoolOpen, setAddSchoolOpen] = useState(false);
  const [restrictSchool, setRestrictSchool] = useState(null);
  const [restrictedIds, setRestrictedIds] = useState([]);

  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/api/admin/clusters`, { headers: authHeaders() }),
      axios.get(`${API}/api/admin/programs`, { headers: authHeaders() }),
    ]).then(([cr, pr]) => { setClusters(cr.data); setPrograms(pr.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // Cluster CRUD
  const handleAddCluster = async () => {
    setActionLoading(true);
    try {
      await axios.post(`${API}/api/admin/clusters`, { cluster_number: Number(clusterForm.cluster_number), name: clusterForm.name }, { headers: authHeaders() });
      setAddClusterOpen(false); setClusterForm({ cluster_number: '', name: '' }); fetchAll();
    } finally { setActionLoading(false); }
  };
  const handleEditCluster = async () => {
    setActionLoading(true);
    try {
      await axios.patch(`${API}/api/admin/clusters/${editCluster.id}`, { name: clusterForm.name }, { headers: authHeaders() });
      setEditCluster(null); fetchAll();
    } finally { setActionLoading(false); }
  };
  const handleDeleteCluster = async () => {
    setActionLoading(true);
    try {
      await axios.delete(`${API}/api/admin/clusters/${deleteCluster.id}`, { headers: authHeaders() });
      setDeleteCluster(null); fetchAll();
    } finally { setActionLoading(false); }
  };

  // School CRUD
  const handleAddSchool = async () => {
    setActionLoading(true);
    try {
      await axios.post(`${API}/api/admin/schools`, schoolForm, { headers: authHeaders() });
      setAddSchoolOpen(false); setSchoolForm({ name: '', level: 'Elementary', cluster_id: null }); fetchAll();
    } finally { setActionLoading(false); }
  };
  const handleEditSchool = async () => {
    setActionLoading(true);
    try {
      await axios.patch(`${API}/api/admin/schools/${editSchool.id}`, { name: schoolForm.name, level: schoolForm.level, cluster_id: schoolForm.cluster_id }, { headers: authHeaders() });
      setEditSchool(null); fetchAll();
    } finally { setActionLoading(false); }
  };
  const handleDeleteSchool = async () => {
    setActionLoading(true);
    try {
      await axios.delete(`${API}/api/admin/schools/${deleteSchool.id}`, { headers: authHeaders() });
      setDeleteSchool(null); fetchAll();
    } finally { setActionLoading(false); }
  };
  const handleSaveRestrictions = async () => {
    setActionLoading(true);
    try {
      await axios.patch(`${API}/api/admin/schools/${restrictSchool.id}/restrictions`, { restricted_program_ids: restrictedIds }, { headers: authHeaders() });
      setRestrictSchool(null); fetchAll();
    } finally { setActionLoading(false); }
  };

  const allSchools = clusters.flatMap(c => c.schools || []);

  return (
    <AdminLayout title="Schools" breadcrumbs={[{ label: 'Schools' }]}>
      <div className="space-y-4">

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end">
          <button onClick={() => { setAddSchoolOpen(true); setSchoolForm({ name: '', level: 'Elementary', cluster_id: null }); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
            <Plus size={15} /> Add School
          </button>
          <button onClick={() => { setAddClusterOpen(true); setClusterForm({ cluster_number: '', name: '' }); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-border rounded-xl transition-colors">
            <Plus size={15} /> Add Cluster
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {clusters.map(cl => {
              const isOpen = !!expanded[cl.id];
              const schoolCount = cl.schools?.length ?? 0;
              const compliantCount = cl.schools?.filter(s => s.aips?.some(a => a.year === year)).length ?? 0;
              return (
                <div key={cl.id} className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden">
                  {/* Cluster header */}
                  <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-border/20 transition-colors" onClick={() => toggleExpand(cl.id)}>
                    <span className="text-xs font-black bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-lg">Cluster {cl.cluster_number}</span>
                    <span className="font-black text-slate-900 dark:text-slate-100">{cl.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">{schoolCount} schools</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">AIP: {compliantCount}/{schoolCount}</span>
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setEditCluster(cl); setClusterForm({ cluster_number: cl.cluster_number, name: cl.name }); }} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"><PencilSimple size={15} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteCluster(cl); }} className={`p-1.5 rounded-lg transition-colors ${schoolCount > 0 ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'}`} disabled={schoolCount > 0} title={schoolCount > 0 ? 'Remove all schools first' : 'Delete cluster'}><Trash size={15} /></button>
                      {isOpen ? <CaretDown size={16} className="text-slate-400" /> : <CaretRight size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  {/* Schools */}
                  {isOpen && (
                    <div className="border-t border-slate-100 dark:border-dark-border px-5 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {cl.schools?.map(school => (
                        <div key={school.id} className="border border-slate-200 dark:border-dark-border rounded-xl p-4 bg-slate-50 dark:bg-dark-base space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-black text-slate-900 dark:text-slate-100 text-sm truncate">{school.name}</p>
                            <button onClick={() => { setEditSchool(school); setSchoolForm({ name: school.name, level: school.level, cluster_id: school.cluster_id }); }} className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors shrink-0"><PencilSimple size={14} /></button>
                          </div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{school.level}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-bold ${school.aips?.some(a => a.year === year) ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                              AIP {school.aips?.some(a => a.year === year) ? '✓' : '✗'}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500">{school.user?.email ?? 'No user'}</span>
                          </div>
                          {school.restricted_programs?.length > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">{school.restricted_programs.length} restricted programs</p>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            <button onClick={() => { setRestrictSchool(school); setRestrictedIds(school.restricted_programs?.map(p => p.id) ?? []); }} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Manage Restrictions</button>
                            <button onClick={() => setDeleteSchool(school)} className="ml-auto text-xs font-bold text-rose-500 hover:underline">Delete</button>
                          </div>
                        </div>
                      ))}
                      {!cl.schools?.length && (
                        <p className="text-sm text-slate-400 dark:text-slate-600 col-span-full text-center py-4">No schools in this cluster.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {!clusters.length && (
              <p className="text-center text-slate-400 dark:text-slate-600 py-16">No clusters yet. Add one to get started.</p>
            )}
          </div>
        )}
      </div>

      {/* Add Cluster */}
      <FormModal open={addClusterOpen} title="Add Cluster" onSave={handleAddCluster} onCancel={() => setAddClusterOpen(false)} loading={actionLoading}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Cluster Number</label>
            <input type="number" value={clusterForm.cluster_number} onChange={e => setClusterForm(f => ({ ...f, cluster_number: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Cluster Name</label>
            <input value={clusterForm.name} onChange={e => setClusterForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400" />
          </div>
        </div>
      </FormModal>

      {/* Edit Cluster */}
      <FormModal open={!!editCluster} title="Edit Cluster" onSave={handleEditCluster} onCancel={() => setEditCluster(null)} loading={actionLoading}>
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Cluster Name</label>
          <input value={clusterForm.name} onChange={e => setClusterForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400" />
        </div>
      </FormModal>

      {/* Delete Cluster */}
      <ConfirmModal open={!!deleteCluster} title="Delete Cluster" message={`Delete cluster "${deleteCluster?.name}"? This cannot be undone.`}
        variant="danger" confirmLabel="Delete" onConfirm={handleDeleteCluster} onCancel={() => setDeleteCluster(null)} loading={actionLoading} />

      {/* Add School */}
      <FormModal open={addSchoolOpen} title="Add School" onSave={handleAddSchool} onCancel={() => setAddSchoolOpen(false)} loading={actionLoading}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">School Name</label>
            <input value={schoolForm.name} onChange={e => setSchoolForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Level</label>
            <SearchableSelect options={LEVELS.map(l => ({ value: l, label: l }))} value={schoolForm.level} onChange={v => setSchoolForm(f => ({ ...f, level: v }))} />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Cluster</label>
            <SearchableSelect options={clusters.map(c => ({ value: c.id, label: `Cluster ${c.cluster_number}: ${c.name}` }))} value={schoolForm.cluster_id} onChange={v => setSchoolForm(f => ({ ...f, cluster_id: v }))} />
          </div>
        </div>
      </FormModal>

      {/* Edit School */}
      <FormModal open={!!editSchool} title="Edit School" onSave={handleEditSchool} onCancel={() => setEditSchool(null)} loading={actionLoading}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">School Name</label>
            <input value={schoolForm.name} onChange={e => setSchoolForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Level</label>
            <SearchableSelect options={LEVELS.map(l => ({ value: l, label: l }))} value={schoolForm.level} onChange={v => setSchoolForm(f => ({ ...f, level: v }))} />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Cluster</label>
            <SearchableSelect options={clusters.map(c => ({ value: c.id, label: `Cluster ${c.cluster_number}: ${c.name}` }))} value={schoolForm.cluster_id} onChange={v => setSchoolForm(f => ({ ...f, cluster_id: v }))} />
          </div>
        </div>
      </FormModal>

      {/* Delete School */}
      <ConfirmModal open={!!deleteSchool} title="Delete School" message={`Delete "${deleteSchool?.name}"? All associated submissions will also be removed.`}
        variant="danger" confirmLabel="Delete" onConfirm={handleDeleteSchool} onCancel={() => setDeleteSchool(null)} loading={actionLoading} />

      {/* Program Restrictions */}
      <FormModal open={!!restrictSchool} title={`Program Restrictions — ${restrictSchool?.name}`} onSave={handleSaveRestrictions} onCancel={() => setRestrictSchool(null)} loading={actionLoading} saveLabel="Save Restrictions">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          <strong>Checked</strong> = program is available to this school. <strong>Unchecked</strong> = restricted.
        </p>
        <div className="space-y-2">
          {programs.map(p => {
            const isRestricted = restrictedIds.includes(p.id);
            return (
              <label key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-border/20 cursor-pointer">
                <input type="checkbox" checked={!isRestricted}
                  onChange={() => setRestrictedIds(ids => ids.includes(p.id) ? ids.filter(i => i !== p.id) : [...ids, p.id])}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.title}</span>
                <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{p.school_level_requirement}</span>
              </label>
            );
          })}
        </div>
      </FormModal>
    </AdminLayout>
  );
}
