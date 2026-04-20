import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, GraduationCap, MagnifyingGlass, X } from '@phosphor-icons/react';
import { Spinner } from './Spinner.jsx';
import api from '../../lib/api.js';

const LEVEL_LABELS = {
  Elementary: 'Elementary',
  Secondary: 'Secondary',
  Both: 'Elementary & Secondary',
  'Select Schools': 'Selected Schools',
  Division: 'Division',
};

export default function ProgramMembersModal({ open, program, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open || !program) return;
    setLoading(true);
    setData(null);
    setError('');
    setSearch('');
    api.get(`/api/admin/programs/${program.id}/members`)
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load schools. Please try again.'))
      .finally(() => setLoading(false));
  }, [open, program]);

  const schools = data?.schools ?? [];
  const q = search.toLowerCase();
  const filteredSchools = schools.filter(s =>
    s.name.toLowerCase().includes(q) ||
    (s.abbreviation && s.abbreviation.toLowerCase().includes(q))
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative z-10 flex items-start justify-center min-h-full p-3 py-4 sm:p-6 sm:py-10 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_64px_-8px_rgba(0,0,0,0.5)] w-full max-w-2xl flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-dark-border shrink-0">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0 mt-0.5">
                    <GraduationCap size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug">
                      Associated Schools
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {program?.title}
                      {program?.abbreviation ? ` · ${program.abbreviation}` : ''}
                      {program?.school_level_requirement ? ` · ${LEVEL_LABELS[program.school_level_requirement] ?? program.school_level_requirement}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0 -mr-1 mt-0.5"
                >
                  <XCircle size={22} weight="fill" />
                </button>
              </div>

              {/* Search */}
              <div className="px-6 pt-4 pb-2 shrink-0">
                <div className="relative">
                  <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search schools…"
                    className="w-full pl-8 pr-8 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="px-6 pb-4 overflow-y-auto min-h-0 flex-1">
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <Spinner />
                  </div>
                ) : error ? (
                  <p className="text-center text-sm text-rose-500 py-10">{error}</p>
                ) : filteredSchools.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <GraduationCap size={32} className="text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      {search ? 'No schools match your search.' : 'No schools found for this program.'}
                    </p>
                    {data?.restricted_count > 0 && !search && (
                      <p className="text-xs text-slate-400 dark:text-slate-600">
                        {data.restricted_count} school{data.restricted_count !== 1 ? 's' : ''} restricted from this program.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1 pt-1">
                    {data?.restricted_count > 0 && !search && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">
                        {filteredSchools.length} school{filteredSchools.length !== 1 ? 's' : ''} · {data.restricted_count} restricted
                      </p>
                    )}
                    {filteredSchools.map(school => (
                      <div
                        key={school.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-base hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                            <GraduationCap size={14} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{school.name}</p>
                            {school.abbreviation && (
                              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">{school.abbreviation}</p>
                            )}
                          </div>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide rounded-lg ${
                          school.level === 'Elementary'
                            ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400'
                            : 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400'
                        }`}>
                          {school.level}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end px-6 py-4 border-t border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-dark-base shrink-0 rounded-b-2xl">
                <button
                  onClick={onClose}
                  className="px-5 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-border rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
