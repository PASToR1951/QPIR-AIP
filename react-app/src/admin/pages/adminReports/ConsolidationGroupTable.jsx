import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function rateColorClass(rate) {
  if (rate >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (rate >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function formatNum(n) {
  return typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—';
}

const GROUP_LABELS = { cluster: 'Cluster', program: 'Program', division: 'Group' };

export function ConsolidationGroupTable({ groups, groupBy }) {
  const [expanded, setExpanded] = useState(new Set());

  if (!groups || groups.length === 0) return null;

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const chartData = groups.map((g) => ({
    name: g.name.length > 20 ? g.name.slice(0, 20) + '...' : g.name,
    Physical: g.physicalRate,
    Financial: g.financialRate,
  }));

  return (
    <div className="space-y-4">
      {/* Chart */}
      {groups.length > 1 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-dark-border dark:bg-dark-surface">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Physical vs Financial Accomplishment
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(200, groups.length * 40)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" domain={[0, 'auto']} tickFormatter={(v) => `${v}%`} fontSize={11} />
              <YAxis type="category" dataKey="name" width={140} fontSize={11} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Physical" fill="#10b981" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Financial" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-dark-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-dark-surface text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="px-3 py-2.5 w-8" />
              <th className="px-3 py-2.5">{GROUP_LABELS[groupBy] || 'Group'}</th>
              <th className="px-3 py-2.5 text-center">PIRs</th>
              <th className="px-3 py-2.5 text-center">Schools</th>
              <th className="px-3 py-2.5 text-center">Programs</th>
              <th className="px-3 py-2.5 text-right">Physical %</th>
              <th className="px-3 py-2.5 text-right">Financial %</th>
              <th className="px-3 py-2.5 text-right">Budget</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
            {groups.map((g) => {
              const isOpen = expanded.has(g.id);
              const totalBudget = (g.budgetDivision || 0) + (g.budgetCoPSF || 0);
              return (
                <GroupRow
                  key={g.id}
                  group={g}
                  isOpen={isOpen}
                  onToggle={() => toggle(g.id)}
                  totalBudget={totalBudget}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupRow({ group: g, isOpen, onToggle, totalBudget }) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <td className="px-3 py-2.5 text-center">
          <CaretDown
            size={13}
            weight="bold"
            className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </td>
        <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{g.name}</td>
        <td className="px-3 py-2.5 text-center text-slate-700 dark:text-slate-300">{g.pirCount}</td>
        <td className="px-3 py-2.5 text-center text-slate-700 dark:text-slate-300">{g.schoolCount}</td>
        <td className="px-3 py-2.5 text-center text-slate-700 dark:text-slate-300">{g.programCount}</td>
        <td className={`px-3 py-2.5 text-right font-bold ${rateColorClass(g.physicalRate)}`}>{g.physicalRate}%</td>
        <td className={`px-3 py-2.5 text-right font-bold ${rateColorClass(g.financialRate)}`}>{g.financialRate}%</td>
        <td className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-300">
          {'\u20B1'}{totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </td>
      </tr>

      <AnimatePresence>
        {isOpen && g.activities?.length > 0 && (
          <tr>
            <td colSpan={8} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-6 py-3 bg-slate-50/50 dark:bg-white/[0.02]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        <th className="px-2 py-1.5">Activity</th>
                        <th className="px-2 py-1.5 text-center">Complied</th>
                        <th className="px-2 py-1.5 text-right">Phys. Target</th>
                        <th className="px-2 py-1.5 text-right">Phys. Accomp.</th>
                        <th className="px-2 py-1.5 text-right">Fin. Target</th>
                        <th className="px-2 py-1.5 text-right">Fin. Accomp.</th>
                        <th className="px-2 py-1.5 text-right">Gap %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 dark:divide-dark-border/50">
                      {g.activities.map((a, i) => {
                        const gapColor = a.physicalGapPct >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400';
                        return (
                          <tr key={i} className="hover:bg-white/50 dark:hover:bg-white/[0.01]">
                            <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                              {a.isUnplanned && <span className="text-amber-500 dark:text-amber-400 mr-1">[U]</span>}
                              {a.activityName}
                            </td>
                            <td className="px-2 py-1.5 text-center text-slate-600 dark:text-slate-400">
                              {a.compliedCount}/{a.compliedCount + a.notCompliedCount}
                            </td>
                            <td className="px-2 py-1.5 text-right text-slate-600 dark:text-slate-400">{formatNum(a.physicalTarget)}</td>
                            <td className="px-2 py-1.5 text-right text-slate-600 dark:text-slate-400">{formatNum(a.physicalAccomplished)}</td>
                            <td className="px-2 py-1.5 text-right text-slate-600 dark:text-slate-400">{formatNum(a.financialTarget)}</td>
                            <td className="px-2 py-1.5 text-right text-slate-600 dark:text-slate-400">{formatNum(a.financialAccomplished)}</td>
                            <td className={`px-2 py-1.5 text-right font-bold ${gapColor}`}>
                              {a.physicalGapPct >= 0 ? '+' : ''}{a.physicalGapPct}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}
