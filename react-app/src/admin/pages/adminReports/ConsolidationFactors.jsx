import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

const FACTOR_TYPES = [
  'Institutional',
  'Technical',
  'Infrastructure',
  'Learning Resources',
  'Environmental',
  'Others',
];

export function ConsolidationFactors({ factors }) {
  const [expanded, setExpanded] = useState(new Set());

  if (!factors) return null;

  const hasAnyData = FACTOR_TYPES.some((t) => {
    const f = factors[t];
    return f && (f.facilitatingCount > 0 || f.hinderingCount > 0);
  });
  if (!hasAnyData) return null;

  const toggle = (type) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
        Factors Analysis
      </h3>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-dark-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-dark-surface text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="px-3 py-2.5 w-8" />
              <th className="px-3 py-2.5">Factor Type</th>
              <th className="px-3 py-2.5 text-center">Facilitating</th>
              <th className="px-3 py-2.5 text-center">Hindering</th>
              <th className="px-3 py-2.5 text-center">Recommendations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
            {FACTOR_TYPES.map((type) => {
              const f = factors[type] || {};
              const isOpen = expanded.has(type);
              const facCount = f.facilitatingCount || 0;
              const hinCount = f.hinderingCount || 0;
              const recCount = f.recommendationEntries?.length || 0;

              return (
                <FactorRow
                  key={type}
                  type={type}
                  f={f}
                  facCount={facCount}
                  hinCount={hinCount}
                  recCount={recCount}
                  isOpen={isOpen}
                  onToggle={() => toggle(type)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FactorRow({ type, f, facCount, hinCount, recCount, isOpen, onToggle }) {
  const hasEntries = facCount > 0 || hinCount > 0 || recCount > 0;

  return (
    <>
      <tr
        onClick={hasEntries ? onToggle : undefined}
        className={`${hasEntries ? 'cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02]' : ''} transition-colors`}
      >
        <td className="px-3 py-2.5 text-center">
          {hasEntries && (
            <CaretDown
              size={13}
              weight="bold"
              className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          )}
        </td>
        <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{type}</td>
        <td className="px-3 py-2.5 text-center">
          <span className={`font-bold ${facCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            {facCount}
          </span>
        </td>
        <td className="px-3 py-2.5 text-center">
          <span className={`font-bold ${hinCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
            {hinCount}
          </span>
        </td>
        <td className="px-3 py-2.5 text-center">
          <span className={`font-bold ${recCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
            {recCount}
          </span>
        </td>
      </tr>

      <AnimatePresence>
        {isOpen && hasEntries && (
          <tr>
            <td colSpan={5} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-6 py-3 bg-slate-50/50 dark:bg-white/[0.02] grid grid-cols-1 md:grid-cols-3 gap-4">
                  {f.facilitatingEntries?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                        Facilitating
                      </p>
                      <ul className="space-y-1">
                        {f.facilitatingEntries.map((e, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            - {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {f.hinderingEntries?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
                        Hindering
                      </p>
                      <ul className="space-y-1">
                        {f.hinderingEntries.map((e, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            - {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {f.recommendationEntries?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                        Recommendations
                      </p>
                      <ul className="space-y-1">
                        {f.recommendationEntries.map((e, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            - {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}
