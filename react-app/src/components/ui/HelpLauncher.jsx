import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  BookOpen, Lifebuoy, Question, PlayCircle, XCircle,
  PersonArmsSpread as AccessibilityIcon,
  Moon, Sun, Lightning as ZapOff,
  TextAlignLeft as AlignLeft, TextT as Type,
  ArrowCounterClockwise as RotateCcw,
  ListChecks, Flask,
} from '@phosphor-icons/react';
import OnboardingTour from './OnboardingTour.jsx';
import { getPortalHelp } from '../../lib/portalHelpConfig.js';
import { THEMES, resolveRouteThemeName } from '../../lib/routeTheme.js';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useOnboarding } from '../../hooks/useOnboarding.jsx';
import { usePracticeMode } from '../../context/PracticeModeContext.jsx';
import { isChecklistLandingPage } from '../../lib/onboardingUtils.js';

const VIEWPORT_MARGIN = 20;
const PANEL_GAP = 12;
const DRAG_THRESHOLD = 6;
const DEFAULT_FAB_SIZE = { width: 56, height: 56 };
const LAUNCHER_SHORTCUT_LABEL = 'Ctrl + Alt + A';

const FONT_SIZES = [
  { value: 'sm',     label: 'A', size: 'text-[10px]' },
  { value: 'normal', label: 'A', size: 'text-xs'     },
  { value: 'lg',     label: 'A', size: 'text-sm'     },
  { value: 'xl',     label: 'A', size: 'text-base'   },
  { value: 'xxl',   label: 'A', size: 'text-lg'     },
];

const SHEEN_COLORS = {
  pink:   { '--s-1': '#ec4899', '--s-2': '#f472b6', '--s-3': '#f9a8d4', '--s-4': '#fda4af', '--s-5': '#fb7185', '--s-shadow': 'rgba(236, 72, 153, 0.4)', '--s-shadow-hover': 'rgba(236, 72, 153, 0.5)' },
  blue:   { '--s-1': '#3b82f6', '--s-2': '#60a5fa', '--s-3': '#93c5fd', '--s-4': '#7dd3fc', '--s-5': '#38bdf8', '--s-shadow': 'rgba(59, 130, 246, 0.4)', '--s-shadow-hover': 'rgba(59, 130, 246, 0.5)' },
  indigo: { '--s-1': '#6366f1', '--s-2': '#818cf8', '--s-3': '#a5b4fc', '--s-4': '#c4b5fd', '--s-5': '#a78bfa', '--s-shadow': 'rgba(99, 102, 241, 0.4)', '--s-shadow-hover': 'rgba(99, 102, 241, 0.5)' },
  teal:   { '--s-1': '#14b8a6', '--s-2': '#2dd4bf', '--s-3': '#5eead4', '--s-4': '#6ee7b7', '--s-5': '#34d399', '--s-shadow': 'rgba(20, 184, 166, 0.4)', '--s-shadow-hover': 'rgba(20, 184, 166, 0.5)' },
  amber:  { '--s-1': '#f59e0b', '--s-2': '#fbbf24', '--s-3': '#fcd34d', '--s-4': '#fdba74', '--s-5': '#fb923c', '--s-shadow': 'rgba(245, 158, 11, 0.4)', '--s-shadow-hover': 'rgba(245, 158, 11, 0.5)' },
  slate:  { '--s-1': '#334155', '--s-2': '#475569', '--s-3': '#64748b', '--s-4': '#4b5563', '--s-5': '#374151', '--s-shadow': 'rgba(15, 23, 42, 0.4)', '--s-shadow-hover': 'rgba(15, 23, 42, 0.5)' },
};

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

const getViewport = () => ({
  width: typeof window !== 'undefined' ? window.innerWidth : 1280,
  height: typeof window !== 'undefined' ? window.innerHeight : 720,
});

const getFabSize = (element) => ({
  width: element?.offsetWidth || DEFAULT_FAB_SIZE.width,
  height: element?.offsetHeight || DEFAULT_FAB_SIZE.height,
});

const getDefaultLauncherPosition = (viewport, fabSize) => ({
  left: Math.max(VIEWPORT_MARGIN, viewport.width - fabSize.width - VIEWPORT_MARGIN),
  top: Math.max(VIEWPORT_MARGIN, viewport.height - fabSize.height - VIEWPORT_MARGIN),
});

const clampLauncherPosition = (position, viewport, fabSize) => {
  const maxLeft = Math.max(VIEWPORT_MARGIN, viewport.width - fabSize.width - VIEWPORT_MARGIN);
  const maxTop = Math.max(VIEWPORT_MARGIN, viewport.height - fabSize.height - VIEWPORT_MARGIN);

  return {
    left: Math.min(Math.max(position.left, VIEWPORT_MARGIN), maxLeft),
    top: Math.min(Math.max(position.top, VIEWPORT_MARGIN), maxTop),
  };
};

