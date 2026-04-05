import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from './Input';
import { useTextMeasure } from '../../lib/useTextMeasure';

export const TextareaAuto = React.forwardRef(({ className, value, onChange, onKeyDown: parentOnKeyDown, ...props }, forwardedRef) => {
    const [localValue, setLocalValue] = useState(value || '');
    const chromeOffset = useRef(0);

    const { measureText, containerRef } = useTextMeasure({
        font: '16px Inter',
        lineHeight: 20,
    });

    // Sync local state when value prop changes (e.g. initial load or parent reset)
    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    // Compute padding+border chrome once (avoids per-keystroke reflow)
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const cs = getComputedStyle(el);
        chromeOffset.current =
            parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) +
            parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    }, []);

    // Auto-resize when value or container width changes — no scrollHeight reflow
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const { height } = measureText(localValue);
        el.style.height = `${Math.max(height + chromeOffset.current, 40)}px`;
    }, [localValue, measureText]);

    const handleInput = useCallback((e) => {
        setLocalValue(e.target.value);

        const el = containerRef.current;
        if (!el) return;

        const { height } = measureText(e.target.value);
        el.style.height = `${Math.max(height + chromeOffset.current, 40)}px`;
    }, [measureText]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            // Fall through — parent handler may still add a row
        }
        if (parentOnKeyDown) parentOnKeyDown(e);
    }, [parentOnKeyDown]);

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

    const combinedRef = useCallback((node) => {
        containerRef.current = node;
        if (typeof forwardedRef === 'function') {
            forwardedRef(node);
        } else if (forwardedRef) {
            forwardedRef.current = node;
        }
    }, [forwardedRef, containerRef]);

    return (
        <textarea
            ref={combinedRef}
            rows={1}
            value={localValue}
            onInput={handleInput}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
                "w-full outline-none resize-none overflow-hidden placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent dark:text-slate-100 min-h-[2.5rem]",
                className
            )}
            {...props}
        />
    );
});

TextareaAuto.displayName = "TextareaAuto";
