import React from 'react';
import { SearchableSelect } from '../../components/SearchableSelect.jsx';
import { QUARTER_OPTIONS, YEAR_OPTIONS, STATUS_OPTIONS } from './submissionsConstants.js';

export function SubmissionsFilterBar({ clusters, schools, programs, filters, setFilters }) {
  const clearFilters = () =>
    setFilters({ cluster: null, school: null, program: null, quarter: null, year: null, status: null });

  return (
    <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* CONSTRAINT: Clusters have no meaningful name — display by number only. Never use c.name here; it mirrors the number and produces "Cluster 1: Cluster 1". */}
        <SearchableSelect
          options={clusters.map(c => ({ value: c.id, label: `Cluster ${c.cluster_number}` }))}
          value={filters.cluster}
          onChange={v => setFilters(f => ({ ...f, cluster: v, school: null }))}
          placeholder="Cluster" clearable
        />
        <SearchableSelect
          options={schools.map(s => ({ value: s.id, label: s.abbreviation ? `${s.name} (${s.abbreviation})` : s.name }))}
          value={filters.school}
          onChange={v => setFilters(f => ({ ...f, school: v }))}
          placeholder="School" clearable
        />
        <SearchableSelect
          options={programs.map(p => ({ value: p.id, label: p.title }))}
          value={filters.program}
          onChange={v => setFilters(f => ({ ...f, program: v }))}
          placeholder="Program" clearable
        />
        <SearchableSelect
          options={QUARTER_OPTIONS}
          value={filters.quarter}
          onChange={v => setFilters(f => ({ ...f, quarter: v }))}
          placeholder="Quarter" clearable
        />
        <SearchableSelect
          options={YEAR_OPTIONS}
          value={filters.year}
          onChange={v => setFilters(f => ({ ...f, year: v }))}
          placeholder="Year" clearable
        />
        <SearchableSelect
          options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
          value={filters.status}
          onChange={v => setFilters(f => ({ ...f, status: v }))}
          placeholder="Status" clearable
        />
      </div>
      <button onClick={clearFilters} className="mt-3 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Clear filters</button>
    </div>
  );
}
