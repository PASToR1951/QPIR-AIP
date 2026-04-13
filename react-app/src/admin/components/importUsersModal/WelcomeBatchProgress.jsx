import React from 'react';

export function WelcomeBatchProgress({ progress, results }) {
  const completed = progress.sent + progress.failed + progress.skipped;
  const percent = progress.total > 0 ? Math.round((completed / progress.total) * 100) : 0;

  return (
    <div className="space-y-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/70 dark:bg-indigo-950/15 p-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-500 dark:text-indigo-400">Welcome Emails</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {progress.running ? 'Sending account invitations…' : 'Welcome email batch'}
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {completed} of {progress.total || results?.created_user_ids?.length || 0}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/80 dark:bg-dark-base overflow-hidden border border-indigo-100 dark:border-indigo-900/30">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
          Do not close this window while the email batch is running.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Sent', value: progress.sent, tone: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Skipped', value: progress.skipped, tone: 'text-amber-600 dark:text-amber-400' },
          { label: 'Failed', value: progress.failed, tone: 'text-rose-600 dark:text-rose-400' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-white/80 dark:border-dark-border bg-white/80 dark:bg-dark-base px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">{card.label}</p>
            <p className={`mt-1 text-lg font-black ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {progress.error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-400">
          {progress.error}
        </div>
      )}

      {progress.items.length > 0 && (
        <div className="max-h-56 overflow-y-auto rounded-xl border border-white/80 dark:border-dark-border bg-white/80 dark:bg-dark-base">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-dark-base border-b border-slate-100 dark:border-dark-border">
              <tr className="text-left text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {progress.items.map((item) => {
                const tone = item.status === 'sent'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : item.status === 'failed'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-amber-600 dark:text-amber-400';

                return (
                  <tr key={`${item.user_id}-${item.email}`}>
                    <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{item.email || `User #${item.user_id}`}</td>
                    <td className={`px-3 py-2 font-black capitalize ${tone}`}>{item.status}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{item.error || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
