import React, { useEffect, useState } from 'react';
import { XCircle, At } from '@phosphor-icons/react';
import { API_BASE_URL } from '../../lib/apiBase.js';
import { useTextMeasure } from '../../lib/useTextMeasure';

/* Render plain text with @[Name] mentions as inline white badges */
function renderWithMentions(text = '') {
  const parts = text.split(/(@\[[^\]]+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^@\[([^\]]+)\]$/);
    if (match) {
      return (
        <span
          key={i}
          className="inline-flex max-w-full align-middle items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/25 font-black text-xs leading-tight mx-0.5"
        >
          <At size={10} weight="bold" className="shrink-0" />
          <span className="min-w-0 break-words">{match[1]}</span>
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function textForMeasurement(text = '') {
  return text.replace(/@\[([^\]]+)\]/g, '@$1');
}

const API = API_BASE_URL;

const TYPE_CONFIG = {
  info: {
    wrap:       'bg-blue-600 dark:bg-blue-700',
    msgText:    'text-white',
    closeHover: 'hover:bg-white/20',
  },
  warning: {
    wrap:       'bg-amber-500 dark:bg-amber-600',
    msgText:    'text-white',
    closeHover: 'hover:bg-white/20',
  },
  critical: {
    wrap:       'bg-rose-600 dark:bg-rose-700',
    msgText:    'text-white',
    closeHover: 'hover:bg-white/20',
  },
};

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/announcement`, { credentials: 'include' })
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

  return (
    <AnnouncementBannerContent
      announcement={announcement}
      onDismiss={() => setDismissed(true)}
    />
  );
}

function AnnouncementBannerContent({ announcement, onDismiss }) {
  const { measureText, containerRef, containerWidth } = useTextMeasure({
    font: '600 14px Inter',
    lineHeight: 20,
  });

  const { wrap, msgText, closeHover } = TYPE_CONFIG[announcement.type] ?? TYPE_CONFIG.info;
  const dismissible = announcement.dismissible !== false;
  const messageMetrics = measureText(textForMeasurement(announcement.message));
  const isMultiline = containerWidth > 0 && messageMetrics.lineCount > 1;

  const handleDismiss = () => {
    sessionStorage.setItem(`ann-dismissed-${announcement.id}`, '1');
    onDismiss();
  };

  return (
    <div className={`w-full ${wrap} shadow-sm`}>
      <div className={`max-w-6xl mx-auto px-4 py-2.5 flex gap-2.5 sm:gap-3 ${isMultiline ? 'items-start' : 'items-center'}`}>
        <p
          ref={containerRef}
          style={{ minHeight: messageMetrics.height }}
          className={`min-w-0 flex-1 text-sm font-semibold ${msgText} leading-snug whitespace-pre-wrap break-words`}
        >
          {renderWithMentions(announcement.message)}
        </p>

        {/* Dismiss — only rendered when allowed */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
            className={`text-white/60 hover:text-white ${closeHover} transition-colors shrink-0 rounded-full -mr-1 p-0.5 ${isMultiline ? 'mt-0.5' : ''}`}
          >
            <XCircle size={20} weight="fill" />
          </button>
        )}
      </div>
    </div>
  );
}
