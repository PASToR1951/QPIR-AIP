import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Lifebuoy, Question, PlayCircle, X } from '@phosphor-icons/react';
import OnboardingTour from './OnboardingTour.jsx';
import { getPortalHelp } from '../../lib/portalHelpConfig.js';

export default function HelpLauncher() {
  const location = useLocation();
  const helpConfig = useMemo(() => getPortalHelp(location.pathname), [location.pathname]);
  const [openPathname, setOpenPathname] = useState(null);
  const [tourOpen, setTourOpen] = useState(false);
  const popoverRef = useRef(null);
  const isOpen = openPathname === location.pathname;

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpenPathname(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!helpConfig?.autoStart || !helpConfig.storageKey) return;
    if (localStorage.getItem(helpConfig.storageKey)) return;
    const timer = window.setTimeout(() => setTourOpen(true), 450);
    return () => window.clearTimeout(timer);
  }, [helpConfig]);

  if (!helpConfig) return null;

  return (
    <>
      <div ref={popoverRef} className="fixed bottom-5 right-5 z-[95] print:hidden">
        {isOpen && (
          <div className="mb-3 w-[280px] rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-2xl dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                  Help
                </p>
                <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {helpConfig.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenPathname(null)}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-dark-base dark:hover:text-slate-200"
                aria-label="Close help"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <Link
                to={helpConfig.docsHref}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
                onClick={() => setOpenPathname(null)}
              >
                <BookOpen size={18} />
                Getting Started
              </Link>
              <Link
                to="/faq"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
                onClick={() => setOpenPathname(null)}
              >
                <Question size={18} />
                FAQ
              </Link>
              <a
                href={helpConfig.contactHref}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
              >
                <Lifebuoy size={18} />
                Contact SDO IT
              </a>
              {helpConfig.steps?.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(helpConfig.storageKey);
                    setTourOpen(true);
                    setOpenPathname(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
                >
                  <PlayCircle size={18} />
                  Show tour again
                </button>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpenPathname((value) => (value === location.pathname ? null : location.pathname))}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl transition-colors hover:bg-indigo-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-indigo-400"
          aria-label="Open help"
        >
          <Question size={26} weight="fill" />
        </button>
      </div>

      <OnboardingTour
        key={`${helpConfig.storageKey ?? helpConfig.id}:${tourOpen ? 'open' : 'closed'}`}
        open={tourOpen}
        title={helpConfig.title}
        steps={helpConfig.steps}
        storageKey={helpConfig.storageKey}
        onClose={() => setTourOpen(false)}
      />
    </>
  );
}
