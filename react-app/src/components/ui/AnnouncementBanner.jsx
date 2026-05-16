import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, At, ArrowSquareOut, CaretLeft, CaretRight } from '@phosphor-icons/react';
import api from '../../lib/api.js';
import { useTextMeasure } from '../../lib/useTextMeasure';

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

function textForMeasurement(announcement) {
  return `${announcement?.title ?? ''} ${announcement?.message ?? ''}`.replace(/@\[([^\]]+)\]/g, '@$1');
}

const TYPE_CONFIG = {
  info: {
    wrap: 'bg-blue-600 dark:bg-blue-700',
    msgText: 'text-white',
    closeHover: 'hover:bg-white/20',
  },
  warning: {
    wrap: 'bg-amber-500 dark:bg-amber-600',
    msgText: 'text-white',
    closeHover: 'hover:bg-white/20',
  },
  critical: {
    wrap: 'bg-rose-600 dark:bg-rose-700',
    msgText: 'text-white',
    closeHover: 'hover:bg-white/20',
  },
};

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.get('/api/announcements/active')
      .then(({ data }) => {
        if (cancelled) return;
        setAnnouncements(Array.isArray(data) ? data : []);
        setIndex(0);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const visible = announcements.filter(item => {
    if (!item?.is_active) return false;
    if (item.expires_at && new Date(item.expires_at) <= new Date()) return false;
    return true;
  });

  const activeIndex = Math.min(index, Math.max(visible.length - 1, 0));
  const announcement = visible[activeIndex];

  const handleDismiss = async (id) => {
    setAnnouncements(prev => prev.filter(item => item.id !== id));
    try {
      await api.post(`/api/announcements/${id}/dismiss`);
    } catch {
      // Local hide still keeps the current view calm; the next refresh will resync.
    }
  };

  if (!announcement) return null;

  return (
    <AnnouncementBannerContent
      announcement={announcement}
      count={visible.length}
      index={activeIndex}
      onPrevious={() => setIndex(i => Math.max(0, i - 1))}
      onNext={() => setIndex(i => Math.min(visible.length - 1, i + 1))}
      onDismiss={() => handleDismiss(announcement.id)}
    />
  );
}

function AnnouncementBannerContent({
  announcement,
  count,
  index,
  onPrevious,
  onNext,
  onDismiss,
}) {
  const navigate = useNavigate();
  const { measureText, containerRef, containerWidth } = useTextMeasure({
    font: '600 14px Inter',
    lineHeight: 20,
  });

  const { wrap, msgText, closeHover } = TYPE_CONFIG[announcement.type] ?? TYPE_CONFIG.info;
  const dismissible = announcement.dismissible !== false;
  const messageMetrics = measureText(textForMeasurement(announcement));
  const isMultiline = containerWidth > 0 && messageMetrics.lineCount > 1;
  const actionUrl = announcement.action_url || '';
  const actionLabel = announcement.action_label || 'Open';
  const isExternalAction = useMemo(() => /^https:\/\//i.test(actionUrl), [actionUrl]);

  const handleAction = () => {
    if (!actionUrl) return;
    if (isExternalAction) {
      window.open(actionUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(actionUrl);
  };

  return (
    <div className={`w-full ${wrap} shadow-sm print:hidden`}>
      <div className={`max-w-6xl mx-auto px-4 py-2.5 flex gap-2.5 sm:gap-3 ${isMultiline ? 'items-start' : 'items-center'}`}>
        <div
          ref={containerRef}
          style={{ minHeight: messageMetrics.height }}
          className={`min-w-0 flex-1 ${msgText}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-xs font-black leading-tight truncate">{announcement.title || 'Announcement'}</p>
            {count > 1 && (
              <span className="shrink-0 text-[10px] font-black rounded-full bg-white/20 px-1.5 py-0.5">
                {index + 1}/{count}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold leading-snug whitespace-pre-wrap break-words">
            {renderWithMentions(announcement.message)}
          </p>
        </div>

        {actionUrl && (
          <button
            type="button"
            onClick={handleAction}
            className={`inline-flex max-w-28 sm:max-w-40 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-black text-white bg-white/15 ${closeHover} transition-colors shrink-0`}
          >
            <span className="truncate">{actionLabel}</span>
            <ArrowSquareOut size={13} weight="bold" />
          </button>
        )}

        {count > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onPrevious}
              disabled={index === 0}
              aria-label="Previous announcement"
              className={`rounded-full p-0.5 text-white/70 disabled:opacity-30 ${closeHover}`}
            >
              <CaretLeft size={18} weight="bold" />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={index === count - 1}
              aria-label="Next announcement"
              className={`rounded-full p-0.5 text-white/70 disabled:opacity-30 ${closeHover}`}
            >
              <CaretRight size={18} weight="bold" />
            </button>
          </div>
        )}

        {dismissible && (
          <button
            onClick={onDismiss}
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
