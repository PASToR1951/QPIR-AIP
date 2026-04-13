import React from 'react';
import { CaretRight, PencilSimple, Trash } from '@phosphor-icons/react';
import { SchoolAvatar } from '../../../components/ui/SchoolAvatar.jsx';
import { EndOfListCue } from '../../../components/ui/EndOfListCue.jsx';
import { getClusterLogoPath, getUploadedLogoUrl } from '../../../lib/clusterLogo.js';
import { IconHoverLabelButton } from './IconHoverLabelButton.jsx';
import { SchoolCard } from './SchoolCard.jsx';

export function ClusterCard({
  cluster, isOpen, isHighlighted, clusterRef, schoolRefs,
  onToggle, onEdit, onDeleteCluster,
  onEditSchool, onDeleteSchool, onRestrictSchool,
  highlightedSchoolId, activeLogoSchoolId, onSchoolHover, onSchoolHoverEnd, onSchoolFocus, onSchoolBlur,
  onAssignHead, searchQuery,
}) {
  const cl = cluster;
  const schoolCount = cl.schools?.length ?? 0;
  const userCount = cl.schools?.reduce((sum, s) => sum + (s.users?.length ?? 0), 0) ?? 0;
  const clusterLogo = cl.logo ?? null;
  const bundledClusterLogo = getClusterLogoPath(cl.cluster_number);
  const decorativeClusterLogo = getUploadedLogoUrl(clusterLogo) ?? bundledClusterLogo;

  return (
    <div
      ref={clusterRef}
      className={`bg-white dark:bg-dark-surface border rounded-2xl overflow-hidden transition-shadow duration-300
        ${isHighlighted ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-300 dark:ring-indigo-600' : 'border-slate-200 dark:border-dark-border'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3.5 sm:py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-border/20 transition-colors" onClick={onToggle}>
        <SchoolAvatar clusterNumber={cl.cluster_number} clusterLogo={clusterLogo}
          name={`Cluster ${cl.cluster_number}`} size={32} rounded="rounded-full" className="shrink-0" />
        <div className="min-w-0">
          <span className="block font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">Cluster {cl.cluster_number}</span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-bold">{schoolCount} schools</span>
            <span className="text-[11px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400">{userCount} user{userCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Head:</span>
            {cl.cluster_head ? (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {cl.cluster_head.name || [cl.cluster_head.first_name, cl.cluster_head.last_name].filter(Boolean).join(' ')}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-500 dark:text-amber-400 italic">Not assigned</span>
            )}
            <button onClick={(e) => { e.stopPropagation(); onAssignHead(cl); }}
              className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 underline">
              {cl.cluster_head ? 'Change' : 'Assign'}
            </button>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <IconHoverLabelButton label="Edit" icon={<PencilSimple size={19} />}
            onClick={(e) => { e.stopPropagation(); onEdit(cl); }} />
          <IconHoverLabelButton label="Delete" icon={<Trash size={19} />}
            onClick={(e) => { e.stopPropagation(); onDeleteCluster(cl); }}
            disabled={schoolCount > 0}
            title={schoolCount > 0 ? 'Remove all schools first' : 'Delete cluster'}
            variant="danger" />
          <CaretRight size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {/* Schools grid */}
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-slate-100 dark:border-dark-border px-4 sm:px-5 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cl.schools?.map(school => (
              <SchoolCard
                key={school.id}
                school={school}
                clusterNumber={cl.cluster_number}
                clusterLogo={clusterLogo}
                decorativeClusterLogo={decorativeClusterLogo}
                isHighlighted={highlightedSchoolId === school.id}
                schoolRef={el => { schoolRefs.current[school.id] = el; }}
                activeLogoSchoolId={activeLogoSchoolId}
                onMouseEnter={() => onSchoolHover(school.id)}
                onMouseLeave={onSchoolHoverEnd}
                onFocus={() => onSchoolFocus(school.id)}
                onBlur={onSchoolBlur}
                onEdit={() => onEditSchool(school, cl)}
                onDelete={() => onDeleteSchool(school)}
                onRestrict={() => onRestrictSchool(school)}
              />
            ))}
            {!cl.schools?.length && (
              <p className="text-sm text-slate-400 dark:text-slate-600 col-span-full text-center py-4">No schools in this cluster.</p>
            )}
            <EndOfListCue
              count={cl.schools?.length ?? 0}
              message={searchQuery ? `All matching schools in Cluster ${cl.cluster_number} shown` : `End of Cluster ${cl.cluster_number} schools`}
              countLabel="school" showCount className="col-span-full pt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
