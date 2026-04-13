import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { staggerContainer } from './adminOverview/chartTheme.js';
import { AdminOverviewCharts } from './adminOverview/AdminOverviewCharts.jsx';
import { AdminOverviewHero } from './adminOverview/AdminOverviewHero.jsx';
import { AdminOverviewPanels } from './adminOverview/AdminOverviewPanels.jsx';
import { AdminOverviewSkeleton } from './adminOverview/AdminOverviewSkeleton.jsx';
import { useAdminOverviewData } from './adminOverview/useAdminOverviewData.js';

export default function AdminOverview() {
  const navigate = useNavigate();
  const {
    appLogo,
    clusterSort,
    data,
    fetchError,
    isDark,
    loading,
    nivoTheme,
    pieData,
    quarterData,
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
          <AdminOverviewCharts isDark={isDark} nivoTheme={nivoTheme} pieData={pieData} quarterData={quarterData} />
          <AdminOverviewPanels
            clusterSort={clusterSort}
            currentQuarter={stats?.currentQuarter}
            data={data}
            navigate={navigate}
            setClusterSort={setClusterSort}
            sortedClusters={sortedClusters}
          />
        </Motion.div>
      )}
    </>
  );
}
