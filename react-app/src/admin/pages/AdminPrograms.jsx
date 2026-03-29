import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { PencilSimple, Trash, Plus, ArrowRight, ArrowLeft, Users, CheckCircle, X } from '@phosphor-icons/react';
import { AdminLayout } from '../AdminLayout.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { FormModal } from '../components/FormModal.jsx';
import { SearchableSelect } from '../components/SearchableSelect.jsx';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const LEVELS = ['Elementary', 'Secondary', 'Both', 'Select Schools', 'Division'];
const KRA_CATEGORIES = ['ACCESS', 'EQUITY', 'QUALITY', 'WELL-BEING & RESILIENCY', 'GOVERNANCE'];
const DIVISIONS = ['SGOD', 'OSDS', 'CID'];
const LEVEL_LABELS = {
  'Elementary': 'Elementary',
  'Secondary': 'Secondary',
  'Both': 'Elementary & Secondary',
  'Select Schools': 'Selected Schools',
  'Division': 'Division',
};

const personnelDisplayName = (p) => {
  if (!p) return '';
  if (p.first_name && p.last_name) {
    const mi = p.middle_initial ? ` ${p.middle_initial}.` : '';
    return `${p.first_name}${mi} ${p.last_name}`;
  }
  return p.name || p.email || '';
};

export default function AdminPrograms() {
  const [programs, setPrograms] = useState([]);
  const [allPersonnel, setAllPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');

  const [programForm, setProgramForm] = useState({ title: '', abbreviation: '', category: '', division: '', school_level_requirement: 'Both' });
  const [editProgram, setEditProgram] = useState(null);
  const [deleteProgram, setDeleteProgram] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [personnelProgram, setPersonnelProgram] = useState(null);
  const [assignedIds, setAssignedIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/api/admin/programs`, { headers: authHeaders() }),
      axios.get(`${API}/api/admin/users?role=Division Personnel&status=active`, { headers: authHeaders() }),
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
      setAddOpen(false); setProgramForm({ title: '', abbreviation: '', category: '', division: '', school_level_requirement: 'Both' }); fetchAll(); showToast('Program added successfully.');
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };

  const handleEdit = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      await axios.patch(`${API}/api/admin/programs/${editProgram.id}`, { title: programForm.title, abbreviation: programForm.abbreviation, category: programForm.category, division: programForm.division || null, school_level_requirement: programForm.school_level_requirement }, { headers: authHeaders() });
      setEditProgram(null); fetchAll(); showToast('Program updated successfully.');
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      await axios.delete(`${API}/api/admin/programs/${deleteProgram.id}`, { headers: authHeaders() });
      setDeleteProgram(null); fetchAll(); showToast('Program deleted.');
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };

  const handleSavePersonnel = async () => {
    setActionLoading(true);
    try {
      setFormError('');
      await axios.patch(`${API}/api/admin/programs/${personnelProgram.id}/personnel`, { user_ids: assignedIds }, { headers: authHeaders() });
      setPersonnelProgram(null); fetchAll(); showToast('Personnel updated.');
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally { setActionLoading(false); }
  };

  const filtered = programs.filter(p =>
    (levelFilter === 'All' || p.school_level_requirement === levelFilter) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.abbreviation && p.abbreviation.toLowerCase().includes(search.toLowerCase())))
  );

  const LEVEL_PILLS = ['All', ...LEVELS];

  return (
    <AdminLayout>
      <div className="space-y-4">

        {/* Top Bar */}
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
            <button onClick={() => { setAddOpen(true); setProgramForm({ title: '', abbreviation: '', category: '', division: '', school_level_requirement: 'Both' }); }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shrink-0">
              <Plus size={17} /> <span className="hidden sm:inline">Add Program</span><span className="sm:hidden">Add</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {LEVEL_PILLS.map(l => {
              const count = l === 'All' ? programs.length : programs.filter(p => p.school_level_requirement === l).length;
              return (
                <button key={l} onClick={() => setLevelFilter(l)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${levelFilter === l ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}>
                  {l === 'All' ? 'All' : (LEVEL_LABELS[l] ?? l)}
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${levelFilter === l ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-dark-base text-slate-500 dark:text-slate-400'}`}>{count}</span>
                </button>
              );
            })}
          </div>
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
                    <h3 className="font-black text-slate-900 dark:text-slate-100 truncate">
                      {prog.title}{prog.abbreviation && <span className="font-normal text-slate-400 dark:text-slate-500"> ({prog.abbreviation})</span>}
                    </h3>
                      <span className="block text-xs font-bold text-slate-400 dark:text-slate-500">{LEVEL_LABELS[prog.school_level_requirement] ?? prog.school_level_requirement}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {prog.category && <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wide rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">{prog.category}</span>}
                        {prog.division && <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wide rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400">{prog.division}</span>}
                      </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setEditProgram(prog); setProgramForm({ title: prog.title, abbreviation: prog.abbreviation ?? '', category: prog.category ?? '', division: prog.division ?? '', school_level_requirement: prog.school_level_requirement }); }} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"><PencilSimple size={16} /></button>
                    <button onClick={() => setDeleteProgram(prog)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"><Trash size={16} /></button>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-dark-border pt-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assigned Personnel</p>
                  {prog.personnel?.length > 0 ? (
                    <div className="space-y-1">
                      {prog.personnel.slice(0, 3).map(p => (
                        <p key={p.id} className="text-xs font-bold text-slate-600 dark:text-slate-400">• {personnelDisplayName(p)}</p>
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
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Abbreviation <span className="font-normal normal-case text-slate-400">(optional)</span></label>
            <input value={programForm.abbreviation} onChange={e => setProgramForm(f => ({ ...f, abbreviation: e.target.value }))}
              placeholder="e.g. SPED"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">KRA Category <span className="font-normal normal-case text-slate-400">(optional)</span></label>
            <SearchableSelect options={[{ value: '', label: 'None' }, ...KRA_CATEGORIES.map(c => ({ value: c, label: c }))]} value={programForm.category} onChange={v => setProgramForm(f => ({ ...f, category: v }))} />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Division <span className="font-normal normal-case text-slate-400">(for CES routing)</span></label>
            <SearchableSelect options={[{ value: '', label: 'None' }, ...DIVISIONS.map(d => ({ value: d, label: d }))]} value={programForm.division} onChange={v => setProgramForm(f => ({ ...f, division: v }))} />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">Applicability</label>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1.5">determines which schools or users can see and file this program</p>
            <SearchableSelect options={LEVELS.map(l => ({ value: l, label: LEVEL_LABELS[l] ?? l }))} value={programForm.school_level_requirement} onChange={v => setProgramForm(f => ({ ...f, school_level_requirement: v }))} />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[240px]">
          {/* Available */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Available</p>
            <div className="space-y-1 border border-slate-200 dark:border-dark-border rounded-xl p-2 max-h-60 overflow-y-auto">
              {allPersonnel.filter(p => !assignedIds.includes(p.id)).map(p => (
                <button key={p.id} onClick={() => setAssignedIds(ids => [...ids, p.id])}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors">
                  <span className="truncate">{personnelDisplayName(p)}</span>
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
                  <span className="truncate">{personnelDisplayName(p)}</span>
                </button>
              ))}
              {assignedIds.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">None assigned</p>
              )}
            </div>
          </div>
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
    </AdminLayout>
  );
}
