import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { TextareaAuto } from '../../ui/TextareaAuto';

export default React.memo(function PIRActionItemsSection({
    appMode,
    currentStep,
    actionItems,
    setActionItems,
}) {
    if (appMode !== 'full' && currentStep !== 5) return null;

    const handleChange = (index, value) => {
        setActionItems(prev => prev.map((item, i) =>
            i === index ? { ...item, action: value } : item
        ));
    };

    return (
        <div className={`${(appMode === 'full' || currentStep === 5) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-200' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
            {appMode === 'wizard' && (
                <SectionHeader
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
                    title="Action Items / Ways Forward"
                    subtitle="List recommended actions. Management responses will be provided by the reviewing officer."
                    theme="blue"
                    appMode={appMode}
                />
            )}

            {appMode === 'full' && (
                <div className="mb-6 flex items-center gap-3 border-b border-slate-200 dark:border-dark-border pb-4">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 border border-blue-100 dark:border-blue-900 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">E. Action Items / Ways Forward</h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Management responses are filled in by the reviewing officer after submission.</p>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {actionItems.map((item, i) => (
                    <div key={i} className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 dark:bg-dark-base border-b border-slate-200 dark:border-dark-border">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm">
                                {i + 1}
                            </div>
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Action Item</span>
                        </div>

                        <div className="p-5 flex flex-col gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                                    Action / Ways Forward
                                </label>
                                <div className="bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl p-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 dark:focus-within:ring-blue-950/20 transition-all">
                                    <TextareaAuto
                                        className="w-full text-sm font-medium text-slate-800 dark:text-slate-100 bg-transparent outline-none min-h-[48px] placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        placeholder="Describe the recommended action or way forward..."
                                        value={item.action}
                                        onChange={(e) => handleChange(i, e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                                        Management Response — ASDS/FD Chief
                                    </label>
                                    <div className="text-sm italic text-slate-400 dark:text-slate-500 p-3 rounded-xl bg-slate-50 dark:bg-dark-base border border-dashed border-slate-200 dark:border-dark-border">
                                        Pending management review
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                                        Management Response — SDS
                                    </label>
                                    <div className="text-sm italic text-slate-400 dark:text-slate-500 p-3 rounded-xl bg-slate-50 dark:bg-dark-base border border-dashed border-slate-200 dark:border-dark-border">
                                        Pending management review
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
