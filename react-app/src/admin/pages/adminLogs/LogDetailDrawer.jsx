import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XCircle, ClockCounterClockwise, WarningCircle, Info, User, LinkSimple, GlobeHemisphereWest } from '@phosphor-icons/react';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { formatActorPrimary, formatActorSecondary, formatEntityPrimary, formatEntitySecondary, formatManilaTimestamp, getSeverityBadgeClass, getSourceBadgeClass } from './formatters.js';

function DetailBlock({ icon: Icon, label, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-dark-border dark:bg-dark-base/70">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
        <Icon size={14} />
        {label}
      </div>
      <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
        {children}
      </div>
    </div>
  );
}

export function LogDetailDrawer({
  open,
  row,
  loading,
  error,
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]">
          <motion.button
            type="button"
            aria-label="Close details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l border-white/50 bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.45)] dark:border-dark-border dark:bg-dark-surface"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 dark:border-dark-border">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Log Detail
                </p>
                <h2 className="mt-1 truncate text-lg font-black text-slate-900 dark:text-slate-100">
                  {row?.action_label || 'Loading log entry'}
                </h2>
                {row && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {row.source} #{row.id} · {row.action}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-dark-border dark:hover:text-slate-200"
              >
                <XCircle size={24} weight="fill" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {loading ? (
                <div className="flex h-full min-h-[18rem] items-center justify-center">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500 dark:border-slate-600" />
                </div>
              ) : error ? (
                <div className="flex min-h-[18rem] flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                    <WarningCircle size={24} weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Entry unavailable</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{error}</p>
                  </div>
                </div>
              ) : row ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${getSourceBadgeClass(row.source)}`}>
                      {row.source === 'admin' ? 'Admin Action' : 'User Activity'}
                    </span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${getSeverityBadgeClass(row.severity)}`}>
                      {row.severity}
                    </span>
                    {row.actor?.role && <StatusBadge status={row.actor.role} size="xs" />}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <DetailBlock icon={ClockCounterClockwise} label="Timeline">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatManilaTimestamp(row.created_at)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Displayed in Asia/Manila
                      </p>
                    </DetailBlock>

                    <DetailBlock icon={Info} label="Action">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{row.action_label}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Key: {row.action} · Category: {row.category}
                      </p>
                    </DetailBlock>

                    <DetailBlock icon={User} label="Actor">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{formatActorPrimary(row.actor)}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formatActorSecondary(row.actor)}</p>
                      {row.actor?.id && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Actor id: {row.actor.id}
                        </p>
                      )}
                    </DetailBlock>

                    <DetailBlock icon={LinkSimple} label="Entity">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{formatEntityPrimary(row)}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formatEntitySecondary(row)}</p>
                    </DetailBlock>

                    <DetailBlock icon={GlobeHemisphereWest} label="IP Address">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{row.ip_address || 'No IP captured'}</p>
                    </DetailBlock>

                    <DetailBlock icon={Info} label="Preview">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {row.details_preview || 'No lightweight summary was generated for this entry.'}
                      </p>
                    </DetailBlock>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-4 text-slate-100 shadow-inner dark:border-dark-border">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      <Info size={14} />
                      Redacted Details
                    </div>
                    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-900/80 p-4 text-xs leading-6 text-slate-200">
                      {JSON.stringify(row.details ?? {}, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[18rem] flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-dark-border dark:text-slate-300">
                    <ClockCounterClockwise size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Select a log entry</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Choose any row in the table to inspect its full redacted payload.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export default LogDetailDrawer;
