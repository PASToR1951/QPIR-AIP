import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { staggerContainer } from './adminOverview/chartTheme.js';
import { AdminOverviewHero } from './adminOverview/AdminOverviewHero.jsx';
import { AdminOverviewSkeleton } from './adminOverview/AdminOverviewSkeleton.jsx';
import { useAdminOverviewData } from './adminOverview/useAdminOverviewData.js';

const LazyAdminOverviewCharts = lazy(() => (
  import('./adminOverview/AdminOverviewCharts.jsx').then((module) => ({
    default: module.AdminOverviewCharts,
  }))
));

const LazyAdminOverviewPanels = lazy(() => (
  import('./adminOverview/AdminOverviewPanels.jsx').then((module) => ({
    default: module.AdminOverviewPanels,
  }))
));

function DeferredOverviewSection({ children, fallback, rootMargin = '240px 0px' }) {
  const containerRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(() => (
    typeof window !== 'undefined' && typeof window.IntersectionObserver === 'undefined'
  ));

  useEffect(() => {
    if (shouldRender) return undefined;

    const node = containerRef.current;
    if (!node) return undefined;

    if (typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldRender(true);
        observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, shouldRender]);

  return (
    <div ref={containerRef}>
      {shouldRender ? children : fallback}
    </div>
  );
}

function OverviewSectionShell({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-surface ${className}`}>
      {children}
    </div>
  );
}

function AdminOverviewChartsFallback() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 px-1">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap">Analytics</h2>
        <span className="h-px flex-1 bg-slate-200 dark:bg-dark-border/60" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OverviewSectionShell>
          <div className="mb-4 h-5 w-40 animate-pulse rounded bg-slate-100 dark:bg-dark-border/70" />
          <div className="h-[220px] animate-pulse rounded-xl bg-slate-100 dark:bg-dark-border/70" />
        </OverviewSectionShell>
        <OverviewSectionShell>
          <div className="mb-4 h-5 w-44 animate-pulse rounded bg-slate-100 dark:bg-dark-border/70" />
          <div className="h-[220px] animate-pulse rounded-xl bg-slate-100 dark:bg-dark-border/70" />
        </OverviewSectionShell>
      </div>
    </div>
  );
}

function AdminOverviewPanelsFallback() {
  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
      <OverviewSectionShell className="space-y-3">
        <div className="h-5 w-52 animate-pulse rounded bg-slate-100 dark:bg-dark-border/70" />
        <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-dark-border/70" />
        <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-dark-border/70" />
        <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-dark-border/70" />
      </OverviewSectionShell>
      <OverviewSectionShell className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-100 dark:bg-dark-border/70" />
        <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-dark-border/70" />
        <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-dark-border/70" />
        <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-dark-border/70" />
      </OverviewSectionShell>
    </div>
  );
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const {
    appLogo,
    clusterSort,
    data,
    divisionAipCompliance,
    fetchError,
    isDark,
    loading,
    nivoTheme,
    pieData,
    quarterData,
    sectionData,
    setClusterSort,
    sortedClusters,
    stats,
    user,
  } = useAdminOverviewData();

  return (
    <>
      {fetchError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 text-sm font-medium mb-4">
          {fetchError}
        </div>
      )}
      {loading ? (
        <AdminOverviewSkeleton />
      ) : (
        <Motion.div
          data-tour="admin-overview"
          className="space-y-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <AdminOverviewHero appLogo={appLogo} navigate={navigate} stats={stats} user={user} />
          <DeferredOverviewSection fallback={<AdminOverviewChartsFallback />}>
            <Suspense fallback={<AdminOverviewChartsFallback />}>
              <LazyAdminOverviewCharts
                divisionAipCompliance={divisionAipCompliance}
                isDark={isDark}
                nivoTheme={nivoTheme}
                pieData={pieData}
                quarterData={quarterData}
                sectionData={sectionData}
              />
            </Suspense>
          </DeferredOverviewSection>
          <DeferredOverviewSection
            fallback={<AdminOverviewPanelsFallback />}
            rootMargin="320px 0px"
          >
            <Suspense fallback={<AdminOverviewPanelsFallback />}>
              <LazyAdminOverviewPanels
                clusterSort={clusterSort}
                currentQuarter={stats?.currentQuarter}
                data={data}
                navigate={navigate}
                setClusterSort={setClusterSort}
                sortedClusters={sortedClusters}
              />
            </Suspense>
          </DeferredOverviewSection>
        </Motion.div>
      )}
    </>
  );
}
