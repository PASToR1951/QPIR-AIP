import React, { useState, useRef, useEffect } from 'react';
import { CaretDown, MagnifyingGlass, X } from '@phosphor-icons/react';

export const SearchableSelect = ({ options = [], value, onChange, placeholder = 'Select…', clearable = false, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o =>
    String(o.label).toLowerCase().includes(query.toLowerCase())
  );

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery(''); }}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 hover:border-indigo-400 transition-colors"
      >
        <span className={selected ? '' : 'text-slate-400 dark:text-slate-500'}>{selected?.label ?? placeholder}</span>
        <div className="flex items-center gap-1 shrink-0">
          {clearable && selected && (
            <span onClick={(e) => { e.stopPropagation(); onChange(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={14} />
            </span>
          )}
          <CaretDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-dark-border">
            <div className="flex items-center gap-2 px-2">
              <MagnifyingGlass size={14} className="text-slate-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search…"
                className="flex-1 text-sm bg-transparent text-slate-900 dark:text-slate-100 outline-none placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">No results</p>
            ) : filtered.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${o.value === value ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-border'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
