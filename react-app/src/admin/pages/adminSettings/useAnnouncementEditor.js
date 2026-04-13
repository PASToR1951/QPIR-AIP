import { useState, useRef, useEffect } from 'react';
import api from '../../../lib/api.js';
import {
  MAX_CHARS, EMPTY_ANNOUNCEMENT,
  rawToEditorHTML, editorToRaw,
  normalizeAnnouncement, announcementFromApi, announcementsEqual,
  hasAnnouncementMessage, isAnnouncementExpired, formatAnnouncementExpiry,
  STATUS_TONE_CLASSES,
} from './settingsConstants.js';

export function useAnnouncementEditor({ showToast }) {
  const [announcement, setAnnouncement]       = useState(EMPTY_ANNOUNCEMENT);
  const [savedAnnouncement, setSavedAnnouncement] = useState(EMPTY_ANNOUNCEMENT);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSaved,  setAutoSaved]  = useState(false);

  // Mention state
  const [schools, setSchools]             = useState([]);
  const [mentionableUsers, setMentionableUsers] = useState([]);
  const [mentionOpen, setMentionOpen]     = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionPos, setMentionPos]       = useState({ top: 0, left: 0, width: 0 });
  const textareaRef    = useRef(null);
  const isInternalEdit = useRef(false);

  useEffect(() => {
    if (isInternalEdit.current) { isInternalEdit.current = false; return; }
    if (textareaRef.current) {
      const currentRaw = editorToRaw(textareaRef.current);
      if (currentRaw !== announcement.message) {
        textareaRef.current.innerHTML = rawToEditorHTML(announcement.message);
      }
    }
  }, [announcement.message]);

  const loadMentionCandidates = () => {
    api.get('/api/admin/schools')
      .then(res => setSchools(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
    api.get('/api/admin/users')
      .then(res => {
        const rawUsers = Array.isArray(res.data) ? res.data : [];
        setMentionableUsers(
          rawUsers.filter(u => u.is_active && u.role === 'Division Personnel')
            .map(u => ({ label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.name || u.email, sub: 'Division Personnel', kind: 'person' }))
            .filter(u => u.label)
        );
      })
      .catch(err => console.warn('[mention] users load failed:', err?.response?.status));
  };

  const handleEditorInput = () => {
    const editor = textareaRef.current;
    if (!editor) return;
    const raw = editorToRaw(editor);
    if (raw.length <= MAX_CHARS) { isInternalEdit.current = true; setAnnouncement(a => ({ ...a, message: raw })); }
    const sel = window.getSelection();
    if (!sel?.rangeCount) { setMentionOpen(false); return; }
    const range = sel.getRangeAt(0);
    const node  = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) { setMentionOpen(false); return; }
    const textBefore = node.textContent.slice(0, range.startOffset);
    const lastAt     = textBefore.lastIndexOf('@');
    if (lastAt !== -1) {
      const afterAt = textBefore.slice(lastAt + 1);
      if (!afterAt.includes('@') && !afterAt.includes('[')) {
        const query = afterAt.toLowerCase();
        const allItems = [...schools.map(s => ({ label: s.name, sub: s.abbreviation || s.cluster?.name, kind: 'school' })), ...mentionableUsers].filter(i => i.label.toLowerCase().includes(query));
        const suggestions = allItems.slice(0, 8);
        setMentionSuggestions(suggestions);
        if (suggestions.length > 0) {
          const r = editor.getBoundingClientRect();
          setMentionPos({ top: r.bottom + 6, left: r.left, width: r.width });
          setMentionOpen(true);
        } else { setMentionOpen(false); }
        return;
      }
    }
    setMentionOpen(false);
  };

  const insertMention = (label) => {
    const editor = textareaRef.current;
    if (!editor) return;
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node  = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      const textBefore = node.textContent.slice(0, range.startOffset);
      const lastAt     = textBefore.lastIndexOf('@');
      if (lastAt !== -1) {
        const del = document.createRange();
        del.setStart(node, lastAt); del.setEnd(node, range.startOffset); del.deleteContents();
        const pill = document.createElement('span');
        pill.className = 'mention-pill'; pill.dataset.mention = label;
        pill.setAttribute('contenteditable', 'false'); pill.textContent = `@${label}`;
        const ins = document.createRange();
        ins.setStart(node, lastAt); ins.collapse(true); ins.insertNode(pill);
        const space = document.createTextNode('\u00A0');
        pill.after(space);
        const after = document.createRange();
        after.setStartAfter(space); after.collapse(true);
        sel.removeAllRanges(); sel.addRange(after);
      }
    }
    const raw = editorToRaw(editor);
    if (raw.length <= MAX_CHARS) { isInternalEdit.current = true; setAnnouncement(a => ({ ...a, message: raw })); }
    setMentionOpen(false);
    editor.focus();
  };

  const handleSave = async () => {
    const payload = normalizeAnnouncement(announcement);
    setSaving(true); setFormError('');
    try {
      const { data } = await api.post('/api/admin/announcements', payload);
      const persisted = data ? announcementFromApi(data) : payload;
      setSavedAnnouncement(persisted);
      setAnnouncement(curr => announcementsEqual(curr, payload) ? persisted : curr);
    } catch (e) { setFormError(e.friendlyMessage ?? 'Operation failed'); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async () => {
    const updated = normalizeAnnouncement({ ...announcement, is_active: !announcement.is_active });
    setAnnouncement(updated); setAutoSaving(true);
    try {
      const { data } = await api.post('/api/admin/announcements', updated);
      const persisted = data ? announcementFromApi(data) : updated;
      setSavedAnnouncement(persisted);
      setAnnouncement(curr => announcementsEqual(curr, updated) ? persisted : curr);
      setAutoSaved(true); setTimeout(() => setAutoSaved(false), 2000);
    } catch { setAnnouncement(prev => announcementsEqual(prev, updated) ? { ...updated, is_active: !updated.is_active } : prev); }
    finally { setAutoSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true); setFormError('');
    try {
      await api.delete('/api/admin/announcements');
      const empty = normalizeAnnouncement(EMPTY_ANNOUNCEMENT);
      setAnnouncement(empty); setSavedAnnouncement(empty);
      if (textareaRef.current) textareaRef.current.innerHTML = '';
    } catch (e) { setFormError(e.friendlyMessage ?? 'Delete failed'); }
    finally { setDeleting(false); }
  };

  // Derived state
  const charsLeft = MAX_CHARS - announcement.message.length;
  const hasDraftMessage = hasAnnouncementMessage(announcement);
  const hasSavedMessage = hasAnnouncementMessage(savedAnnouncement);
  const hasUnpublishedChanges = !announcementsEqual(announcement, savedAnnouncement);
  const savedExpired    = isAnnouncementExpired(savedAnnouncement);
  const savedExpiryText = formatAnnouncementExpiry(savedAnnouncement.expires_at);
  const savedStateLabel = !hasSavedMessage ? 'No announcement' : !savedAnnouncement.is_active ? 'Saved inactive' : savedExpired ? 'Expired' : 'Published';
  const savedStateDetail = !hasSavedMessage ? 'No announcement is currently visible to users.' : !savedAnnouncement.is_active ? 'Saved, but hidden from users.' : savedExpired ? (savedExpiryText ? `Expired on ${savedExpiryText}.` : 'Expired and no longer visible to users.') : (savedAnnouncement.expires_at && savedExpiryText ? `Visible to users until ${savedExpiryText}.` : 'Visible to all users with no expiration.');
  const statusTone = hasUnpublishedChanges ? 'amber' : !hasSavedMessage ? 'slate' : savedAnnouncement.is_active && !savedExpired ? 'emerald' : savedExpired ? 'rose' : 'slate';
  const announcementStatus = {
    label: hasUnpublishedChanges ? (hasDraftMessage ? 'Unpublished changes' : 'Message cleared in editor') : savedStateLabel,
    detail: hasUnpublishedChanges ? (hasDraftMessage ? `Publish changes to update users. Current saved state: ${savedStateLabel}.` : hasSavedMessage ? 'Use Clear to remove the saved announcement, or add a message to publish changes.' : 'Write a message before publishing.') : savedStateDetail,
    ...STATUS_TONE_CLASSES[statusTone],
  };
  const canPublish = hasDraftMessage && hasUnpublishedChanges && !saving;

  return {
    announcement, setAnnouncement,
    savedAnnouncement, setSavedAnnouncement,
    saving, deleting, formError, autoSaving, autoSaved,
    textareaRef, mentionOpen, setMentionOpen, mentionSuggestions, mentionPos,
    charsLeft, hasDraftMessage, hasSavedMessage, hasUnpublishedChanges,
    announcementStatus, canPublish, savedStateLabel,
    loadMentionCandidates, handleEditorInput, insertMention,
    handleSave, handleToggleActive, handleDelete,
  };
}
