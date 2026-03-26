import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from './Input';

export default function AutocompleteInput({
    value,
    onChange,
    suggestions = [],
    placeholder,
    label,
    theme = 'pink',
    ...rest
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const filtered = useMemo(() => {
        if (!value || value.trim() === '') return suggestions.slice(0, 8);
        const q = value.toLowerCase();
        return suggestions.filter(s => s.toLowerCase().includes(q)).slice(0, 8);
    }, [value, suggestions]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <Input
                label={label}
                placeholder={placeholder}
                theme={theme}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                {...rest}
            />
            {isOpen && filtered.length > 0 && (
                <ul className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-lg overflow-hidden">
                    {filtered.map((s, i) => (
                        <li key={i}>
                            <button
                                type="button"
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-pink-50 dark:hover:bg-pink-950/30 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onChange(s);
                                    setIsOpen(false);
                                }}
                            >
                                {s}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
