import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';

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
const ALL_QUARTERS = [1, 2, 3, 4];

function normalizeAvailablePeriods(periods) {
  if (!Array.isArray(periods)) return [];

  return periods
    .map((period) => {
      const year = Number(period?.year);
      const quarters = Array.isArray(period?.quarters)
        ? Array.from(new Set(period.quarters.map(Number)))
          .filter((quarter) => ALL_QUARTERS.includes(quarter))
          .sort((left, right) => left - right)
        : [];

      return { year, quarters };
    })
    .filter((period) => period.year >= 2020 && period.year <= 2100 && period.quarters.length > 0)
    .sort((left, right) => right.year - left.year);
}

function addQuarter(periodMap, year, quarter) {
  if (!year || !ALL_QUARTERS.includes(quarter)) return;
  const existing = periodMap.get(year) ?? new Set();
  existing.add(quarter);
  periodMap.set(year, existing);
}

function mapToPeriods(periodMap) {
  return Array.from(periodMap.entries())
    .sort(([leftYear], [rightYear]) => rightYear - leftYear)
    .map(([year, quarters]) => ({
      year,
      quarters: Array.from(quarters).sort((left, right) => left - right),
    }));
}

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
  const [availablePeriods, setAvailablePeriods] = useState(null);
  const [periodOptionsLoading, setPeriodOptionsLoading] = useState(true);

  // Derive live state
  const livePeriod = useMemo(() => getLivePeriod(), []);
  const selectablePeriods = useMemo(() => {
    const periodMap = new Map();

    if (availablePeriods === null) {
      ALL_QUARTERS.forEach((quarter) => addQuarter(periodMap, selectedYear, quarter));
    } else {
      availablePeriods.forEach((period) => {
        period.quarters.forEach((quarter) => addQuarter(periodMap, period.year, quarter));
      });
    }

    return mapToPeriods(periodMap);
  }, [availablePeriods, selectedYear]);
  const selectablePeriodMap = useMemo(() => {
    return new Map(selectablePeriods.map((period) => [period.year, period.quarters]));
  }, [selectablePeriods]);
  const availableYears = useMemo(() => selectablePeriods.map((period) => period.year), [selectablePeriods]);
  const isLivePeriod = selectedYear === livePeriod.year && selectedQuarter === livePeriod.quarter;
  const selectedQuarterLabel = getQuarterLabel(selectedQuarter, selectedYear);

  useEffect(() => {
    let cancelled = false;

    api.get('/api/reporting-periods')
      .then((response) => {
        if (cancelled) return;
        setAvailablePeriods(normalizeAvailablePeriods(response.data?.periods));
      })
      .catch((error) => {
        console.error('Failed to fetch reporting period options', error);
        if (!cancelled) setAvailablePeriods([]);
      })
      .finally(() => {
        if (!cancelled) setPeriodOptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const getAvailableQuartersForYear = useCallback((year) => {
    return selectablePeriodMap.get(Number(year)) ?? [];
  }, [selectablePeriodMap]);

  useEffect(() => {
    if (periodOptionsLoading || availablePeriods === null) return;
    if (getAvailableQuartersForYear(selectedYear).includes(selectedQuarter)) return;
    if (selectedYear === livePeriod.year && selectedQuarter === livePeriod.quarter) return;

    const selectedYearQuarters = getAvailableQuartersForYear(selectedYear);
    const fallback = selectedYearQuarters.length > 0
      ? { year: selectedYear, quarters: selectedYearQuarters }
      : selectablePeriods[0] ?? {
        year: livePeriod.year,
        quarters: [livePeriod.quarter],
      };

    queueMicrotask(() => {
      setSelectedYear(fallback.year);
      setSelectedQuarter(fallback.quarters[0]);
    });
  }, [
    availablePeriods,
    getAvailableQuartersForYear,
    livePeriod,
    periodOptionsLoading,
    selectablePeriods,
    selectedQuarter,
    selectedYear,
  ]);

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
    const nextYear = Number(year);
    const availableQuarters = getAvailableQuartersForYear(nextYear);
    const requestedQuarter = Number(quarter);
    const nextQuarter = availableQuarters.includes(requestedQuarter)
      ? requestedQuarter
      : (availableQuarters[0] ?? requestedQuarter);

    setSelectedYear(nextYear);
    setSelectedQuarter(nextQuarter);
  }, [getAvailableQuartersForYear]);

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
    availableYears,
    periodOptionsLoading,
    getAvailableQuartersForYear,
    setReportingPeriod,
    resetToLivePeriod,
    getPeriodParams
  }), [
    selectedYear,
    selectedQuarter,
    selectedQuarterLabel,
    isLivePeriod,
    availableYears,
    periodOptionsLoading,
    getAvailableQuartersForYear,
    setReportingPeriod,
    resetToLivePeriod,
    getPeriodParams,
  ]);

  return (
    <ReportingPeriodContext.Provider value={value}>
      {children}
    </ReportingPeriodContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
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
      availableYears: [live.year],
      periodOptionsLoading: false,
      getAvailableQuartersForYear: () => [live.quarter],
      setReportingPeriod: () => {},
      resetToLivePeriod: () => {},
      getPeriodParams: () => live,
    };
  }
  return context;
}
