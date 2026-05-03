import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../lib/api.js';

export function useUserData({ search, roleFilter, showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const dropdownsLoaded = useRef(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter !== 'All') params.set('role', roleFilter);
    if (search) params.set('search', search);
    api.get(`/api/admin/users?${params}`)
      .then(r => setUsers(r.data))
      .catch(e => { console.error(e); showToast(e.friendlyMessage ?? 'Failed to load users. Please refresh and try again.', 'error'); })
      .finally(() => setLoading(false));
  }, [search, roleFilter, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Lazy — only fetched when the user first opens a modal that needs them
  const loadDropdownData = useCallback(() => {
    if (dropdownsLoaded.current) return;
    dropdownsLoaded.current = true;
    api.get('/api/admin/schools').then(r => setSchools(r.data)).catch(() => {});
    api.get('/api/admin/programs').then(r => setPrograms(r.data)).catch(() => {});
  }, []);

  return { users, loading, schools, programs, fetchAll, loadDropdownData };
}

export function useOnboardingData() {
  const [onboardingData, setOnboardingData] = useState(null);
  const [onboardingDays, setOnboardingDays] = useState('30');
  const [onboardingError, setOnboardingError] = useState(null);

  useEffect(() => {
    api.get(`/api/admin/onboarding-overview?days=${onboardingDays}`)
      .then(r => { setOnboardingData(r.data); setOnboardingError(null); })
      .catch((e) => { console.error(e); setOnboardingError('Failed to load onboarding analytics.'); });
  }, [onboardingDays]);

  return { onboardingData, onboardingDays, setOnboardingDays, onboardingError };
}
