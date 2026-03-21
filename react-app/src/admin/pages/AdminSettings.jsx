import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FloppyDisk, Eye, Buildings, Users, BookOpen, Database } from '@phosphor-icons/react';
import { AdminLayout } from '../AdminLayout.jsx';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const TYPE_STYLES = {
  info: { banner: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-400', label: 'Info' },
  warning: { banner: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400', label: 'Warning' },
  critical: { banner: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-400', label: 'Critical' },
};

function Section({ title, children }) {
  return (
    <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {children}
    </div>
  );
}

export default function AdminSettings() {
  const [announcement, setAnnouncement] = useState({ message: '', type: 'info', is_active: true });
  const [sysInfo, setSysInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewEnabled, setPreviewEnabled] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API}/api/admin/announcements`, { headers: authHeaders() }),
      axios.get(`${API}/api/admin/settings/system-info`, { headers: authHeaders() }),
    ]).then(([ar, sr]) => {
      if (ar.data) setAnnouncement({ message: ar.data.message ?? '', type: ar.data.type ?? 'info', is_active: ar.data.is_active ?? true });
      setSysInfo(sr.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSaveAnnouncement = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/api/admin/announcements`, announcement, { headers: authHeaders() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const currentYear = new Date().getFullYear();

  return (
    <AdminLayout title="Settings" breadcrumbs={[{ label: 'Settings' }]}>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-5 max-w-2xl">

          {/* Section 1: Announcements */}
          <Section title="System Announcements">
            <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Announcement Message</label>
              <textarea
                value={announcement.message}
                onChange={e => setAnnouncement(a => ({ ...a, message: e.target.value }))}
                rows={3}
                placeholder="Type a message to display to all users…"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl resize-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Display Type</label>
                <div className="flex items-center gap-2">
                  {['info', 'warning', 'critical'].map(t => (
                    <button key={t} onClick={() => setAnnouncement(a => ({ ...a, type: t }))}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors capitalize ${announcement.type === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-400'}`}>
                      {TYPE_STYLES[t].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">Active</label>
                <button
                  onClick={() => setAnnouncement(a => ({ ...a, is_active: !a.is_active }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${announcement.is_active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${announcement.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <button
                onClick={() => setPreviewEnabled(!previewEnabled)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <Eye size={14} /> Preview
              </button>
            </div>

            {/* Live Preview */}
            {previewEnabled && announcement.message && (
              <div className={`border rounded-xl px-4 py-3 text-sm font-bold ${TYPE_STYLES[announcement.type]?.banner ?? TYPE_STYLES.info.banner}`}>
                ℹ {announcement.message} — Admin
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveAnnouncement}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl transition-colors"
              >
                <FloppyDisk size={15} />
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Announcement'}
              </button>
            </div>
          </Section>

          {/* Section 2: Fiscal Year */}
          <Section title="Fiscal Year">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Current Fiscal Year</label>
                <div className="px-4 py-2 bg-slate-100 dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-sm font-black text-slate-900 dark:text-slate-100">
                  FY {currentYear}
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">Fiscal year is derived from the current calendar year. Deadlines are set per fiscal year in the Deadlines page.</p>
            </div>
          </Section>

          {/* Section 3: System Info */}
          <Section title="System Information">
            {sysInfo ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Users', value: sysInfo.userCount, icon: Users },
                  { label: 'Total Schools', value: sysInfo.schoolCount, icon: Buildings },
                  { label: 'Total Programs', value: sysInfo.programCount, icon: BookOpen },
                  { label: 'Version', value: 'v1.0.0', icon: Database },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-dark-base rounded-xl">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                      <item.icon size={16} weight="bold" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">{item.value}</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">Could not load system info.</p>
            )}
          </Section>

        </div>
      )}
    </AdminLayout>
  );
}
