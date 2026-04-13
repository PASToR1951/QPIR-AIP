import React from 'react';
import { PencilSimple, Trash } from '@phosphor-icons/react';
import { SchoolAvatar } from '../../../components/ui/SchoolAvatar.jsx';
import { SchoolNameMarquee } from './SchoolNameMarquee.jsx';
import { IconHoverLabelButton } from './IconHoverLabelButton.jsx';

export function SchoolCard({ school, clusterNumber, clusterLogo, decorativeClusterLogo, isHighlighted, schoolRef, onEdit, onDelete, onRestrict, activeLogoSchoolId, onMouseEnter, onMouseLeave, onFocus, onBlur }) {
  const isActive = isHighlighted || activeLogoSchoolId === school.id;

  return (
    <div
      ref={schoolRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`relative overflow-hidden border rounded-xl p-3.5 sm:p-4 transition-[background-color,border-color,box-shadow] duration-300
        ${isActive
          ? 'bg-amber-50/60 dark:bg-amber-950/15 border-amber-300 dark:border-amber-700/60 shadow-[0_12px_28px_rgba(245,158,11,0.16)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.24)]'
          : 'bg-slate-50 dark:bg-dark-base border-slate-200 dark:border-dark-border'}
        ${isHighlighted ? 'ring-2 ring-indigo-300 dark:ring-indigo-600' : ''}`}
    >
      <img src={decorativeClusterLogo} alt="" aria-hidden="true"
        className={`school-card-watermark pointer-events-none absolute -right-8 -bottom-10 h-40 w-40 object-contain ${isActive ? 'school-card-watermark--active' : ''}`}
        style={{ opacity: isActive ? 0.36 : 0.07 }}
        loading="lazy"
        onError={e => {
          if (clusterLogo && e.currentTarget.dataset.fallbackApplied !== 'true') {
            e.currentTarget.dataset.fallbackApplied = 'true';
            e.currentTarget.src = e.currentTarget.src;
          } else {
            e.currentTarget.style.display = 'none';
          }
        }}
      />
      <div className="relative z-10 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-1 items-center gap-3 min-w-0">
            <SchoolAvatar
              clusterNumber={clusterNumber} schoolLogo={school.logo ?? null}
              clusterLogo={clusterLogo} name={school.name}
              size={36} rounded="rounded-full" className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <SchoolNameMarquee name={school.name} abbreviation={school.abbreviation} />
            </div>
          </div>
          <IconHoverLabelButton label="Edit" icon={<PencilSimple size={18} />} onClick={onEdit} className="shrink-0 sm:p-1" />
        </div>
        <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">{school.level}</p>
        <div className="flex items-center justify-between text-[11px] sm:text-xs">
          <span className={`font-bold ${school.users?.length ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {school.users?.length ? 'Has user' : 'No user'}
          </span>
          {school.users?.length === 1 && (
            <span className="text-slate-400 dark:text-slate-500 truncate ml-2">
              {(school.users[0].first_name && school.users[0].last_name)
                ? `${school.users[0].first_name} ${school.users[0].last_name}`
                : school.users[0].name || school.users[0].email}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <button type="button" onClick={onRestrict}
            className={`text-left text-[11px] sm:text-xs font-bold hover:underline ${school.restricted_programs?.length ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
            {school.restricted_programs?.length ?? 0} Restricted {(school.restricted_programs?.length ?? 0) === 1 ? 'Program' : 'Programs'}
          </button>
          <IconHoverLabelButton label="Delete" icon={<Trash size={17} />} onClick={onDelete} variant="danger" className="sm:p-1" />
        </div>
      </div>
    </div>
  );
}
