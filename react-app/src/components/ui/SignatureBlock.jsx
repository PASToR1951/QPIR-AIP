import React from 'react';

export default function SignatureBlock({ 
    label, 
    name, 
    title, 
    onNameChange, 
    onTitleChange, 
    namePlaceholder = "NAME", 
    titlePlaceholder = "Job Title",
    readOnly = false,
    theme = 'pink'
}) {
    const focusColor = theme === 'blue' ? 'focus:border-blue-500' : 'focus:border-pink-500';

    return (
        <div className="flex flex-col">
            <p className="text-xs text-left mb-8 select-none text-slate-500 font-bold uppercase tracking-widest">{label}</p>
            {readOnly ? (
                <input 
                    type="text" 
                    className="w-full border-b-2 border-slate-200 text-center font-black uppercase text-lg pointer-events-none select-none bg-transparent pb-2 text-slate-800" 
                    value={name} 
                    readOnly 
                    tabIndex={-1} 
                />
            ) : (
                <input 
                    type="text" 
                    className={`w-full border-b-2 border-slate-200 ${focusColor} transition-colors text-center font-black uppercase text-lg outline-none bg-transparent pb-2 text-slate-800 placeholder:text-slate-300`} 
                    placeholder={namePlaceholder} 
                    value={name} 
                    onChange={onNameChange ? (e) => onNameChange(e.target.value) : undefined} 
                />
            )}
            
            {title ? (
                <p className="text-xs mt-3 select-none text-slate-500 text-center font-semibold uppercase tracking-widest">
                    {title}
                </p>
            ) : (
                <input 
                    type="text" 
                    className={`mt-2 w-full border-b-2 border-slate-100 ${focusColor} transition-colors text-center text-xs font-semibold uppercase tracking-widest outline-none bg-transparent pb-1 text-slate-500 placeholder:text-slate-300`} 
                    placeholder={titlePlaceholder} 
                    value={title} 
                    onChange={onTitleChange ? (e) => onTitleChange(e.target.value) : undefined} 
                />
            )}
        </div>
    );
}
