import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { NotePencil, Table, LockKey as Lock, Warning as AlertTriangle, CaretCircleRight } from '@phosphor-icons/react';
import { auth } from './lib/auth';
import api from './lib/api.js';
import { DashboardHeader } from './components/ui/DashboardHeader';
import { AnnouncementBanner } from './components/ui/AnnouncementBanner';
import Footer from './components/ui/Footer';
import DashboardStats, { getActionPrompt } from './components/ui/DashboardStats';
import SubmissionsHistory from './components/ui/SubmissionsHistory';
import { useAccessibility } from './context/AccessibilityContext';

function useAnimatedNumber(targetValue, duration = 700) {
  const targetNumber = Number(targetValue) || 0;
  const [displayValue, setDisplayValue] = useState(targetNumber);
  const previousValueRef = useRef(targetNumber);

  useEffect(() => {
    const fromValue = previousValueRef.current;
    previousValueRef.current = targetNumber;

    if (fromValue === targetNumber) return;

    let frameId = 0;
    const startedAt = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(fromValue + (targetNumber - fromValue) * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [targetNumber, duration]);

  return displayValue;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { settings } = useAccessibility();
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
        const dashRes = await api.get('/api/dashboard');
        setDashboardData(dashRes.data);

        // Derive AIP card status from dashboard data + draft check
        const hasSubmittedAIP = dashRes.data.aipCompletion.completed > 0;
        if (hasSubmittedAIP) {
          setAipStatus('review');
        } else {
          try {
            const draftRes = await api.get('/api/aips/draft');
            setAipStatus(draftRes.data.hasDraft ? 'draft' : 'none');
          } catch {
            setAipStatus('none');
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setDashboardError(error.friendlyMessage ?? 'Dashboard data could not be loaded. Please refresh and try again.');
      } finally {
        setDashboardLoading(false);
      }
    };
    fetchDashboard();
  }, [navigate, user?.id]);

  const hasAIP = dashboardData ? dashboardData.aipCompletion.completed > 0 : false;
  const targetAipCompleted = dashboardData?.aipCompletion.completed ?? 0;
  const targetAipTotal = dashboardData?.aipCompletion.total ?? 0;
  const animatedAipCompleted = useAnimatedNumber(targetAipCompleted);
  const animatedAipTotal = useAnimatedNumber(targetAipTotal);
  const displayedAipCompleted = settings.reduceMotion ? targetAipCompleted : animatedAipCompleted;
  const displayedAipTotal = settings.reduceMotion ? targetAipTotal : animatedAipTotal;
  const aipCounterMotionClasses = settings.reduceMotion
    ? ''
    : 'group-hover:border-pink-500 dark:group-hover:border-pink-500 transition-colors duration-300';
  const aipCounterFillMotionClasses = settings.reduceMotion
    ? ''
    : 'group-hover:translate-x-0 transition-transform duration-500 ease-out';
  const aipCounterTextMotionClasses = settings.reduceMotion
    ? ''
    : 'group-hover:text-white transition-colors duration-300';

  const actionPrompt = dashboardData ? getActionPrompt(dashboardData, aipStatus) : '';

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
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col font-sans relative select-none">
      {/* Subtle Background Asset Overlay */}
      <div
        className="absolute inset-x-0 top-0 h-[60vh] z-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url('/SDO_Facade.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          maskImage: 'linear-gradient(to bottom, black, transparent)'
        }}
      ></div>

      <DashboardHeader user={user} onLogout={handleLogout} />
      <AnnouncementBanner />

      <main className="flex-1 w-full max-w-6xl mx-auto mt-6 px-4 pb-12 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8">
          <div data-tour="dashboard-summary" className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2.5rem] p-8 md:p-10 shadow-sm overflow-hidden group">
{/* Card Background Facade */}
            <div
              className="absolute inset-0 opacity-70 grayscale pointer-events-none transition-all duration-700 group-hover:opacity-85 group-hover:grayscale-0"
              style={{
                backgroundImage: `url('/SDO_Facade.webp')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 70%',
                maskImage: 'radial-gradient(circle at top right, black, transparent 80%)'
              }}
            ></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center mb-6">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Summary</span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-2">
                Welcome back, <br />
                <span className="text-pink-600">
                  {user?.role === 'School'
                    ? (user?.school_name || 'User')
                    : user?.role === 'Division Personnel'
                      ? (user?.first_name || 'User')
                      : (user?.name || 'User')}
                </span>
              </h1>

              <p data-tour="dashboard-action-prompt" className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-auto">
                {dashboardLoading
                  ? <span className="inline-block w-64 h-4 bg-slate-200 dark:bg-dark-border/60 rounded animate-pulse" />
                  : actionPrompt
                }
              </p>
            </div>
          </div>

        </div>

        {/* Stats + Quarter Timeline */}
        {dashboardError ? (
          <div className="mb-6 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-5 py-4 text-sm font-semibold text-rose-700 dark:text-rose-300">
            {dashboardError}
          </div>
        ) : (
          <DashboardStats data={dashboardData} loading={dashboardLoading} />
        )}

        {/* Modules Section */}
        <div className="flex items-center justify-between mb-8 px-2 mt-4">
          <h2 className="text-sm font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-4">
            Workspace Hub
            <span className="flex-1 h-px bg-slate-200 dark:bg-dark-border/60"></span>
          </h2>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* AIP Card */}
          <Link data-tour="dashboard-aip-card" to="/aip" onMouseEnter={() => import('./AIPForm')} className="group block bg-white dark:bg-dark-surface rounded-[2rem] border-2 shadow-sm hover:shadow-xl transition-all duration-500 active:scale-[0.98] overflow-hidden border-slate-100 dark:border-dark-border hover:border-pink-200 dark:hover:border-pink-400 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50 dark:bg-pink-950 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -mr-20 -mt-20"></div>

            <div className="p-8 md:p-10 relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-12">
                <div className="relative overflow-hidden w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 ease-out shadow-md border bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/40 dark:to-pink-900/30 text-pink-600 border-pink-200 dark:border-pink-800/60 shadow-pink-100/50 group-hover:border-pink-500 group-hover:shadow-pink-400/40">
                  <span className="absolute inset-0 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out bg-pink-500/75 backdrop-blur-sm rounded-2xl" />
                  <NotePencil size={36} className="relative z-10 group-hover:text-white transition-colors duration-300" />
                </div>
                {dashboardData && dashboardData.aipCompletion.total > 0 && (
                  <div
                    className={`relative overflow-hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm tabular-nums mt-8 sm:mt-0 bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-700/60 ${aipCounterMotionClasses}`}
                    aria-label={`${dashboardData.aipCompletion.completed} of ${dashboardData.aipCompletion.total} programs`}
                  >
                    <span className={`absolute inset-0 -translate-x-full bg-pink-500/75 backdrop-blur-sm rounded-full ${aipCounterFillMotionClasses}`} />
                    <span className={`relative z-10 ${aipCounterTextMotionClasses}`}>
                      {displayedAipCompleted}/{displayedAipTotal} Programs
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <h3 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-3 opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:text-pink-600">AIP - Annual Plan</h3>
                <p className="font-medium text-slate-500 dark:text-slate-400 leading-relaxed text-base md:text-lg mb-6 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-slate-400 dark:text-slate-500 text-sm md:text-base font-normal">
                    {dashboardData && dashboardData.aipCompletion.completed < dashboardData.aipCompletion.total
                      ? `${dashboardData.aipCompletion.total - dashboardData.aipCompletion.completed} program${dashboardData.aipCompletion.total - dashboardData.aipCompletion.completed !== 1 ? 's still need planning' : ' still needs planning'} for FY ${new Date().getFullYear()}.`
                      : 'Plan your objectives, activities, and budget for the fiscal year.'
                    }
                  </span>
                </p>

                <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-bold group-hover:translate-x-2 transition-transform duration-300">
                  <span className="text-sm uppercase tracking-widest">
                    {aipStatus === 'review' ? 'View Submission' : aipStatus === 'draft' ? 'Continue Plan' : 'Start Planning'}
                  </span>
                  <div className="w-0 group-hover:w-5 overflow-hidden transition-all duration-300 ease-out flex items-center">
                    <div className="w-5 h-px bg-pink-400/60 dark:bg-pink-500/50 rounded-full" />
                  </div>
                  <CaretCircleRight size={24} />
                </div>
              </div>
            </div>
          </Link>

          {/* PIR Card */}
          {hasAIP ? (
            <div data-tour="dashboard-pir-card" className="group block bg-white dark:bg-dark-surface rounded-[2rem] border-2 shadow-sm hover:shadow-xl transition-all duration-500 active:scale-[0.98] overflow-hidden border-slate-100 dark:border-dark-border hover:border-blue-200 dark:hover:border-blue-400 relative">
              <Link to="/pir" onMouseEnter={() => import('./PIRForm')} className="absolute inset-0 z-10"></Link>
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-950 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -mr-20 -mt-20"></div>

              <div className="p-8 md:p-10 relative z-0 flex flex-col h-full">
                <div className="flex justify-between items-start mb-12">
                  <div className="relative overflow-hidden w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 ease-out shadow-md border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 text-blue-600 border-blue-200 dark:border-blue-800/60 shadow-blue-100/50 group-hover:border-blue-500 group-hover:shadow-blue-400/40">
                    <span className="absolute inset-0 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out bg-blue-500/75 backdrop-blur-sm rounded-2xl" />
                    <Table size={36} className="relative z-10 group-hover:text-white transition-colors duration-300" />
                  </div>
                  {dashboardData && (
                    <div className={`relative overflow-hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm mt-8 sm:mt-0 group-hover:border-blue-500 dark:group-hover:border-blue-500 transition-colors duration-300 ${
                      dashboardData.pirSubmitted.total === 0
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 border-blue-200 dark:border-blue-700/60'
                        : dashboardData.pirSubmitted.submitted >= dashboardData.pirSubmitted.total
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700/60'
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700/60'
                    }`}>
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out bg-blue-500/75 backdrop-blur-sm rounded-full" />
                      <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                        {dashboardData.pirSubmitted.total === 0
                          ? `No Q${dashboardData.currentQuarter} Activities`
                          : `Q${dashboardData.currentQuarter}: ${dashboardData.pirSubmitted.submitted}/${dashboardData.pirSubmitted.total} Filed`
                        }
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-3 opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:text-blue-600">PIR - Quarterly Report</h3>
                  <p className="font-medium text-slate-500 dark:text-slate-400 leading-relaxed text-base md:text-lg mb-6 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-slate-400 dark:text-slate-500 text-sm md:text-base font-normal">
                      {dashboardData && dashboardData.pirSubmitted.total > 0 && dashboardData.pirSubmitted.submitted < dashboardData.pirSubmitted.total
                        ? `${dashboardData.pirSubmitted.total - dashboardData.pirSubmitted.submitted} quarterly report${dashboardData.pirSubmitted.total - dashboardData.pirSubmitted.submitted !== 1 ? 's are' : ' is'} still pending for Q${dashboardData.currentQuarter}.`
                        : dashboardData && dashboardData.pirSubmitted.total === 0
                          ? `No activities are scheduled this quarter. Check back next quarter.`
                          : 'Report your accomplishments and spending for the current quarter.'
                      }
                    </span>
                  </p>

                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-2 transition-transform duration-300">
                    <span className="text-sm uppercase tracking-widest">
                      {dashboardData && dashboardData.pirSubmitted.submitted > 0 ? 'View Reviews' : 'Start Review'}
                    </span>
                    <div className="w-0 group-hover:w-5 overflow-hidden transition-all duration-300 ease-out flex items-center">
                      <div className="w-5 h-px bg-blue-400/60 dark:bg-blue-500/50 rounded-full" />
                    </div>
                    <CaretCircleRight size={24} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div data-tour="dashboard-pir-card" className="block bg-slate-50/50 dark:bg-dark-surface/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-dark-border relative overflow-hidden group">
              <div className="p-8 md:p-10 flex flex-col h-full opacity-60 grayscale transition-opacity group-hover:opacity-80">
                <div className="flex justify-between items-start mb-12">
                  <div className="w-16 h-16 bg-white dark:bg-dark-border text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-dark-border shadow-sm">
                    <Table size={36} />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-dark-border shadow-sm mt-8 sm:mt-0">
                    <Lock size={14} />
                    Locked
                  </div>
                </div>

                <div className="mt-auto">
                  <h3 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-3">PIR - Quarterly Report</h3>
                  <p className="font-medium text-slate-500 dark:text-slate-400 leading-relaxed text-base md:text-lg mb-6">
                    <span className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal">Submit your AIP first to unlock quarterly reports.</span>
                  </p>

                  <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
                    <AlertTriangle size={18} />
                    Submit AIP first
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submission History */}
        <SubmissionsHistory />

      </main>

      <Footer />
    </div>
  );
}
