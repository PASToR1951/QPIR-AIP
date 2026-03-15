import React from 'react';

export default function WizardStepper({ steps, currentStep, theme = 'pink' }) {
    const totalSteps = steps.length;
    
    const themeColors = {
        pink: {
            bg: 'bg-pink-600',
            text: 'text-pink-700',
            ring: 'ring-pink-100',
            bar: 'bg-pink-500'
        },
        blue: {
            bg: 'bg-blue-600',
            text: 'text-blue-700',
            ring: 'ring-blue-100',
            bar: 'bg-blue-500'
        }
    }[theme] || themeColors.pink;

    return (
        <div className="mb-12 pt-6">
            <div className="flex justify-between items-center max-w-2xl mx-auto px-4 relative">
                <div className="absolute left-[10%] right-[10%] top-[14px] h-[2px] bg-slate-200 -z-0 hidden md:block rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${themeColors.bar} transition-all duration-300 ease-out`} 
                        style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                    ></div>
                </div>
                {steps.map((step) => (
                    <div key={step.num} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs transition-colors ${
                                currentStep === step.num ? `${themeColors.bg} text-white shadow-md ring-4 ${themeColors.ring}` :
                                currentStep > step.num ? `${themeColors.bg} text-white ring-2 ring-white` : 'bg-white text-slate-400 border-2 border-slate-200'
                            }`}>
                            {currentStep > step.num ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            ) : step.num}
                        </div>
                        <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest text-center ${currentStep === step.num ? themeColors.text : 'text-slate-400'}`}>
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
