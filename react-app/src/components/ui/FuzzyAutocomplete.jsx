import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';

function toTitleCase(str) {
    return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
}

export default function FuzzyAutocomplete({
    value,
    onChange,
    terms = [],
    placeholder,
    className,
    label,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState([]);
    const containerRef = useRef(null);
    const textareaRef = useRef(null);

    const autoResize = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, []);

    useEffect(() => { autoResize(); }, [value, autoResize]);

    const fuse = useMemo(() => new Fuse(terms, { threshold: 0.3 }), [terms]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e) => {
        const v = e.target.value;
        onChange(v);
        if (v.trim() && terms.length > 0) {
            setResults(fuse.search(v).slice(0, 5).map(r => r.item));
            setIsOpen(true);
        } else {
            setResults(terms.slice(0, 5));
            setIsOpen(v.trim() === '' ? false : true);
        }
    };

    const handleSelect = (term) => {
        onChange(toTitleCase(term));
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); }
        if (e.key === 'Escape') setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            {label && (
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                    {label}
                </label>
            )}
            <textarea
                ref={textareaRef}
                rows={1}
                className={className}
                style={{ overflow: 'hidden', resize: 'none' }}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                onInput={autoResize}
                onFocus={() => {
                    if (terms.length > 0 && !value?.trim()) {
                        setResults(terms.slice(0, 5));
                        setIsOpen(true);
                    }
                }}
                onKeyDown={handleKeyDown}
            />
            {isOpen && results.length > 0 && (
                <ul className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-lg overflow-hidden">
                    {results.map((term, i) => (
                        <li key={i}>
                            <button
                                type="button"
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-pink-50 dark:hover:bg-pink-950/30 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelect(term);
                                }}
                            >
                                {term}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
