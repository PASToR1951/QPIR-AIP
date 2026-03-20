import React from 'react';

export default function SectionHeader({ icon, title, subtitle, theme = 'pink', appMode = 'wizard', rightElement }) {
    const themeColors = {
        pink: {
            bg: 'bg-pink-50 dark:bg-pink-950/30',
            text: 'text-pink-600',
            border: 'border-pink-100 dark:border-pink-900/50'
        },
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-950/30',
            text: 'text-blue-600',
            border: 'border-blue-100 dark:border-blue-900/50'
        }
    }[theme] || themeColors.pink;

    return (
        <div className="mb-8 flex items-center justify-between border-b border-slate-200 dark:border-dark-border pb-4">
            <div className="flex items-center gap-3">
                <div className={`p-2.5 ${themeColors.bg} ${themeColors.text} border ${themeColors.border} rounded-xl`}>
                    {icon}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h2>
                    {(appMode === 'wizard' && subtitle) && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>
            {rightElement && (
                <div>
                    {rightElement}
                </div>
            )}
        </div>
    );
}
