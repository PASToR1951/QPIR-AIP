import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowSquareOut, CalendarBlank, Megaphone } from '@phosphor-icons/react';
import api from '../lib/api.js';
import { auth } from '../lib/auth';
import { DashboardHeader } from './ui/DashboardHeader.jsx';
import Footer from './ui/Footer.jsx';

const TYPE_CLASSES = {
  info: 'bg-blue-600 text-white',
  warning: 'bg-amber-500 text-white',
  critical: 'bg-rose-600 text-white',
};

function formatDate(value) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function isExternalUrl(value) {
  return /^https:\/\//i.test(value || '');
}

export default function AnnouncementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = auth.getUser();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/api/announcements/${id}`)
      .then(({ data }) => {
        if (!cancelled) setAnnouncement(data);
      })
      .catch(e => {
        if (!cancelled) setError(e.friendlyMessage ?? 'Announcement could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleLogout = async () => {
    try {
      await auth.logout({ clearDrafts: true });
    } catch {
      window.alert('This browser was cleared, but the server could not confirm logout. Please close the tab if this is a shared device.');
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const handleAction = () => {
    const url = announcement?.action_url;
    if (!url) return;
    if (isExternalUrl(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col font-sans">
      <DashboardHeader user={user} onLogout={handleLogout} />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <Link
          to={user?.role === 'Admin' || user?.role === 'Observer' ? '/admin' : '/'}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 transition-colors mb-5"
        >
          <ArrowLeft size={16} weight="bold" /> Back
        </Link>

        {loading ? (
          <div className="h-48 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface animate-pulse" />
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-5 py-4 text-sm font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        ) : (
          <article className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden shadow-sm">
            <div className={`px-5 py-4 ${TYPE_CLASSES[announcement.type] ?? TYPE_CLASSES.info}`}>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-90">
                <Megaphone size={15} weight="fill" />
                Announcement
              </div>
              <h1 className="text-xl sm:text-2xl font-black mt-2 leading-tight">{announcement.title}</h1>
            </div>

            <div className="px-5 py-5 space-y-5">
              <p className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                {announcement.message}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2">
                  <p className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <CalendarBlank size={12} weight="bold" /> Starts
                  </p>
                  <p className="font-semibold text-slate-700 dark:text-slate-200 mt-1">{formatDate(announcement.starts_at)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2">
                  <p className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <CalendarBlank size={12} weight="bold" /> Expires
                  </p>
                  <p className="font-semibold text-slate-700 dark:text-slate-200 mt-1">{formatDate(announcement.expires_at)}</p>
                </div>
              </div>

              {announcement.action_url && (
                <button
                  type="button"
                  onClick={handleAction}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700 transition-colors"
                >
                  {announcement.action_label || 'Open'}
                  <ArrowSquareOut size={15} weight="bold" />
                </button>
              )}
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
