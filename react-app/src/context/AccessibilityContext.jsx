import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

const AccessibilityContext = createContext(null);

const getSystemPrefersDark = () =>
    Boolean(typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches);

const DEFAULTS = {
    colorScheme: 'system',   // 'system' | 'light' | 'dark'
    highContrast: false,
    fontSize: 'normal',     // 'sm' | 'normal' | 'lg' | 'xl' | 'xxl'
    reduceMotion: false,
    dyslexicFont: false,
    lineSpacing: 'normal',  // 'normal' | 'relaxed' | 'loose'
    letterSpacing: 'normal', // 'normal' | 'wide'
};

const normalizeSettings = (raw = {}) => {
    const { darkMode, colorScheme, ...rest } = raw;
    const migratedColorScheme =
        colorScheme ?? (darkMode === true ? 'dark' : DEFAULTS.colorScheme);

    return {
        ...DEFAULTS,
        ...rest,
        colorScheme: ['system', 'light', 'dark'].includes(migratedColorScheme)
            ? migratedColorScheme
            : DEFAULTS.colorScheme,
    };
};

export function AccessibilityProvider({ children }) {
    const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark);
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('a11y_settings');
            return saved ? normalizeSettings(JSON.parse(saved)) : DEFAULTS;
        } catch {
            return DEFAULTS;
        }
    });
    const resolvedDarkMode = settings.colorScheme === 'system'
        ? systemPrefersDark
        : settings.colorScheme === 'dark';
    const prevDarkRef = useRef(resolvedDarkMode);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => setSystemPrefersDark(media.matches);
        handleChange();

        if (media.addEventListener) {
            media.addEventListener('change', handleChange);
            return () => media.removeEventListener('change', handleChange);
        }

        media.addListener?.(handleChange);
        return () => media.removeListener?.(handleChange);
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('a11y_settings', JSON.stringify(settings));
        } catch { /* ignore */ }

        const html = document.documentElement;

        // Dark mode — with smooth transition on toggle
        if (prevDarkRef.current !== resolvedDarkMode) {
            html.classList.add('dark-transition');
            setTimeout(() => html.classList.remove('dark-transition'), 400);
            prevDarkRef.current = resolvedDarkMode;
        }
        html.classList.toggle('dark', resolvedDarkMode);
        html.style.colorScheme = resolvedDarkMode ? 'dark' : 'light';
        html.dataset.colorScheme = settings.colorScheme;

        html.classList.toggle('a11y-high-contrast', settings.highContrast);

        html.classList.remove('a11y-font-sm', 'a11y-font-lg', 'a11y-font-xl', 'a11y-font-xxl');
        if (settings.fontSize !== 'normal') html.classList.add(`a11y-font-${settings.fontSize}`);

        html.classList.toggle('a11y-reduce-motion', settings.reduceMotion);
        html.classList.toggle('a11y-dyslexic', settings.dyslexicFont);

        html.classList.remove('a11y-spacing-relaxed', 'a11y-spacing-loose');
        if (settings.lineSpacing === 'relaxed') html.classList.add('a11y-spacing-relaxed');
        if (settings.lineSpacing === 'loose') html.classList.add('a11y-spacing-loose');

        html.classList.toggle('a11y-letter-wide', settings.letterSpacing === 'wide');
    }, [settings, resolvedDarkMode]);

    const update = useCallback((key, value) =>
        setSettings(prev => ({ ...prev, [key]: value })), []);

    const reset = useCallback(() => setSettings(DEFAULTS), []);

    const contextValue = useMemo(() => ({
        settings: { ...settings, darkMode: resolvedDarkMode },
        resolvedDarkMode,
        update,
        reset,
    }), [settings, resolvedDarkMode, update, reset]);

    return (
        <AccessibilityContext.Provider value={contextValue}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    return useContext(AccessibilityContext);
}
