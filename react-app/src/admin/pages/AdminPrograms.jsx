import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { PencilSimple, Trash, Plus, ArrowRight, ArrowLeft, Users } from '@phosphor-icons/react';
import { AdminLayout } from '../AdminLayout.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { FormModal } from '../components/FormModal.jsx';
import { SearchableSelect } from '../components/SearchableSelect.jsx';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const LEVELS = ['Elementary', 'Secondary', 'Both', 'Select Schools'];

export default function AdminPrograms() {
  const [programs, setPrograms] = useState([]);
  const [allPersonnel, setAllPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');

  const [programForm, setProgramForm] = useState({ title: '', school_level_requirement: 'Both' });
  const [editProgram, setEditProgram] = useState(null);
  const [deleteProgram, setDeleteProgram] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [personnelProgram, setPersonnelProgram] = useState(null);
  const [assignedIds, setAssignedIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/api/admin/programs`, { headers: authHeaders() }),
      axios.get(`${API}/api/admin/users?role=Division Personnel`, { headers: authHeaders() }),
    ]).then(([pr, ur]) => { setPrograms(pr.data); setAllPersonnel(ur.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAdd = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      await axios.post(`${API}/api/admin/programs`, programForm, { headers: authHeaders() });
      setAddOpen(false); setProgramForm({ title: '', school_level_requirement: 'Both' }); fetchAll();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };

  const handleEdit = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      await axios.patch(`${API}/api/admin/programs/${editProgram.id}`, { title: programForm.title, school_level_requirement: programForm.school_level_requirement }, { headers: authHeaders() });
      setEditProgram(null); fetchAll();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      await axios.delete(`${API}/api/admin/programs/${deleteProgram.id}`, { headers: authHeaders() });
      setDeleteProgram(null); fetchAll();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };

  const handleSavePersonnel = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      await axios.patch(`${API}/api/admin/programs/${personnelProgram.id}/personnel`, { user_ids: assignedIds }, { headers: authHeaders() });
      setPersonnelProgram(null); fetchAll();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };

  const filtered = programs.filter(p =>
    (levelFilter === 'All' || p.school_level_requirement === levelFilter) &&
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const LEVEL_PILLS = ['All', ...LEVELS];

  return (
    <AdminLayout>
      <div className="space-y-4">

        {/* Top Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs…"
            className="flex-1 min-w-40 px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-400" />
          <div className="flex items-center gap-1.5">
            {LEVEL_PILLS.map(l => (
              <button key={l} onClick={() => setLevelFilter(l)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${levelFilter === l ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={() => { setAddOpen(true); setProgramForm({ title: '', school_level_requirement: 'Both' }); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors ml-auto">
            <Plus size={17} /> Add Program
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(prog => (
              <div key={prog.id} className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 dark:text-slate-100 truncate">{prog.title}</h3>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{prog.school_level_requirement}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setEditProgram(prog); setProgramForm({ title: prog.title, school_level_requirement: prog.school_level_requirement }); }} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"><PencilSimple size={16} /></button>
                    <button onClick={() => setDeleteProgram(prog)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"><Trash size={16} /></button>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-dark-border pt-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assigned Personnel</p>
                  {prog.personnel?.length > 0 ? (
                    <div className="space-y-1">
                      {prog.personnel.slice(0, 3).map(p => (
                        <p key={p.id} className="text-xs font-bold text-slate-600 dark:text-slate-400">• {p.name ?? p.email}</p>
                      ))}
                      {prog.personnel.length > 3 && <p className="text-xs text-slate-400">+{prog.personnel.length - 3} more</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-600">No personnel assigned</p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-dark-border pt-3">
                  <span className="text-xs text-slate-400 dark:text-slate-500">{prog._count?.aips ?? 0} AIPs filed</span>
                  <button onClick={() => { setPersonnelProgram(prog); setAssignedIds(prog.personnel?.map(p => p.id) ?? []); }}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    <Users size={15} /> Manage Personnel
                  </button>
                </div>
              </div>
            ))}
            {!filtered.length && (
              <p className="col-span-2 text-center text-slate-400 dark:text-slate-600 py-16">No programs found.</p>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Program */}
      <FormModal open={addOpen || !!editProgram} title={editProgram ? 'Edit Program' : 'Add Program'}
        onSave={editProgram ? handleEdit : handleAdd}
        onCancel={() => { setAddOpen(false); setEditProgram(null); setFormError(''); }} loading={actionLoading}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Program Title</label>
            <input value={programForm.title} onChange={e => setProgramForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">School Level Requirement</label>
            <SearchableSelect options={LEVELS.map(l => ({ value: l, label: l }))} value={programForm.school_level_requirement} onChange={v => setProgramForm(f => ({ ...f, school_level_requirement: v }))} />
          </div>
          {formError && <p className="text-xs text-red-500 font-bold">{formError}</p>}
        </div>
      </FormModal>

      {/* Delete Program */}
      <ConfirmModal open={!!deleteProgram} title="Delete Program" message={`Delete "${deleteProgram?.title}"? Existing AIP submissions referencing this program will remain but orphaned.`}
        variant="danger" confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteProgram(null)} loading={actionLoading} />

      {/* Personnel Assignment */}
      <FormModal open={!!personnelProgram} title={`Assign Personnel — ${personnelProgram?.title}`} onSave={handleSavePersonnel} onCancel={() => { setPersonnelProgram(null); setFormError(''); }} loading={actionLoading} wide saveLabel="Save">
        {formError && <p className="text-xs text-red-500 font-bold mb-3">{formError}</p>}
        <div className="grid grid-cols-2 gap-4 min-h-[240px]">
          {/* Available */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Available</p>
            <div className="space-y-1 border border-slate-200 dark:border-dark-border rounded-xl p-2 max-h-60 overflow-y-auto">
              {allPersonnel.filter(p => !assignedIds.includes(p.id)).map(p => (
                <button key={p.id} onClick={() => setAssignedIds(ids => [...ids, p.id])}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors">
                  <span className="truncate">{p.name ?? p.email}</span>
                  <ArrowRight size={16} weight="bold" className="text-slate-400 shrink-0" />
                </button>
              ))}
              {allPersonnel.filter(p => !assignedIds.includes(p.id)).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">All assigned</p>
              )}
            </div>
          </div>
          {/* Assigned */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assigned</p>
            <div className="space-y-1 border border-indigo-200 dark:border-indigo-800/40 rounded-xl p-2 max-h-60 overflow-y-auto bg-indigo-50/50 dark:bg-indigo-950/10">
              {allPersonnel.filter(p => assignedIds.includes(p.id)).map(p => (
                <button key={p.id} onClick={() => setAssignedIds(ids => ids.filter(i => i !== p.id))}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-indigo-700 dark:text-indigo-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors">
                  <ArrowLeft size={16} weight="bold" className="shrink-0" />
                  <span className="truncate">{p.name ?? p.email}</span>
                </button>
              ))}
              {assignedIds.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">None assigned</p>
              )}
            </div>
          </div>
        </div>
      </FormModal>
    </AdminLayout>
  );
}
