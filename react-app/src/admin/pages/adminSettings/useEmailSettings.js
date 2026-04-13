import { useState } from 'react';
import api, { API } from '../../../lib/api.js';
import { readSSEJsonStream } from '../../../lib/readSSEStream.js';
import { EMPTY_EMAIL_CONFIG, DEFAULT_BLAST_FORM, minutesToDurationInput, durationInputToMinutes } from './settingsConstants.js';

export function useEmailSettings({ showToast }) {
  const [emailConfig, setEmailConfig] = useState(EMPTY_EMAIL_CONFIG);
  const [ttlInputs, setTtlInputs] = useState({
    login:   minutesToDurationInput(EMPTY_EMAIL_CONFIG.magic_link_ttl_login),
    welcome: minutesToDurationInput(EMPTY_EMAIL_CONFIG.magic_link_ttl_welcome),
    reminder:minutesToDurationInput(EMPTY_EMAIL_CONFIG.magic_link_ttl_reminder),
  });
  const [emailLoading, setEmailLoading]   = useState(true);
  const [emailSaving, setEmailSaving]     = useState(false);
  const [emailTesting, setEmailTesting]   = useState(false);
  const [recipientsData, setRecipientsData] = useState({ total: 0, groups: [], recipients: [] });
  const [recipientRoleFilter, setRecipientRoleFilter] = useState('All');
  const [blastForm, setBlastForm]         = useState(DEFAULT_BLAST_FORM);
  const [blastHistory, setBlastHistory]   = useState([]);
  const [blastSending, setBlastSending]   = useState(false);
  const [blastProgress, setBlastProgress] = useState({ running: false, total: 0, sent: 0, failed: 0, skipped: 0, items: [], error: '' });

  const applyEmailConfig = (config) => {
    const next = { ...EMPTY_EMAIL_CONFIG, ...config, smtp_pass: config?.smtp_pass ?? '', has_password: Boolean(config?.has_password) };
    setEmailConfig(next);
    setTtlInputs({ login: minutesToDurationInput(next.magic_link_ttl_login), welcome: minutesToDurationInput(next.magic_link_ttl_welcome), reminder: minutesToDurationInput(next.magic_link_ttl_reminder) });
  };

  const loadEmailAdminData = async () => {
    setEmailLoading(true);
    try {
      const [configRes, recipientsRes, historyRes] = await Promise.all([
        api.get('/api/admin/settings/email-config'),
        api.get('/api/admin/email-recipients'),
        api.get('/api/admin/email-blast/history'),
      ]);
      applyEmailConfig(configRes.data);
      setRecipientsData(recipientsRes.data ?? { total: 0, groups: [], recipients: [] });
      setBlastHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
    } catch (error) {
      console.error(error);
      showToast(error.friendlyMessage ?? 'Failed to load email settings.', 'error');
    } finally { setEmailLoading(false); }
  };

  const handleSaveEmailConfig = async () => {
    const loginMinutes   = durationInputToMinutes(ttlInputs.login);
    const welcomeMinutes = durationInputToMinutes(ttlInputs.welcome);
    const reminderMinutes = durationInputToMinutes(ttlInputs.reminder);
    if (!loginMinutes || !welcomeMinutes || !reminderMinutes) { showToast('Magic-link durations must be valid positive numbers.', 'error'); return; }
    setEmailSaving(true);
    try {
      const { data } = await api.put('/api/admin/settings/email-config', { smtp_host: emailConfig.smtp_host, smtp_port: Number(emailConfig.smtp_port), smtp_user: emailConfig.smtp_user, smtp_pass: emailConfig.smtp_pass, from_name: emailConfig.from_name, is_enabled: emailConfig.is_enabled, magic_link_ttl_login: loginMinutes, magic_link_ttl_welcome: welcomeMinutes, magic_link_ttl_reminder: reminderMinutes });
      applyEmailConfig(data);
      showToast('Email settings saved.');
    } catch (error) { showToast(error.friendlyMessage ?? 'Failed to save email settings.', 'error'); }
    finally { setEmailSaving(false); }
  };

  const handleSendTestEmail = async () => {
    setEmailTesting(true);
    try { const { data } = await api.post('/api/admin/settings/email-config/test'); showToast(`Test email sent to ${data.target}.`); }
    catch (error) { showToast(error.friendlyMessage ?? 'Test email failed.', 'error'); }
    finally { setEmailTesting(false); }
  };

  const handleToggleBlastRole = (role) => {
    setBlastForm(prev => ({ ...prev, target_roles: prev.target_roles.includes(role) ? prev.target_roles.filter(r => r !== role) : [...prev.target_roles, role] }));
  };

  const handleSendPortalBlast = async () => {
    if (!blastForm.label.trim()) { showToast('Enter a period label before sending the blast.', 'error'); return; }
    setBlastSending(true);
    setBlastProgress({ running: true, total: 0, sent: 0, failed: 0, skipped: 0, items: [], error: '' });
    try {
      const response = await fetch(`${API}/api/admin/email-blast`, {
        method: 'POST', credentials: 'include',
        headers: { 'Accept': 'text/event-stream', 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: blastForm.type, label: blastForm.label, target_roles: blastForm.target_roles }),
      });
      await readSSEJsonStream(response, (payload) => {
        if (payload.type === 'started') { setBlastProgress(prev => ({ ...prev, running: true, total: payload.total ?? prev.total })); return; }
        if (payload.type === 'item') {
          setBlastProgress(prev => {
            const idx = prev.items.findIndex(i => i.user_id === payload.user_id);
            const nextItems = idx === -1 ? [...prev.items, payload] : prev.items.map((i, n) => n === idx ? payload : i);
            const counts = nextItems.reduce((acc, i) => { if (i.status === 'sent') acc.sent++; else if (i.status === 'failed') acc.failed++; else acc.skipped++; return acc; }, { sent: 0, failed: 0, skipped: 0 });
            return { ...prev, items: nextItems, ...counts };
          }); return;
        }
        if (payload.type === 'complete') { setBlastProgress(prev => ({ ...prev, running: false, total: payload.total ?? prev.total, sent: payload.sent ?? prev.sent, failed: payload.failed ?? prev.failed, skipped: payload.skipped ?? prev.skipped })); }
      });
      const historyRes = await api.get('/api/admin/email-blast/history');
      setBlastHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      showToast('Portal-open email batch finished.');
    } catch (error) {
      setBlastProgress(prev => ({ ...prev, running: false, error: error.message || 'Portal-open email batch failed.' }));
      showToast(error.message || 'Portal-open email batch failed.', 'error');
    } finally { setBlastSending(false); }
  };

  const filteredRecipients = recipientRoleFilter === 'All' ? recipientsData.recipients : recipientsData.recipients.filter(r => r.role === recipientRoleFilter);
  const estimatedBlastRecipients = recipientsData.recipients.filter(r => blastForm.target_roles.includes(r.role)).length;

  return {
    emailConfig, setEmailConfig, ttlInputs, setTtlInputs,
    emailLoading, emailSaving, emailTesting,
    recipientsData, recipientRoleFilter, setRecipientRoleFilter,
    blastForm, setBlastForm, blastHistory, blastSending, blastProgress,
    filteredRecipients, estimatedBlastRecipients,
    loadEmailAdminData, handleSaveEmailConfig, handleSendTestEmail,
    handleToggleBlastRole, handleSendPortalBlast,
  };
}
