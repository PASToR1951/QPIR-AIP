import { useState } from 'react';
import api from '../../../lib/api.js';
import { auth } from '../../../lib/auth.js';
import { EMPTY_USER_FORM } from './UserForm.jsx';

const splitNameRoles = new Set(['School', 'Division Personnel', 'Superintendent']);

function buildDisplayName(form) {
  const parts = [
    form.first_name,
    form.middle_initial ? `${form.middle_initial}.` : '',
    form.last_name,
  ].filter(Boolean);
  return parts.join(' ').trim();
}

function normalizeUserPayload(form) {
  const name = splitNameRoles.has(form.role)
    ? buildDisplayName(form)
    : form.name;
  return { ...form, name };
}

export function useUserMutations({ fetchAll, showToast }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(EMPTY_USER_FORM);

  const handleCreate = async (wizardForm) => {
    setActionLoading(true); setFormError('');
    try {
      await api.post('/api/admin/users', normalizeUserPayload(wizardForm));
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
      const payload = normalizeUserPayload({
        salutation: form.salutation, name: form.name, first_name: form.first_name,
        middle_initial: form.middle_initial, last_name: form.last_name, position: form.position,
        email: form.email, role: form.role, school_id: form.school_id, program_ids: form.program_ids,
      });
      await api.patch(`/api/admin/users/${editUser.id}`, {
        ...payload,
      });
      try {
        const stored = auth.getUser();
        if (stored && stored.id === editUser.id) {
          auth.setSession({
            ...stored,
            email: payload.email, role: payload.role,
            salutation: payload.salutation, name: payload.name, first_name: payload.first_name,
            middle_initial: payload.middle_initial, last_name: payload.last_name, position: payload.position,
          }, auth.getExpiry());
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
