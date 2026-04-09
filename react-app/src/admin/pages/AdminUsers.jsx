import React, { useEffect, useState, useCallback, useRef } from 'react';
import { PencilSimple, Key, LockKey, LockKeyOpen, Trash, Plus, MagnifyingGlass, Copy, Check, XCircle, CheckCircle, UploadSimple } from '@phosphor-icons/react';
import api from '../../lib/api.js';
import { DataTable } from '../components/DataTable.jsx';
import { withResponsiveHide } from '../components/dataTableColumns.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { FormModal } from '../components/FormModal.jsx';
import { SearchableSelect } from '../components/SearchableSelect.jsx';
import { MultiSelect } from '../components/MultiSelect.jsx';
import { CreateUserWizard } from '../components/CreateUserWizard.jsx';
import { ImportUsersModal } from '../components/ImportUsersModal.jsx';
import { UserProfileModal } from '../components/UserProfileModal.jsx';


const ROLES = ['School', 'Division Personnel', 'CES-SGOD', 'CES-ASDS', 'CES-CID', 'Cluster Coordinator', 'Admin', 'Observer'];

const inputCls = "w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all";

function UserForm({ form, setForm, schools, programs, clusters = [] }) {
  return (
    <div className="space-y-4">
      {(['Admin', 'CES-SGOD', 'CES-ASDS', 'CES-CID', 'Cluster Coordinator', 'Observer'].includes(form.role)) && (
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Full Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className={inputCls} placeholder={form.role === 'Cluster Coordinator' ? 'Cluster Coordinator Name' : form.role === 'Observer' ? 'Observer Name' : form.role.startsWith('CES') ? `${form.role} Name` : 'Administrator Name'} />
        </div>
      )}
      {form.role === 'Division Personnel' && (
        <>
          <div className="grid grid-cols-[1fr_80px] gap-3">
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
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Email</label>
        <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className={inputCls} placeholder="juan@deped.gov.ph" />
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
      {form.role === 'Division Personnel' && (
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

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [clusters, setClusters] = useState([]);

  // Modals
  const [viewUser, setViewUser] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [toggleUser, setToggleUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState(null); // { msg, type: 'success'|'error' }
  const [progTooltip, setProgTooltip] = useState(null); // { x, y, items }
  const tooltipHideTimer = useRef(null);

  const showProgTooltip = (e, items) => {
    clearTimeout(tooltipHideTimer.current);
    setProgTooltip({ x: e.clientX, y: e.clientY, items });
  };
  const hideProgTooltip = () => {
    tooltipHideTimer.current = setTimeout(() => setProgTooltip(null), 120);
  };
  const keepProgTooltip = () => clearTimeout(tooltipHideTimer.current);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const emptyForm = { id: null, name: '', first_name: '', middle_initial: '', last_name: '', email: '', password: '', role: 'School', school_id: null, cluster_id: null, program_ids: [] };
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter !== 'All') params.set('role', roleFilter);
    if (search) params.set('search', search);
    api.get(`/api/admin/users?${params}`)
      .then(r => setUsers(r.data))
      .catch(e => { console.error(e); showToast(e.friendlyMessage ?? 'Failed to load users. Please refresh and try again.', 'error'); })
      .finally(() => setLoading(false));
  }, [search, roleFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    api.get('/api/admin/schools').then(r => setSchools(r.data)).catch(() => {});
    api.get('/api/admin/programs').then(r => setPrograms(r.data)).catch(() => {});
    api.get('/api/admin/clusters').then(r => setClusters(r.data)).catch(() => {});
  }, []);

  const handleCreate = async (wizardForm) => {
    setActionLoading(true); setFormError('');
    try {
      await api.post('/api/admin/users', { ...wizardForm });
      setCreateOpen(false); setForm(emptyForm); fetchAll();
      showToast('User created successfully.');
    } catch (e) {
      setFormError(e.friendlyMessage ?? 'Failed to create user');
    } finally { setActionLoading(false); }
  };

  const handleEdit = async () => {
    setActionLoading(true); setFormError('');
    try {
      await api.patch(`/api/admin/users/${editUser.id}`, { name: form.name, first_name: form.first_name, middle_initial: form.middle_initial, last_name: form.last_name, role: form.role, school_id: form.school_id, program_ids: form.program_ids });
      // If the edited user is the currently logged-in user, sync sessionStorage so
      // the header/sidebar reflect the new name without requiring a re-login.
      try {
        const stored = JSON.parse(sessionStorage.getItem('user') || 'null');
        if (stored && stored.id === editUser.id) {
          sessionStorage.setItem('user', JSON.stringify({
            ...stored,
            name: form.name,
            first_name: form.first_name,
            middle_initial: form.middle_initial,
            last_name: form.last_name,
          }));
        }
      } catch { /* non-critical */ }
      setEditUser(null); fetchAll();
      showToast('User updated successfully.');
    } catch (e) {
      setFormError(e.friendlyMessage ?? 'Failed to update user');
    } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/api/admin/users/${deleteUser.id}`);
      setDeleteUser(null); fetchAll();
    } finally { setActionLoading(false); }
  };

  const handleToggle = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/api/admin/users/${toggleUser.id}`, { is_active: !toggleUser.is_active });
      setToggleUser(null); fetchAll();
    } finally { setActionLoading(false); }
  };

  const handleResetPassword = async () => {
    setActionLoading(true);
    try {
      const r = await api.post(`/api/admin/users/${resetUser.id}/reset-password`);
      setTempPassword(r.data.temporaryPassword); setResetUser(null);
    } finally { setActionLoading(false); }
  };

  // Set of school IDs already claimed by a School-role user.
  const takenSchoolIds = new Set(
    users.filter(u => u.role === 'School' && u.school?.id).map(u => u.school.id)
  );

  const userDisplayName = (u) => {
    if (!u) return '';
    if (u.role === 'Division Personnel' && u.first_name && u.last_name) {
      const mi = u.middle_initial ? ` ${u.middle_initial}.` : '';
      return `${u.first_name}${mi} ${u.last_name}`;
    }
    return u.name || (u.role === 'School' ? u.school?.name : null) || u.email || '';
  };

  const columns = withResponsiveHide([
    { key: 'name', label: 'Name', sortable: true, render: (v, row) => {
      const display = row.role === 'Division Personnel' && row.first_name && row.last_name
        ? `${row.first_name}${row.middle_initial ? ` ${row.middle_initial}.` : ''} ${row.last_name}`
        : (v || (row.role === 'School' ? row.school?.name : null) || row.email);
      return <span className="font-bold text-slate-900 dark:text-slate-100">{display}</span>;
    }},
    { key: 'email', label: 'Email', render: v => <span className="text-sm text-slate-500 dark:text-slate-400">{v}</span> },
    { key: 'role', label: 'Role', render: v => <StatusBadge status={v} size="xs" /> },
    { key: 'school', label: 'Affiliation', render: (_, row) => <span className="text-xs text-slate-500 dark:text-slate-400">{row.role === 'Division Personnel' ? 'Division' : (row.school?.name ?? '—')}</span> },
    { key: 'programs', label: 'Programs', render: (_, row) => {
      const progs = row.programs ?? [];
      if (!progs.length) return <span className="text-slate-400 dark:text-slate-600">—</span>;
      // School accounts always show count + hover tooltip (even 1 program)
      // Division Personnel with exactly 1 program show the name directly
      if (row.role !== 'School' && progs.length === 1)
        return <span className="text-xs text-slate-500 dark:text-slate-400">{progs[0].title}</span>;
      return (
        <span
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-default underline decoration-dotted underline-offset-2"
          onMouseEnter={e => showProgTooltip(e, progs)}
          onMouseLeave={hideProgTooltip}
        >
          {progs.length} {progs.length === 1 ? 'Program' : 'Programs'}
        </span>
      );
    }},
    { key: 'is_active', label: 'Status', render: v => (
      <span
        title={v ? 'account is active — user can log in' : 'account is disabled — user cannot log in, but their data is preserved'}
        className={`inline-flex items-center gap-1.5 text-xs font-bold cursor-default ${v ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${v ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        {v ? 'Active' : 'Disabled'}
      </span>
    )},
    {
      key: 'id', label: 'Actions', render: (_, row) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => { setEditUser(row); setForm({ id: row.id, name: row.name || '', first_name: row.first_name || '', middle_initial: row.middle_initial || '', last_name: row.last_name || '', email: row.email, password: '', role: row.role, school_id: row.school?.id ?? null, program_ids: row.programs?.map(p => p.id) ?? [] }); setFormError(''); }} title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"><PencilSimple size={17} /></button>
          <button onClick={() => setResetUser(row)} title="Reset Password" className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"><Key size={17} /></button>
          <button onClick={() => setToggleUser(row)} title={row.is_active ? 'Disable' : 'Enable'} className={`p-1.5 rounded-lg transition-colors ${row.is_active ? 'text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30' : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}`}>{row.is_active ? <LockKey size={17} /> : <LockKeyOpen size={17} />}</button>
          <button onClick={() => setDeleteUser(row)} title="Delete" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"><Trash size={17} /></button>
        </div>
      )
    },
  ], {
    lg: ['email', 'school'],
    xl: ['programs'],
  });

  const ROLE_PILLS = ['All', 'School', 'Division Personnel', 'CES-SGOD', 'CES-ASDS', 'CES-CID', 'Cluster Coordinator', 'Admin', 'Observer'];

  return (
    <>
      <div className="flex flex-col h-full gap-4">

        {/* Top Bar — locked */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-400"
            />
          </div>
            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:border-indigo-400 rounded-xl transition-colors shrink-0"
            >
              <UploadSimple size={17} />
              <span className="hidden sm:inline">Import Directory</span>
            </button>
            <button
            onClick={() => { setCreateOpen(true); setForm(emptyForm); setFormError(''); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shrink-0"
          >
            <Plus size={17} /> <span className="hidden sm:inline">Add User</span><span className="sm:hidden">Add</span>
          </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {ROLE_PILLS.map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${roleFilter === r ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-border/80'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <DataTable
              columns={columns}
              data={users}
              emptyMessage="No users found."
              onRowClick={(row) => setViewUser(row)}
              fillHeight
              endMessage={search || roleFilter !== 'All' ? 'All matching users shown' : 'End of users list'}
              endCountLabel="user"
              showEndCount
            />
          </div>
        )}
      </div>

      {/* Create User — Wizard */}
      <CreateUserWizard
        open={createOpen}
        onClose={() => { setCreateOpen(false); setForm(emptyForm); setFormError(''); }}
        onSave={handleCreate}
        schools={schools.filter(s => !takenSchoolIds.has(s.id))}
        programs={programs}
        clusters={clusters}
        loading={actionLoading}
        error={formError}
      />

      {/* Import Directory */}
      <ImportUsersModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImportComplete={() => { showToast('Import complete.'); fetchAll(); }}
      />

      {/* Edit User */}
      <FormModal open={!!editUser} title="Edit User" onSave={handleEdit} onCancel={() => setEditUser(null)} loading={actionLoading} saveLabel="Save Changes">
        <UserForm form={form} setForm={setForm} schools={schools.filter(s => !takenSchoolIds.has(s.id) || s.id === form.school_id)} programs={programs} clusters={clusters} />
        {formError && <p className="mt-3 text-xs font-bold text-rose-600">{formError}</p>}
      </FormModal>

      {/* Delete Confirm */}
      <ConfirmModal open={!!deleteUser} title="Delete User" message={`Permanently delete ${userDisplayName(deleteUser) || deleteUser?.email}? Their submissions will be preserved.`}
        variant="danger" confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteUser(null)} loading={actionLoading} />

      {/* Toggle Confirm */}
      <ConfirmModal open={!!toggleUser}
        title={toggleUser?.is_active ? 'Disable User' : 'Enable User'}
        message={toggleUser?.is_active ? `Disable ${userDisplayName(toggleUser) || toggleUser?.email}? They will not be able to log in.` : `Enable ${userDisplayName(toggleUser) || toggleUser?.email}?`}
        variant={toggleUser?.is_active ? 'danger' : 'info'} confirmLabel={toggleUser?.is_active ? 'Disable' : 'Enable'}
        onConfirm={handleToggle} onCancel={() => setToggleUser(null)} loading={actionLoading} />

      {/* Reset Password Confirm */}
      <ConfirmModal open={!!resetUser} title="Reset Password"
        message={`Reset password for ${userDisplayName(resetUser) || resetUser?.email}? A temporary password will be generated.`}
        variant="info" confirmLabel="Reset" onConfirm={handleResetPassword} onCancel={() => setResetUser(null)} loading={actionLoading} />

      {/* Show Temp Password */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setTempPassword(null); setCopied(false); }} />
          <div className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_64px_-8px_rgba(0,0,0,0.5)] p-6 w-full max-w-sm text-center overflow-hidden">
            <button onClick={() => { setTempPassword(null); setCopied(false); }} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <XCircle size={22} weight="fill" />
            </button>
            <h3 className="font-black text-slate-900 dark:text-slate-100 mb-2">Temporary Password</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Share this with the user. It will not be shown again.</p>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-dark-base rounded-xl px-4 py-3 mb-4">
              <code className="flex-1 font-mono text-lg font-black text-slate-900 dark:text-slate-100 tracking-wider">{tempPassword}</code>
              <button onClick={() => { navigator.clipboard.writeText(tempPassword); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
              </button>
            </div>
            <button onClick={() => { setTempPassword(null); setCopied(false); }}
              className="w-full px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
              Done
            </button>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        open={!!viewUser}
        user={viewUser}
        onClose={() => setViewUser(null)}
        onEdit={() => {
          const u = viewUser;
          setViewUser(null);
          setEditUser(u);
          setForm({ id: u.id, name: u.name || '', first_name: u.first_name || '', middle_initial: u.middle_initial || '', last_name: u.last_name || '', email: u.email, password: '', role: u.role, school_id: u.school?.id ?? null, program_ids: u.programs?.map(p => p.id) ?? [] });
          setFormError('');
        }}
        onResetPassword={async (userId) => {
          const r = await api.post(`/api/admin/users/${userId}/reset-password`);
          return r.data.temporaryPassword;
        }}
        onToggle={() => { const u = viewUser; setViewUser(null); setToggleUser(u); }}
        onDelete={() => { const u = viewUser; setViewUser(null); setDeleteUser(u); }}
      />


      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-bold transition-all
          ${toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
          }`}>
          <CheckCircle size={18} weight="fill" className={toast.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} />
          {toast.msg}
        </div>
      )}

      {/* Programs hover tooltip — fixed to escape table overflow clipping */}
      {progTooltip && (
        <div
          className="fixed z-[300] bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-xl shadow-xl max-w-xs"
          style={{ left: progTooltip.x + 12, top: progTooltip.y + 12 }}
          onMouseEnter={keepProgTooltip}
          onMouseLeave={hideProgTooltip}
        >
          <div className="overflow-y-auto max-h-48 px-3 py-2.5 space-y-1">
            {progTooltip.items.map(p => <div key={p.id} className="leading-snug">{p.title}</div>)}
          </div>
        </div>
      )}
    </>
  );
}
