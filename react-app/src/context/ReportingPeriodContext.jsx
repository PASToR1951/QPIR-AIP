import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

function normalizePeriod(period) {
  const year = Number(period?.year);
  const quarter = Number(period?.quarter);
  if (year >= 2020 && year <= 2100 && ALL_QUARTERS.includes(quarter)) {
    return { year, quarter };
  }
  return null;
}

function getPeriodFromSearch(search) {
  const params = new URLSearchParams(search);
  return normalizePeriod({
    year: params.get('year'),
    quarter: params.get('quarter'),
  });
}

function getPeriodFromStorage() {
  try {
    const storedStr = localStorage.getItem(STORAGE_KEY);
    if (!storedStr) return null;
    return normalizePeriod(JSON.parse(storedStr));
  } catch (e) {
    console.error('Failed to parse reporting period from local storage', e);
    return null;
  }
}

function resolveInitialPeriod(search) {
  const urlPeriod = getPeriodFromSearch(search);
  if (urlPeriod) return { period: urlPeriod, source: 'url' };

  const storedPeriod = getPeriodFromStorage();
  if (storedPeriod) return { period: storedPeriod, source: 'storage' };

  return { period: getLivePeriod(), source: 'live' };
}

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

  const [initialPeriod] = useState(() => resolveInitialPeriod(location.search));
  const initialPeriodSourceRef = useRef(initialPeriod.source);
  const periodWasExplicitlyChangedRef = useRef(initialPeriod.source !== 'live');
  // Latest selected period, so the URL->state effect can detect external URL
  // changes without depending on the state it sets (which would make it revert
  // the user's own picks). Updated below whenever the selection commits.
  const selectedPeriodRef = useRef(initialPeriod.period);
  // Last URL search string this provider observed, so the state->URL effect can
  // tell a genuine URL navigation apart from a state-driven re-run.
  const prevSearchRef = useRef(location.search);

  const [selectedYear, setSelectedYear] = useState(initialPeriod.period.year);
  const [selectedQuarter, setSelectedQuarter] = useState(initialPeriod.period.quarter);
  const [livePeriod, setLivePeriod] = useState(() => getLivePeriod());
  const [availablePeriods, setAvailablePeriods] = useState(null);
  const [periodOptionsLoading, setPeriodOptionsLoading] = useState(true);

  const selectablePeriods = useMemo(() => {
    const periodMap = new Map();

    if (availablePeriods === null) {
      ALL_QUARTERS.forEach((quarter) => addQuarter(periodMap, selectedYear, quarter));
    } else {
      availablePeriods.forEach((period) => {
        period.quarters.forEach((quarter) => addQuarter(periodMap, period.year, quarter));
      });
    }
    addQuarter(periodMap, livePeriod.year, livePeriod.quarter);

    return mapToPeriods(periodMap);
  }, [availablePeriods, livePeriod, selectedYear]);
  const selectablePeriodMap = useMemo(() => {
    return new Map(selectablePeriods.map((period) => [period.year, period.quarters]));
  }, [selectablePeriods]);
  const availableYears = useMemo(() => selectablePeriods.map((period) => period.year), [selectablePeriods]);
  const isLivePeriod = selectedYear === livePeriod.year && selectedQuarter === livePeriod.quarter;
  const selectedQuarterLabel = getQuarterLabel(selectedQuarter, selectedYear);

  // Whether the picker currently offers a given period. Derived from the server's
  // available periods plus the live period — deliberately NOT from the selected
  // year, so the URL-sync effects below can depend on it without re-running on
  // every user pick. Used to decide whether a URL period should be adopted, or
  // normalised away when it points at a period with no data.
  const isSelectablePeriod = useCallback((year, quarter) => {
    if (year === livePeriod.year && quarter === livePeriod.quarter) return true;
    if (availablePeriods === null) return false;
    const match = availablePeriods.find((period) => period.year === year);
    return Boolean(match && match.quarters.includes(quarter));
  }, [availablePeriods, livePeriod]);

  useEffect(() => {
    let cancelled = false;

    api.get('/api/reporting-periods')
      .then((response) => {
        if (cancelled) return;
        const serverLivePeriod = normalizePeriod(response.data?.live);
        if (serverLivePeriod) {
          setLivePeriod(serverLivePeriod);
          if (
            initialPeriodSourceRef.current === 'live' &&
            !periodWasExplicitlyChangedRef.current
          ) {
            setSelectedYear(serverLivePeriod.year);
            setSelectedQuarter(serverLivePeriod.quarter);
          }
        }
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

  useEffect(() => {
    selectedPeriodRef.current = { year: selectedYear, quarter: selectedQuarter };
  }, [selectedYear, selectedQuarter]);

  // Adopt the period from the URL only on a genuine URL navigation (back/forward,
  // shared link, manual edit). This effect must NOT depend on the selected state,
  // otherwise it re-runs on every pick and reverts the user's selection back to
  // the (not-yet-updated) URL.
  useEffect(() => {
    let cancelled = false;
    const urlPeriod = getPeriodFromSearch(location.search);
    if (!urlPeriod) return undefined;
    const current = selectedPeriodRef.current;
    if (urlPeriod.year === current.year && urlPeriod.quarter === current.quarter) return undefined;

    // Once the period options have loaded, ignore a URL that points at a period
    // the picker no longer offers (a stale bookmark/shared link, or a period with
    // no data). The fallback effect below normalises the selection to a valid
    // period and the state->URL effect rewrites the stale query string; adopting
    // the invalid URL here would fight them and leave the dashboard stuck loading
    // a period that never resolves.
    if (!periodOptionsLoading && !isSelectablePeriod(urlPeriod.year, urlPeriod.quarter)) {
      return undefined;
    }

    periodWasExplicitlyChangedRef.current = true;
    queueMicrotask(() => {
      if (cancelled) return;
      setSelectedYear(urlPeriod.year);
      setSelectedQuarter(urlPeriod.quarter);
    });

    return () => {
      cancelled = true;
    };
  }, [location.search, periodOptionsLoading, isSelectablePeriod]);

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
    const searchChanged = location.search !== prevSearchRef.current;
    prevSearchRef.current = location.search;

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
    const urlPeriod = getPeriodFromSearch(location.search);

    // The URL itself just changed to a different valid period (back/forward,
    // shared link, manual edit): the URL->state effect will adopt it, so don't
    // write the stale state back and clobber that navigation. When the *state*
    // is what changed (searchChanged === false), fall through and mirror it.
    // Only defer to the URL->state effect when it will actually adopt the URL
    // period (i.e. the picker still offers it). If the URL holds a period that is
    // no longer selectable, that effect ignores it, so fall through and rewrite
    // the stale query string here instead of leaving it dangling — otherwise the
    // selector shows the live period while the URL stays pinned to a dead one and
    // the dashboard never finishes loading.
    if (
      searchChanged && urlPeriod &&
      isSelectablePeriod(urlPeriod.year, urlPeriod.quarter) &&
      (urlPeriod.year !== selectedYear || urlPeriod.quarter !== selectedQuarter)
    ) {
      return;
    }

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
  }, [selectedYear, selectedQuarter, isLivePeriod, location.search, location.pathname, location.hash, navigate, isSelectablePeriod]);

  const setReportingPeriod = useCallback(({ year, quarter }) => {
    const nextYear = Number(year);
    const availableQuarters = getAvailableQuartersForYear(nextYear);
    const requestedQuarter = Number(quarter);
    const nextQuarter = availableQuarters.includes(requestedQuarter)
      ? requestedQuarter
      : (availableQuarters[0] ?? requestedQuarter);

    periodWasExplicitlyChangedRef.current = true;
    setSelectedYear(nextYear);
    setSelectedQuarter(nextQuarter);
  }, [getAvailableQuartersForYear]);

  const resetToLivePeriod = useCallback(() => {
    periodWasExplicitlyChangedRef.current = true;
    setSelectedYear(livePeriod.year);
    setSelectedQuarter(livePeriod.quarter);
  }, [livePeriod]);

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
