import React from 'react';
import { ArrowUp, ArrowDown, Minus } from '@phosphor-icons/react';

export const StatCard = ({ icon: Icon, value, label, sub, trend, color = 'indigo', onClick }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  };

  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-400';

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5 flex items-start gap-4 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150' : ''}`}
    >
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color] || colorMap.indigo}`}>
          <Icon size={22} weight="bold" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none tabular-nums">{value}</span>
          {trend && <TrendIcon size={16} weight="bold" className={trendColor} />}
        </div>
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mt-1 truncate">{label}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
};

export default StatCard;
