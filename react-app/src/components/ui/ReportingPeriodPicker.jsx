import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReportingPeriod } from '../../context/ReportingPeriodContext.jsx';
import { ArrowClockwise, CalendarBlank, CaretDown, CheckCircle } from '@phosphor-icons/react';

const QUARTER_LABELS = {
  1: '1st Quarter',
  2: '2nd Quarter',
  3: '3rd Quarter',
  4: '4th Quarter',
};

function PeriodMenu({ ariaLabel, value, options, disabled, onSelect }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  const toggleMenu = () => {
    if (disabled || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const width = Math.max(rect.width, 118);
    setDropPos({
      width,
      left: Math.min(Math.max(8, rect.left), window.innerWidth - width - 8),
      top: rect.bottom + 6,
    });
    setOpen((current) => !current);
  };

  useEffect(() => {
    if (!open) return undefined;

    const close = (event) => {
      if (
        buttonRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };
    const closeOnViewportChange = () => setOpen(false);

    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', closeOnViewportChange, true);
    window.addEventListener('resize', closeOnViewportChange);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', closeOnViewportChange, true);
      window.removeEventListener('resize', closeOnViewportChange);
    };
  }, [open]);

  return (
    <div className="relative h-8 shrink-0">
      <button
        type="button"
        ref={buttonRef}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleMenu}
        disabled={disabled}
        className="inline-flex h-full items-center gap-2 rounded-md border border-transparent bg-transparent py-1 pl-2 pr-2 text-sm font-black leading-none text-slate-800 outline-none transition-colors hover:bg-slate-100 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-100 dark:hover:bg-white/10 dark:focus:border-indigo-400/40 dark:focus:bg-white/10"
      >
        <span>{selectedOption?.label}</span>
        <CaretDown
          size={12}
          weight="bold"
          className={`text-slate-400 transition-transform dark:text-slate-500 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && dropPos && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: dropPos.left,
            top: dropPos.top,
            width: dropPos.width,
            zIndex: 9999,
          }}
          className="overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl shadow-slate-950/15 dark:border-white/10 dark:bg-dark-surface dark:shadow-black/30"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-bold transition-colors ${
                  selected
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                }`}
              >
                <span className="flex min-w-0 flex-col">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      {option.description}
                    </span>
                  )}
                </span>
                {selected && <CheckCircle size={14} weight="fill" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

export function ReportingPeriodPicker() {
  const {
    selectedYear,
    selectedQuarter,
    selectedQuarterLabel,
    isLivePeriod,
    availableYears,
    periodOptionsLoading,
    getAvailableQuartersForYear,
    setReportingPeriod,
    resetToLivePeriod
  } = useReportingPeriod();

  const yearOptions = availableYears?.includes(selectedYear)
    ? availableYears
    : [selectedYear, ...(availableYears ?? [])].sort((left, right) => right - left);
  const quarterOptions = getAvailableQuartersForYear?.(selectedYear) ?? [];
  const visibleQuarterOptions = quarterOptions.includes(selectedQuarter)
    ? quarterOptions
    : [selectedQuarter, ...quarterOptions].filter((quarter, index, list) => list.indexOf(quarter) === index);
  const handleYearChange = (year) => {
    const quarters = getAvailableQuartersForYear?.(year) ?? [];
    setReportingPeriod({
      year,
      quarter: quarters.includes(selectedQuarter) ? selectedQuarter : (quarters[0] ?? selectedQuarter),
    });
  };
  const yearSelectOptions = yearOptions.map((year) => ({ value: year, label: `FY ${year}` }));
  const quarterSelectOptions = visibleQuarterOptions.map((quarter) => ({
    value: quarter,
    label: `Q${quarter}`,
    description: QUARTER_LABELS[quarter] ?? `Quarter ${quarter}`,
  }));
  const statusLabel = isLivePeriod ? 'Live' : 'Demo Period';

  return (
    <div
      className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/80 px-1.5 text-slate-700 shadow-sm shadow-slate-950/5 backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:shadow-black/20"
      title={`Viewing ${selectedQuarterLabel}`}
    >
      <div className={`hidden h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 sm:flex dark:bg-white/10 dark:text-slate-300 ${periodOptionsLoading ? 'animate-pulse' : ''}`}>
        <CalendarBlank size={16} weight="bold" />
      </div>

      <div className="flex items-center gap-1 rounded-md bg-slate-50/80 p-0.5 dark:bg-black/10">
        <PeriodMenu
          ariaLabel="Fiscal year"
          value={selectedYear}
          onSelect={handleYearChange}
          options={yearSelectOptions}
        />
        <div className="h-5 w-px bg-slate-200 dark:bg-white/10" />
        <PeriodMenu
          ariaLabel="Quarter"
          value={selectedQuarter}
          onSelect={(quarter) => setReportingPeriod({ year: selectedYear, quarter })}
          disabled={periodOptionsLoading && visibleQuarterOptions.length === 0}
          options={quarterSelectOptions}
        />
      </div>

      <div className="hidden h-6 w-px bg-slate-200 dark:bg-white/10 sm:block" />

      <span
        className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-black ${
          isLivePeriod
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200'
        }`}
      >
        {isLivePeriod && <CheckCircle size={13} weight="fill" />}
        <span className="hidden sm:inline">{statusLabel}</span>
        <span className="sm:hidden">{isLivePeriod ? 'Live' : 'Demo'}</span>
      </span>

      {!isLivePeriod && (
        <button
          type="button"
          onClick={resetToLivePeriod}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-black text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:border-indigo-400/30 dark:hover:bg-indigo-400/15 dark:hover:text-indigo-100"
        >
          <ArrowClockwise size={12} weight="bold" />
          <span className="hidden sm:inline">Live</span>
        </button>
      )}
    </div>
  );
}
