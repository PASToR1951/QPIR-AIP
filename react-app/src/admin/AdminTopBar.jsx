import React from 'react';
import { Link } from 'react-router-dom';
import { List as Menu, CaretRight } from '@phosphor-icons/react';

const QUARTER_BADGE_COLORS = {
  rose:    'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50',
  amber:   'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
};

function quarterBadgeColor(daysLeft) {
  if (daysLeft == null) return 'emerald';
  if (daysLeft < 0) return 'rose';
  if (daysLeft <= 14) return 'amber';
  return 'emerald';
}

export const AdminTopBar = ({ title, breadcrumbs = [], onMobileMenuToggle, deadline }) => {
  const badgeColor = quarterBadgeColor(deadline?.daysLeft);

  return (
    <header className="h-14 bg-white/80 dark:bg-dark-base/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border flex items-center px-4 gap-4 sticky top-0 z-30">
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <Menu size={22} />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm min-w-0">
        <Link to="/admin" className="font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0">
          Admin
        </Link>
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            <CaretRight size={12} className="text-slate-300 dark:text-slate-600 shrink-0" />
            {crumb.to ? (
              <Link to={crumb.to} className="font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 truncate">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-black text-slate-900 dark:text-slate-100 truncate">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
        {title && breadcrumbs.length === 0 && (
          <>
            <CaretRight size={12} className="text-slate-300 dark:text-slate-600 shrink-0" />
            <span className="font-black text-slate-900 dark:text-slate-100 truncate">{title}</span>
          </>
        )}
      </nav>
      {/* Quarter badge */}
      {deadline?.currentQuarter && (
        <span className={`ml-auto shrink-0 border rounded-full text-[10px] font-black uppercase tracking-widest px-3 py-1 ${QUARTER_BADGE_COLORS[badgeColor]}`}>
          Q{deadline.currentQuarter} {deadline.daysLeft < 0 ? 'Overdue' : deadline.daysLeft === 0 ? 'Due Today' : `${deadline.daysLeft}d left`}
        </span>
      )}
    </header>
  );
};

export default AdminTopBar;
