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

// ─── Constants ───────────────────────────────────────────────────────────────

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

// ─── Position utilities ───────────────────────────────────────────────────────

const getViewport = () => ({
  width: typeof window !== 'undefined' ? window.innerWidth : 1280,
  height: typeof window !== 'undefined' ? window.innerHeight : 720,
});

const getFabSize = (el) => ({
  width: el?.offsetWidth  || DEFAULT_FAB_SIZE.width,
  height: el?.offsetHeight || DEFAULT_FAB_SIZE.height,
});

const getDefaultPosition = (viewport, fabSize) => ({
  left: Math.max(VIEWPORT_MARGIN, viewport.width  - fabSize.width  - VIEWPORT_MARGIN),
  top:  Math.max(VIEWPORT_MARGIN, viewport.height - fabSize.height - VIEWPORT_MARGIN),
});

const clampPosition = (pos, viewport, fabSize) => ({
  left: Math.min(Math.max(pos.left, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, viewport.width  - fabSize.width  - VIEWPORT_MARGIN)),
  top:  Math.min(Math.max(pos.top,  VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, viewport.height - fabSize.height - VIEWPORT_MARGIN)),
});

const resolvePosition = (saved, viewport, fabSize) =>
  clampPosition(saved ?? getDefaultPosition(viewport, fabSize), viewport, fabSize);

const positionsMatch = (a, b) =>
  Math.round(a.left) === Math.round(b.left) && Math.round(a.top) === Math.round(b.top);

// ─── Animation variant helpers ───────────────────────────────────────────────

const staggerVariants = (delay = 0.055) => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay } },
});
const slideIn = (offset = -8) => ({
  hidden: { opacity: 0, x: offset },
  visible: { opacity: 1, x: 0 },
});
const fadeUp = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

// ─── Small shared primitives ─────────────────────────────────────────────────

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

// ─── useDraggableLauncher ─────────────────────────────────────────────────────

