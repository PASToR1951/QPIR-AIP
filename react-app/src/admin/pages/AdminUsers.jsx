import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { PencilSimple, Key, Prohibit, Trash, Plus, MagnifyingGlass, Copy, Check } from '@phosphor-icons/react';
import { AdminLayout } from '../AdminLayout.jsx';
import { DataTable } from '../components/DataTable.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { FormModal } from '../components/FormModal.jsx';
import { SearchableSelect } from '../components/SearchableSelect.jsx';
import { MultiSelect } from '../components/MultiSelect.jsx';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const ROLES = ['School', 'Division Personnel', 'Admin'];

function UserForm({ form, setForm, schools, programs }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Full Name</label>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400" placeholder="Juan Dela Cruz" />
      </div>
      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Email</label>
        <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400" placeholder="juan@deped.gov.ph" />
      </div>
      {!form.id && (
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Password</label>
          <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400" placeholder="Min. 8 characters" />
        </div>
      )}
      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Role</label>
        <SearchableSelect
          options={ROLES.map(r => ({ value: r, label: r }))}
          value={form.role}
          onChange={v => setForm(f => ({ ...f, role: v, school_id: null, program_ids: [] }))}
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
      {form.role === 'Division Personnel' && (
        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Assigned Programs</label>
          <MultiSelect
            options={programs.map(p => ({ value: p.id, label: p.title }))}
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

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [toggleUser, setToggleUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const emptyForm = { name: '', email: '', password: '', role: 'School', school_id: null, program_ids: [] };
  const [form, setForm] = useState(emptyForm);

  const fetchAll = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter !== 'All') params.set('role', roleFilter);
    if (search) params.set('search', search);
    axios.get(`${API}/api/admin/users?${params}`, { headers: authHeaders() })
      .then(r => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, roleFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    axios.get(`${API}/api/admin/schools`, { headers: authHeaders() }).then(r => setSchools(r.data)).catch(() => {});
    axios.get(`${API}/api/admin/programs`, { headers: authHeaders() }).then(r => setPrograms(r.data)).catch(() => {});
  }, []);

  const handleCreate = async () => {
    setActionLoading(true); setFormError('');
    try {
      await axios.post(`${API}/api/admin/users`, { ...form, program_ids: form.program_ids }, { headers: authHeaders() });
      setCreateOpen(false); setForm(emptyForm); fetchAll();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Failed to create user');
    } finally { setActionLoading(false); }
  };

  const handleEdit = async () => {
    setActionLoading(true); setFormError('');
    try {
      await axios.patch(`${API}/api/admin/users/${editUser.id}`, { name: form.name, role: form.role, school_id: form.school_id, program_ids: form.program_ids }, { headers: authHeaders() });
      setEditUser(null); fetchAll();
    } catch (e) {
      setFormError(e.response?.data?.error || 'Failed to update user');
    } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await axios.delete(`${API}/api/admin/users/${deleteUser.id}`, { headers: authHeaders() });
      setDeleteUser(null); fetchAll();
    } finally { setActionLoading(false); }
  };

  const handleToggle = async () => {
    setActionLoading(true);
    try {
      await axios.patch(`${API}/api/admin/users/${toggleUser.id}`, { is_active: !toggleUser.is_active }, { headers: authHeaders() });
      setToggleUser(null); fetchAll();
    } finally { setActionLoading(false); }
  };

  const handleResetPassword = async () => {
    setActionLoading(true);
    try {
      const r = await axios.post(`${API}/api/admin/users/${resetUser.id}/reset-password`, {}, { headers: authHeaders() });
      setTempPassword(r.data.temporaryPassword); setResetUser(null);
    } finally { setActionLoading(false); }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true, render: (v, row) => <span className="font-bold text-slate-900 dark:text-slate-100">{v || row.email}</span> },
    { key: 'email', label: 'Email', render: v => <span className="text-sm text-slate-500 dark:text-slate-400">{v}</span> },
    { key: 'role', label: 'Role', render: v => <StatusBadge status={v} size="xs" /> },
    { key: 'school', label: 'School', render: (_, row) => <span className="text-xs text-slate-500 dark:text-slate-400">{row.school?.name ?? '—'}</span> },
    { key: 'programs', label: 'Programs', render: (_, row) => row.programs?.length > 0 ? (
      <span className="text-xs text-slate-500 dark:text-slate-400">{row.programs.slice(0, 2).map(p => p.title).join(', ')}{row.programs.length > 2 ? ` +${row.programs.length - 2}` : ''}</span>
    ) : <span className="text-slate-400 dark:text-slate-600">—</span> },
    { key: 'is_active', label: 'Status', render: v => (
      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${v ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${v ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        {v ? 'Active' : 'Disabled'}
      </span>
    )},
    {
      key: 'id', label: 'Actions', render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setEditUser(row); setForm({ name: row.name || '', email: row.email, password: '', role: row.role, school_id: row.school?.id ?? null, program_ids: row.programs?.map(p => p.id) ?? [] }); setFormError(''); }} title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"><PencilSimple size={15} /></button>
          <button onClick={() => setResetUser(row)} title="Reset Password" className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"><Key size={15} /></button>
          <button onClick={() => setToggleUser(row)} title={row.is_active ? 'Disable' : 'Enable'} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"><Prohibit size={15} /></button>
          <button onClick={() => setDeleteUser(row)} title="Delete" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"><Trash size={15} /></button>
        </div>
      )
    },
  ];

  const ROLE_PILLS = ['All', 'School', 'Division Personnel', 'Admin'];

  return (
    <AdminLayout title="Users" breadcrumbs={[{ label: 'Users' }]}>
      <div className="space-y-4">

        {/* Top Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {ROLE_PILLS.map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${roleFilter === r ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-border/80'}`}>
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setCreateOpen(true); setForm(emptyForm); setFormError(''); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors ml-auto"
          >
            <Plus size={15} /> Add User
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" />
          </div>
        ) : (
          <DataTable columns={columns} data={users} emptyMessage="No users found." />
        )}
      </div>

      {/* Create User */}
      <FormModal open={createOpen} title="Add User" onSave={handleCreate} onCancel={() => setCreateOpen(false)} loading={actionLoading} saveLabel="Create User">
        <UserForm form={form} setForm={setForm} schools={schools} programs={programs} />
        {formError && <p className="mt-3 text-xs font-bold text-rose-600">{formError}</p>}
      </FormModal>

      {/* Edit User */}
      <FormModal open={!!editUser} title="Edit User" onSave={handleEdit} onCancel={() => setEditUser(null)} loading={actionLoading} saveLabel="Save Changes">
        <UserForm form={form} setForm={setForm} schools={schools} programs={programs} />
        {formError && <p className="mt-3 text-xs font-bold text-rose-600">{formError}</p>}
      </FormModal>

      {/* Delete Confirm */}
      <ConfirmModal open={!!deleteUser} title="Delete User" message={`Permanently delete ${deleteUser?.name || deleteUser?.email}? Their submissions will be preserved.`}
        variant="danger" confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteUser(null)} loading={actionLoading} />

      {/* Toggle Confirm */}
      <ConfirmModal open={!!toggleUser}
        title={toggleUser?.is_active ? 'Disable User' : 'Enable User'}
        message={toggleUser?.is_active ? `Disable ${toggleUser?.name || toggleUser?.email}? They will not be able to log in.` : `Enable ${toggleUser?.name || toggleUser?.email}?`}
        variant={toggleUser?.is_active ? 'danger' : 'info'} confirmLabel={toggleUser?.is_active ? 'Disable' : 'Enable'}
        onConfirm={handleToggle} onCancel={() => setToggleUser(null)} loading={actionLoading} />

      {/* Reset Password Confirm */}
      <ConfirmModal open={!!resetUser} title="Reset Password"
        message={`Reset password for ${resetUser?.name || resetUser?.email}? A temporary password will be generated.`}
        variant="info" confirmLabel="Reset" onConfirm={handleResetPassword} onCancel={() => setResetUser(null)} loading={actionLoading} />

      {/* Show Temp Password */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setTempPassword(null); setCopied(false); }} />
          <div className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <h3 className="font-black text-slate-900 dark:text-slate-100 mb-2">Temporary Password</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Share this with the user. It will not be shown again.</p>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-dark-base rounded-xl px-4 py-3 mb-4">
              <code className="flex-1 font-mono text-lg font-black text-slate-900 dark:text-slate-100 tracking-wider">{tempPassword}</code>
              <button onClick={() => { navigator.clipboard.writeText(tempPassword); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </button>
            </div>
            <button onClick={() => { setTempPassword(null); setCopied(false); }}
              className="w-full px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
              Done
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
