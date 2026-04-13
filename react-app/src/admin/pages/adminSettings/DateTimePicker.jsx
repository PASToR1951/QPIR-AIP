import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarBlank, XCircle, CaretLeft, CaretRight, CaretUp, CaretDown, Clock } from '@phosphor-icons/react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const DTP_W = 272;
const DTP_H = 316;

export function DateTimePicker({ value, onChange }) {
  const [open, setOpen]     = useState(false);
  const [popPos, setPopPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  const parsed = value ? new Date(value) : null;
  const [viewYear,  setViewYear]  = useState(() => parsed?.getFullYear()  ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsed?.getMonth()     ?? new Date().getMonth());
  const [hour,   setHour]   = useState(() => parsed ? String(parsed.getHours()).padStart(2,'0')   : '08');
  const [minute, setMinute] = useState(() => parsed ? String(parsed.getMinutes()).padStart(2,'0') : '00');

  const selectedDateStr = value ? value.slice(0, 10) : '';
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };

  const recalcPos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const top  = spaceBelow > DTP_H + 8 ? r.bottom + 6 : r.top - DTP_H - 6;
    const left = Math.min(r.left, window.innerWidth - DTP_W - 8);
    setPopPos({ top: Math.max(8, top), left: Math.max(8, left) });
  };

  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', recalcPos);
    window.addEventListener('scroll', recalcPos, true);
    return () => { window.removeEventListener('resize', recalcPos); window.removeEventListener('scroll', recalcPos, true); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleOpen = () => {
    const p = value ? new Date(value) : null;
    setViewYear(p?.getFullYear() ?? new Date().getFullYear());
    setViewMonth(p?.getMonth() ?? new Date().getMonth());
    setHour(p ? String(p.getHours()).padStart(2,'0') : '08');
    setMinute(p ? String(p.getMinutes()).padStart(2,'0') : '00');
    recalcPos(); setOpen(true);
  };

  const selectDay = (day) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const h  = String(Math.min(23, Math.max(0, Number(hour)))).padStart(2,'0');
    const m  = String(Math.min(59, Math.max(0, Number(minute)))).padStart(2,'0');
    onChange(`${viewYear}-${mm}-${dd}T${h}:${m}`);
  };

  const applyTime = (h, m) => {
    if (!selectedDateStr) return;
    const hh = String(Math.min(23, Math.max(0, Number(h)))).padStart(2,'0');
    const mm = String(Math.min(59, Math.max(0, Number(m)))).padStart(2,'0');
    onChange(`${selectedDateStr}T${hh}:${mm}`);
  };

  const formatDisplay = () => {
    if (!value) return null;
    const d = new Date(value);
    return d.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekDay = new Date(viewYear, viewMonth, 1).getDay();

  return (
    <>
      <button ref={btnRef} type="button" onClick={handleOpen}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-500 hover:border-slate-300 dark:hover:border-slate-600">
        <CalendarBlank size={15} weight="bold" className="text-slate-400 dark:text-slate-500 shrink-0" />
        {value
          ? <span className="flex-1 text-slate-900 dark:text-slate-100 font-semibold">{formatDisplay()}</span>
          : <span className="flex-1 text-slate-400 dark:text-slate-500">No expiration — never expires</span>}
        {value && (
          <span role="button" tabIndex={0}
            onClick={e => { e.stopPropagation(); onChange(''); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onChange(''); } }}
            className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors shrink-0">
            <XCircle size={16} weight="fill" />
          </span>
        )}
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div style={{ position: 'fixed', top: popPos.top, left: popPos.left, width: DTP_W, zIndex: 9999 }}
            className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-dark-border">
              <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors"><CaretLeft size={13} weight="bold" /></button>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 select-none">{MONTHS[viewMonth]} {viewYear}</span>
              <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors"><CaretRight size={13} weight="bold" /></button>
            </div>
            <div className="px-2 pt-2 pb-1">
              <div className="grid grid-cols-7">
                {DAYS_SHORT.map(d => <div key={d} className="h-7 flex items-center justify-center text-[10px] font-black text-slate-400 dark:text-slate-500 select-none">{d}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: firstWeekDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const mm  = String(viewMonth + 1).padStart(2, '0');
                  const dd  = String(day).padStart(2, '0');
                  const dateStr    = `${viewYear}-${mm}-${dd}`;
                  const isSelected = selectedDateStr === dateStr;
                  const isToday    = todayStr === dateStr;
                  return (
                    <div key={day} className="flex items-center justify-center">
                      <button type="button" onClick={() => selectDay(day)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors select-none ${isSelected ? 'bg-indigo-600 text-white shadow-sm' : isToday ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                        {day}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-3 py-2 border-t border-slate-100 dark:border-dark-border bg-slate-50/60 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Clock size={13} weight="bold" className="text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Time</span>
                <div className="ml-auto flex items-center gap-2">
                  {[{ state: hour, setState: setHour, wrap: 24 }, { state: minute, setState: setMinute, wrap: 60 }].map((field, fi) => (
                    <React.Fragment key={fi}>
                      {fi > 0 && <span className="text-sm font-black text-slate-400 dark:text-slate-500 select-none">:</span>}
                      <div className="flex items-center border border-slate-200 dark:border-dark-border rounded-lg overflow-hidden bg-white dark:bg-dark-base">
                        <span className="w-9 text-center text-sm font-bold text-slate-900 dark:text-slate-100 py-1 select-none tabular-nums">{String(field.state).padStart(2,'0')}</span>
                        <div className="flex flex-col border-l border-slate-200 dark:border-dark-border">
                          <button type="button" onClick={() => { const v = String((Number(field.state)+1)%field.wrap).padStart(2,'0'); field.setState(v); fi === 0 ? applyTime(v,minute) : applyTime(hour,v); }} className="px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-indigo-600 transition-colors leading-none"><CaretUp size={10} weight="bold" /></button>
                          <div className="h-px bg-slate-200 dark:bg-dark-border" />
                          <button type="button" onClick={() => { const v = String((Number(field.state)+field.wrap-1)%field.wrap).padStart(2,'0'); field.setState(v); fi === 0 ? applyTime(v,minute) : applyTime(hour,v); }} className="px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-indigo-600 transition-colors leading-none"><CaretDown size={10} weight="bold" /></button>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-3 py-2 border-t border-slate-100 dark:border-dark-border flex items-center justify-between">
              <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors">Clear</button>
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Done</button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
