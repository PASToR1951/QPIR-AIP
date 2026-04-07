import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    PersonArmsSpread as Accessibility,
    XCircleIcon as X,
    Moon,
    Sun,
    Lightning as ZapOff,
    BookOpen,
    TextAlignLeft as AlignLeft,
    TextT as Type,
    ArrowCounterClockwise as RotateCcw,
} from '@phosphor-icons/react';
import { useAccessibility } from '../../context/AccessibilityContext';

/* ── Theme definitions ─────────────────────────────────────────────────── */
const ROUTE_THEMES = {
    '/':          'pink',
    '/aip':       'pink',
    '/pir':       'blue',
    '/login':     'indigo',
    '/changelog': 'slate',
    '/docs':      'slate',
    '/faq':       'slate',
    '/403':       'slate',
    '/500':       'slate',
};

const THEMES = {
    pink: {
        strip:          'from-pink-500 via-purple-500 to-indigo-500',
        icon:           'text-pink-500',
        toggleOn:       'from-pink-500 to-rose-500',
        segmentOn:      'from-pink-500 to-rose-500',
        segmentShadow:  'shadow-pink-200',
        btnOpen:        'from-pink-500 to-rose-500 border-pink-600 shadow-pink-200',
        btnClosed:      'hover:border-pink-200 dark:hover:border-pink-500/40 hover:text-pink-500 dark:hover:text-pink-400 hover:shadow-pink-100 dark:hover:shadow-none',
        focusRing:      'focus-visible:outline-pink-500',
    },
    blue: {
        strip:          'from-blue-500 via-cyan-400 to-indigo-500',
        icon:           'text-blue-500',
        toggleOn:       'from-blue-500 to-cyan-500',
        segmentOn:      'from-blue-500 to-cyan-500',
        segmentShadow:  'shadow-blue-200',
        btnOpen:        'from-blue-500 to-cyan-500 border-blue-600 shadow-blue-200',
        btnClosed:      'hover:border-blue-200 dark:hover:border-blue-500/40 hover:text-blue-500 dark:hover:text-blue-400 hover:shadow-blue-100 dark:hover:shadow-none',
        focusRing:      'focus-visible:outline-blue-500',
    },
    indigo: {
        strip:          'from-indigo-500 via-violet-500 to-purple-500',
        icon:           'text-indigo-500',
        toggleOn:       'from-indigo-500 to-violet-500',
        segmentOn:      'from-indigo-500 to-violet-500',
        segmentShadow:  'shadow-indigo-200',
        btnOpen:        'from-indigo-500 to-violet-500 border-indigo-600 shadow-indigo-200',
        btnClosed:      'hover:border-indigo-200 dark:hover:border-indigo-500/40 hover:text-indigo-500 dark:hover:text-indigo-400 hover:shadow-indigo-100 dark:hover:shadow-none',
        focusRing:      'focus-visible:outline-indigo-500',
    },
    slate: {
        strip:          'from-slate-400 via-slate-500 to-slate-600',
        icon:           'text-slate-500',
        toggleOn:       'from-slate-600 to-slate-700',
        segmentOn:      'from-slate-600 to-slate-700',
        segmentShadow:  'shadow-slate-200',
        btnOpen:        'from-slate-600 to-slate-700 border-slate-700 shadow-slate-200',
        btnClosed:      'hover:border-slate-400 dark:hover:border-slate-500/40 hover:text-slate-600 dark:hover:text-slate-400 hover:shadow-slate-100 dark:hover:shadow-none',
        focusRing:      'focus-visible:outline-slate-500',
    },
};

/* ── Sub-components ────────────────────────────────────────────────────── */
function ToggleSwitch({ value, onChange, theme }) {
    const t = THEMES[theme];
    return (
        <button
            onClick={() => onChange(!value)}
            role="switch"
            aria-checked={value}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${t.focusRing} focus-visible:outline focus-visible:outline-2 ${value ? `bg-gradient-to-r ${t.toggleOn}` : 'bg-slate-200'}`}
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

/* ── Main component ────────────────────────────────────────────────────── */
export default function AccessibilityPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const { settings, update, reset } = useAccessibility();
    const { pathname } = useLocation();

    const themeName = ROUTE_THEMES[pathname] ?? 'slate';
    const t = THEMES[themeName];

    const segmentActive = (active) =>
        active
            ? `bg-gradient-to-br ${t.segmentOn} text-white shadow-sm ${t.segmentShadow}`
            : 'bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-border/80';

    return (
        <div className="fixed bottom-6 right-6 z-[60] print:hidden">
            {isOpen && (
                <div className="absolute bottom-14 right-0 w-72 bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[1.5rem] shadow-2xl overflow-hidden mb-2">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-dark-border">
                        <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Accessibility className={`w-4 h-4 ${t.icon}`} />
                            Accessibility
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
                            aria-label="Close accessibility panel"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="px-5 py-4 space-y-5">

                        {/* Visual */}
                        <div>
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
                        </div>

                        <div className="border-t border-slate-100 dark:border-dark-border" />

                        {/* Motion & Reading */}
                        <div>
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
                        </div>

                        <div className="border-t border-slate-100 dark:border-dark-border" />

                        <button
                            onClick={reset}
                            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-border rounded-xl transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset to defaults
                        </button>
                    </div>
                </div>
            )}

            {/* Trigger button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-12 h-12 rounded-2xl shadow-lg border transition-all duration-200 flex items-center justify-center ${
                    isOpen
                        ? `bg-gradient-to-br ${t.btnOpen} text-white`
                        : `bg-slate-50 dark:bg-dark-surface border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-400 ${t.btnClosed}`
                }`}
                title="Accessibility Options"
                aria-label="Open accessibility options"
                aria-expanded={isOpen}
            >
                <Accessibility className="w-6 h-6" />
            </button>
        </div>
    );
}
