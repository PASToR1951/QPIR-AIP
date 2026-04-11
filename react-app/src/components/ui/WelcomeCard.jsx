import React from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { CaretRight, CheckCircle, XCircle } from '@phosphor-icons/react';
import { useLocation } from 'react-router-dom';
import { useAccessibility } from '../../context/AccessibilityContext.jsx';
import { useAppLogo } from '../../context/BrandingContext.jsx';
import { THEMES, resolveRouteThemeName } from '../../lib/routeTheme.js';
import { onboardingContent } from '../../lib/onboardingUtils.js';

const LOGOS = [
  { src: '/DepEd_Seal.webp', alt: 'DepEd Seal' },
  { src: '/Division_Logo.webp', alt: 'Division Logo' },
  { src: '/DepEd NIR Logo.webp', alt: 'DepEd NIR' },
];

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
  const appLogo = useAppLogo();
  const themeName = resolveRouteThemeName(location.pathname);
  const t = THEMES[themeName];
  const content = onboardingContent[roleKey];
  const isPending = roleKey === 'pending';

  if (!content) return null;

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[104] flex items-end justify-center overflow-y-auto px-0 pt-10 pb-0 sm:p-6 sm:items-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={isPending ? onDismissPending : onSkip}
          />

          {/* Card */}
          <Motion.div
            initial={settings.reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={settings.reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={settings.reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="relative flex max-h-[min(92vh,52rem)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-slate-200 bg-white shadow-[0_-16px_48px_rgba(15,23,42,0.22)] dark:border-dark-border dark:bg-dark-surface sm:max-h-[min(88vh,44rem)] sm:flex-row sm:rounded-2xl sm:shadow-xl"
          >
            {/* ── Left panel ───────────────────────────────── */}
            <div className="relative hidden basis-1/3 shrink-0 flex-col sm:flex overflow-hidden">
              {/* Facade image */}
              <img
                src="/SDO_Facade.webp"
                alt="SDO Facade"
                className="absolute inset-0 h-full w-full object-cover object-[80%] scale-105"
              />

              {/* Layered overlays for depth */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Content — full height flex column */}
              <div className="relative flex h-full flex-col justify-between p-5">

                {/* Top: institution logos stacked */}
                <div className="flex flex-col gap-3">
                  {LOGOS.map((logo) => (
                    <img
                      key={logo.src}
                      src={logo.src}
                      alt={logo.alt}
                      className="h-11 w-11 rounded-full object-contain"
                      style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}
                    />
                  ))}
                </div>

                {/* Bottom: AIP-PIR mark */}
                <div>
                  <img
                    src={appLogo}
                    alt="AIP-PIR"
                    className="h-7 w-auto brightness-0 invert opacity-80"
                  />
                  <div className="mt-2 h-px w-8 bg-white/20" />
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
                    Dep Ed Guimbalian City
                  </p>
                </div>
              </div>
            </div>

            {/* ── Right panel ──────────────────────────────── */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col p-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] sm:p-6">
                <div className="min-h-0 flex-1 overflow-y-auto pr-1 sm:pr-2">
                  <div className="mb-3 rounded-2xl border border-slate-200/80 bg-slate-950 text-white shadow-lg shadow-slate-900/20 sm:hidden">
                    <div className="relative overflow-hidden rounded-2xl px-3.5 py-3">
                      <img
                        src="/SDO_Facade.webp"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover object-[center_32%] opacity-35"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-900/70" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_34%)]" />
                      <div className="relative flex items-center gap-3">
                        <img
                          src={appLogo}
                          alt="AIP-PIR"
                          className="h-6 w-auto brightness-0 invert opacity-90 shrink-0"
                        />
                        <div className="h-4 w-px bg-white/20 shrink-0" />
                        <p className="flex-1 text-[11px] font-medium leading-snug text-white/70">
                          Quick Portal Tour — review the essentials before you start.
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {LOGOS.map((logo) => (
                            <img
                              key={logo.src}
                              src={logo.src}
                              alt={logo.alt}
                              className="h-7 w-7 rounded-full border border-white/20 bg-white/10 object-contain p-0.5"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      {/* Logo shown only on mobile when hero is scrolled out of view */}
                      <img
                        src={appLogo}
                        alt="AIP-PIR"
                        className="hidden h-7 w-auto opacity-90 max-[380px]:block sm:hidden"
                      />
                      {isPending && (
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${t.tab}`}>
                          Access Pending
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={isPending ? onDismissPending : onSkip}
                      className="rounded-xl border border-slate-200 p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:border-dark-border dark:hover:bg-dark-base dark:hover:text-slate-200"
                      aria-label="Close"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>

                  {/* Title & subtitle */}
                  <div className="mt-3 sm:mt-5">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                      {content.title}
                    </h2>
                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {content.subtitle}
                    </p>
                  </div>

                  {/* Feature highlights */}
                  <div className="mt-3 space-y-2 sm:mt-6 sm:space-y-3">
                    {content.bullets.map((bullet) => {
                      const [head, ...rest] = bullet.split(' — ');
                      const tail = rest.join(' — ');
                      return (
                        <div
                          key={bullet}
                          className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-dark-border dark:bg-dark-base/60 sm:rounded-2xl sm:p-3.5"
                        >
                          <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${t.tourProgress}`} />
                          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {tail ? (
                              <>
                                <span className="font-medium text-slate-800 dark:text-slate-100">{head}</span>
                                {' — '}{tail}
                              </>
                            ) : bullet}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom section */}
                <div className="mt-3 border-t border-slate-100 pt-3 dark:border-dark-border sm:mt-4 sm:pt-4">
                  {/* Onboarding nudge */}
                  {!isPending && (
                    <p className="mb-3 text-xs leading-relaxed text-slate-400 dark:text-slate-500 sm:mb-4">
                      A guided onboarding checklist is ready to walk you through your first actions. You can reopen it from Help when you are back on your dashboard.
                    </p>
                  )}

                  {/* Show on login toggle */}
                  {!isPending && (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={showOnLogin}
                      onClick={() => onToggleShowOnLogin(!showOnLogin)}
                      className="mb-3 flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left dark:border-dark-border dark:bg-dark-base sm:mb-4 sm:rounded-2xl sm:px-3.5 sm:py-3"
                    >
                      <span
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${showOnLogin ? `bg-gradient-to-r ${t.toggleOn}` : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                      >
                        <Motion.span
                          layout
                          transition={{ type: 'spring', stiffness: 600, damping: 35 }}
                          className={`absolute h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-[left] duration-200 ${showOnLogin ? 'left-[18px]' : 'left-[3px]'
                            }`}
                        />
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Show this when I sign in again
                      </span>
                    </button>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                    {isPending ? (
                      <button
                        type="button"
                        onClick={onDismissPending}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:w-auto sm:rounded-xl sm:py-2.5 ${t.tourPrimary}`}
                      >
                        <CheckCircle size={16} />
                        Got it
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={onSkip}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-dark-border dark:bg-dark-base dark:text-slate-300 dark:hover:bg-dark-border/60 sm:w-auto sm:rounded-xl sm:py-2.5"
                        >
                          Maybe later
                        </button>
                        <button
                          type="button"
                          onClick={onGetStarted}
                          className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:w-auto sm:rounded-xl sm:py-2.5 ${t.tourPrimary}`}
                        >
                          Start onboarding
                          <CaretRight size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>{/* end bottom section */}
              </div>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
