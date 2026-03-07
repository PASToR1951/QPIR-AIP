import React from 'react';
import { cn } from './Input';

export const TextareaAuto = React.forwardRef(({ className, onChange, ...props }, ref) => {
    const handleInput = (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
        if (onChange) onChange(e);
    };

    return (
        <textarea
            ref={ref}
            rows={1}
            onInput={handleInput}
            onChange={onChange}
            className={cn(
                "w-full outline-none resize-none overflow-hidden placeholder:text-slate-400 bg-transparent",
                className
            )}
            {...props}
        />
    );
});

TextareaAuto.displayName = "TextareaAuto";
