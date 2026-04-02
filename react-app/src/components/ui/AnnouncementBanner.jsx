import React, { useEffect, useState } from 'react';
import { XCircle, Info, Warning, WarningCircle, Megaphone, At } from '@phosphor-icons/react';

/* Render plain text with @[Name] mentions as inline white badges */
function renderWithMentions(text) {
  const parts = text.split(/(@\[[^\]]+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^@\[([^\]]+)\]$/);
    if (match) {
      return (
        <span
          key={i}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/25 font-black text-xs leading-none mx-0.5"
        >
          <At size={10} weight="bold" />
          {match[1]}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const API = import.meta.env.VITE_API_URL;

const TYPE_CONFIG = {
  info: {
    wrap:       'bg-blue-600 dark:bg-blue-700',
    label:      'bg-blue-500 dark:bg-blue-600',
    labelText:  'text-white/90',
    msgText:    'text-white',
    Icon:       Info,
    iconBg:     'bg-white/15',
    closeHover: 'hover:bg-white/20',
  },
  warning: {
    wrap:       'bg-amber-500 dark:bg-amber-600',
    label:      'bg-amber-400 dark:bg-amber-500',
    labelText:  'text-amber-900/80',
    msgText:    'text-white',
    Icon:       Warning,
    iconBg:     'bg-white/15',
    closeHover: 'hover:bg-white/20',
  },
  critical: {
    wrap:       'bg-rose-600 dark:bg-rose-700',
    label:      'bg-rose-500 dark:bg-rose-600',
    labelText:  'text-white/90',
    msgText:    'text-white',
    Icon:       WarningCircle,
    iconBg:     'bg-white/15',
    closeHover: 'hover:bg-white/20',
  },
};

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API}/api/announcement`, { headers })
      .then(r => r.json())
      .then(data => {
        if (!data?.is_active) return;
        // Guard: if the announcement has an expiry and it has passed, don't show
        if (data.expires_at && new Date(data.expires_at) <= new Date()) return;
        // Only respect prior dismissal if the announcement allows it
        if (data.dismissible !== false) {
          const key = `ann-dismissed-${data.id}`;
          if (sessionStorage.getItem(key)) return;
        }
        setAnnouncement(data);
      })
      .catch(() => {});
  }, []);

  if (!announcement || dismissed) return null;

  const { wrap, label, labelText, msgText, Icon, iconBg, closeHover } = TYPE_CONFIG[announcement.type] ?? TYPE_CONFIG.info;
  const dismissible = announcement.dismissible !== false;

  const handleDismiss = () => {
    sessionStorage.setItem(`ann-dismissed-${announcement.id}`, '1');
    setDismissed(true);
  };

  return (
    <div className={`w-full ${wrap} shadow-sm`}>
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">

        {/* ANNOUNCEMENT label pill */}
        <div className={`${label} ${labelText} flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0`}>
          <Megaphone size={12} weight="fill" />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">
            Announcement
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-white/25 shrink-0" />

        {/* Type icon */}
        <div className={`${iconBg} rounded-lg p-1 shrink-0`}>
          <Icon size={14} weight="bold" className="text-white" />
        </div>

        {/* Message */}
        <p className={`flex-1 text-sm font-semibold ${msgText} leading-snug flex items-center flex-wrap gap-y-0.5`}>
          {renderWithMentions(announcement.message)}
        </p>

        {/* Dismiss — only rendered when allowed */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
            className="text-white/60 hover:text-white transition-colors shrink-0"
          >
            <XCircle size={20} weight="fill" />
          </button>
        )}
      </div>
    </div>
  );
}
