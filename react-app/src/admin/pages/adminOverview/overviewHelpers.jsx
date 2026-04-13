import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Info } from '@phosphor-icons/react';
import { PIR_QUARTERLY_KEYS } from './chartTheme.js';

export function relativeTime(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export function pirBarColor(pct) {
  if (pct >= 90) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}
export function pirBarTrack(pct) {
  if (pct >= 90) return 'bg-emerald-100 dark:bg-emerald-900/30';
  if (pct >= 60) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-rose-100 dark:bg-rose-900/30';
}
export function pirTextColor(pct) {
  if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}
export function pirPctBadge(pct) {
  if (pct >= 90) return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
  if (pct >= 60) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
  return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300';
}

export function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  const btnRef = React.useRef(null);
  const [pos, setPos] = useState(null);

  React.useEffect(() => {
    if (!show || !btnRef.current) { setPos(null); return; }
    const r = btnRef.current.getBoundingClientRect();
    const tipW = 208;
    let left = r.left + r.width / 2 - tipW / 2;
    if (left < 8) left = 8;
    if (left + tipW > window.innerWidth - 8) left = window.innerWidth - 8 - tipW;
    setPos({ top: r.top - 6, left });
  }, [show]);

  return (
    <span className="inline-flex">
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => { e.stopPropagation(); setShow(s => !s); }}
        className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
      >
        <Info size={15} weight="fill" />
      </button>
      {show && pos && ReactDOM.createPortal(
        <span
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 208, transform: 'translateY(-100%)' }}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 dark:bg-dark-border text-slate-100 text-[10px] leading-snug font-medium shadow-lg z-[9999] pointer-events-none text-center"
        >
          {text}
        </span>,
        document.body
      )}
    </span>
  );
}

export function getQuarterTotal(quarter) {
  return PIR_QUARTERLY_KEYS.reduce((sum, key) => sum + (quarter[key] ?? 0), 0);
}

export function getQuarterAxisMax(data) {
  const maxTotal = Math.max(0, ...data.map(getQuarterTotal));
  return Math.max(4, Math.ceil(maxTotal / 4) * 4);
}
