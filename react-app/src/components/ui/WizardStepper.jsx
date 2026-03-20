import React from 'react';

export default function WizardStepper({ steps, currentStep, theme = 'pink' }) {
    const totalSteps = steps.length;
    const currentLabel = steps.find(s => s.num === currentStep)?.label || '';
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

    const tc = {
        pink: {
            bg: 'bg-pink-600',
            text: 'text-pink-700 dark:text-pink-400',
            ring: 'ring-pink-100',
            bar: 'bg-pink-500',
            barTrack: 'bg-pink-100 dark:bg-pink-900/40',
            mobileBg: 'bg-pink-50 dark:bg-pink-950/30',
            mobileBorder: 'border-pink-100 dark:border-pink-900/50',
            mobileNum: 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/40',
        },
        blue: {
            bg: 'bg-blue-600',
            text: 'text-blue-700 dark:text-blue-400',
            ring: 'ring-blue-100',
            bar: 'bg-blue-500',
            barTrack: 'bg-blue-100 dark:bg-blue-900/40',
            mobileBg: 'bg-blue-50 dark:bg-blue-950/30',
            mobileBorder: 'border-blue-100 dark:border-blue-900/50',
            mobileNum: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40',
        }
    }[theme] || {
        bg: 'bg-pink-600', text: 'text-pink-700 dark:text-pink-400', ring: 'ring-pink-100',
        bar: 'bg-pink-500', barTrack: 'bg-pink-100 dark:bg-pink-900/40', mobileBg: 'bg-pink-50 dark:bg-pink-950/30',
        mobileBorder: 'border-pink-100 dark:border-pink-900/50', mobileNum: 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/40',
    };

    return (
        <div className="mb-10 md:mb-12 pt-4 md:pt-6">
            {/* ── Mobile: compact "1/6 Alignment" bar ── */}
            <div className="md:hidden px-4">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${tc.mobileBg} ${tc.mobileBorder}`}>
                    {/* Step counter */}
                    <span className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 ${tc.mobileNum}`}>
                        {currentStep}/{totalSteps}
                    </span>

                    {/* Label + progress */}
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${tc.text} truncate`}>
                            {currentLabel}
                        </p>
                        {/* Progress bar */}
                        <div className={`mt-1.5 h-1 rounded-full ${tc.barTrack} overflow-hidden`}>
                            <div
                                className={`h-full rounded-full ${tc.bar} transition-all duration-300 ease-out`}
                                style={{ width: `${Math.max(progress, 8)}%` }}
                            />
                        </div>
                    </div>

                    {/* Completed count */}
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0">
                        {currentStep > 1 ? `${currentStep - 1} done` : ''}
                    </span>
                </div>
            </div>

            {/* ── Desktop: full stepper ── */}
            <div className="hidden md:block">
                <div className="flex justify-between items-center max-w-2xl mx-auto px-4 relative">
                    <div className="absolute left-[10%] right-[10%] top-[14px] h-[2px] bg-slate-200 dark:bg-dark-border -z-0 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${tc.bar} transition-all duration-300 ease-out`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {steps.map((step) => (
                        <div key={step.num} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs transition-colors ${
                                    currentStep === step.num ? `${tc.bg} text-white shadow-md ring-4 ${tc.ring}` :
                                    currentStep > step.num ? `${tc.bg} text-white ring-2 ring-white dark:ring-dark-surface` : 'bg-white dark:bg-dark-surface text-slate-400 dark:text-slate-500 border-2 border-slate-200 dark:border-dark-border'
                                }`}>
                                {currentStep > step.num ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                ) : step.num}
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-widest text-center ${currentStep === step.num ? tc.text : 'text-slate-400 dark:text-slate-500'}`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
