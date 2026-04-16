import React, { useState, useRef, useCallback } from 'react';
import { MagnifyingGlass, Plus, UploadSimple, CheckCircle } from '@phosphor-icons/react';
import api from '../../lib/api.js';
import { DataTable } from '../components/DataTable.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { FormModal } from '../components/FormModal.jsx';
import { CreateUserWizard } from '../components/CreateUserWizard.jsx';
import { ImportUsersModal } from '../components/ImportUsersModal.jsx';
import { UserProfileModal } from '../components/UserProfileModal.jsx';
import { UserForm, EMPTY_USER_FORM, userDisplayName } from './adminUsers/UserForm.jsx';
import { buildUserColumns } from './adminUsers/userColumns.jsx';
import { OnboardingSnapshot } from './adminUsers/OnboardingSnapshot.jsx';
import { TempPasswordModal } from './adminUsers/TempPasswordModal.jsx';
import { useUserData } from './adminUsers/useUserData.js';
import { useOnboardingData } from './adminUsers/useUserData.js';
import { useUserMutations } from './adminUsers/useUserMutations.js';

const ROLE_PILLS = ['All', 'School', 'Division Personnel', 'CES-SGOD', 'CES-ASDS', 'CES-CID', 'Cluster Coordinator', 'Admin', 'Observer'];

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [toast, setToast] = useState(null);
  const [progTooltip, setProgTooltip] = useState(null);
  const tooltipHideTimer = useRef(null);

  // Modals
  const [viewUser, setViewUser] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [toggleUser, setToggleUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const { users, loading, schools, programs, clusters, fetchAll, loadDropdownData } = useUserData({ search, roleFilter, showToast });
  const onboarding = useOnboardingData();
  const { actionLoading, formError, setFormError, form, setForm, handleCreate, handleEdit, handleDelete, handleToggle, handleResetPassword } = useUserMutations({ fetchAll, showToast });

  const showProgTooltip = (e, items) => { clearTimeout(tooltipHideTimer.current); setProgTooltip({ x: e.clientX, y: e.clientY, items }); };
  const hideProgTooltip = () => { tooltipHideTimer.current = setTimeout(() => setProgTooltip(null), 120); };

  const takenSchoolIds = new Set(users.filter(u => u.role === 'School' && u.school?.id).map(u => u.school.id));

  const openEdit = (u) => {
    loadDropdownData();
    setEditUser(u);
    setForm({ id: u.id, salutation: u.salutation || '', name: u.name || '', first_name: u.first_name || '', middle_initial: u.middle_initial || '', last_name: u.last_name || '', position: u.position || '', email: u.email, password: '', role: u.role, school_id: u.school?.id ?? null, cluster_id: null, program_ids: u.programs?.map(p => p.id) ?? [] });
    setFormError('');
  };

  const columns = buildUserColumns({
    onEdit: openEdit,
    onResetPassword: (row) => setResetUser(row),
    onToggle: (row) => setToggleUser(row),
    onDelete: (row) => setDeleteUser(row),
    showProgTooltip,
    hideProgTooltip,
  });

  return (
    <>
      <div className="flex flex-col h-full gap-4">
        {/* Toolbar */}
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
            <button onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:border-indigo-400 rounded-xl transition-colors shrink-0">
              <UploadSimple size={17} /><span className="hidden sm:inline">Import Directory</span>
            </button>
            <button onClick={() => { loadDropdownData(); setCreateOpen(true); setForm(EMPTY_USER_FORM); setFormError(''); }} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shrink-0">
              <Plus size={17} /><span className="hidden sm:inline">Add User</span><span className="sm:hidden">Add</span>
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
              columns={columns} data={users} emptyMessage="No users found."
              onRowClick={(row) => setViewUser(row)} fillHeight
              endMessage={search || roleFilter !== 'All' ? 'All matching users shown' : 'End of users list'}
              endCountLabel="user" showEndCount
            />
          </div>
        )}
      </div>

      <OnboardingSnapshot {...onboarding} />

      {/* Modals */}
      <CreateUserWizard
        open={createOpen}
        onClose={() => { setCreateOpen(false); setForm(EMPTY_USER_FORM); setFormError(''); }}
        onSave={async (wizardForm) => { const ok = await handleCreate(wizardForm); if (ok) setCreateOpen(false); }}
        schools={schools.filter(s => !takenSchoolIds.has(s.id))}
        programs={programs} clusters={clusters}
        loading={actionLoading} error={formError}
      />

      <ImportUsersModal
        open={importOpen} onClose={() => setImportOpen(false)}
        onImportComplete={() => { showToast('Import complete.'); fetchAll(); }}
      />

      <FormModal open={!!editUser} title="Edit User" onSave={async () => { const ok = await handleEdit(editUser); if (ok) setEditUser(null); }} onCancel={() => setEditUser(null)} loading={actionLoading} saveLabel="Save Changes">
        <UserForm form={form} setForm={setForm} schools={schools.filter(s => !takenSchoolIds.has(s.id) || s.id === form.school_id)} programs={programs} clusters={clusters} />
        {formError && <p className="mt-3 text-xs font-bold text-rose-600">{formError}</p>}
      </FormModal>

      <ConfirmModal open={!!deleteUser} title="Delete User"
        message={`Permanently delete ${userDisplayName(deleteUser) || deleteUser?.email}? Their submissions will be preserved.`}
        variant="danger" confirmLabel="Delete"
        onConfirm={async () => { await handleDelete(deleteUser); setDeleteUser(null); }}
        onCancel={() => setDeleteUser(null)} loading={actionLoading} />

      <ConfirmModal open={!!toggleUser}
        title={toggleUser?.is_active ? 'Disable User' : 'Enable User'}
        message={toggleUser?.is_active ? `Disable ${userDisplayName(toggleUser) || toggleUser?.email}? They will not be able to log in.` : `Enable ${userDisplayName(toggleUser) || toggleUser?.email}?`}
        variant={toggleUser?.is_active ? 'danger' : 'info'} confirmLabel={toggleUser?.is_active ? 'Disable' : 'Enable'}
        onConfirm={async () => { await handleToggle(toggleUser); setToggleUser(null); }}
        onCancel={() => setToggleUser(null)} loading={actionLoading} />

      <ConfirmModal open={!!resetUser} title="Reset Password"
        message={`Reset password for ${userDisplayName(resetUser) || resetUser?.email}? A temporary password will be generated.`}
        variant="info" confirmLabel="Reset"
        onConfirm={async () => { const pw = await handleResetPassword(resetUser); setResetUser(null); if (pw) setTempPassword(pw); }}
        onCancel={() => setResetUser(null)} loading={actionLoading} />

      {tempPassword && <TempPasswordModal password={tempPassword} onClose={() => setTempPassword(null)} />}

      <UserProfileModal
        open={!!viewUser} user={viewUser} onClose={() => setViewUser(null)}
        onEdit={() => { const u = viewUser; setViewUser(null); openEdit(u); }}
        onResetPassword={async (userId) => { const r = await api.post(`/api/admin/users/${userId}/reset-password`); return r.data.temporaryPassword; }}
        onToggle={() => { const u = viewUser; setViewUser(null); setToggleUser(u); }}
        onDelete={() => { const u = viewUser; setViewUser(null); setDeleteUser(u); }}
      />

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-bold transition-all
          ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'}`}>
          <CheckCircle size={18} weight="fill" className={toast.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} />
          {toast.msg}
        </div>
      )}

      {progTooltip && (
        <div className="fixed z-[300] bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-xl shadow-xl max-w-xs"
          style={{ left: progTooltip.x + 12, top: progTooltip.y + 12 }}
          onMouseEnter={() => clearTimeout(tooltipHideTimer.current)}
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
