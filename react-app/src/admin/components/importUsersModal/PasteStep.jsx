import React, { useState } from 'react';
import { CaretDown, CaretRight } from '@phosphor-icons/react';
import { EXAMPLE_CSV } from './importUsersCsv.js';

export function PasteStep({ csvText, setCsvText, parseError }) {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        Paste a CSV list of users below. Pre-created accounts auto-link when a user first signs in via OAuth — no manual activation needed.
      </p>

      <div className="border border-slate-200 dark:border-dark-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setGuideOpen((open) => !open)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide hover:bg-slate-50 dark:hover:bg-dark-border/40 transition-colors"
        >
          <span>CSV Format Guide</span>
          {guideOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
        </button>
        {guideOpen && (
          <div className="px-4 pb-4 border-t border-slate-100 dark:border-dark-border space-y-3">
            <table className="w-full text-xs mt-3">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400">
                  <th className="pr-3 pb-1.5 font-black">Column</th>
                  <th className="pr-3 pb-1.5 font-black">Required for</th>
                  <th className="pb-1.5 font-black">Notes</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-dark-border">
                {[
                  ['email', 'All roles', 'Must end @deped.gov.ph'],
                  ['role', 'All roles', 'School | Division Personnel | Admin | CES-SGOD | CES-ASDS | CES-CID | Cluster Coordinator | Observer'],
                  ['name', 'Admin, CES-*, Cluster Coordinator, Observer', 'Full display name'],
                  ['first_name', 'Division Personnel', 'Given name'],
                  ['last_name', 'Division Personnel', 'Surname'],
                  ['middle_initial', 'Division Personnel', 'Optional (e.g. "D")'],
                  ['school_id', 'School', 'Numeric ID from Schools list'],
                  ['cluster_id', 'Cluster Coordinator', 'Optional numeric cluster ID'],
                  ['program_ids', 'Division Personnel', 'Optional; semicolon-separated IDs e.g. "2;5;8"'],
                ].map(([column, requiredFor, notes]) => (
                  <tr key={column}>
                    <td className="pr-3 py-1.5 font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{column}</td>
                    <td className="pr-3 py-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{requiredFor}</td>
                    <td className="py-1.5 text-slate-500 dark:text-slate-400">{notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div>
              <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Example</p>
              <pre className="text-[11px] bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-lg p-3 overflow-x-auto text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre">
                {EXAMPLE_CSV}
              </pre>
              <button
                type="button"
                onClick={() => setCsvText(EXAMPLE_CSV)}
                className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Load example into editor
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
          CSV Data
        </label>
        <textarea
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          rows={10}
          spellCheck={false}
          placeholder={`email,role,name,...\n101234@deped.gov.ph,School,,,,,42,,\njuan.delacruz@deped.gov.ph,Division Personnel,,Juan,Dela Cruz,...`}
          className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-y"
        />
        {parseError && (
          <p className="mt-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">{parseError}</p>
        )}
      </div>
    </div>
  );
}
