import { useEffect, useState } from 'react';
import api from '../../../lib/api.js';

export function useReportYears() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    api.get('/api/admin/reports/years')
      .then((response) => {
        const years = response.data.years || [];
        setAvailableYears(years);
        if (years.length > 0) {
          setYear((previousYear) => (years.includes(previousYear) ? previousYear : years[0]));
        }
      })
      .catch(() => {
        setAvailableYears([new Date().getFullYear()]);
      });
  }, []);

  return { availableYears, setYear, year };
}
