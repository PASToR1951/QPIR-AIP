import React from 'react';
import { Link } from 'react-router-dom';
import { Info } from '@phosphor-icons/react';

/**
 * Small info affordance shown next to the "Prepared by" signatory in the AIP/PIR
 * forms. Explains that the default comes from the user's Profile (so they know
 * where to change it permanently) while the field stays editable here for a
 * one-off override. The icon links to the Profile page.
 */
export default function SignatoryHint() {
  return (
    <span className="group/sig relative inline-flex items-center">
      <Link
        to="/profile"
        onMouseEnter={() => import('../../Profile.jsx')}
        aria-label="Edit your default signatory in your Profile"
        className="text-slate-400 hover:text-pink-500 dark:text-slate-500 dark:hover:text-pink-400 transition-colors"
      >
        <Info size={15} weight="bold" />
      </Link>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-6 z-20 w-56 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-medium normal-case tracking-normal text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover/sig:opacity-100 dark:bg-slate-700"
      >
        This auto-fills from your Profile signatory. Edit your default in Profile,
        or change it here just for this document.
      </span>
    </span>
  );
}
