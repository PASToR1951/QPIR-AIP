import { useMemo, useState } from 'react';
import api from '../../../lib/api.js';
import {
  EMPTY_ANNOUNCEMENT,
  MAX_CHARS,
  normalizeAnnouncement,
  announcementFromApi,
  hasAnnouncementMessage,
} from './settingsConstants.js';

function announcementPayload(announcement) {
  const normalized = normalizeAnnouncement(announcement);
  return {
    title: normalized.title,
    message: normalized.message,
    type: normalized.type,
    is_active: normalized.is_active,
    dismissible: normalized.dismissible,
    starts_at: normalized.starts_at || null,
    expires_at: normalized.expires_at || null,
    action_label: normalized.action_label,
    action_url: normalized.action_url,
    audience: normalized.audience,
  };
}

function sortAnnouncements(items) {
  const statusRank = { active: 0, scheduled: 1, draft: 2, expired: 3 };
  return [...items].sort((a, b) => {
    const rank = (statusRank[a.status] ?? 4) - (statusRank[b.status] ?? 4);
    if (rank !== 0) return rank;
    return new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime();
  });
}

export function useAnnouncementEditor({ showToast }) {
  const [announcements, setAnnouncements] = useState([]);
  const [announcement, setAnnouncement] = useState(EMPTY_ANNOUNCEMENT);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState('');
  const [schools, setSchools] = useState([]);
  const [mentionableUsers, setMentionableUsers] = useState([]);

  const loadAnnouncements = async () => {
    const { data } = await api.get('/api/admin/announcements');
    const loaded = Array.isArray(data) ? data.map(announcementFromApi) : [];
    setAnnouncements(sortAnnouncements(loaded));
    if (!editingId) setAnnouncement(EMPTY_ANNOUNCEMENT);
    return loaded;
  };

  const hydrateAnnouncements = (items) => {
    const loaded = Array.isArray(items) ? items.map(announcementFromApi) : [];
    setAnnouncements(sortAnnouncements(loaded));
  };

  const loadMentionCandidates = () => {
    api.get('/api/admin/schools')
      .then(res => setSchools(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
    api.get('/api/admin/users')
      .then(res => {
        const rawUsers = Array.isArray(res.data) ? res.data : [];
        setMentionableUsers(
          rawUsers
            .filter(u => u.is_active && u.role === 'Division Personnel')
            .map(u => ({
              id: u.id,
              label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.name || u.email,
              sub: u.email,
            }))
            .filter(u => u.label)
        );
      })
      .catch(err => console.warn('[announcement] users load failed:', err?.response?.status));
  };

  const startCreate = () => {
    setEditingId(null);
    setAnnouncement(EMPTY_ANNOUNCEMENT);
    setFormError('');
  };

  const startEdit = (item) => {
    const draft = announcementFromApi(item);
    setEditingId(draft.id);
    setAnnouncement(draft);
    setFormError('');
  };

  const handleSave = async () => {
    const payload = announcementPayload(announcement);
    setSaving(true);
    setFormError('');
    try {
      const request = editingId
        ? api.patch(`/api/admin/announcements/${editingId}`, payload)
        : api.post('/api/admin/announcements', payload);
      const { data } = await request;
      const saved = announcementFromApi(data);
      setAnnouncements(prev => sortAnnouncements([
        saved,
        ...prev.filter(item => item.id !== saved.id),
      ]));
      setEditingId(saved.id);
      setAnnouncement(saved);
      showToast?.(editingId ? 'Announcement updated.' : 'Announcement published.');
    } catch (e) {
      setFormError(e.friendlyMessage ?? e.response?.data?.error ?? 'Announcement could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id = editingId) => {
    if (!id) return;
    setDeleting(true);
    setFormError('');
    try {
      await api.delete(`/api/admin/announcements/${id}`);
      setAnnouncements(prev => prev.filter(item => item.id !== id));
      if (editingId === id) startCreate();
      showToast?.('Announcement archived.');
    } catch (e) {
      setFormError(e.friendlyMessage ?? e.response?.data?.error ?? 'Announcement could not be archived.');
    } finally {
      setDeleting(false);
    }
  };

  const charsLeft = MAX_CHARS - (announcement.message?.length ?? 0);
  const hasDraftMessage = hasAnnouncementMessage(announcement);
  const canPublish = hasDraftMessage && charsLeft >= 0 && !saving;

  const schoolOptions = useMemo(() => schools.map(s => ({
    value: s.id,
    label: s.abbreviation ? `${s.name} (${s.abbreviation})` : s.name,
  })), [schools]);

  const personnelOptions = useMemo(() => mentionableUsers.map(u => ({
    value: u.id,
    label: u.label,
  })), [mentionableUsers]);

  return {
    announcements,
    setAnnouncements: hydrateAnnouncements,
    announcement,
    setAnnouncement,
    editingId,
    saving,
    deleting,
    formError,
    charsLeft,
    hasDraftMessage,
    canPublish,
    schoolOptions,
    personnelOptions,
    loadAnnouncements,
    loadMentionCandidates,
    startCreate,
    startEdit,
    handleSave,
    handleDelete,
  };
}
