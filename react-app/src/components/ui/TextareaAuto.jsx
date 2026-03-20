import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from './Input';

export const TextareaAuto = React.forwardRef(({ className, value, onChange, ...props }, forwardedRef) => {
    const [localValue, setLocalValue] = useState(value || '');
    const textareaRef = useRef(null);

    // Sync local state when value prop changes (e.g. initial load or parent reset)
    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    // Auto-resize when value changes (initial load, prop updates, etc.)
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [localValue]);

    const handleInput = useCallback((e) => {
        setLocalValue(e.target.value);
        
        const el = textareaRef.current;
        if (!el) return;
        
        // Prevent layout thrashing: only recalculate height here, do not trigger parent onChange
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, []);

    const handleBlur = useCallback((e) => {
        if (onChange && localValue !== value) {
            // Create a synthetic event or just call onChange with current state if needed
            // The simplest way to keep compatibility with existing onChange handlers is to 
            // call it with the original event, but update the target's value. 
            // We can just pass the event, since the target value is already updated in DOM.
            onChange(e);
        }
        if (props.onBlur) {
            props.onBlur(e);
        }
    }, [onChange, localValue, value, props.onBlur]);

    // Use a combined ref so both internal height calculation and forwarded refs work
    const combinedRef = useCallback((node) => {
        textareaRef.current = node;
        if (typeof forwardedRef === 'function') {
            forwardedRef(node);
        } else if (forwardedRef) {
            forwardedRef.current = node;
        }
    }, [forwardedRef]);

    return (
        <textarea
            ref={combinedRef}
            rows={1}
            value={localValue}
            onInput={handleInput}
            onBlur={handleBlur}
            className={cn(
                "w-full outline-none resize-none overflow-hidden placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent dark:text-slate-100 min-h-[2.5rem]",
                className
            )}
            {...props}
        />
    );
});

TextareaAuto.displayName = "TextareaAuto";
