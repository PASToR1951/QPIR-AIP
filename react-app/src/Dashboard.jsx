import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ClipboardText, NotePencil, Table, LockKey as Lock } from '@phosphor-icons/react';
import { useReportingPeriod } from './context/ReportingPeriodContext.jsx';
import { auth } from './lib/auth';
import api from './lib/api.js';
import { DashboardHeader } from './components/ui/DashboardHeader';
import { AnnouncementBanner } from './components/ui/AnnouncementBanner';
import Footer from './components/ui/Footer';
import DashboardStats from './components/ui/DashboardStats';
import { getActionPrompt } from './components/ui/dashboardPrompt.js';
import SubmissionsHistory from './components/ui/SubmissionsHistory';
import { getPeriodYear, periodNoun, periodPrefix } from './lib/periods.js';

const TILE_TONES = {
  pink: {
    icon: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-800/60',
    hover: 'hover:border-pink-200 dark:hover:border-pink-700/70',
    action: 'text-pink-700 dark:text-pink-300',
  },
  blue: {
    icon: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/60',
    hover: 'hover:border-blue-200 dark:hover:border-blue-700/70',
    action: 'text-blue-700 dark:text-blue-300',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-dark-border',
    hover: 'hover:border-slate-300 dark:hover:border-slate-600',
    action: 'text-slate-600 dark:text-slate-300',
  },
};

