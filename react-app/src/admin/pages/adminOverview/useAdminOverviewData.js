import { useEffect, useMemo, useState } from 'react';
import { useAppLogo } from '../../../context/BrandingContext.jsx';
import api from '../../../lib/api.js';
import { CHART_COLORS, getNivoTheme, useIsDark } from './chartTheme.js';

export function useAdminOverviewData() {
  const appLogo = useAppLogo();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [clusterSort, setClusterSort] = useState('desc');
  const isDark = useIsDark();
  const nivoTheme = getNivoTheme(isDark);

  useEffect(() => {
    api.get('/api/admin/overview')
      .then((response) => setData(response.data))
      .catch((error) => {
        console.error(error);
        setFetchError('Failed to load dashboard data. Please refresh and try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;

  const sortedClusters = useMemo(() => {
    const list = data?.pirClusterStatus ?? [];
    const sorted = [...list];
    sorted.sort((a, b) => (clusterSort === 'desc' ? b.pct - a.pct : a.pct - b.pct));
    return sorted;
  }, [data?.pirClusterStatus, clusterSort]);

  const quarterData = useMemo(() => (
    (data?.pirQuarterly ?? []).map((quarter) => ({
      name: quarter.quarter,
      Submitted: quarter.submitted,
      Approved: quarter.approved,
      'Under Review': quarter.underReview,
      Returned: quarter.returned,
      SGOD: quarter.SGOD ?? 0,
      CID: quarter.CID ?? 0,
      OSDS: quarter.OSDS ?? 0,
    }))
  ), [data?.pirQuarterly]);

  const trimesterData = useMemo(() => (
    (data?.pirByTrimester ?? []).map((trimester) => ({
      name: trimester.trimester ?? trimester.quarter,
      Submitted: trimester.submitted,
      Approved: trimester.approved,
      'Under Review': trimester.underReview,
      Returned: trimester.returned,
      SGOD: trimester.SGOD ?? 0,
      CID: trimester.CID ?? 0,
      OSDS: trimester.OSDS ?? 0,
    }))
  ), [data?.pirByTrimester]);

  const pieData = useMemo(() => (
    [...(data?.clusterCompliance ?? [])]
      .sort((a, b) => a.cluster_number - b.cluster_number)
      .map((entry, index) => ({
        id: entry.name,
        label: `Cluster ${entry.cluster_number}`,
        clusterId: entry.id,
        clusterNumber: entry.cluster_number,
        value: entry.compliant,
        color: CHART_COLORS[index % CHART_COLORS.length],
        total: entry.total,
        pct: entry.pct,
      }))
  ), [data?.clusterCompliance]);

  const sectionData = data?.divisionSections ?? [];
  const divisionAipCompliance = data?.divisionAipCompliance ?? [];

  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  return {
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
    trimesterData,
    user,
  };
}
