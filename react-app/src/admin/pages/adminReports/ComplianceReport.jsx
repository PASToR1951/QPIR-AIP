import React, { useEffect, useState } from 'react';
import api from '../../../lib/api.js';
import { ComplianceKpiCards } from './ComplianceKpiCards.jsx';
import { ComplianceMatrixTable } from './ComplianceMatrixTable.jsx';
import { ComplianceSummaryTable } from './ComplianceSummaryTable.jsx';
import { ComplianceToolbar } from './ComplianceToolbar.jsx';
import { Spinner } from './shared.jsx';
import { buildComplianceKpi, buildComplianceRows, filterComplianceRows } from './complianceUtils.js';

export function ComplianceReport({ year }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('summary');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name');
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    setLoading(true); setError(null);
    api.get(`/api/admin/reports/compliance?year=${year}`)
      .then(r => setData(r.data)).catch(e => { console.error(e); setError('Failed to load compliance report.'); }).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-center text-red-500 font-bold py-8">{error}</p>;
  if (!data) return null;

  const enrichedRows = buildComplianceRows(data);
  const kpi = buildComplianceKpi(enrichedRows);
  const filteredRows = filterComplianceRows(enrichedRows, { search, filter, sort });

  return (
    <div className="space-y-5">
      <ComplianceKpiCards kpi={kpi} />
      <ComplianceToolbar
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        sort={sort}
        setSort={setSort}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      {viewMode === 'summary' ? (
        <ComplianceSummaryTable
          data={data}
          rows={filteredRows}
          expandedRows={expandedRows}
          setExpandedRows={setExpandedRows}
        />
      ) : (
        <ComplianceMatrixTable data={data} rows={filteredRows} />
      )}
    </div>
  );
}
