import { useState } from 'react';
import api from '../../../lib/api.js';
import { EMPTY_USER_FORM } from './UserForm.jsx';

export function useUserMutations({ fetchAll, showToast }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(EMPTY_USER_FORM);

  const handleCreate = async (wizardForm) => {
    setActionLoading(true); setFormError('');
    try {
      await api.post('/api/admin/users', { ...wizardForm });
      showToast('User created successfully.');
      fetchAll();
      return true;
    } catch (e) {
      setFormError(e.friendlyMessage ?? 'Failed to create user');
      return false;
    } finally { setActionLoading(false); }
  };

  const handleEdit = async (editUser) => {
    setActionLoading(true); setFormError('');
    try {
      await api.patch(`/api/admin/users/${editUser.id}`, {
        salutation: form.salutation, name: form.name, first_name: form.first_name,
        middle_initial: form.middle_initial, last_name: form.last_name, position: form.position,
        role: form.role, school_id: form.school_id, program_ids: form.program_ids,
      });
      try {
        const stored = JSON.parse(sessionStorage.getItem('user') || 'null');
        if (stored && stored.id === editUser.id) {
          sessionStorage.setItem('user', JSON.stringify({
            ...stored,
            salutation: form.salutation, name: form.name, first_name: form.first_name,
            middle_initial: form.middle_initial, last_name: form.last_name, position: form.position,
          }));
        }
      } catch { /* non-critical */ }
      showToast('User updated successfully.');
      fetchAll();
      return true;
    } catch (e) {
      setFormError(e.friendlyMessage ?? 'Failed to update user');
      return false;
    } finally { setActionLoading(false); }
  };

  const handleDelete = async (deleteUser) => {
    setActionLoading(true);
    try {
      await api.delete(`/api/admin/users/${deleteUser.id}`);
      fetchAll();
      return true;
    } finally { setActionLoading(false); }
  };

  const handleToggle = async (toggleUser) => {
    setActionLoading(true);
    try {
      await api.patch(`/api/admin/users/${toggleUser.id}`, { is_active: !toggleUser.is_active });
      fetchAll();
      return true;
    } finally { setActionLoading(false); }
  };

  const handleResetPassword = async (resetUser) => {
    setActionLoading(true);
    try {
      const r = await api.post(`/api/admin/users/${resetUser.id}/reset-password`);
      return r.data.temporaryPassword;
    } finally { setActionLoading(false); }
  };

  return { actionLoading, formError, setFormError, form, setForm, handleCreate, handleEdit, handleDelete, handleToggle, handleResetPassword };
}
