import { Flask, X } from '@phosphor-icons/react';
import { useAccessibility } from '../../context/AccessibilityContext.jsx';

export default function PracticeModeBanner({ onExit }) {
  const { settings } = useAccessibility();

  return (
    <div
      className={`fixed top-0 inset-x-0 z-[200] flex items-center justify-center gap-3 bg-amber-500 dark:bg-amber-600 px-4 py-2 shadow-lg print:hidden ${
        settings.reduceMotion ? '' : 'animate-in slide-in-from-top-1 duration-200'
      }`}
    >
      <Flask size={15} className="shrink-0 text-amber-900/70" />
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-950">
        Practice Mode — no real data will be affected
      </p>
      <button
        type="button"
        onClick={onExit}
        className="ml-2 flex items-center gap-1.5 rounded-lg bg-amber-900/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-950 transition-colors hover:bg-amber-900/25"
        aria-label="Exit practice mode"
      >
        <X size={11} weight="bold" />
        Exit
      </button>
    </div>
  );
}
