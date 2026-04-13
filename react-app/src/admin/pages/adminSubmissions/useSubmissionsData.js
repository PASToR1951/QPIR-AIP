import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api.js';

export function useSubmissionsData({ tab, filters, page }) {
  const [submissions, setSubmissions]           = useState([]);
  const [totals, setTotals]                     = useState({ aipTotal: 0, pirTotal: 0, total: 0 });
  const [loading, setLoading]                   = useState(true);
  const [fetchError, setFetchError]             = useState(null);
  const [clusters, setClusters]                 = useState([]);
  const [schools, setSchools]                   = useState([]);
  const [programs, setPrograms]                 = useState([]);

  useEffect(() => {
    api.get('/api/admin/clusters')
      .then(r => setClusters(r.data))
      .catch(err => console.warn('[clusters filter]', err?.response?.status));
    api.get('/api/admin/programs')
      .then(r => setPrograms(r.data))
      .catch(err => console.warn('[programs filter]', err?.response?.status));
  }, []);

  useEffect(() => {
    if (filters.cluster) {
      api.get(`/api/admin/schools?cluster=${filters.cluster}`)
        .then(r => setSchools(r.data))
        .catch(err => console.warn('[schools filter]', err?.response?.status));
    } else {
      setSchools([]);
    }
  }, [filters.cluster]);

  const fetchSubmissions = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab !== 'all') params.set('type', tab);
    if (filters.cluster) params.set('cluster', filters.cluster);
    if (filters.school)  params.set('school',  filters.school);
    if (filters.program) params.set('program', filters.program);
    if (filters.quarter) params.set('quarter', filters.quarter);
    if (filters.year)    params.set('year',    filters.year);
    if (filters.status)  params.set('status',  filters.status);
    params.set('page', page);
    api.get(`/api/admin/submissions?${params}`)
      .then(r => {
        setFetchError(null);
        setSubmissions(r.data.data);
        setTotals({ aipTotal: r.data.aipTotal, pirTotal: r.data.pirTotal, total: r.data.total });
      })
      .catch(e => {
        console.error(e);
        setFetchError(e.friendlyMessage ?? 'Failed to load submissions. Please refresh and try again.');
      })
      .finally(() => setLoading(false));
  }, [tab, filters, page]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  return { submissions, totals, loading, fetchError, fetchSubmissions, clusters, schools, programs };
}
