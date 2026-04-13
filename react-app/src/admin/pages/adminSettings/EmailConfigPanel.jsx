import React from 'react';
import { EnvelopeSimple, FloppyDisk, PaperPlaneTilt, Clock } from '@phosphor-icons/react';
import { SettingsCard } from './SettingsUI.jsx';
import { DurationField } from './DurationField.jsx';
import { STATUS_TONE_CLASSES } from './settingsConstants.js';

export function EmailConfigPanel({ emailConfig, setEmailConfig, emailLoading, emailSaving, emailTesting, onSave, onTest }) {
  const emailStatusLabel = emailConfig.is_enabled && emailConfig.smtp_user && emailConfig.has_password ? 'Configured' : 'Not configured';
  const emailStatusTone  = emailConfig.is_enabled && emailConfig.smtp_user && emailConfig.has_password ? 'emerald' : 'amber';

  if (emailLoading) return (
    <SettingsCard icon={EnvelopeSimple} iconBg="bg-blue-100 dark:bg-blue-950/50" iconColor="text-blue-600 dark:text-blue-400"
      title="Email Configuration" description="Configure Gmail SMTP delivery for welcome emails, reminders, and portal-open notifications.">
      <div className="flex items-center justify-center h-32"><div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 animate-spin" /></div>
    </SettingsCard>
  );

  return (
    <SettingsCard icon={EnvelopeSimple} iconBg="bg-blue-100 dark:bg-blue-950/50" iconColor="text-blue-600 dark:text-blue-400"
      title="Email Configuration" description="Configure Gmail SMTP delivery for welcome emails, reminders, and portal-open notifications.">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900 dark:text-slate-100">SMTP Settings</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Use a Gmail or Google Workspace sender with an app password.</p>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-black whitespace-nowrap ${STATUS_TONE_CLASSES[emailStatusTone].badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_TONE_CLASSES[emailStatusTone].dot}`} />
          {emailStatusLabel}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'SMTP Host', key: 'smtp_host', placeholder: 'smtp.gmail.com' },
          { label: 'SMTP Port', key: 'smtp_port', type: 'number', min: 1, max: 65535 },
          { label: 'Sender Email', key: 'smtp_user', placeholder: 'aip-pir@deped.gov.ph' },
          { label: 'App Password', key: 'smtp_pass', type: 'password', placeholder: emailConfig.has_password ? 'Saved password will be kept unless replaced' : 'Gmail app password' },
        ].map(f => (
          <div key={f.key} className={f.key === 'smtp_pass' || f.key === 'smtp_user' ? '' : ''}>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">{f.label}</label>
            <input type={f.type ?? 'text'} min={f.min} max={f.max} value={emailConfig[f.key]} placeholder={f.placeholder}
              onChange={e => setEmailConfig(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
          </div>
        ))}
        <div className="md:col-span-2">
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Sender Display Name</label>
          <input value={emailConfig.from_name} onChange={e => setEmailConfig(prev => ({ ...prev, from_name: e.target.value }))} placeholder="AIP-PIR System"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-base/70 px-4 py-3">
        <div>
          <p className="text-sm font-black text-slate-900 dark:text-slate-100">Email sending</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Enable or disable all outbound email delivery without removing the saved SMTP credentials.</p>
        </div>
        <button onClick={() => setEmailConfig(prev => ({ ...prev, is_enabled: !prev.is_enabled }))} className="flex items-center gap-3">
          <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${emailConfig.is_enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${emailConfig.is_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <span className="text-xs font-black text-slate-700 dark:text-slate-200">{emailConfig.is_enabled ? 'Enabled' : 'Disabled'}</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onSave} disabled={emailSaving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors">
          {emailSaving ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <FloppyDisk size={15} weight="bold" />}
          {emailSaving ? 'Saving…' : 'Save Email Settings'}
        </button>
        <button onClick={onTest} disabled={emailTesting} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-dark-base dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-colors">
          {emailTesting ? <span className="w-4 h-4 rounded-full border-2 border-slate-400/40 border-t-slate-500 animate-spin" /> : <PaperPlaneTilt size={15} weight="bold" />}
          {emailTesting ? 'Sending Test…' : 'Send Test Email'}
        </button>
      </div>
    </SettingsCard>
  );
}

export function MagicLinkPanel({ emailLoading, emailSaving, ttlInputs, setTtlInputs, onSave }) {
  return (
    <SettingsCard icon={Clock} iconBg="bg-amber-100 dark:bg-amber-950/50" iconColor="text-amber-600 dark:text-amber-400"
      title="Magic Link Settings" description="Set how long each type of magic link remains valid.">
      {emailLoading ? (
        <div className="flex items-center justify-center h-28"><div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-amber-500 animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            <DurationField label="Login" description="Standard magic link for email-based sign-in." value={ttlInputs.login} onChange={next => setTtlInputs(prev => ({ ...prev, login: next }))} />
            <DurationField label="Welcome" description="Magic link included in welcome emails for newly created accounts." value={ttlInputs.welcome} onChange={next => setTtlInputs(prev => ({ ...prev, welcome: next }))} />
            <DurationField label="Deadline Reminder" description="Magic link included in deadline reminder emails." value={ttlInputs.reminder} onChange={next => setTtlInputs(prev => ({ ...prev, reminder: next }))} />
          </div>
          <div className="flex justify-end">
            <button onClick={onSave} disabled={emailSaving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors">
              <FloppyDisk size={15} weight="bold" />Save TTLs
            </button>
          </div>
        </>
      )}
    </SettingsCard>
  );
}