const resolveLauncherPosition = (position, viewport, fabSize) =>
  clampLauncherPosition(
    position ?? getDefaultLauncherPosition(viewport, fabSize),
    viewport,
    fabSize,
  );

const positionsMatch = (left, right) =>
  Math.round(left.left) === Math.round(right.left) &&
  Math.round(left.top) === Math.round(right.top);

export default function HelpLauncher() {
  const location = useLocation();
  const helpConfig = useMemo(() => getPortalHelp(location.pathname), [location.pathname]);
  const { settings, update, reset, resetLauncher } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('help');
  const [tourOpen, setTourOpen] = useState(false);
  const [viewport, setViewport] = useState(() => getViewport());
  const [fabSize, setFabSize] = useState(DEFAULT_FAB_SIZE);
  const [dragPreviewPosition, setDragPreviewPosition] = useState(null);
  const popoverRef = useRef(null);
  const fabRef = useRef(null);
  const dragStateRef = useRef(null);
  const suppressToggleRef = useRef(false);
  const {
    hasChecklist,
    checklistOpen,
    toggleChecklist,
    resetOnboarding,
    roleKey,
    showUpdatedContentBadge,
  } = useOnboarding();
  const { canPractice, active: practiceActive, openIntro } = usePracticeMode();
  const themeName = resolveRouteThemeName(location.pathname);
  const t = THEMES[themeName];
  const showChecklistActions = hasChecklist &&
    isChecklistLandingPage(roleKey, location.pathname) &&
    !['observer', 'pending'].includes(roleKey);
  const resolvedLauncherPosition = useMemo(
    () => resolveLauncherPosition(settings.launcherPosition, viewport, fabSize),
    [fabSize, settings.launcherPosition, viewport],
  );
  const launcherPosition = dragPreviewPosition ?? resolvedLauncherPosition;
  const launcherAnchor = {
    left: launcherPosition.left + fabSize.width / 2,
    top: launcherPosition.top + fabSize.height / 2,
  };
  const openAbove = launcherAnchor.top > viewport.height / 2;
  const alignRight = launcherAnchor.left > viewport.width / 2;
  const panelSide = alignRight ? 'right' : 'left';
  const panelVertical = openAbove ? 'bottom' : 'top';
  const panelOffset = fabSize.height + PANEL_GAP;

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

  // Keep launcher position in bounds as the viewport changes.
  useEffect(() => {
    const handleResize = () => {
      const nextViewport = getViewport();
      const nextFabSize = getFabSize(fabRef.current);
      const nextPosition = resolveLauncherPosition(settings.launcherPosition, nextViewport, nextFabSize);

      setViewport(nextViewport);
      setFabSize(nextFabSize);
      setDragPreviewPosition((currentPosition) =>
        currentPosition ? clampLauncherPosition(currentPosition, nextViewport, nextFabSize) : currentPosition,
      );

      if (settings.launcherPosition && !positionsMatch(settings.launcherPosition, nextPosition)) {
        update('launcherPosition', nextPosition);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [settings.launcherPosition, update]);

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

  // Provide a recovery shortcut when the floating launcher is hidden.
  useEffect(() => {
    const handleShortcut = (event) => {
      if (!event.ctrlKey || !event.altKey || event.key.toLowerCase() !== 'a') return;

      event.preventDefault();
      setActiveTab('a11y');
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const segmentActive = (active) =>
    active
      ? `bg-gradient-to-br ${t.segmentOn} text-white shadow-sm ${t.segmentShadow}`
      : 'bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-border/80';

  // Shared link/row style for Help tab items — matches a11y ToggleRow height & spacing
  const helpItemCls =
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors ${t.hoverItem}`;

  const restoreLauncherFromSettings = () => {
    setDragPreviewPosition(null);
    resetLauncher();
    setActiveTab('a11y');
    setIsOpen(true);
  };

  const resetLauncherPosition = () => {
    setDragPreviewPosition(null);
    update('launcherPosition', null);
  };

  const handleFabPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: launcherPosition.left,
      originTop: launcherPosition.top,
      fabSize,
      moved: false,
      nextPosition: launcherPosition,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleFabPointerMove = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const nextPosition = clampLauncherPosition(
      {
        left: dragState.originLeft + deltaX,
        top: dragState.originTop + deltaY,
      },
      viewport,
      dragState.fabSize,
    );

    if (!dragState.moved && Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD) {
      dragState.moved = true;
      suppressToggleRef.current = true;
    }

    dragState.nextPosition = nextPosition;

    if (dragState.moved) {
      setDragPreviewPosition(nextPosition);
    }
  };

  const finishDragging = (pointerId) => {
    const dragState = dragStateRef.current;
    if (!dragState || (pointerId != null && dragState.pointerId !== pointerId)) return;

    if (dragState.moved) {
      update('launcherPosition', dragState.nextPosition);
      setDragPreviewPosition(null);
      window.setTimeout(() => {
        suppressToggleRef.current = false;
      }, 0);
    }

    dragStateRef.current = null;
  };

  const handleFabPointerUp = (event) => {
    finishDragging(event.pointerId);
  };

  const handleFabPointerCancel = (event) => {
    finishDragging(event.pointerId);
  };

  const handleFabClick = () => {
    if (suppressToggleRef.current) {
      suppressToggleRef.current = false;
      return;
    }

    setIsOpen((prev) => !prev);
  };

  return (
    <>
      <div
        ref={popoverRef}
        className="fixed z-[95] print:hidden"
        style={{
          left: launcherPosition.left,
          top: launcherPosition.top,
          width: fabSize.width,
          height: fabSize.height,
        }}
      >

        {/* Panel */}
        <AnimatePresence>
          {isOpen && (
            <Motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{
                transformOrigin: `${panelVertical} ${panelSide}`,
                [panelVertical]: panelOffset,
                [panelSide]: 0,
              }}
              className="absolute z-[1] w-72 max-w-[calc(100vw-2.5rem)] rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl dark:border-dark-border dark:bg-dark-surface overflow-hidden"
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
                        ...(canPractice && !practiceActive ? [{
                          as: 'button',
                          icon: <Flask size={18} />,
                          label: 'Try practice mode',
                          onClick: () => { openIntro(); setIsOpen(false); },
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
                      {!settings.launcherVisible && (
                        <Motion.div
                          variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                          className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/20 px-3 py-2.5"
                        >
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                            Floating Button Hidden
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/80">
                            Use {LAUNCHER_SHORTCUT_LABEL} any time to reopen Accessibility settings and bring the launcher back.
                          </p>
                        </Motion.div>
                      )}

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

                      {/* Launcher */}
                      <Motion.div variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Launcher</p>
                        <div className="space-y-3.5">
                          <ToggleRow
                            label="Show Floating Button"
                            description={settings.launcherVisible
                              ? 'Keep the help and accessibility button on screen.'
                              : `Hidden for now. Press ${LAUNCHER_SHORTCUT_LABEL} to return here.`}
                            icon={<AccessibilityIcon className="w-5 h-5" />}
                            value={settings.launcherVisible}
                            onChange={(value) => {
                              update('launcherVisible', value);
                              if (value) {
                                setActiveTab('a11y');
                                setIsOpen(true);
                              }
                            }}
                            theme={themeName}
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={resetLauncherPosition}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-dark-border dark:text-slate-300 dark:hover:bg-dark-border"
                            >
                              Reset Position
                            </button>
                            <button
                              type="button"
                              onClick={restoreLauncherFromSettings}
                              className={`rounded-xl px-3 py-2 text-xs font-bold text-white transition-all ${t.segmentOn} ${t.segmentShadow} bg-gradient-to-br`}
                            >
                              Restore Button
                            </button>
                          </div>

                          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                            Drag the floating button anywhere on the screen. Reset Position returns it to the default bottom-right spot.
                          </p>
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
        {settings.launcherVisible && (
          <Motion.button
            ref={fabRef}
            type="button"
            onClick={handleFabClick}
            onPointerDown={handleFabPointerDown}
            onPointerMove={handleFabPointerMove}
            onPointerUp={handleFabPointerUp}
            onPointerCancel={handleFabPointerCancel}
            whileHover={isOpen ? undefined : { scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            animate={{ scale: isOpen ? 0.95 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex h-11 w-11 cursor-grab items-center justify-center rounded-full transition-[box-shadow] sheen-button text-white active:cursor-grabbing sm:h-14 sm:w-14"
            aria-label="Open help and accessibility options"
            aria-expanded={isOpen}
            data-active={isOpen}
            style={{
              ...(SHEEN_COLORS[themeName] || SHEEN_COLORS.slate),
              touchAction: 'none',
            }}
            title={`Drag to move. ${LAUNCHER_SHORTCUT_LABEL} reopens Accessibility if hidden.`}
          >
            <Motion.div transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
              <Question size={26} weight="fill" />
            </Motion.div>
          </Motion.button>
        )}
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
