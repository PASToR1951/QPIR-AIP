import React from 'react';
import { useTextMeasure } from '../../../lib/useTextMeasure.js';

export function SchoolNameMarquee({ name, abbreviation }) {
  const displayName = abbreviation ? `${name} (${abbreviation})` : name;
  const { measureText, containerRef, containerWidth } = useTextMeasure({
    font: '900 14px Inter',
    lineHeight: 18,
  });

  const overflows = containerWidth > 0 && measureText(displayName, containerWidth).lineCount > 1;

  return (
    <div
      ref={containerRef}
      className={overflows ? 'school-name-marquee' : 'min-w-0 overflow-hidden'}
      title={displayName}
      aria-label={displayName}
      tabIndex={overflows ? 0 : undefined}
    >
      {overflows ? (
        <span className="school-name-marquee__track">
          <span className="school-name-marquee__text font-black text-slate-900 dark:text-slate-100 text-sm leading-tight">{displayName}</span>
          <span aria-hidden="true" className="school-name-marquee__text font-black text-slate-900 dark:text-slate-100 text-sm leading-tight">{displayName}</span>
        </span>
      ) : (
        <span className="block truncate font-black text-slate-900 dark:text-slate-100 text-sm leading-tight">
          {name}
          {abbreviation && (
            <span className="font-bold text-slate-400 dark:text-slate-500"> ({abbreviation})</span>
          )}
        </span>
      )}
    </div>
  );
}