function useDraggableLauncher(savedPosition, update) {
  const fabRef = useRef(null);
  const dragStateRef = useRef(null);
  const suppressToggleRef = useRef(false);
  const [viewport, setViewport] = useState(getViewport);
  const [fabSize, setFabSize] = useState(DEFAULT_FAB_SIZE);
  const [dragPreview, setDragPreview] = useState(null);

  const resolved = useMemo(
    () => resolvePosition(savedPosition, viewport, fabSize),
    [savedPosition, viewport, fabSize],
  );
  const position = dragPreview ?? resolved;

  useEffect(() => {
    const onResize = () => {
      const nextViewport = getViewport();
      const nextFabSize  = getFabSize(fabRef.current);
      const nextResolved = resolvePosition(savedPosition, nextViewport, nextFabSize);

      setViewport(nextViewport);
      setFabSize(nextFabSize);
      setDragPreview((cur) => cur ? clampPosition(cur, nextViewport, nextFabSize) : cur);

      if (savedPosition && !positionsMatch(savedPosition, nextResolved)) {
        update('launcherPosition', nextResolved);
      }
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [savedPosition, update]);

  const onPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: position.left,
      originTop:  position.top,
      fabSize,
      moved: false,
      nextPosition: position,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    const next = clampPosition(
      { left: state.originLeft + dx, top: state.originTop + dy },
      viewport,
      state.fabSize,
    );

    if (!state.moved && Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
      state.moved = true;
      suppressToggleRef.current = true;
    }

    state.nextPosition = next;
    if (state.moved) setDragPreview(next);
  };

  const finishDrag = (pointerId) => {
    const state = dragStateRef.current;
    if (!state || (pointerId != null && state.pointerId !== pointerId)) return;

    if (state.moved) {
      update('launcherPosition', state.nextPosition);
      setDragPreview(null);
      window.setTimeout(() => { suppressToggleRef.current = false; }, 0);
    }

    dragStateRef.current = null;
  };

  const interceptClick = (onToggle) => {
    if (suppressToggleRef.current) {
      suppressToggleRef.current = false;
      return;
    }
    onToggle();
  };

  return {
    fabRef,
    fabSize,
    viewport,
    position,
    resetDragPreview: () => setDragPreview(null),
    onPointerDown,
    onPointerMove,
    onPointerUp:     (e) => finishDrag(e.pointerId),
    onPointerCancel: (e) => finishDrag(e.pointerId),
    interceptClick,
  };
}

// ─── HelpTabContent ───────────────────────────────────────────────────────────

function HelpTabContent({
  helpConfig, themeName,
  showUpdatedContentBadge,
  showChecklistActions, checklistOpen, toggleChecklist, resetOnboarding,
  canPractice, practiceActive, openIntro,
  onStartTour, onClose,
}) {
  const t = THEMES[themeName];
  const itemCls = `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors ${t.hoverItem}`;

  const items = [
    { as: 'link', to: helpConfig.docsHref,      icon: <BookOpen  size={18} />, label: 'Getting Started', onClick: onClose },
    { as: 'link', to: '/faq',                   icon: <Question  size={18} />, label: 'FAQ',             onClick: onClose },
    { as: 'a',    href: helpConfig.contactHref, icon: <Lifebuoy  size={18} />, label: 'Contact SDO IT'                    },
    ...(showChecklistActions ? [
      {
        as: 'button',
        icon: <ListChecks size={18} />,
        label: checklistOpen ? 'Hide onboarding checklist' : 'Show onboarding checklist',
        onClick: () => { toggleChecklist(); onClose(); },
      },
      {
        as: 'button',
        icon: <RotateCcw size={18} />,
        label: 'Reset onboarding',
        onClick: () => { resetOnboarding(); onClose(); },
      },
    ] : []),
    ...(canPractice && !practiceActive ? [{
      as: 'button',
      icon: <Flask size={18} />,
      label: 'Try practice mode',
      onClick: () => { openIntro(); onClose(); },
    }] : []),
    ...(helpConfig.steps?.length > 0 ? [{
      as: 'button',
      icon: <PlayCircle size={18} />,
      label: 'Start guided tour',
      onClick: () => { localStorage.removeItem(helpConfig.storageKey); onStartTour(); onClose(); },
    }] : []),
  ];

  return (
    <Motion.div
      className="px-5 py-4 space-y-1"
      initial="hidden"
      animate="visible"
      variants={staggerVariants()}
    >
      <Motion.p
        variants={slideIn(-6)}
        className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3"
      >
        {helpConfig.title}
      </Motion.p>

      {showUpdatedContentBadge && (
        <Motion.div
          variants={slideIn()}
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

      {items.map(({ as, to, href, icon, label, onClick }) => (
        <Motion.div key={label} variants={slideIn()}>
          {as === 'link' ? (
            <Link to={to} className={itemCls} onClick={onClick}>
              <span className={t.icon}>{icon}</span>{label}
            </Link>
          ) : as === 'a' ? (
            <a href={href} className={itemCls}>
              <span className={t.icon}>{icon}</span>{label}
            </a>
          ) : (
            <button type="button" className={itemCls} onClick={onClick}>
              <span className={t.icon}>{icon}</span>{label}
            </button>
          )}
        </Motion.div>
      ))}
    </Motion.div>
  );
}

// ─── A11yTabContent ───────────────────────────────────────────────────────────

function A11yTabContent({ settings, update, reset, themeName, onResetPosition, onRestoreLauncher }) {
  const t = THEMES[themeName];

  const segmentActive = (active) =>
    active
      ? `bg-gradient-to-br ${t.segmentOn} text-white shadow-sm ${t.segmentShadow}`
      : 'bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-border/80';

  return (
    <Motion.div
      className="px-5 py-4 space-y-5 max-h-[480px] overflow-y-auto"
      initial="hidden"
      animate="visible"
      variants={staggerVariants(0.045)}
    >
      {!settings.launcherVisible && (
        <Motion.div
          variants={fadeUp}
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
      <Motion.div variants={fadeUp}>
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
            onChange={(v) => update('highContrast', v)}
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

      <Motion.div variants={fadeUp} className="border-t border-slate-100 dark:border-dark-border" />

      {/* Motion & Reading */}
      <Motion.div variants={fadeUp}>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Motion & Reading</p>
        <div className="space-y-3.5">
          <ToggleRow
            label="Reduce Motion"
            description="Minimize animations and transitions"
            icon={<ZapOff className="w-5 h-5" />}
            value={settings.reduceMotion}
            onChange={(v) => update('reduceMotion', v)}
            theme={themeName}
          />
          <ToggleRow
            label="OpenDyslexic Font"
            description="Switch to OpenDyslexic typeface"
            icon={<BookOpen className="w-5 h-5" />}
            value={settings.dyslexicFont}
            onChange={(v) => update('dyslexicFont', v)}
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
            onChange={(v) => update('letterSpacing', v ? 'wide' : 'normal')}
            theme={themeName}
          />
        </div>
      </Motion.div>

      <Motion.div variants={fadeUp} className="border-t border-slate-100 dark:border-dark-border" />

      {/* Launcher */}
      <Motion.div variants={fadeUp}>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Launcher</p>
        <div className="space-y-3.5">
          <ToggleRow
            label="Show Floating Button"
            description={settings.launcherVisible
              ? 'Keep the help and accessibility button on screen.'
              : `Hidden for now. Press ${LAUNCHER_SHORTCUT_LABEL} to return here.`}
            icon={<AccessibilityIcon className="w-5 h-5" />}
            value={settings.launcherVisible}
            onChange={(v) => {
              update('launcherVisible', v);
              if (v) onRestoreLauncher();
            }}
            theme={themeName}
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onResetPosition}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-dark-border dark:text-slate-300 dark:hover:bg-dark-border"
            >
              Reset Position
            </button>
            <button
              type="button"
              onClick={onRestoreLauncher}
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

      <Motion.div variants={fadeUp} className="border-t border-slate-100 dark:border-dark-border" />

      <Motion.button
        variants={fadeUp}
        onClick={reset}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-border rounded-xl transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset to defaults
      </Motion.button>
    </Motion.div>
  );
}

// ─── HelpLauncher ─────────────────────────────────────────────────────────────

export default function HelpLauncher() {
  const location  = useLocation();
  const { settings, update, reset, resetLauncher } = useAccessibility();
  const [isOpen, setIsOpen]       = useState(false);
  const [activeTab, setActiveTab] = useState('help');
  const [tourOpen, setTourOpen]   = useState(false);
  const popoverRef = useRef(null);

  const drag = useDraggableLauncher(settings.launcherPosition, update);

  const {
    hasChecklist, checklistOpen, toggleChecklist, resetOnboarding,
    roleKey, showUpdatedContentBadge,
  } = useOnboarding();
  const helpConfig = useMemo(
    () => getPortalHelp(location.pathname, roleKey),
    [location.pathname, roleKey],
  );
  const { canPractice, active: practiceActive, openIntro } = usePracticeMode();

  const themeName = resolveRouteThemeName(location.pathname);

  const showChecklistActions =
    hasChecklist &&
    isChecklistLandingPage(roleKey, location.pathname) &&
    roleKey !== 'pending';

  // Derived layout
  const anchor     = { left: drag.position.left + drag.fabSize.width / 2, top: drag.position.top + drag.fabSize.height / 2 };
  const openAbove  = anchor.top  > drag.viewport.height / 2;
  const alignRight = anchor.left > drag.viewport.width  / 2;
  const panelSide     = alignRight ? 'right' : 'left';
  const panelVertical = openAbove  ? 'bottom' : 'top';
  const panelOffset   = drag.fabSize.height + PANEL_GAP;

  // Close panel on navigation
  useEffect(() => {
    const t = window.setTimeout(() => setIsOpen(false), 0);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  // Default tab: help when available, else accessibility
  useEffect(() => {
    const t = window.setTimeout(() => setActiveTab(helpConfig ? 'help' : 'a11y'), 0);
    return () => window.clearTimeout(t);
  }, [location.pathname, helpConfig]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return undefined;
    const onOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [isOpen]);

  // Keyboard recovery shortcut
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!e.ctrlKey || !e.altKey || e.key.toLowerCase() !== 'a') return;
      e.preventDefault();
      setActiveTab('a11y');
      setIsOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleRestoreLauncher = () => {
    drag.resetDragPreview();
    resetLauncher();
    setActiveTab('a11y');
    setIsOpen(true);
  };

  const handleResetPosition = () => {
    drag.resetDragPreview();
    update('launcherPosition', null);
  };

  const tabBtnCls = (active) =>
    `flex flex-1 items-center justify-center gap-1.5 py-1.5 rounded-[10px] text-[11px] font-bold transition-all ${
      active
        ? 'bg-white dark:bg-dark-surface shadow-sm text-slate-800 dark:text-slate-100'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
    }`;

  return (
    <>
      <div
        ref={popoverRef}
        className="fixed z-[95] print:hidden"
        style={{
          left: drag.position.left,
          top:  drag.position.top,
          width:  drag.fabSize.width,
          height: drag.fabSize.height,
        }}
      >
        {/* Panel */}
        <AnimatePresence>
          {isOpen && (
            <Motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.94, y: 10 }}
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
                    <button type="button" onClick={() => setActiveTab('help')} className={tabBtnCls(activeTab === 'help')}>
                      <Question size={12} weight={activeTab === 'help' ? 'fill' : 'regular'} />
                      Help
                    </button>
                  )}
                  <button type="button" onClick={() => setActiveTab('a11y')} className={tabBtnCls(activeTab === 'a11y')}>
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

              {/* Tab content */}
              <AnimatePresence mode="wait">
                <Motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y:  6 }}
                  animate={{ opacity: 1, y:  0 }}
                  exit={{    opacity: 0, y: -6 }}
                  transition={{ duration: 0.16, ease: 'easeInOut' }}
                >
                  {activeTab === 'help' && helpConfig && (
                    <HelpTabContent
                      helpConfig={helpConfig}
                      themeName={themeName}
                      showUpdatedContentBadge={showUpdatedContentBadge}
                      showChecklistActions={showChecklistActions}
                      checklistOpen={checklistOpen}
                      toggleChecklist={toggleChecklist}
                      resetOnboarding={resetOnboarding}
                      canPractice={canPractice}
                      practiceActive={practiceActive}
                      openIntro={openIntro}
                      onStartTour={() => setTourOpen(true)}
                      onClose={() => setIsOpen(false)}
                    />
                  )}
                  {activeTab === 'a11y' && (
                    <A11yTabContent
                      settings={settings}
                      update={update}
                      reset={reset}
                      themeName={themeName}
                      onResetPosition={handleResetPosition}
                      onRestoreLauncher={handleRestoreLauncher}
                    />
                  )}
                </Motion.div>
              </AnimatePresence>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* FAB */}
        {settings.launcherVisible && (
          <Motion.button
            ref={drag.fabRef}
            type="button"
            onClick={() => drag.interceptClick(() => setIsOpen((p) => !p))}
            onPointerDown={drag.onPointerDown}
            onPointerMove={drag.onPointerMove}
            onPointerUp={drag.onPointerUp}
            onPointerCancel={drag.onPointerCancel}
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
