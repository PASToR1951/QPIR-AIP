import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  FloppyDisk, Buildings, Users, BookOpen, Database,
  Info, Warning, WarningCircle, Megaphone, XCircle, LockSimple,
  Gear, CheckCircle, UserCircle, At, User,
} from '@phosphor-icons/react';
import { AdminLayout } from '../AdminLayout.jsx';
import { CURRENT_VERSION } from '../../version.js';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const MAX_CHARS = 280;

/* ─── Contenteditable editor helpers ─────────────────────────────── */
function rawToEditorHTML(raw) {
  if (!raw) return '';
  return raw.split(/(@\[[^\]]+\])/g).map(part => {
    const m = part.match(/^@\[([^\]]+)\]$/);
    if (m) {
      const safe = m[1].replace(/"/g, '&quot;');
      return `<span class="mention-pill" data-mention="${safe}" contenteditable="false">@${m[1]}</span>`;
    }
    return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }).join('');
}

function editorToRaw(el) {
  let out = '';
  el.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.dataset?.mention) out += `@[${node.dataset.mention}]`;
      else if (node.nodeName !== 'BR') out += node.textContent;
    }
  });
  return out;
}

/* ─── Announcement type definitions ─────────────────────────────── */
const TYPE_CONFIG = {
  info: {
    wrap:      'bg-blue-600 dark:bg-blue-700',
    label:     'bg-blue-500 dark:bg-blue-600',
    labelText: 'text-white/90',
    iconBg:    'bg-white/15',
    card:      'border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-950/20',
    cardActive:'border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-500/30',
    dot:       'bg-blue-500',
    textColor: 'text-blue-700 dark:text-blue-300',
    Icon:      Info,
    label_str: 'Info',
    desc:      'General information or updates',
  },
  warning: {
    wrap:      'bg-amber-500 dark:bg-amber-600',
    label:     'bg-amber-400 dark:bg-amber-500',
    labelText: 'text-amber-900/80',
    iconBg:    'bg-white/15',
    card:      'border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20',
    cardActive:'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-500/30',
    dot:       'bg-amber-500',
    textColor: 'text-amber-700 dark:text-amber-300',
    Icon:      Warning,
    label_str: 'Warning',
    desc:      'Caution or upcoming changes',
  },
  critical: {
    wrap:      'bg-rose-600 dark:bg-rose-700',
    label:     'bg-rose-500 dark:bg-rose-600',
    labelText: 'text-white/90',
    iconBg:    'bg-white/15',
    card:      'border-rose-200 dark:border-rose-800/60 bg-rose-50/60 dark:bg-rose-950/20',
    cardActive:'border-rose-500 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-500/30',
    dot:       'bg-rose-600',
    textColor: 'text-rose-700 dark:text-rose-300',
    Icon:      WarningCircle,
    label_str: 'Critical',
    desc:      'Urgent system-wide alert',
  },
};

