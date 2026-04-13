import React, { useEffect, useRef, useState } from 'react';
import api from '../../lib/api.js';
import { CheckCircle, Database, Gear, Users, Buildings, BookOpen } from '@phosphor-icons/react';
import { CURRENT_VERSION } from '../../version.js';
import { useAppLogo, useReloadBranding } from '../../context/BrandingContext.jsx';
import { announcementFromApi } from './adminSettings/settingsConstants.js';
import { SettingsCard, StatTile } from './adminSettings/SettingsUI.jsx';
import { BrandingPanel } from './adminSettings/BrandingPanel.jsx';
import { EmailConfigPanel, MagicLinkPanel } from './adminSettings/EmailConfigPanel.jsx';
import { RecipientsPanel, EmailBlastPanel } from './adminSettings/EmailBlastPanel.jsx';
import { AnnouncementPanel } from './adminSettings/AnnouncementPanel.jsx';
import { useAnnouncementEditor } from './adminSettings/useAnnouncementEditor.js';
import { useEmailSettings } from './adminSettings/useEmailSettings.js';

export default function AdminSettings() {
  const appLogo        = useAppLogo();
  const reloadBranding = useReloadBranding();
  const logoFileRef    = useRef(null);

  const [sysInfo, setSysInfo]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoResetting, setLogoResetting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const announcementEditor = useAnnouncementEditor({ showToast });
  const emailSettings = useEmailSettings({ showToast });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/api/admin/announcements'),
      api.get('/api/admin/settings/system-info'),
      api.get('/api/admin/settings/division-config'),
    ]).then(([ar, sr]) => {
      const loaded = announcementFromApi(ar.data);
      announcementEditor.setAnnouncement(loaded);
      announcementEditor.setSavedAnnouncement(loaded);
      setSysInfo(sr.data);
    }).catch(e => { console.error(e); setFetchError('Failed to load settings. Please refresh and try again.'); })
      .finally(() => setLoading(false));
    announcementEditor.loadMentionCandidates();
    emailSettings.loadEmailAdminData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogoUpload = async (file) => {
    setLogoUploading(true);
    const formData = new FormData();
    formData.append('logo', file);
    try { await api.post('/api/admin/settings/app-logo', formData); await reloadBranding(); showToast('App logo updated.'); }
    catch (e) { showToast(e.friendlyMessage ?? 'Upload failed.', 'error'); }
    finally { setLogoUploading(false); if (logoFileRef.current) logoFileRef.current.value = ''; }
  };

  const handleLogoReset = async () => {
    setLogoResetting(true);
    try { await api.delete('/api/admin/settings/app-logo'); await reloadBranding(); showToast('App logo reset to default.'); }
    catch (e) { showToast(e.friendlyMessage ?? 'Reset failed.', 'error'); }
    finally { setLogoResetting(false); }
  };

  return (
    <>
      {fetchError && <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 text-sm font-medium mb-4">{fetchError}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" /></div>
      ) : (
        <div className="space-y-3 max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Gear size={16} weight="fill" className="text-slate-400 dark:text-slate-500" />
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Settings</h1>
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500">Manage branding, announcements, email delivery, and deployment information.</p>
          </div>

          <BrandingPanel appLogo={appLogo} logoFileRef={logoFileRef} logoUploading={logoUploading} logoResetting={logoResetting} onUpload={handleLogoUpload} onReset={handleLogoReset} />

          <EmailConfigPanel
            emailConfig={emailSettings.emailConfig} setEmailConfig={emailSettings.setEmailConfig}
            emailLoading={emailSettings.emailLoading} emailSaving={emailSettings.emailSaving} emailTesting={emailSettings.emailTesting}
            onSave={emailSettings.handleSaveEmailConfig} onTest={emailSettings.handleSendTestEmail} />

          <MagicLinkPanel
            emailLoading={emailSettings.emailLoading} emailSaving={emailSettings.emailSaving}
            ttlInputs={emailSettings.ttlInputs} setTtlInputs={emailSettings.setTtlInputs}
            onSave={emailSettings.handleSaveEmailConfig} />

          <RecipientsPanel
            emailLoading={emailSettings.emailLoading}
            recipientsData={emailSettings.recipientsData}
            recipientRoleFilter={emailSettings.recipientRoleFilter}
            setRecipientRoleFilter={emailSettings.setRecipientRoleFilter}
            filteredRecipients={emailSettings.filteredRecipients} />

          <EmailBlastPanel
            emailLoading={emailSettings.emailLoading}
            blastForm={emailSettings.blastForm} setBlastForm={emailSettings.setBlastForm}
            recipientsData={emailSettings.recipientsData}
            blastSending={emailSettings.blastSending} blastProgress={emailSettings.blastProgress}
            blastHistory={emailSettings.blastHistory}
            estimatedBlastRecipients={emailSettings.estimatedBlastRecipients}
            onToggleRole={emailSettings.handleToggleBlastRole}
            onSend={emailSettings.handleSendPortalBlast} />

          <AnnouncementPanel {...announcementEditor} />

          <SettingsCard icon={Database} iconBg="bg-slate-100 dark:bg-slate-800/60" iconColor="text-slate-500 dark:text-slate-400"
            title="System Information" description="Read-only snapshot of the current deployment.">
            <div className="grid grid-cols-2 gap-3">
              <StatTile icon={Users}     label="Total Users"    value={sysInfo?.userCount    ?? '—'} />
              <StatTile icon={Buildings} label="Total Schools"  value={sysInfo?.schoolCount  ?? '—'} />
              <StatTile icon={BookOpen}  label="Total Programs" value={sysInfo?.programCount ?? '—'} />
              <StatTile icon={Database}  label="App Version"    value={`v${CURRENT_VERSION}`} sub={`FY ${new Date().getFullYear()} · Deadlines managed in Deadlines page`} />
            </div>
          </SettingsCard>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-bold ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'}`}>
          <CheckCircle size={18} weight="fill" className={toast.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} />
          {toast.msg}
        </div>
      )}
    </>
  );
}