function WorkspaceTile({ to, preload, icon, eyebrow, title, description, meta, action, tone = 'slate', disabled = false, ...props }) {
  const colors = TILE_TONES[tone] ?? TILE_TONES.slate;
  const content = (
    <>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${colors.icon}`}>
          {icon}
        </div>
        {meta && (
          <span className="inline-flex min-h-7 max-w-[68%] items-center gap-1.5 truncate rounded-full border border-slate-200 bg-slate-50 px-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:border-dark-border dark:bg-dark-base dark:text-slate-400">
            {meta}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{eyebrow}</p>
        <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-2 min-h-10 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className={`mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest ${disabled ? 'text-slate-400 dark:text-slate-500' : colors.action}`}>
        {action}
        {disabled ? <Lock size={15} /> : <ArrowRight size={15} />}
      </div>
    </>
  );

  if (disabled) {
    return (
      <div {...props} className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-5 opacity-80 dark:border-dark-border dark:bg-dark-surface/55">
        {content}
      </div>
    );
  }

  return (
    <Link
      {...props}
      to={to}
      onMouseEnter={preload}
      className={`group block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-dark-border dark:bg-dark-surface ${colors.hover}`}
    >
      {content}
    </Link>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { selectedYear, selectedQuarter } = useReportingPeriod();
  const userStr = sessionStorage.getItem('user');
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    sessionStorage.removeItem('user');
  }


  const [aipStatus, setAipStatus] = useState('none');
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    // Guard against out-of-order responses: when the year/quarter change in
    // quick succession (or the component remounts), multiple fetches overlap.
    // Without this flag a stale response can clobber state from a newer one,
    // leaving dashboardData and aipStatus sourced from different fetches (e.g.
    // 37/48 submitted but a "Start planning" CTA).
    let cancelled = false;
    const fetchDashboard = async () => {
      if (!user?.id) {
        setDashboardLoading(false);
        setDashboardError('Your session was not ready. Please sign in again.');
        return;
      }
      setDashboardLoading(true);
      setDashboardError('');
      try {
        // Fetch aggregated dashboard stats
        const dashRes = await api.get(`/api/dashboard?year=${selectedYear}&quarter=${selectedQuarter}`);
        if (cancelled) return;
        setDashboardData(dashRes.data);

        // Derive AIP card status from dashboard data + draft check
        const hasSubmittedAIP = dashRes.data.aipCompletion.completed > 0;
        if (hasSubmittedAIP) {
          setAipStatus('review');
        } else {
          try {
            const draftRes = await api.get('/api/aips/draft');
            if (cancelled) return;
            setAipStatus(draftRes.data.hasDraft ? 'draft' : 'none');
          } catch {
            if (cancelled) return;
            setAipStatus('none');
          }
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to fetch dashboard data:', error);
        setDashboardError(error.friendlyMessage ?? 'Dashboard data could not be loaded. Please refresh and try again.');
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    };
    fetchDashboard();
    return () => { cancelled = true; };
  }, [selectedYear, selectedQuarter, navigate, user?.id]);

  const hasAIP = dashboardData ? dashboardData.aipCompletion.completed > 0 : false;

  const actionPrompt = dashboardData ? getActionPrompt(dashboardData, aipStatus) : '';
  const dashboardPeriodShort = dashboardData
    ? `${periodPrefix(dashboardData.period_type)}${dashboardData.currentQuarter}`
    : '';
  const dashboardPeriodNoun = dashboardData ? periodNoun(dashboardData.period_type) : 'quarter';
  const reportingYear = dashboardData
    ? getPeriodYear(dashboardData.currentPeriodLabel, dashboardData.period_type === 'trimester' ? 'School' : 'Division Personnel')
    : new Date().getFullYear();
  const pirReportTitle = 'PIR - Quarterly Report';
  const displayName =
    user?.role === 'School'
      ? (user?.school_name || 'User')
      : user?.role === 'Division Personnel'
        ? (user?.first_name || 'User')
        : (user?.name || 'User');
  const workspaceLabel = user?.role === 'Division Personnel' ? 'Program Owner Workspace' : 'Planning Workspace';
  const aipTotal = dashboardData?.aipCompletion.total ?? 0;
  const aipCompleted = dashboardData?.aipCompletion.completed ?? 0;
  const aipPending = Math.max(aipTotal - aipCompleted, 0);
  const pirTotal = dashboardData?.pirSubmitted.total ?? 0;
  const pirSubmitted = dashboardData?.pirSubmitted.submitted ?? 0;
  const pirPending = Math.max(pirTotal - pirSubmitted, 0);

  const handleLogout = async () => {
    try {
      await auth.logout({ clearDrafts: true });
    } catch {
      window.alert('This browser was cleared, but the server could not confirm logout. Please close the tab if this is a shared device.');
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="relative flex min-h-screen select-none flex-col bg-slate-50 font-sans dark:bg-dark-base lg:pl-60">
      <DashboardHeader user={user} onLogout={handleLogout} />
      <AnnouncementBanner />

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-12 sm:px-5">
        <section data-tour="dashboard-summary" className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:bg-dark-base dark:text-slate-400">
                  {workspaceLabel}
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/30 dark:text-blue-300">
                  {dashboardPeriodShort || 'Current Period'}
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
                Good day, {displayName}
              </h1>
              <p data-tour="dashboard-action-prompt" className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                {dashboardLoading
                  ? <span className="inline-block h-4 w-64 animate-pulse rounded bg-slate-200 dark:bg-dark-border/60" />
                  : actionPrompt
                }
              </p>
            </div>

            <dl className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 dark:border-dark-border/60 lg:w-[460px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div>
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Year</dt>
                <dd className="mt-1 text-lg font-black tabular-nums text-slate-900 dark:text-slate-100">FY {reportingYear}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">AIP</dt>
                <dd className="mt-1 text-lg font-black tabular-nums text-slate-900 dark:text-slate-100">
                  {dashboardLoading ? '...' : `${aipCompleted}/${aipTotal}`}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">PIR</dt>
                <dd className="mt-1 text-lg font-black tabular-nums text-slate-900 dark:text-slate-100">
                  {dashboardLoading ? '...' : pirTotal === 0 ? 'None' : `${pirSubmitted}/${pirTotal}`}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Stats + Quarter Timeline */}
        {dashboardError ? (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
            {dashboardError}
          </div>
        ) : (
          <DashboardStats data={dashboardData} loading={dashboardLoading} />
        )}

        <section className="mb-10">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Workspace
            </h2>
          </div>

          <div className={`grid grid-cols-1 gap-3 ${user?.role === 'Division Personnel' ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'}`}>
            <WorkspaceTile
              data-tour="dashboard-aip-card"
              to="/aip"
              preload={() => import('./AIPForm')}
              tone="pink"
              icon={<NotePencil size={22} weight="bold" />}
              eyebrow="Annual planning"
              title="AIP - Annual Plan"
              meta={dashboardLoading ? 'Loading' : `${aipCompleted}/${aipTotal} programs`}
              description={
                aipTotal === 0
                  ? 'No assigned programs are available yet.'
                  : aipPending > 0
                    ? `${aipPending} program${aipPending !== 1 ? 's still need' : ' still needs'} planning for FY ${reportingYear}.`
                    : `All assigned programs have an AIP for FY ${reportingYear}.`
              }
              action={aipStatus === 'review' ? 'View submission' : aipStatus === 'draft' ? 'Continue plan' : 'Start planning'}
            />

            <WorkspaceTile
              data-tour="dashboard-pir-card"
              to="/pir"
              preload={() => import('./PIRForm')}
              tone={hasAIP ? 'blue' : 'slate'}
              disabled={!hasAIP}
              icon={<Table size={22} weight="bold" />}
              eyebrow="Implementation review"
              title={pirReportTitle}
              meta={
                hasAIP
                  ? (dashboardLoading ? 'Loading' : pirTotal === 0 ? `No ${dashboardPeriodShort || 'period'} activities` : `${pirSubmitted}/${pirTotal} filed`)
                  : <><Lock size={13} /> Locked</>
              }
              description={
                !hasAIP
                  ? 'Submit your AIP first to unlock PIR reporting.'
                  : pirTotal > 0 && pirPending > 0
                    ? `${pirPending} ${dashboardPeriodNoun} report${pirPending !== 1 ? 's are' : ' is'} still pending for ${dashboardPeriodShort}.`
                    : pirTotal === 0
                      ? `No activities are scheduled this ${dashboardPeriodNoun}.`
                      : `All ${dashboardPeriodShort} reports are filed.`
              }
              action={hasAIP ? (pirSubmitted > 0 ? 'View PIR' : 'Open PIR') : 'AIP required'}
            />

            {user?.role === 'Division Personnel' && (
              <WorkspaceTile
                to="/division"
                preload={() => import('./division/DivisionLayout.jsx')}
                tone="blue"
                icon={<ClipboardText size={22} weight="bold" />}
                eyebrow="Focal review"
                title="Review Queue"
                meta="Assigned"
                description="Review school submissions assigned to your focal programs."
                action="Open queue"
              />
            )}
            
            {user?.role === 'Superintendent' && (
              <WorkspaceTile
                to="/ces"
                preload={() => import('./ces/CESLayout.jsx')}
                tone="slate"
                icon={<ClipboardText size={22} weight="bold" />}
                eyebrow="Final approval"
                title="Approval Queue"
                meta="Superintendent"
                description="Review and approve final submissions from schools and personnel."
                action="Open queue"
              />
            )}
          </div>
        </section>

        {/* Submission History */}
        <SubmissionsHistory />

      </main>

      <Footer />
    </div>
  );
}
