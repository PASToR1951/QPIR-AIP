import React from 'react';
import { Users, Buildings, PaperPlaneTilt } from '@phosphor-icons/react';
import { Spinner } from '../../components/Spinner.jsx';
import { SettingsCard, StatTile } from './SettingsUI.jsx';
import { StreamProgressCard } from './StreamProgressCard.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { formatDateTime } from './settingsConstants.js';

export function RecipientsPanel({ emailLoading, recipientsData, recipientRoleFilter, setRecipientRoleFilter, filteredRecipients }) {
  return (
    <SettingsCard icon={Users} iconBg="bg-emerald-100 dark:bg-emerald-950/50" iconColor="text-emerald-600 dark:text-emerald-400"
      title="Recipients Directory" description="Review the active users who can receive broadcast or reminder emails.">
      {emailLoading ? (
        <div className="flex items-center justify-center h-28"><Spinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile icon={Users} label="Recipients" value={recipientsData.total ?? 0} />
            {recipientsData.groups.slice(0, 3).map(g => <StatTile key={g.role} icon={Buildings} label={g.role} value={g.count} />)}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setRecipientRoleFilter('All')} className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${recipientRoleFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}>All ({recipientsData.total ?? 0})</button>
            {recipientsData.groups.map(g => (
              <button key={g.role} onClick={() => setRecipientRoleFilter(g.role)} className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${recipientRoleFilter === g.role ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}>{g.role} ({g.count})</button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-dark-border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-dark-base"><tr className="text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{['Name','Email','Role','Affiliation'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {filteredRecipients.map(r => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{r.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{r.email}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.role} size="xs" /></td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.affiliation}</td>
                  </tr>
                ))}
                {!filteredRecipients.length && <tr><td colSpan="4" className="px-4 py-6 text-center text-sm text-slate-400">No recipients match the selected role filter.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </SettingsCard>
  );
}

export function EmailBlastPanel({ emailLoading, blastForm, setBlastForm, recipientsData, blastSending, blastProgress, blastHistory, estimatedBlastRecipients, onToggleRole, onSend }) {
  return (
    <SettingsCard icon={PaperPlaneTilt} iconBg="bg-violet-100 dark:bg-violet-950/50" iconColor="text-violet-600 dark:text-violet-400"
      title="Portal Open Notification" description="Send a seasonal announcement that the AIP or PIR portal is now open.">
      {emailLoading ? (
        <div className="flex items-center justify-center h-28"><Spinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Notification Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['aip','pir'].map(t => (
                  <button key={t} onClick={() => setBlastForm(prev => ({ ...prev, type: t }))}
                    className={`px-4 py-2 rounded-xl text-sm font-black border transition-colors ${blastForm.type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-dark-base text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border hover:border-indigo-300'}`}>
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Period Label</label>
              <input value={blastForm.label} onChange={e => setBlastForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder={blastForm.type === 'aip' ? '2027' : '2nd Quarter CY 2026'}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Target Roles</p>
            <div className="flex flex-wrap gap-2">
              {recipientsData.groups.map(g => {
                const checked = blastForm.target_roles.includes(g.role);
                return (
                  <button key={g.role} onClick={() => onToggleRole(g.role)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${checked ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-dark-base text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border hover:border-indigo-300'}`}>
                    {g.role} ({g.count})
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-base/70 px-4 py-3">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">Estimated recipients</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Current selection will send to {estimatedBlastRecipients} active user{estimatedBlastRecipients === 1 ? '' : 's'}.</p>
            </div>
            <button onClick={onSend} disabled={blastSending || blastForm.target_roles.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors">
              {blastSending ? <Spinner size="sm" variant="white" /> : <PaperPlaneTilt size={15} weight="bold" />}
              {blastSending ? 'Sending…' : `Send to ${estimatedBlastRecipients} users`}
            </button>
          </div>
          {(blastProgress.running || blastProgress.items.length > 0 || blastProgress.error) && (
            <StreamProgressCard title="Portal Open Email Batch" progress={blastProgress} />
          )}
          <div>
            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Recent Blasts</p>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-dark-border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-dark-base"><tr className="text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{['Type','Label','Recipients','Sent At'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                  {blastHistory.map(e => (
                    <tr key={e.blast_key}>
                      <td className="px-4 py-3"><StatusBadge status={e.blast_type?.toUpperCase?.() || e.blast_type} size="xs" /></td>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{e.blast_label}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{e.recipient_count}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDateTime(e.sent_at)}</td>
                    </tr>
                  ))}
                  {!blastHistory.length && <tr><td colSpan="4" className="px-4 py-6 text-center text-sm text-slate-400">No portal-open email blasts have been sent yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </SettingsCard>
  );
}
