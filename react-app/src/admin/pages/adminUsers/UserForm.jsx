import React from 'react';
import { SearchableSelect } from '../../components/SearchableSelect.jsx';
import { MultiSelect } from '../../components/MultiSelect.jsx';

const inputCls = "w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all";
const selectCls = "w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all";

export const ROLES = ['School', 'Division Personnel', 'CES-SGOD', 'CES-ASDS', 'CES-CID', 'Cluster Coordinator', 'Admin', 'Observer'];
const SALUTATIONS = ['Mr.', 'Ms.', 'Mrs.', 'Dr.'];

export const EMPTY_USER_FORM = {
  id: null, salutation: '', name: '', first_name: '', middle_initial: '',
  last_name: '', position: '', email: '', password: '', role: 'School',
  school_id: null, cluster_id: null, program_ids: [],
};

export function userDisplayName(u) {
  if (!u) return '';
  if ((u.role === 'Division Personnel' || u.role === 'School') && u.first_name && u.last_name) {
    const mi = u.middle_initial ? ` ${u.middle_initial}.` : '';
    return `${u.first_name}${mi} ${u.last_name}`;
  }
  return u.name || (u.role === 'School' ? u.school?.name : null) || u.email || '';
}

export function UserForm({ form, setForm, schools, programs, clusters = [] }) {
  const emailLocal = form.email.replace(/@deped\.gov\.ph$/, '');
  const handleEmailChange = (e) => {
    const val = e.target.value.replace(/@.*$/, '');
    setForm(f => ({ ...f, email: val + '@deped.gov.ph' }));
  };

  return (
    <div className="space-y-4">
      {(['Admin', 'CES-SGOD', 'CES-ASDS', 'CES-CID', 'Cluster Coordinator', 'Observer'].includes(form.role)) && (
        <div className="grid grid-cols-[100px_1fr] gap-3">
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Title</label>
            <select value={form.salutation} onChange={e => setForm(f => ({ ...f, salutation: e.target.value }))} className={selectCls}>
              <option value="">—</option>
              {SALUTATIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Full Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputCls} placeholder={form.role === 'Cluster Coordinator' ? 'Cluster Coordinator Name' : form.role === 'Observer' ? 'Observer Name' : form.role.startsWith('CES') ? `${form.role} Name` : 'Administrator Name'} />
          </div>
        </div>
      )}
      {(form.role === 'Division Personnel' || form.role === 'School') && (
        <>
          {form.role === 'School' && (
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest -mb-1">School Head</p>
          )}
          <div className="grid grid-cols-[100px_1fr_80px] gap-3">
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Title</label>
              <select value={form.salutation} onChange={e => setForm(f => ({ ...f, salutation: e.target.value }))} className={selectCls}>
                <option value="">—</option>
                {SALUTATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">First Name <span className="text-rose-500">*</span></label>
              <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                className={inputCls} placeholder="Juan" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">M.I.</label>
              <input value={form.middle_initial} onChange={e => setForm(f => ({ ...f, middle_initial: e.target.value }))}
                className={inputCls} placeholder="D" maxLength={1} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Surname <span className="text-rose-500">*</span></label>
            <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
              className={inputCls} placeholder="Dela Cruz" />
          </div>
        </>
      )}
      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Position / Designation</label>
        <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
          className={inputCls} placeholder="e.g. Education Program Supervisor I" />
      </div>
      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Email</label>
        <div className="flex items-center border border-slate-200 dark:border-dark-border rounded-xl overflow-hidden bg-white dark:bg-dark-base focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <input
            value={emailLocal}
            onChange={handleEmailChange}
            className="flex-1 min-w-0 px-3 py-2 text-sm bg-transparent text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none"
            placeholder="username"
          />
          <span className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-dark-surface border-l border-slate-200 dark:border-dark-border whitespace-nowrap select-none">
            @deped.gov.ph
          </span>
        </div>
      </div>
      {!form.id && (
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Password</label>
          <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className={inputCls} placeholder="Min. 8 characters" />
        </div>
      )}
      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Role</label>
        <SearchableSelect
          options={ROLES.map(r => ({ value: r, label: r }))}
          value={form.role}
          onChange={v => setForm(f => ({ ...f, role: v, school_id: null, cluster_id: null, program_ids: [] }))}
          placeholder="Select role"
        />
      </div>
      {form.role === 'School' && (
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">School</label>
          <SearchableSelect
            options={schools.map(s => ({ value: s.id, label: s.name }))}
            value={form.school_id}
            onChange={v => setForm(f => ({ ...f, school_id: v }))}
            placeholder="Select school"
          />
        </div>
      )}
      {form.role === 'Cluster Coordinator' && (
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Assigned Cluster <span className="text-rose-500">*</span>
          </label>
          <SearchableSelect
            options={clusters.map(c => ({ value: c.id, label: c.name || `Cluster ${c.cluster_number}` }))}
            value={form.cluster_id}
            onChange={v => setForm(f => ({ ...f, cluster_id: v }))}
            placeholder="Select cluster"
          />
        </div>
      )}
      {(['Division Personnel', 'CES-SGOD', 'CES-ASDS', 'CES-CID'].includes(form.role)) && (
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Assigned Programs</label>
          <MultiSelect
            options={programs.filter(p => p.school_level_requirement === 'Division').map(p => ({ value: p.id, label: p.title }))}
            selected={form.program_ids}
            onChange={v => setForm(f => ({ ...f, program_ids: v }))}
            placeholder="Select programs"
          />
        </div>
      )}
    </div>
  );
}
