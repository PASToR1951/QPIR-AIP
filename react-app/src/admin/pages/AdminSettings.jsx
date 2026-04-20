import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import api from '../../lib/api.js';
import {
  CheckCircle, Database, Gear, Users, Buildings, BookOpen,
  Palette, EnvelopeSimple, Key, PaperPlaneTilt, Megaphone,
  ClockCounterClockwise,
} from '@phosphor-icons/react';
import { Spinner } from '../components/Spinner.jsx';
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

const AdminSessions = lazy(() => import('./AdminSessions.jsx'));
const AdminLogs     = lazy(() => import('./AdminLogs.jsx'));
const AdminBackups  = lazy(() => import('./AdminBackups.jsx'));

const SECTIONS = [
  { key: 'branding',      label: 'App Branding',        desc: 'Logo & appearance',       Icon: Palette              },
  { key: 'email-config',  label: 'Email Configuration', desc: 'SMTP delivery setup',     Icon: EnvelopeSimple       },
  { key: 'magic-links',   label: 'Magic Links',         desc: 'Link expiry times',       Icon: Key                  },
  { key: 'recipients',    label: 'Recipients Directory',desc: 'Active email recipients', Icon: Users                },
  { key: 'email-blast',   label: 'Portal Notification', desc: 'Broadcast to users',      Icon: PaperPlaneTilt       },
  { key: 'announcements', label: 'Announcement',        desc: 'System-wide banners',     Icon: Megaphone            },
  { key: 'system',        label: 'System Info',         desc: 'Deployment snapshot',     Icon: Database             },
];

const SUB_SECTIONS = [
  { key: 'sessions', label: 'Sessions',   desc: 'Active user sessions', Icon: Key,                   },
  { key: 'logs',     label: 'Audit Logs', desc: 'Admin activity trail', Icon: ClockCounterClockwise, badge: 'Beta' },
  { key: 'backups',  label: 'Backups',    desc: 'Database snapshots',   Icon: Database,              badge: 'Beta' },
];

function NavBtn({ sectionKey, label, desc, Icon, badge, activeSection, onSelect }) {
  const isActive = activeSection === sectionKey;
  return (
    <button
      onClick={() => onSelect(sectionKey)}
      className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
        isActive
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
      }`}
    >
      <Icon size={15} weight={isActive ? 'fill' : 'regular'} className="shrink-0 mt-0.5" />
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="text-sm font-medium leading-tight">{label}</span>
          {badge && <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">{badge}</span>}
        </span>
        {desc && <span className="block text-xs text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{desc}</span>}
      </span>
    </button>
  );
}

export default function AdminSettings() {
  const [activeSection, setActiveSection] = useState('branding');

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
        <div className="flex items-center justify-center h-64"><Spinner /></div>
      ) : (
        <div className="flex gap-6 w-full">

          {/* Left sidebar nav */}
          <div className="w-48 shrink-0 sticky top-0 self-start">
            <div className="flex items-center gap-2 mb-4">
              <Gear size={15} weight="fill" className="text-slate-400 dark:text-slate-500" />
              <h1 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">Settings</h1>
            </div>
            <nav className="space-y-0.5">
              {SECTIONS.map(({ key, label, desc, Icon }) => (
                <NavBtn key={key} sectionKey={key} label={label} desc={desc} Icon={Icon} activeSection={activeSection} onSelect={setActiveSection} />
              ))}
              <div className="my-2 border-t border-slate-200 dark:border-dark-border" />
              {SUB_SECTIONS.map(({ key, label, desc, Icon, badge }) => (
                <NavBtn key={key} sectionKey={key} label={label} desc={desc} Icon={Icon} badge={badge} activeSection={activeSection} onSelect={setActiveSection} />
              ))}
            </nav>
          </div>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            {activeSection === 'branding' && (
              <BrandingPanel appLogo={appLogo} logoFileRef={logoFileRef} logoUploading={logoUploading} logoResetting={logoResetting} onUpload={handleLogoUpload} onReset={handleLogoReset} />
            )}
            {activeSection === 'email-config' && (
              <EmailConfigPanel
                emailConfig={emailSettings.emailConfig} setEmailConfig={emailSettings.setEmailConfig}
                emailLoading={emailSettings.emailLoading} emailSaving={emailSettings.emailSaving} emailTesting={emailSettings.emailTesting}
                onSave={emailSettings.handleSaveEmailConfig} onTest={emailSettings.handleSendTestEmail} />
            )}
            {activeSection === 'magic-links' && (
              <MagicLinkPanel
                emailLoading={emailSettings.emailLoading} emailSaving={emailSettings.emailSaving}
                ttlInputs={emailSettings.ttlInputs} setTtlInputs={emailSettings.setTtlInputs}
                onSave={emailSettings.handleSaveEmailConfig} />
            )}
            {activeSection === 'recipients' && (
              <RecipientsPanel
                emailLoading={emailSettings.emailLoading}
                recipientsData={emailSettings.recipientsData}
                recipientRoleFilter={emailSettings.recipientRoleFilter}
                setRecipientRoleFilter={emailSettings.setRecipientRoleFilter}
                filteredRecipients={emailSettings.filteredRecipients} />
            )}
            {activeSection === 'email-blast' && (
              <EmailBlastPanel
                emailLoading={emailSettings.emailLoading}
                blastForm={emailSettings.blastForm} setBlastForm={emailSettings.setBlastForm}
                recipientsData={emailSettings.recipientsData}
                blastSending={emailSettings.blastSending} blastProgress={emailSettings.blastProgress}
                blastHistory={emailSettings.blastHistory}
                estimatedBlastRecipients={emailSettings.estimatedBlastRecipients}
                onToggleRole={emailSettings.handleToggleBlastRole}
                onSend={emailSettings.handleSendPortalBlast} />
            )}
            {activeSection === 'announcements' && (
              <AnnouncementPanel {...announcementEditor} />
            )}
            {activeSection === 'system' && (
              <SettingsCard icon={Database} iconBg="bg-slate-100 dark:bg-slate-800/60" iconColor="text-slate-500 dark:text-slate-400"
                title="System Information" description="Read-only snapshot of the current deployment.">
                <div className="grid grid-cols-2 gap-3">
                  <StatTile icon={Users}     label="Total Users"    value={sysInfo?.userCount    ?? '—'} />
                  <StatTile icon={Buildings} label="Total Schools"  value={sysInfo?.schoolCount  ?? '—'} />
                  <StatTile icon={BookOpen}  label="Total Programs" value={sysInfo?.programCount ?? '—'} />
                  <StatTile icon={Database}  label="App Version"    value={`v${CURRENT_VERSION}`} sub={`FY ${new Date().getFullYear()} · Deadlines managed in Deadlines page`} />
                </div>
              </SettingsCard>
            )}
            {(activeSection === 'sessions' || activeSection === 'logs' || activeSection === 'backups') && (
              <Suspense fallback={<div className="flex items-center justify-center h-64"><Spinner /></div>}>
                {activeSection === 'sessions' && <AdminSessions />}
                {activeSection === 'logs'     && <AdminLogs />}
                {activeSection === 'backups'  && <AdminBackups />}
              </Suspense>
            )}
          </div>

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
