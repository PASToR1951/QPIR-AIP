import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const AccessibilityContext = createContext(null);

const DEFAULTS = {
    highContrast: false,
    fontSize: 'normal',     // 'sm' | 'normal' | 'lg' | 'xl' | 'xxl'
    reduceMotion: false,
    dyslexicFont: false,
    lineSpacing: 'normal',  // 'normal' | 'relaxed' | 'loose'
    letterSpacing: 'normal', // 'normal' | 'wide'
};

export function AccessibilityProvider({ children }) {
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('a11y_settings');
            return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
        } catch {
            return DEFAULTS;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('a11y_settings', JSON.stringify(settings));
        } catch { /* ignore */ }

        const html = document.documentElement;

        html.classList.toggle('a11y-high-contrast', settings.highContrast);

        html.classList.remove('a11y-font-sm', 'a11y-font-lg', 'a11y-font-xl', 'a11y-font-xxl');
        if (settings.fontSize !== 'normal') html.classList.add(`a11y-font-${settings.fontSize}`);

        html.classList.toggle('a11y-reduce-motion', settings.reduceMotion);
        html.classList.toggle('a11y-dyslexic', settings.dyslexicFont);

        html.classList.remove('a11y-spacing-relaxed', 'a11y-spacing-loose');
        if (settings.lineSpacing === 'relaxed') html.classList.add('a11y-spacing-relaxed');
        if (settings.lineSpacing === 'loose') html.classList.add('a11y-spacing-loose');

        html.classList.toggle('a11y-letter-wide', settings.letterSpacing === 'wide');
    }, [settings]);

    const update = useCallback((key, value) =>
        setSettings(prev => ({ ...prev, [key]: value })), []);

    const reset = useCallback(() => setSettings(DEFAULTS), []);

    const contextValue = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);

    return (
        <AccessibilityContext.Provider value={contextValue}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    return useContext(AccessibilityContext);
}
