import React from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { Sparkle, CheckCircle, XCircle } from '@phosphor-icons/react';
import { useLocation } from 'react-router-dom';
import { useAccessibility } from '../../context/AccessibilityContext.jsx';
import { THEMES, resolveRouteThemeName } from '../../lib/routeTheme.js';
import { onboardingContent } from '../../lib/onboardingConfig.js';

function Checkbox({ checked, onChange, theme }) {
  const t = THEMES[theme];
  return (
    <label className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className={`mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-dark-border ${t.focusRing}`}
      />
      <span className="leading-snug">Show onboarding when I sign in again</span>
    </label>
  );
}

export default function WelcomeCard({
  roleKey,
  showOnLogin,
  onToggleShowOnLogin,
  onGetStarted,
  onSkip,
  onDismissPending,
  open,
}) {
  const location = useLocation();
  const { settings } = useAccessibility();
  const themeName = resolveRouteThemeName(location.pathname);
  const t = THEMES[themeName];
  const content = onboardingContent[roleKey];
  const isPending = roleKey === 'pending';

  if (!content) return null;

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          initial={settings.reduceMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
          animate={settings.reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={settings.reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: settings.reduceMotion ? 0.12 : 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[104] flex items-end sm:items-center justify-center p-4 sm:p-6"
        >
          <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" />
          <div className="relative w-full max-w-xl rounded-[2rem] border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface shadow-2xl overflow-hidden">
            <div className={`h-1.5 bg-gradient-to-r ${t.strip}`} />
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${t.tourIconShell}`}>
                  {isPending ? <CheckCircle size={24} /> : <Sparkle size={24} />}
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${t.tourLabel}`}>
                    {isPending ? 'Access Update' : 'First-Time Onboarding'}
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {content.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {content.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-slate-100 dark:border-dark-border bg-slate-50/80 dark:bg-dark-base/70 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  What You’ll Learn
                </p>
                <div className="mt-3 space-y-2.5">
                  {content.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <span className={`mt-1 h-2 w-2 rounded-full ${t.tourProgress}`} />
                      <span className="leading-snug">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!isPending && (
                <div className="mt-5">
                  <Checkbox
                    checked={showOnLogin}
                    onChange={onToggleShowOnLogin}
                    theme={themeName}
                  />
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                {isPending ? (
                  <button
                    type="button"
                    onClick={onDismissPending}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-base px-5 py-3 text-sm font-black text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-dark-border/50"
                  >
                    <XCircle size={18} />
                    Okay
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onSkip}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-base px-5 py-3 text-sm font-black text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-dark-border/50"
                    >
                      Skip for now
                    </button>
                    <button
                      type="button"
                      onClick={onGetStarted}
                      className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-black text-white ${t.tourPrimary}`}
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
