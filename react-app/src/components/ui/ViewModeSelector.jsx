import React, { useEffect } from 'react';

/**
 * ViewModeSelector Component
 * Displays a selection screen for users to choose between Wizard and Full Form views.
 * Designed to be extended with draft preview functionality.
 */
export const ViewModeSelector = ({ 
    onSelectMode, 
    hasDraft = false,
    draftInfo = null,
    theme = "pink" 
}) => {
    // Fix: Move hook to the top level, avoiding conditional React Hook errors
    useEffect(() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        if (isMobile) {
            onSelectMode('wizard');
        }
    }, [onSelectMode]);

    // Fix: Use full Tailwind class names because Tailwind cannot process dynamically interpolated strings (e.g. `bg-${color}-500`)
    const themeClasses = {
        pink: {
            glow: "bg-pink-600/20",
            iconContainer: "bg-pink-50 border-pink-200",
            icon: "text-pink-600",
            draftBox: "bg-pink-50 border-pink-200",
            draftIcon: "text-pink-600",
            wizardBtn: "border-pink-200 hover:border-pink-200 hover:bg-pink-50/50",
            wizardIconBox: "bg-pink-100 text-pink-600",
        },
        emerald: {
            glow: "bg-emerald-600/20",
            iconContainer: "bg-emerald-50 border-emerald-200",
            icon: "text-emerald-600",
            draftBox: "bg-emerald-50 border-emerald-200",
            draftIcon: "text-emerald-600",
            wizardBtn: "border-emerald-200 hover:border-emerald-200 hover:bg-emerald-50/50",
            wizardIconBox: "bg-emerald-100 text-emerald-600",
        },
        blue: {
            glow: "bg-blue-600/20",
            iconContainer: "bg-blue-50 border-blue-200",
            icon: "text-blue-600",
            draftBox: "bg-blue-50 border-blue-200",
            draftIcon: "text-blue-600",
            wizardBtn: "border-blue-200 hover:border-blue-200 hover:bg-blue-50/50",
            wizardIconBox: "bg-blue-100 text-blue-600",
        },
    };

    const colors = themeClasses[theme] || themeClasses.pink;

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col font-sans relative overflow-hidden">
            {/* Grid Background */}
            <div className="fixed inset-0 bg-slate-50 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_70%,transparent_110%)] pointer-events-none z-0">
                <div
                    className="absolute inset-0 opacity-100 pointer-events-none grayscale mix-blend-multiply"
                    style={{
                        backgroundImage: `url('/SDO_Facade.webp')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center 25%'
                    }}
                ></div>
            </div>
            
            {/* Glowing Orbs */}
            <div className={`fixed top-1/4 left-1/4 w-[30rem] h-[30rem] ${colors.glow} rounded-full blur-[120px] pointer-events-none animate-pulse duration-[4000ms]`}></div>
            <div className="fixed bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[4000ms]" style={{ animationDelay: '2s' }}></div>

            <div className="relative z-10 container mx-auto px-6 flex flex-col items-center justify-center flex-1">
                <div className="bg-white/90 border border-slate-200 rounded-[2rem] p-8 md:p-14 shadow-xl text-center max-w-2xl w-full mx-auto ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-700">
                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center p-3 rounded-2xl mb-6 shadow-inner border ${colors.iconContainer}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={colors.icon}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-slate-900 pb-2 mb-3">
                        Choose Your Workflow
                    </h1>
                    <p className="text-slate-500 font-medium mb-10 text-sm md:text-base px-4">
                        Select how you would like to complete your form.
                    </p>

                    {/* Draft Preview (Extensible) */}
                    {hasDraft && draftInfo && (
                        <div className={`mb-8 p-4 border rounded-2xl text-left ${colors.draftBox}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={colors.draftIcon}>
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span className={`text-xs font-bold uppercase tracking-wider ${colors.draftIcon}`}>Draft Available</span>
                            </div>
                            <p className="text-sm text-slate-600">
                                Last saved: {new Date(draftInfo.lastSaved).toLocaleString()}
                            </p>
                        </div>
                    )}

                    {/* Mode Selection Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Wizard Mode */}
                        <button
                            onClick={() => onSelectMode('wizard')}
                            className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-white border-2 p-6 shadow-sm hover:shadow-md transition-all active:scale-95 text-center gap-3 ${colors.wizardBtn}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${colors.wizardIconBox}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m9 18 6-6-6-6"/>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Step-by-Step Wizard</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">Guided, focused sections</p>
                            </div>
                        </button>

                        {/* Full Form Mode */}
                        <button
                            onClick={() => onSelectMode('full')}
                            className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95 text-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                    <line x1="3" x2="21" y1="9" y2="9"/>
                                    <line x1="9" x2="9" y1="21" y2="9"/>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Full Form View</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">Classic paper layout</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewModeSelector;