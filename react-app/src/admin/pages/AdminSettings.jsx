import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FloppyDisk, Buildings, Users, BookOpen, Database,
  Info, Warning, WarningCircle, Megaphone, XCircle, LockSimple,
  Gear, CheckCircle,
} from '@phosphor-icons/react';
import { AdminLayout } from '../AdminLayout.jsx';
import { CURRENT_VERSION } from '../../version.js';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

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

const MAX_CHARS = 200;

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
        <p className="flex-1 text-sm font-semibold text-white leading-snug truncate">
          {announcement.message || <span className="opacity-50 italic">Your message will appear here…</span>}
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
      {/* Card header */}
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

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/api/admin/announcements`, { headers: authHeaders() }),
      axios.get(`${API}/api/admin/settings/system-info`, { headers: authHeaders() }),
    ]).then(([ar, sr]) => {
      if (ar.data) setAnnouncement({ message: ar.data.message ?? '', type: ar.data.type ?? 'info', is_active: ar.data.is_active ?? true, dismissible: ar.data.dismissible !== false });
      setSysInfo(sr.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

            {/* Divider */}
            <div className="h-px bg-slate-100 dark:bg-dark-border" />

            {/* Compose area */}
            <div className="space-y-4">
              {/* Message textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Message
                  </label>
                  <span className={`text-xs font-bold tabular-nums transition-colors ${charsLeft < 20 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
                    {charsLeft}/{MAX_CHARS}
                  </span>
                </div>
                <textarea
                  value={announcement.message}
                  onChange={e => {
                    if (e.target.value.length <= MAX_CHARS)
                      setAnnouncement(a => ({ ...a, message: e.target.value }));
                  }}
                  rows={3}
                  placeholder="Write a message for all users…"
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl resize-none text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all"
                />
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

              {/* Status toggle + Save row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  {/* Active toggle */}
                  <button
                    onClick={() => setAnnouncement(a => ({ ...a, is_active: !a.is_active }))}
                    className="flex items-center gap-3"
                  >
                    <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${announcement.is_active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${announcement.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 leading-none">
                        {announcement.is_active ? 'Active' : 'Inactive'}
                      </span>
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

          {/* ── System Information ──────────────────────── */}
          <SettingsCard
            icon={Database}
            iconBg="bg-slate-100 dark:bg-slate-800/60"
            iconColor="text-slate-500 dark:text-slate-400"
            title="System Information"
            description="Read-only snapshot of the current deployment."
          >
            <div className="grid grid-cols-2 gap-3">
              <StatTile icon={Users}    label="Total Users"    value={sysInfo?.userCount    ?? '—'} />
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
