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

    const addItem = () =>
        setActionItems(prev => [...prev, { action: '', response_asds: '', response_sds: '' }]);

    const removeItem = (index) =>
        setActionItems(prev => prev.filter((_, i) => i !== index));

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter' && !e.shiftKey && index === actionItems.length - 1) {
            e.preventDefault();
            addItem();
        }
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

            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100 dark:divide-dark-border" id="action-items-list">
                    {actionItems.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-3">
                            {actionItems.length > 1 && (
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-sm mt-1">
                                    {i + 1}
                                </div>
                            )}
                            <TextareaAuto
                                className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100 bg-transparent outline-none min-h-[100px] placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none py-0.5"
                                placeholder="Describe the recommended action or way forward..."
                                value={item.action}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, i)}
                            />
                            {actionItems.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeItem(i)}
                                    className="mt-1 flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                                    title="Remove"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="border-t border-slate-100 dark:border-dark-border">
                    <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-600 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all w-full"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Add Action Item
                    </button>
                </div>
            </div>
        </div>
    );
});
