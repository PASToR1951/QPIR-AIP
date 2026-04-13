import { useState, useEffect } from 'react';
import api from '../../../lib/api.js';
import { TERM_OPTIONS } from './submissionsConstants.js';

export function useTermConfig({ isObserver, navigate, searchParams }) {
  const [termConfig, setTermConfig]       = useState({ termType: null, periods: [] });
  const [pendingTermType, setPendingTermType] = useState(null);
  const [periodMonths, setPeriodMonths]   = useState([]);
  const [termSaving, setTermSaving]       = useState(false);
  const [termSaved, setTermSaved]         = useState(false);
  const [termError, setTermError]         = useState('');

  // Seed period months from the live term config once it loads
  useEffect(() => {
    if (termConfig.periods?.length) {
      setPeriodMonths(termConfig.periods.map(p => ({ start: p.startMonth, end: p.endMonth })));
    }
  }, [termConfig.periods]);

  // Selecting a term type pre-fills months from current config (if same type) or clears them (new type)
  const handleTermTypeSelect = (type) => {
    setPendingTermType(type);
    if (type === termConfig.termType) {
      setPeriodMonths(termConfig.periods.map(p => ({ start: p.startMonth, end: p.endMonth })));
    } else {
      const count = TERM_OPTIONS.find(o => o.type === type)?.periodCount ?? 0;
      setPeriodMonths(Array.from({ length: count }, () => ({ start: '', end: '' })));
    }
  };

  const handleTermSave = async () => {
    if (isObserver) return;
    if (!pendingTermType || pendingTermType === termConfig.termType) return;
    if (periodMonths.some(m => !m.start || !m.end)) {
      setTermError('Assign start and end months for every period.');
      return;
    }
    setTermSaving(true);
    setTermError('');
    try {
      const nextTermType = pendingTermType;
      const nextPeriods  = periodMonths.map((m, i) => ({ period: i + 1, startMonth: m.start, endMonth: m.end }));
      await api.patch('/api/admin/term-config', { termType: nextTermType, periods: nextPeriods });
      setTermConfig({ termType: nextTermType, periods: nextPeriods });
      setTermSaved(true);
      setPendingTermType(null);
      const currentSearch = searchParams.toString();
      setTimeout(() => {
        setTermSaved(false);
        navigate(
          { pathname: '/admin/submissions', search: currentSearch ? `?${currentSearch}` : '' },
          { replace: true },
        );
      }, 1200);
    } catch (e) {
      setTermError(e.friendlyMessage ?? 'Failed to update term structure');
    } finally {
      setTermSaving(false);
    }
  };

  return {
    termConfig, pendingTermType, periodMonths, setPeriodMonths,
    termSaving, termSaved, termError,
    handleTermTypeSelect, handleTermSave,
  };
}
