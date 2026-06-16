import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ReportingPeriodContext = createContext(null);

function getQuarterLabel(quarter, year) {
  const qStr = {
    1: '1st Quarter',
    2: '2nd Quarter',
    3: '3rd Quarter',
    4: '4th Quarter'
  }[quarter] || `${quarter}th Quarter`;
  return `${qStr} CY ${year}`;
}

function getLivePeriod() {
  const d = new Date();
  return {
    year: d.getFullYear(),
    quarter: Math.ceil((d.getMonth() + 1) / 3),
  };
}

const STORAGE_KEY = 'qpir.reportingPeriod';

export function ReportingPeriodProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Initial State Resolution
  const initialPeriod = useMemo(() => {
    // a. URL Hydration
    const params = new URLSearchParams(location.search);
    const urlYear = parseInt(params.get('year'), 10);
    const urlQuarter = parseInt(params.get('quarter'), 10);

    if (urlYear >= 2020 && urlYear <= 2100 && [1, 2, 3, 4].includes(urlQuarter)) {
      return { year: urlYear, quarter: urlQuarter };
    }

    // b. LocalStorage
    try {
      const storedStr = localStorage.getItem(STORAGE_KEY);
      if (storedStr) {
        const stored = JSON.parse(storedStr);
        if (stored.year >= 2020 && stored.year <= 2100 && [1, 2, 3, 4].includes(stored.quarter)) {
          return stored;
        }
      }
    } catch (e) {
      console.error('Failed to parse reporting period from local storage', e);
    }

    // c. Live Fallback
    return getLivePeriod();
  }, [location.search]);

  const [selectedYear, setSelectedYear] = useState(initialPeriod.year);
  const [selectedQuarter, setSelectedQuarter] = useState(initialPeriod.quarter);

  // Derive live state
  const livePeriod = useMemo(() => getLivePeriod(), []);
  const isLivePeriod = selectedYear === livePeriod.year && selectedQuarter === livePeriod.quarter;
  const selectedQuarterLabel = getQuarterLabel(selectedQuarter, selectedYear);

  // URL & Storage Sync Effect when state changes
  useEffect(() => {
    // Update local storage
    if (isLivePeriod) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ year: selectedYear, quarter: selectedQuarter }));
    }

    // We only update URL if it is out of sync.
    // If URL already has exactly the state we hold, we don't push state.
    // If we're live and URL has no year/quarter, we don't push state.
    const params = new URLSearchParams(location.search);
    const urlYear = parseInt(params.get('year'), 10);
    const urlQuarter = parseInt(params.get('quarter'), 10);

    const hasUrlParams = !isNaN(urlYear) && !isNaN(urlQuarter);
    
    let urlNeedsUpdate = false;
    
    if (isLivePeriod) {
      if (hasUrlParams) {
        params.delete('year');
        params.delete('quarter');
        urlNeedsUpdate = true;
      }
    } else {
      if (urlYear !== selectedYear || urlQuarter !== selectedQuarter) {
        params.set('year', selectedYear);
        params.set('quarter', selectedQuarter);
        urlNeedsUpdate = true;
      }
    }

    if (urlNeedsUpdate) {
      const newSearch = params.toString();
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}${location.hash}`;
      navigate(newUrl, { replace: true });
    }
  }, [selectedYear, selectedQuarter, isLivePeriod, location.search, location.pathname, location.hash, navigate]);

  const setReportingPeriod = useCallback(({ year, quarter }) => {
    setSelectedYear(year);
    setSelectedQuarter(quarter);
  }, []);

  const resetToLivePeriod = useCallback(() => {
    const live = getLivePeriod();
    setSelectedYear(live.year);
    setSelectedQuarter(live.quarter);
  }, []);

  const getPeriodParams = useCallback(() => {
    return { year: selectedYear, quarter: selectedQuarter };
  }, [selectedYear, selectedQuarter]);

  const value = useMemo(() => ({
    selectedYear,
    selectedQuarter,
    selectedQuarterLabel,
    isLivePeriod,
    setReportingPeriod,
    resetToLivePeriod,
    getPeriodParams
  }), [selectedYear, selectedQuarter, selectedQuarterLabel, isLivePeriod, setReportingPeriod, resetToLivePeriod, getPeriodParams]);

  return (
    <ReportingPeriodContext.Provider value={value}>
      {children}
    </ReportingPeriodContext.Provider>
  );
}

export function useReportingPeriod() {
  const context = useContext(ReportingPeriodContext);
  if (context === null) {
    // As a fallback when used outside of Provider (e.g. login pages)
    const live = getLivePeriod();
    return {
      selectedYear: live.year,
      selectedQuarter: live.quarter,
      selectedQuarterLabel: getQuarterLabel(live.quarter, live.year),
      isLivePeriod: true,
      setReportingPeriod: () => {},
      resetToLivePeriod: () => {},
      getPeriodParams: () => live,
    };
  }
  return context;
}
