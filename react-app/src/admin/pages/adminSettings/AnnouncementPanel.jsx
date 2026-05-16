import React from 'react';
import {
  Megaphone,
  CalendarBlank,
  FloppyDisk,
  Trash,
  CheckCircle,
  Plus,
  PencilSimple,
} from '@phosphor-icons/react';
import { Spinner } from '../../components/Spinner.jsx';
import MultiSelect from '../../components/MultiSelect.jsx';
import { SettingsCard, BannerPreview } from './SettingsUI.jsx';
import { DateTimePicker } from './DateTimePicker.jsx';
import {
  ANNOUNCEMENT_ROLE_OPTIONS,
  TYPE_CONFIG,
  MAX_CHARS,
  formatAnnouncementExpiry,
} from './settingsConstants.js';

const STATUS_CLASSES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/70',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/70',
  draft: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/[0.04] dark:text-slate-300 dark:border-dark-border',
  expired: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/70',
};

function updateAudience(announcement, key, value) {
  return {
    ...announcement,
    audience: {
      ...(announcement.audience ?? {}),
      [key]: value,
    },
  };
}

function formatDate(value) {
  return formatAnnouncementExpiry(value) || 'No date';
}

export function AnnouncementPanel({
  announcements,
  announcement,
  setAnnouncement,
  editingId,
  charsLeft,
  canPublish,
  schoolOptions,
  personnelOptions,
  saving,
  deleting,
  formError,
  startCreate,
  startEdit,
  handleSave,
  handleDelete,
}) {
  const publishButtonLabel = saving ? 'Saving...' : editingId ? 'Save changes' : 'Publish';

  return (
    <SettingsCard
      icon={Megaphone}
      iconBg="bg-indigo-100 dark:bg-indigo-950/50"
      iconColor="text-indigo-600 dark:text-indigo-400"
      title="Announcements"
      description="Publish high-visibility notices that also appear in user notifications."
    >
      <div className="flex flex-col xl:flex-row gap-5">
        <div className="xl:w-[58%] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Composer</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{editingId ? `Editing #${editingId}` : 'New announcement'}</p>
            </div>
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 dark:bg-dark-base dark:hover:bg-dark-border text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Plus size={14} weight="bold" /> New
            </button>
          </div>

          <BannerPreview announcement={announcement} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">Title</span>
              <input
                value={announcement.title}
                onChange={e => setAnnouncement(a => ({ ...a, title: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none"
                maxLength={120}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">Action URL</span>
              <input
                value={announcement.action_url}
                onChange={e => setAnnouncement(a => ({ ...a, action_url: e.target.value }))}
                placeholder="/aip or https://..."
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none"
              />
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">Message</label>
              <span className={`text-xs font-bold tabular-nums ${charsLeft < 20 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>{charsLeft}/{MAX_CHARS}</span>
            </div>
            <textarea
              value={announcement.message}
              onChange={e => setAnnouncement(a => ({ ...a, message: e.target.value.slice(0, MAX_CHARS) }))}
              rows={4}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none resize-y"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">Action Label</span>
              <input
                value={announcement.action_label}
                onChange={e => setAnnouncement(a => ({ ...a, action_label: e.target.value }))}
                disabled={!announcement.action_url}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none disabled:opacity-50"
                maxLength={40}
              />
            </label>
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Severity</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                  const isActive = announcement.type === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAnnouncement(a => ({ ...a, type: key }))}
                      className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-xs font-black transition-all ${isActive ? cfg.cardActive : `${cfg.card} hover:border-opacity-80`}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label_str}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                <span className="flex items-center gap-1.5"><CalendarBlank size={12} weight="bold" />Starts At</span>
              </label>
              <DateTimePicker value={announcement.starts_at} onChange={val => setAnnouncement(a => ({ ...a, starts_at: val }))} />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                <span className="flex items-center gap-1.5"><CalendarBlank size={12} weight="bold" />Expires At</span>
              </label>
              <DateTimePicker value={announcement.expires_at} onChange={val => setAnnouncement(a => ({ ...a, expires_at: val }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Roles</label>
              <MultiSelect
                options={ANNOUNCEMENT_ROLE_OPTIONS}
                selected={announcement.audience?.roles ?? []}
                onChange={roles => setAnnouncement(a => updateAudience(a, 'roles', roles))}
                placeholder="All roles"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Schools</label>
              <MultiSelect
                options={schoolOptions}
                selected={announcement.audience?.school_ids ?? []}
                onChange={ids => setAnnouncement(a => updateAudience(a, 'school_ids', ids))}
                placeholder="All schools"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Personnel</label>
              <MultiSelect
                options={personnelOptions}
                selected={announcement.audience?.user_ids ?? []}
                onChange={ids => setAnnouncement(a => updateAudience(a, 'user_ids', ids))}
                placeholder="All personnel"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setAnnouncement(a => ({ ...a, is_active: !a.is_active }))}
                className="flex items-center gap-3"
              >
                <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${announcement.is_active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${announcement.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-xs font-black text-slate-700 dark:text-slate-200">{announcement.is_active ? 'Active' : 'Draft'}</span>
              </button>
              <button
                type="button"
                onClick={() => setAnnouncement(a => ({ ...a, dismissible: !a.dismissible }))}
                className="flex items-center gap-3"
              >
                <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${announcement.dismissible ? 'bg-indigo-600' : 'bg-rose-500'}`}>
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${announcement.dismissible ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-xs font-black text-slate-700 dark:text-slate-200">{announcement.dismissible ? 'Dismissible' : 'Persistent'}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              {formError && <p className="text-xs text-red-500 font-bold mr-2">{formError}</p>}
              {editingId && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingId)}
                  disabled={deleting}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-xl disabled:opacity-40 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                >
                  <Trash size={15} weight="bold" />{deleting ? 'Archiving...' : 'Archive'}
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={!canPublish}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {saving ? <Spinner size="sm" variant="white" /> : <FloppyDisk size={15} weight="bold" />}
                {publishButtonLabel}
              </button>
            </div>
          </div>
        </div>

        <div className="xl:w-[42%] min-w-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">History</p>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{announcements.length} saved</span>
          </div>
          <div className="border border-slate-200 dark:border-dark-border rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-dark-border max-h-[720px] overflow-y-auto">
            {announcements.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">No announcements yet.</div>
            ) : announcements.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => startEdit(item)}
                className={`w-full text-left px-4 py-3 transition-colors ${editingId === item.id ? 'bg-indigo-50 dark:bg-indigo-950/30' : 'hover:bg-slate-50 dark:hover:bg-dark-base'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${(TYPE_CONFIG[item.type] ?? TYPE_CONFIG.info).dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{item.title}</p>
                      {editingId === item.id && <PencilSimple size={13} weight="fill" className="text-indigo-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.message}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_CLASSES[item.status] ?? STATUS_CLASSES.draft}`}>
                        {item.status === 'active' && <CheckCircle size={10} weight="fill" />}
                        {item.status ?? 'draft'}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{item.audience_summary ?? 'All active users'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                      <span>Starts: {formatDate(item.starts_at)}</span>
                      <span>Expires: {formatDate(item.expires_at)}</span>
                      <span>Notified: {item.notified_count ?? 0}</span>
                      <span>Dismissed: {item.dismissed_count ?? 0}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
