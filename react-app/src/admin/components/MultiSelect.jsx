import { useState, useRef, useEffect } from 'react';
import { CaretDown, X, MagnifyingGlass } from '@phosphor-icons/react';

export const MultiSelect = ({ options = [], selected = [], onChange, placeholder = 'Select…', className = '' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options
    .filter(o => String(o.label).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => selected.includes(b.value) - selected.includes(a.value));

  const toggle = (val) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };

  const selectedLabels = options.filter(o => selected.includes(o.value));

  const handleOpen = () => {
    setOpen(v => !v);
    setQuery('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full min-h-[38px] flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-sm hover:border-indigo-400 transition-colors"
      >
        {selectedLabels.length === 0 ? (
          <span className="text-slate-400 dark:text-slate-500 font-medium">{placeholder}</span>
        ) : (
          selectedLabels.map(o => (
            <span key={o.value} className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-lg">
              {o.label}
              <span
                onClick={(e) => { e.stopPropagation(); toggle(o.value); }}
                className="hover:text-indigo-900 dark:hover:text-indigo-200"
              >
                <X size={12} />
              </span>
            </span>
          ))
        )}
        <CaretDown size={16} className={`ml-auto text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-dark-border">
            <div className="flex items-center gap-2 px-2">
              <MagnifyingGlass size={16} className="text-slate-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search…"
                className="flex-1 text-sm bg-transparent text-slate-900 dark:text-slate-100 outline-none placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">No results</p>
            ) : filtered.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                  selected.includes(o.value)
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                  selected.includes(o.value) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {selected.includes(o.value) && <span className="text-white text-[10px] font-black">✓</span>}
                </span>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
