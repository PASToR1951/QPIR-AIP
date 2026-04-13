import React from 'react';
import { createPortal } from 'react-dom';
import { Megaphone, At, Buildings, User, CalendarBlank, FloppyDisk, Trash, CheckCircle } from '@phosphor-icons/react';
import { SettingsCard, BannerPreview } from './SettingsUI.jsx';
import { DateTimePicker } from './DateTimePicker.jsx';
import { TYPE_CONFIG, MAX_CHARS } from './settingsConstants.js';

export function AnnouncementPanel({
  announcement, setAnnouncement,
  textareaRef, mentionOpen, setMentionOpen, mentionSuggestions, mentionPos,
  charsLeft, hasDraftMessage, hasSavedMessage, hasUnpublishedChanges,
  announcementStatus, canPublish, savedStateLabel,
  autoSaving, autoSaved, saving, deleting, formError,
  handleEditorInput, insertMention, handleSave, handleToggleActive, handleDelete,
}) {
  const publishButtonLabel = saving ? 'Saving…' : hasUnpublishedChanges ? (hasSavedMessage ? 'Publish changes' : 'Publish') : (hasSavedMessage ? savedStateLabel : 'Publish');
  const publishButtonStyle = saving || canPublish ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : hasSavedMessage && !hasUnpublishedChanges && announcement.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400';

  return (
    <SettingsCard icon={Megaphone} iconBg="bg-indigo-100 dark:bg-indigo-950/50" iconColor="text-indigo-600 dark:text-indigo-400"
      title="System Announcement" description="Broadcast a message to all logged-in users across the portal.">
      {/* Live preview */}
      <div>
        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Live Preview</p>
        <BannerPreview announcement={announcement} />
      </div>
      <div className="h-px bg-slate-100 dark:bg-dark-border" />

      {/* Message editor */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">Message</label>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Type <span className="font-black text-indigo-500">@</span> to mention a school or personnel</span>
            <span className={`text-xs font-bold tabular-nums transition-colors ${charsLeft < 20 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>{charsLeft}/{MAX_CHARS}</span>
          </div>
        </div>
        <div className="relative">
          <div ref={textareaRef} contentEditable="true" suppressContentEditableWarning
            data-placeholder="Write a message for all users… Type @ to mention schools or personnel."
            onInput={handleEditorInput}
            onKeyDown={e => { if (e.key === 'Escape') setMentionOpen(false); if (e.key === 'Enter') e.preventDefault(); }}
            onPaste={e => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); }}
            onBlur={() => setTimeout(() => setMentionOpen(false), 150)}
            className="mention-editor w-full px-3.5 py-2.5 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all"
          />
          {mentionOpen && mentionSuggestions.length > 0 && createPortal(
            <div style={{ position: 'fixed', top: mentionPos.top, left: mentionPos.left, width: mentionPos.width, zIndex: 9999 }}
              className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-2xl overflow-hidden max-h-56 flex flex-col">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-dark-border flex items-center gap-2 shrink-0">
                <At size={12} weight="bold" className="text-indigo-500" />
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mention</span>
              </div>
              <div className="overflow-y-auto">
                {mentionSuggestions.map((s, i) => (
                  <button key={i} onMouseDown={e => { e.preventDefault(); insertMention(s.label); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors text-left">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.kind === 'school' ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' : 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400'}`}>
                      {s.kind === 'school' ? <Buildings size={14} weight="fill" /> : <User size={14} weight="fill" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">{s.label}</p>
                      {s.sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{s.sub}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      {/* Type selector */}
      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Severity</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
            const isActive = announcement.type === key;
            return (
              <button key={key} onClick={() => setAnnouncement(a => ({ ...a, type: key }))}
                className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all ${isActive ? cfg.cardActive : `${cfg.card} hover:border-opacity-80`}`}>
                <div className="flex items-center gap-2 w-full">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className={`text-xs font-black ${isActive ? cfg.textColor : 'text-slate-600 dark:text-slate-400'}`}>{cfg.label_str}</span>
                  {isActive && <CheckCircle size={13} weight="fill" className={`ml-auto ${cfg.textColor}`} />}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug pl-4">{cfg.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expiry */}
      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
          <span className="flex items-center gap-1.5"><CalendarBlank size={12} weight="bold" />Expires At<span className="normal-case font-medium text-slate-400">(optional — leave blank to never expire)</span></span>
        </label>
        <DateTimePicker value={announcement.expires_at} onChange={val => setAnnouncement(a => ({ ...a, expires_at: val }))} />
      </div>

      {/* Toggles + save row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <button onClick={handleToggleActive} disabled={autoSaving} className="flex items-center gap-3 disabled:opacity-70">
            <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${announcement.is_active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${announcement.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 leading-none">{announcement.is_active ? 'Active' : 'Inactive'}</span>
                {autoSaving && <span className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin" />}
                {autoSaved && !autoSaving && <CheckCircle size={12} weight="fill" className="text-emerald-500" />}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{announcement.is_active ? 'Visible to all users' : 'Hidden from users'}</span>
            </div>
          </button>
          <button onClick={() => setAnnouncement(a => ({ ...a, dismissible: !a.dismissible }))} className="flex items-center gap-3">
            <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${announcement.dismissible ? 'bg-indigo-600' : 'bg-rose-500'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${announcement.dismissible ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-black text-slate-700 dark:text-slate-200 leading-none">{announcement.dismissible ? 'Dismissible' : 'Persistent'}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{announcement.dismissible ? 'Users can close it' : 'Cannot be closed by users'}</span>
            </div>
          </button>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1">
          {formError && <p className="text-xs text-red-500 font-bold">{formError}</p>}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-black ${announcementStatus.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${announcementStatus.dot}`} />{announcementStatus.label}
          </div>
          <p className="max-w-xs text-[10px] text-slate-400 dark:text-slate-500 sm:text-right leading-snug">{announcementStatus.detail}</p>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} disabled={deleting || (!hasDraftMessage && !hasSavedMessage)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-40 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              <Trash size={15} weight="bold" />{deleting ? 'Clearing…' : 'Clear'}
            </button>
            <button onClick={handleSave} disabled={!canPublish}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all shadow-sm disabled:cursor-not-allowed ${publishButtonStyle}`}>
              {saving ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/50 border-t-white animate-spin" /> : hasSavedMessage && !hasUnpublishedChanges ? <CheckCircle size={15} weight="fill" /> : <FloppyDisk size={15} weight="bold" />}
              {publishButtonLabel}
            </button>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
