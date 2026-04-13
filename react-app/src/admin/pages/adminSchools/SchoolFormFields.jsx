import React from 'react';
import { SearchableSelect } from '../../components/SearchableSelect.jsx';
import { SchoolAvatar } from '../../../components/ui/SchoolAvatar.jsx';

const inputCls = "w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400";

const LEVELS = ['Elementary', 'Secondary'];

export function SchoolFormFields({ schoolForm, setSchoolForm, clusters }) {
  return (
    <>
      <div><label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">School Name</label>
        <input value={schoolForm.name} onChange={e => setSchoolForm(f => ({ ...f, name: e.target.value }))} className={inputCls} /></div>
      <div><label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Abbreviation <span className="font-normal normal-case text-slate-400">(optional)</span></label>
        <input value={schoolForm.abbreviation} onChange={e => setSchoolForm(f => ({ ...f, abbreviation: e.target.value }))} placeholder="e.g. GNAS" className={inputCls} /></div>
      <div><label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Level</label>
        <SearchableSelect options={LEVELS.map(l => ({ value: l, label: l }))} value={schoolForm.level} onChange={v => setSchoolForm(f => ({ ...f, level: v }))} /></div>
      <div><label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Cluster</label>
        <SearchableSelect options={clusters.map(c => ({ value: c.id, label: `Cluster ${c.cluster_number}` }))} value={schoolForm.cluster_id} onChange={v => setSchoolForm(f => ({ ...f, cluster_id: Number(v) }))} /></div>
    </>
  );
}

export function SchoolLogoField({ editSchool, editSchoolClusterNumber, editSchoolCluster, logoUploading, onUpload, onRemove }) {
  return (
    <div>
      <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">School Logo</label>
      <div className="flex items-center gap-4">
        <SchoolAvatar clusterNumber={editSchoolClusterNumber} schoolLogo={editSchool?.logo ?? null} clusterLogo={editSchoolCluster?.logo ?? null} name={editSchool?.name ?? ''} size={56} rounded="rounded-full" className="shrink-0" />
        <div className="flex flex-col gap-2">
          <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors">
            {logoUploading ? 'Uploading...' : 'Upload Logo'}
            <input type="file" accept="image/webp,image/png,image/jpeg,image/gif" className="hidden" disabled={logoUploading} onChange={e => { const f = e.currentTarget.files?.[0]; if (f) onUpload(f, e.currentTarget); }} />
          </label>
          {editSchool?.logo && (
            <button type="button" disabled={logoUploading} onClick={onRemove} className="text-left text-xs font-bold text-rose-500 hover:underline disabled:opacity-50">
              Remove and use cluster default
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">Max 2 MB - WebP, PNG, JPEG, or GIF</p>
    </div>
  );
}

export function SchoolHeadFields({ schoolHeadForm, setSchoolHeadForm }) {
  return (
    <div className="pt-2">
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">School Head</p>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Title &amp; Name</label>
          <div className="grid grid-cols-[100px_1fr_80px] gap-2">
            <select value={schoolHeadForm.salutation} onChange={e => setSchoolHeadForm(f => ({ ...f, salutation: e.target.value }))}
              className="px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400">
              <option value="">Title</option>
              {['Mr.', 'Ms.', 'Mrs.', 'Dr.'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="First name" value={schoolHeadForm.first_name} onChange={e => setSchoolHeadForm(f => ({ ...f, first_name: e.target.value }))}
              className="px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400" />
            <input placeholder="M.I." value={schoolHeadForm.middle_initial} onChange={e => setSchoolHeadForm(f => ({ ...f, middle_initial: e.target.value }))} maxLength={2}
              className="px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400" />
          </div>
          <div className="mt-2">
            <input placeholder="Last name" value={schoolHeadForm.last_name} onChange={e => setSchoolHeadForm(f => ({ ...f, last_name: e.target.value }))}
              className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Position / Designation</label>
          <input placeholder="e.g. School Principal I" value={schoolHeadForm.position} onChange={e => setSchoolHeadForm(f => ({ ...f, position: e.target.value }))} className={inputCls} />
        </div>
      </div>
    </div>
  );
}
