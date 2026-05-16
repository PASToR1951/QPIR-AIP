import React from 'react';
import { At } from '@phosphor-icons/react';
import { TYPE_CONFIG } from './settingsConstants.js';

export function SettingsCard({ icon: Icon, iconColor, iconBg, title, description, children }) {
  return (
    <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden">
      <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-dark-border">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-xl ${iconBg}`}>
            <Icon size={18} weight="fill" className={iconColor} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
        </div>
      </div>
      <div className="px-5 sm:px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

export function StatTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/80 dark:bg-dark-base/70 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-slate-400 dark:text-slate-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</p>
      </div>
      <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export function BannerPreview({ announcement }) {
  const cfg = TYPE_CONFIG[announcement.type] ?? TYPE_CONFIG.info;
  return (
    <div className={`w-full rounded-xl overflow-hidden shadow-sm ${cfg.wrap}`}>
      <div className="px-4 py-2.5 flex items-start gap-2.5">
        <div className="min-w-0 flex-1 text-white">
          {announcement.title && (
            <p className="text-xs font-black leading-snug truncate">{announcement.title}</p>
          )}
          <p className="text-sm font-semibold leading-snug whitespace-pre-wrap break-words">
            {renderWithMentions(announcement.message)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function renderWithMentions(text, badgeClass = 'bg-white/25 text-white') {
  if (!text) return <span className="opacity-50 italic">Your message will appear here…</span>;
  const parts = text.split(/(@\[[^\]]+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^@\[([^\]]+)\]$/);
    if (match) {
      return (
        <span key={i} className={`inline-flex max-w-full align-middle items-center gap-0.5 px-1.5 py-0.5 rounded-md font-black text-xs leading-tight mx-0.5 ${badgeClass}`}>
          <At size={10} weight="bold" className="shrink-0" />
          <span className="min-w-0 break-words">{match[1]}</span>
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
