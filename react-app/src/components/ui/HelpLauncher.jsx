import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  BookOpen, Lifebuoy, Question, PlayCircle, XCircle,
  PersonArmsSpread as AccessibilityIcon,
  Moon, Sun, Lightning as ZapOff,
  TextAlignLeft as AlignLeft, TextT as Type,
  ArrowCounterClockwise as RotateCcw,
  ListChecks,
} from '@phosphor-icons/react';
import OnboardingTour from './OnboardingTour.jsx';
import { getPortalHelp } from '../../lib/portalHelpConfig.js';
import { THEMES, resolveRouteThemeName } from '../../lib/routeTheme.js';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useOnboarding } from '../../hooks/useOnboarding.jsx';

const FONT_SIZES = [
  { value: 'sm',     label: 'A', size: 'text-[10px]' },
  { value: 'normal', label: 'A', size: 'text-xs'     },
  { value: 'lg',     label: 'A', size: 'text-sm'     },
  { value: 'xl',     label: 'A', size: 'text-base'   },
  { value: 'xxl',   label: 'A', size: 'text-lg'     },
];

const SPACING_OPTIONS = [
  { value: 'normal',  label: '1×'   },
  { value: 'relaxed', label: '1.5×' },
  { value: 'loose',   label: '2×'   },
];

const COLOR_SCHEMES = [
  { value: 'system', label: 'System' },
  { value: 'light',  label: 'Light'  },
  { value: 'dark',   label: 'Dark'   },
];

function ToggleSwitch({ value, onChange, theme }) {
  const t = THEMES[theme];
  return (
    <button
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${t.focusRing} focus-visible:outline focus-visible:outline-2 ${value ? `bg-gradient-to-r ${t.toggleOn}` : 'bg-slate-200 dark:bg-dark-border'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
    </button>
  );
}

function ToggleRow({ label, description, icon, value, onChange, theme }) {
  const t = THEMES[theme];
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`flex-shrink-0 transition-colors ${value ? t.icon : 'text-slate-400'}`}>{icon}</span>
        <div className="min-w-0">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">{label}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{description}</div>
        </div>
      </div>
      <ToggleSwitch value={value} onChange={onChange} theme={theme} />
    </div>
  );
}

