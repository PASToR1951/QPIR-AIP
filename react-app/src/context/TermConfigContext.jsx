import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

// ─── Default config (Trimester) used before the API responds ─────────────────
const DEFAULT_CONFIG = {
  termType:        'Trimester',
  termNoun:        'Trimester',
  periodPrefix:    'T',
  yearFormat:      'SY',
  supervisorName:  'DR. ENRIQUE Q. RETES, EdD',
  supervisorTitle: 'Chief Education Supervisor',
  periods: [
    { number: 1, label: 'T1', ordinal: '1st', termNoun: 'Trimester', startMonth: 6,  endMonth: 9  },
    { number: 2, label: 'T2', ordinal: '2nd', termNoun: 'Trimester', startMonth: 10, endMonth: 12 },
    { number: 3, label: 'T3', ordinal: '3rd', termNoun: 'Trimester', startMonth: 1,  endMonth: 3  },
  ],
};

const TermConfigContext = createContext(DEFAULT_CONFIG);

export function TermConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    axios.get(`${API}/api/term-config`)
      .then(r => setConfig(r.data))
      .catch(() => { /* silently use default */ });
  }, []);

  return (
    <TermConfigContext.Provider value={config}>
      {children}
    </TermConfigContext.Provider>
  );
}

export function useTermConfig() {
  return useContext(TermConfigContext);
}

// ─── Pure helpers (mirror server-side logic, no imports needed) ───────────────

/** Returns true if the given month falls in a period, handling wrap-around. */
function periodContainsMonth(p, month) {
  if (p.startMonth <= p.endMonth) {
    return month >= p.startMonth && month <= p.endMonth;
  }
  return month >= p.startMonth || month <= p.endMonth;
}

/** Returns the current period number for a given config and date. */
export function getCurrentPeriodFromConfig(config, date = new Date()) {
  const month = date.getMonth() + 1;
  for (const p of config.periods) {
    if (periodContainsMonth(p, month)) return p.number;
  }
  return config.periods[config.periods.length - 1].number;
}

/** Returns the SY start year for a given date (SY starts in June). */
export function getSYStart(date = new Date()) {
  const month = date.getMonth() + 1;
  return month >= 6 ? date.getFullYear() : date.getFullYear() - 1;
}

/** Builds the full PIR label string, e.g. "1st Trimester SY 2025-2026". */
export function buildPeriodLabel(config, periodNumber, syStart) {
  const p = config.periods.find(pd => pd.number === periodNumber);
  if (!p) return '';
  const syEnd = syStart + 1;
  if (config.yearFormat === 'SY') {
    return `${p.ordinal} ${p.termNoun} SY ${syStart}-${syEnd}`;
  }
  return `${p.ordinal} ${p.termNoun} CY ${syStart}`;
}