/* ─── Render text with @[Name] mentions as inline badges ─────────── */
function renderWithMentions(text, badgeClass = 'bg-white/25 text-white') {
  if (!text) return <span className="opacity-50 italic">Your message will appear here…</span>;
  const parts = text.split(/(@\[[^\]]+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^@\[([^\]]+)\]$/);
    if (match) {
      return (
        <span
          key={i}
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-black text-xs leading-none mx-0.5 ${badgeClass}`}
        >
          <At size={10} weight="bold" />
          {match[1]}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ─── Banner preview (mirrors live AnnouncementBanner) ──────────── */
function BannerPreview({ announcement }) {
  const cfg = TYPE_CONFIG[announcement.type] ?? TYPE_CONFIG.info;
  const { Icon } = cfg;
  return (
    <div className={`w-full rounded-xl overflow-hidden shadow-sm ${cfg.wrap}`}>
      <div className="px-4 py-2.5 flex items-center gap-3">
        <div className={`${cfg.label} ${cfg.labelText} flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0`}>
          <Megaphone size={12} weight="fill" />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">Announcement</span>
        </div>
        <div className="w-px h-4 bg-white/25 shrink-0" />
        <div className={`${cfg.iconBg} rounded-lg p-1 shrink-0`}>
          <Icon size={14} weight="bold" className="text-white" />
        </div>
        <p className="flex-1 text-sm font-semibold text-white leading-snug truncate flex items-center gap-0.5 flex-wrap">
          {renderWithMentions(announcement.message)}
        </p>
        {announcement.dismissible !== false ? (
          <div className="text-white/40 shrink-0">
            <XCircle size={20} weight="fill" />
          </div>
        ) : (
          <div className="relative shrink-0" title="Dismiss locked">
            <XCircle size={20} weight="fill" className="text-white/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <LockSimple size={9} weight="fill" className="text-white/70" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Settings section wrapper ───────────────────────────────────── */
function SettingsCard({ icon: Icon, iconColor, iconBg, title, description, children }) {
  return (
    <div className="bg-white/70 dark:bg-dark-surface/80 backdrop-blur-sm border border-white/60 dark:border-dark-border rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-white/[0.02]">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={20} weight="fill" className={iconColor} />
        </div>
        <div>
          <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm leading-tight">{title}</h3>
          {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-6 space-y-6">{children}</div>
    </div>
  );
}

/* ─── Stat tile ──────────────────────────────────────────────────── */
function StatTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="relative flex flex-col gap-3 p-4 bg-slate-50 dark:bg-dark-base rounded-xl border border-slate-100 dark:border-dark-border overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 to-transparent dark:from-indigo-950/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={16} weight="bold" />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none tracking-tight">{value}</p>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function AdminSettings() {
  const [announcement, setAnnouncement] = useState({ message: '', type: 'info', is_active: true, dismissible: true });
  const [sysInfo, setSysInfo]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [formError, setFormError]       = useState('');

  const [divConfig, setDivConfig]   = useState({ supervisor_name: '', supervisor_title: '' });
  const [savingDiv, setSavingDiv]   = useState(false);
  const [savedDiv, setSavedDiv]     = useState(false);
  const [divError, setDivError]     = useState('');

  /* ── Mention state ──────────────────────────────────────────────── */
  const [schools, setSchools]               = useState([]);
  const [mentionableUsers, setMentionableUsers] = useState([]);
  const [mentionOpen, setMentionOpen]       = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionPos, setMentionPos]         = useState({ top: 0, left: 0, width: 0 });
  const textareaRef    = useRef(null);
  const mentionAtIdx   = useRef(-1);
  const isInternalEdit = useRef(false);

  /* ── Sync editor HTML when announcement loads externally ─────────── */
  useEffect(() => {
    if (isInternalEdit.current) { isInternalEdit.current = false; return; }
    if (textareaRef.current) {
      const currentRaw = editorToRaw(textareaRef.current);
      if (currentRaw !== announcement.message) {
        textareaRef.current.innerHTML = rawToEditorHTML(announcement.message);
      }
    }
  }, [announcement.message]);

  /* ── Auto-save toggle state ─────────────────────────────────────── */
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSaved,  setAutoSaved]  = useState(false);

  useEffect(() => {
    // Core settings — required for page to render
    setLoading(true);
    Promise.all([
      axios.get(`${API}/api/admin/announcements`,            { headers: authHeaders() }),
      axios.get(`${API}/api/admin/settings/system-info`,     { headers: authHeaders() }),
      axios.get(`${API}/api/admin/settings/division-config`, { headers: authHeaders() }),
    ]).then(([ar, sr, dr]) => {
      if (ar.data) setAnnouncement({
        message:     ar.data.message     ?? '',
        type:        ar.data.type        ?? 'info',
        is_active:   ar.data.is_active   ?? true,
        dismissible: ar.data.dismissible !== false,
      });
      setSysInfo(sr.data);
      if (dr.data) setDivConfig({
        supervisor_name:  dr.data.supervisor_name  ?? '',
        supervisor_title: dr.data.supervisor_title ?? '',
      });
    }).catch(console.error)
      .finally(() => setLoading(false));

    // Mention candidates — non-critical, loaded independently
    axios.get(`${API}/api/admin/schools`, { headers: authHeaders() })
      .then(res => setSchools(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});

    axios.get(`${API}/api/admin/users`, { headers: authHeaders() })
      .then(res => {
        const rawUsers = Array.isArray(res.data) ? res.data : [];
        // Only Division Personnel can be mentioned directly.
        // Schools are mentioned separately via the schools list.
        setMentionableUsers(
          rawUsers
            .filter(u => u.is_active && u.role === 'Division Personnel')
            .map(u => ({
              label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.name || u.email,
              sub:   'Division Personnel',
              kind:  'person',
            }))
            .filter(u => u.label)
        );
      })
      .catch(err => console.warn('[mention] users load failed:', err?.response?.status, err?.message));
  }, []);

  /* ── Announce save (Publish button) ──────────────────────────────── */
  const handleSave = async () => {
    setSaving(true);
    setFormError('');
    try {
      await axios.post(`${API}/api/admin/announcements`, announcement, { headers: authHeaders() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setFormError(e.response?.data?.error || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  /* ── Active toggle: auto-saves immediately ───────────────────────── */
  const handleToggleActive = async () => {
    const updated = { ...announcement, is_active: !announcement.is_active };
    setAnnouncement(updated);
    setAutoSaving(true);
    try {
      await axios.post(`${API}/api/admin/announcements`, updated, { headers: authHeaders() });
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    } catch {
      // revert
      setAnnouncement(prev => ({ ...prev, is_active: !updated.is_active }));
    } finally {
      setAutoSaving(false);
    }
  };

  /* ── Division config save ────────────────────────────────────────── */
  const handleSaveDiv = async () => {
    setSavingDiv(true);
    setDivError('');
    try {
      await axios.post(`${API}/api/admin/settings/division-config`, divConfig, { headers: authHeaders() });
      setSavedDiv(true);
      setTimeout(() => setSavedDiv(false), 2500);
    } catch (e) {
      setDivError(e.response?.data?.error || 'Operation failed');
    } finally {
      setSavingDiv(false);
    }
  };

  /* ── Mention detection (contenteditable) ────────────────────────── */
  const handleEditorInput = () => {
    const editor = textareaRef.current;
    if (!editor) return;

    const raw = editorToRaw(editor);
    if (raw.length <= MAX_CHARS) {
      isInternalEdit.current = true;
      setAnnouncement(a => ({ ...a, message: raw }));
    }

    // Detect in-progress @mention via Selection API
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
        const allItems = [
          ...schools.map(s => ({ label: s.name, sub: s.abbreviation || s.cluster?.name, kind: 'school' })),
          ...mentionableUsers,
        ].filter(item => item.label.toLowerCase().includes(query));
        const suggestions = allItems.slice(0, 8);
        setMentionSuggestions(suggestions);
        if (suggestions.length > 0) {
          const r = editor.getBoundingClientRect();
          setMentionPos({ top: r.bottom + 6, left: r.left, width: r.width });
          setMentionOpen(true);
        } else {
          setMentionOpen(false);
        }
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
        // Remove @query text
        const del = document.createRange();
        del.setStart(node, lastAt);
        del.setEnd(node, range.startOffset);
        del.deleteContents();

        // Build pill element
        const pill = document.createElement('span');
        pill.className = 'mention-pill';
        pill.dataset.mention = label;
        pill.setAttribute('contenteditable', 'false');
        pill.textContent = `@${label}`;

        // Insert pill where @ was
        const ins = document.createRange();
        ins.setStart(node, lastAt);
        ins.collapse(true);
        ins.insertNode(pill);

        // Add a space after pill and place cursor there
        const space = document.createTextNode('\u00A0');
        pill.after(space);
        const after = document.createRange();
        after.setStartAfter(space);
        after.collapse(true);
        sel.removeAllRanges();
        sel.addRange(after);
      }
    }

    // Sync state from DOM
    const raw = editorToRaw(editor);
    if (raw.length <= MAX_CHARS) {
      isInternalEdit.current = true;
      setAnnouncement(a => ({ ...a, message: raw }));
    }
    setMentionOpen(false);
    editor.focus();
  };

  const charsLeft = MAX_CHARS - announcement.message.length;

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl mx-auto">

          {/* ── Page header ─────────────────────────────── */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Gear size={16} weight="fill" className="text-slate-400 dark:text-slate-500" />
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Settings</h1>
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Manage system-wide announcements and review deployment information.
            </p>
          </div>

          {/* ── System Announcement ─────────────────────── */}
          <SettingsCard
            icon={Megaphone}
            iconBg="bg-indigo-100 dark:bg-indigo-950/50"
            iconColor="text-indigo-600 dark:text-indigo-400"
            title="System Announcement"
            description="Broadcast a message to all logged-in users across the portal."
          >
            {/* Live preview — always visible */}
            <div>
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                Live Preview
              </p>
              <BannerPreview announcement={announcement} />
            </div>

            <div className="h-px bg-slate-100 dark:bg-dark-border" />

            {/* Compose area */}
            <div className="space-y-4">

              {/* Message textarea with mention dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Message
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      Type <span className="font-black text-indigo-500">@</span> to mention a school or personnel
                    </span>
                    <span className={`text-xs font-bold tabular-nums transition-colors ${charsLeft < 20 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
                      {charsLeft}/{MAX_CHARS}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <div
                    ref={textareaRef}
                    contentEditable="true"
                    suppressContentEditableWarning
                    data-placeholder="Write a message for all users… Type @ to mention schools or personnel."
                    onInput={handleEditorInput}
                    onKeyDown={e => {
                      if (e.key === 'Escape') setMentionOpen(false);
                      if (e.key === 'Enter') e.preventDefault();
                    }}
                    onPaste={e => {
                      e.preventDefault();
                      const text = e.clipboardData.getData('text/plain');
                      document.execCommand('insertText', false, text);
                    }}
                    onBlur={() => setTimeout(() => setMentionOpen(false), 150)}
                    className="mention-editor w-full px-3.5 py-2.5 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all"
                  />

                  {/* Mention dropdown — rendered via portal so it escapes overflow:hidden */}
                  {mentionOpen && mentionSuggestions.length > 0 && createPortal(
                    <div
                      style={{ position: 'fixed', top: mentionPos.top, left: mentionPos.left, width: mentionPos.width, zIndex: 9999 }}
                      className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-2xl overflow-hidden max-h-56 flex flex-col"
                    >
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-dark-border flex items-center gap-2 shrink-0">
                        <At size={12} weight="bold" className="text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Mention
                        </span>
                      </div>
                      <div className="overflow-y-auto">
                        {mentionSuggestions.map((s, i) => (
                          <button
                            key={i}
                            onMouseDown={e => { e.preventDefault(); insertMention(s.label); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors text-left"
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              s.kind === 'school'
                                ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                                : 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400'
                            }`}>
                              {s.kind === 'school'
                                ? <Buildings size={14} weight="fill" />
                                : <User size={14} weight="fill" />
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
                                {s.label}
                              </p>
                              {s.sub && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{s.sub}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              </div>

              {/* Type selector — card style */}
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Severity
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                    const isActive = announcement.type === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setAnnouncement(a => ({ ...a, type: key }))}
                        className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all ${
                          isActive ? cfg.cardActive : `${cfg.card} hover:border-opacity-80`
                        }`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                          <span className={`text-xs font-black ${isActive ? cfg.textColor : 'text-slate-600 dark:text-slate-400'}`}>
                            {cfg.label_str}
                          </span>
                          {isActive && (
                            <CheckCircle size={13} weight="fill" className={`ml-auto ${cfg.textColor}`} />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug pl-4">
                          {cfg.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status toggles + save row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">

                  {/* Active toggle — auto-saves immediately */}
                  <button onClick={handleToggleActive} disabled={autoSaving} className="flex items-center gap-3 disabled:opacity-70">
                    <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${announcement.is_active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${announcement.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 leading-none">
                          {announcement.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {autoSaving && (
                          <span className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin" />
                        )}
                        {autoSaved && !autoSaving && (
                          <CheckCircle size={12} weight="fill" className="text-emerald-500" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {announcement.is_active ? 'Visible to all users' : 'Hidden from users'}
                      </span>
                    </div>
                  </button>

                  {/* Dismissible toggle */}
                  <button
                    onClick={() => setAnnouncement(a => ({ ...a, dismissible: !a.dismissible }))}
                    className="flex items-center gap-3"
                  >
                    <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${announcement.dismissible ? 'bg-indigo-600' : 'bg-rose-500'}`}>
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${announcement.dismissible ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 leading-none">
                        {announcement.dismissible ? 'Dismissible' : 'Persistent'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {announcement.dismissible ? 'Users can close it' : 'Cannot be closed by users'}
                      </span>
                    </div>
                  </button>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1">
                  {formError && <p className="text-xs text-red-500 font-bold">{formError}</p>}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 ${
                      saved
                        ? 'bg-emerald-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {saved
                      ? <><CheckCircle size={15} weight="fill" /> Saved</>
                      : <><FloppyDisk size={15} weight="bold" /> {saving ? 'Saving…' : 'Publish'}</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* ── Document Signatories ────────────────────── */}
          <SettingsCard
            icon={UserCircle}
            iconBg="bg-emerald-100 dark:bg-emerald-950/50"
            iconColor="text-emerald-600 dark:text-emerald-400"
            title="Document Signatories"
            description="Name and title that appear on the PIR document's 'Noted' signature block."
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Supervisor Name
                </label>
                <input
                  type="text"
                  value={divConfig.supervisor_name}
                  onChange={e => setDivConfig(d => ({ ...d, supervisor_name: e.target.value }))}
                  placeholder="e.g. DR. JUAN D. DELA CRUZ, EdD"
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 dark:focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Supervisor Title / Position
                </label>
                <input
                  type="text"
                  value={divConfig.supervisor_title}
                  onChange={e => setDivConfig(d => ({ ...d, supervisor_title: e.target.value }))}
                  placeholder="e.g. Chief Education Supervisor"
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 dark:focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1 pt-1">
                {divError && <p className="text-xs text-red-500 font-bold">{divError}</p>}
                <button
                  onClick={handleSaveDiv}
                  disabled={savingDiv}
                  className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 ${
                    savedDiv
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {savedDiv
                    ? <><CheckCircle size={15} weight="fill" /> Saved</>
                    : <><FloppyDisk size={15} weight="bold" /> {savingDiv ? 'Saving…' : 'Save'}</>
                  }
                </button>
              </div>
            </div>
          </SettingsCard>

          {/* ── System Information ──────────────────────── */}
          <SettingsCard
            icon={Database}
            iconBg="bg-slate-100 dark:bg-slate-800/60"
            iconColor="text-slate-500 dark:text-slate-400"
            title="System Information"
            description="Read-only snapshot of the current deployment."
          >
            <div className="grid grid-cols-2 gap-3">
              <StatTile icon={Users}     label="Total Users"    value={sysInfo?.userCount    ?? '—'} />
              <StatTile icon={Buildings} label="Total Schools"  value={sysInfo?.schoolCount  ?? '—'} />
              <StatTile icon={BookOpen}  label="Total Programs" value={sysInfo?.programCount ?? '—'} />
              <StatTile
                icon={Database}
                label="App Version"
                value={`v${CURRENT_VERSION}`}
                sub={`FY ${new Date().getFullYear()} · Deadlines managed in Deadlines page`}
              />
            </div>
          </SettingsCard>

        </div>
      )}
    </AdminLayout>
  );
}