export default function HelpLauncher() {
  const location = useLocation();
  const helpConfig = useMemo(() => getPortalHelp(location.pathname), [location.pathname]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('help');
  const [tourOpen, setTourOpen] = useState(false);
  const popoverRef = useRef(null);

  const { settings, update, reset } = useAccessibility();
  const {
    hasChecklist,
    checklistOpen,
    toggleChecklist,
    resetOnboarding,
    roleKey,
    showUpdatedContentBadge,
  } = useOnboarding();
  const themeName = resolveRouteThemeName(location.pathname);
  const t = THEMES[themeName];
  const showChecklistActions = hasChecklist && !['observer', 'pending'].includes(roleKey);

  // Close panel on navigation
  useEffect(() => {
    const timer = window.setTimeout(() => setIsOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  // Default tab: help when available, else accessibility
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveTab(helpConfig ? 'help' : 'a11y');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname, helpConfig]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const segmentActive = (active) =>
    active
      ? `bg-gradient-to-br ${t.segmentOn} text-white shadow-sm ${t.segmentShadow}`
      : 'bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-border/80';

  // Shared link/row style for Help tab items — matches a11y ToggleRow height & spacing
  const helpItemCls =
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors ${t.hoverItem}`;

  return (
    <>
      <div ref={popoverRef} className="fixed bottom-5 right-5 z-[95] print:hidden flex flex-col items-end">

        {/* Panel */}
        <AnimatePresence>
          {isOpen && (
            <Motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'bottom right' }}
              className="mb-3 w-72 max-w-[calc(100vw-2.5rem)] rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl dark:border-dark-border dark:bg-dark-surface overflow-hidden"
            >
              {/* Tab header */}
              <div className="flex items-center gap-2 px-3 pt-3 pb-2.5 border-b border-slate-100 dark:border-dark-border">
                <div className="flex flex-1 rounded-xl bg-slate-100 dark:bg-dark-border p-0.5 gap-0.5">
                  {helpConfig && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('help')}
                      className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 rounded-[10px] text-[11px] font-bold transition-all ${
                        activeTab === 'help'
                          ? 'bg-white dark:bg-dark-surface shadow-sm text-slate-800 dark:text-slate-100'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <Question size={12} weight={activeTab === 'help' ? 'fill' : 'regular'} />
                      Help
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab('a11y')}
                    className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 rounded-[10px] text-[11px] font-bold transition-all ${
                      activeTab === 'a11y'
                        ? 'bg-white dark:bg-dark-surface shadow-sm text-slate-800 dark:text-slate-100'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <AccessibilityIcon size={12} weight={activeTab === 'a11y' ? 'fill' : 'regular'} />
                    Accessibility
                  </button>
                </div>
                <Motion.button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex-shrink-0 rounded-xl p-1.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Close panel"
                >
                  <XCircle size={18} weight="fill" />
                </Motion.button>
              </div>

              {/* Tab content — crossfade between tabs */}
              <AnimatePresence mode="wait">
                <Motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16, ease: 'easeInOut' }}
                >
                  {/* ── Help tab ── */}
                  {activeTab === 'help' && helpConfig && (
                    <Motion.div
                      className="px-5 py-4 space-y-1"
                      initial="hidden"
                      animate="visible"
                      variants={{ visible: { transition: { staggerChildren: 0.055 } } }}
                    >
                      <Motion.p
                        variants={{ hidden: { opacity: 0, x: -6 }, visible: { opacity: 1, x: 0 } }}
                        className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3"
                      >
                        {helpConfig.title}
                      </Motion.p>

                      {showUpdatedContentBadge && (
                        <Motion.div
                          variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                          className="mb-3 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/20 px-3 py-2.5"
                        >
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                            Updated Onboarding
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/80">
                            New onboarding content is available in the checklist whenever you want to review it.
                          </p>
                        </Motion.div>
                      )}

                      {[
                        { as: 'link', to: helpConfig.docsHref, icon: <BookOpen size={18} />, label: 'Getting Started', onClick: () => setIsOpen(false) },
                        { as: 'link', to: '/faq',              icon: <Question  size={18} />, label: 'FAQ',             onClick: () => setIsOpen(false) },
                        { as: 'a',    href: helpConfig.contactHref, icon: <Lifebuoy size={18} />, label: 'Contact SDO IT' },
                        ...(showChecklistActions ? [{
                          as: 'button',
                          icon: <ListChecks size={18} />,
                          label: checklistOpen ? 'Hide onboarding checklist' : 'Show onboarding checklist',
                          onClick: () => { toggleChecklist(); setIsOpen(false); },
                        }] : []),
                        ...(showChecklistActions ? [{
                          as: 'button',
                          icon: <RotateCcw size={18} />,
                          label: 'Reset onboarding',
                          onClick: () => { resetOnboarding(); setIsOpen(false); },
                        }] : []),
                        ...(helpConfig.steps?.length > 0 ? [{
                          as: 'button',
                          icon: <PlayCircle size={18} />,
                          label: 'Show tour again',
                          onClick: () => { localStorage.removeItem(helpConfig.storageKey); setTourOpen(true); setIsOpen(false); },
                        }] : []),
                      ].map(({ as, to, href, icon, label, onClick }) => (
                        <Motion.div
                          key={label}
                          variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                        >
                          {as === 'link' ? (
                            <Link to={to} className={helpItemCls} onClick={onClick}><span className={t.icon}>{icon}</span>{label}</Link>
                          ) : as === 'a' ? (
                            <a href={href} className={helpItemCls}><span className={t.icon}>{icon}</span>{label}</a>
                          ) : (
                            <button type="button" className={helpItemCls} onClick={onClick}><span className={t.icon}>{icon}</span>{label}</button>
                          )}
                        </Motion.div>
                      ))}
                    </Motion.div>
                  )}

                  {/* ── Accessibility tab ── */}
                  {activeTab === 'a11y' && (
                    <Motion.div
                      className="px-5 py-4 space-y-5 max-h-[480px] overflow-y-auto"
                      initial="hidden"
                      animate="visible"
                      variants={{ visible: { transition: { staggerChildren: 0.045 } } }}
                    >
                      {/* Visual */}
                      <Motion.div variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Visual</p>
                        <div className="space-y-3.5">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Moon className={`w-5 h-5 ${settings.darkMode ? t.icon : 'text-slate-400'}`} />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Colour Scheme</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              {COLOR_SCHEMES.map(({ value, label }) => (
                                <button
                                  key={value}
                                  onClick={() => update('colorScheme', value)}
                                  className={`h-9 rounded-xl text-[11px] font-black transition-all ${segmentActive(settings.colorScheme === value)}`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <ToggleRow
                            label="High Contrast"
                            description="Stronger borders and colors"
                            icon={<Sun className="w-5 h-5" />}
                            value={settings.highContrast}
                            onChange={v => update('highContrast', v)}
                            theme={themeName}
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Type className={`w-5 h-5 ${settings.fontSize !== 'normal' ? t.icon : 'text-slate-400'}`} />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Font Size</span>
                            </div>
                            <div className="flex gap-1">
                              {FONT_SIZES.map(({ value, label, size }) => (
                                <button
                                  key={value}
                                  onClick={() => update('fontSize', value)}
                                  title={value === 'sm' ? 'Small' : value === 'normal' ? 'Normal' : value === 'lg' ? 'Large' : value === 'xl' ? 'X-Large' : 'XX-Large'}
                                  className={`flex-1 h-9 flex items-center justify-center rounded-xl font-black transition-all ${size} ${segmentActive(settings.fontSize === value)}`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Motion.div>

                      <Motion.div
                        variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                        className="border-t border-slate-100 dark:border-dark-border"
                      />

                      {/* Motion & Reading */}
                      <Motion.div variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Motion & Reading</p>
                        <div className="space-y-3.5">
                          <ToggleRow
                            label="Reduce Motion"
                            description="Minimize animations and transitions"
                            icon={<ZapOff className="w-5 h-5" />}
                            value={settings.reduceMotion}
                            onChange={v => update('reduceMotion', v)}
                            theme={themeName}
                          />
                          <ToggleRow
                            label="OpenDyslexic Font"
                            description="Switch to OpenDyslexic typeface"
                            icon={<BookOpen className="w-5 h-5" />}
                            value={settings.dyslexicFont}
                            onChange={v => update('dyslexicFont', v)}
                            theme={themeName}
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <AlignLeft className={`w-5 h-5 ${settings.lineSpacing !== 'normal' ? t.icon : 'text-slate-400'}`} />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Line Spacing</span>
                            </div>
                            <div className="flex gap-1">
                              {SPACING_OPTIONS.map(({ value, label }) => (
                                <button
                                  key={value}
                                  onClick={() => update('lineSpacing', value)}
                                  className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all ${segmentActive(settings.lineSpacing === value)}`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <ToggleRow
                            label="Wide Letter Spacing"
                            description="Increase space between characters"
                            icon={<Type className="w-5 h-5" />}
                            value={settings.letterSpacing === 'wide'}
                            onChange={v => update('letterSpacing', v ? 'wide' : 'normal')}
                            theme={themeName}
                          />
                        </div>
                      </Motion.div>

                      <Motion.div
                        variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                        className="border-t border-slate-100 dark:border-dark-border"
                      />

                      <Motion.button
                        variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                        onClick={reset}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-border rounded-xl transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset to defaults
                      </Motion.button>
                    </Motion.div>
                  )}
                </Motion.div>
              </AnimatePresence>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* FAB */}
        <Motion.button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={`flex h-14 w-14 items-center justify-center rounded-full transition-[background-image,box-shadow,transform] ${t.fab} ${t.fabHover}`}
          aria-label="Open help and accessibility options"
          aria-expanded={isOpen}
        >
          <Motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          >
            <Question size={26} weight="fill" />
          </Motion.div>
        </Motion.button>
      </div>

      {helpConfig && (
        <OnboardingTour
          key={`${helpConfig.storageKey ?? helpConfig.id}:${tourOpen ? 'open' : 'closed'}`}
          open={tourOpen}
          title={helpConfig.title}
          steps={helpConfig.steps}
          storageKey={helpConfig.storageKey}
          onClose={() => setTourOpen(false)}
        />
      )}
    </>
  );
}
