import React from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import SectionHeader from '../../ui/SectionHeader';
import { TextareaAuto } from '../../ui/TextareaAuto';
import { useFormShellContext } from '../../../forms/shared/formShellContext.jsx';
import { selectActionItems, usePirDispatch, usePirSelector } from '../../../forms/pir/pirContext.jsx';

export default React.memo(function PIRActionItemsSection() {
    const { appMode, currentStep } = useFormShellContext();
    const dispatch = usePirDispatch();
    const actionItems = usePirSelector(selectActionItems);

    if (appMode !== 'full' && currentStep !== 5) return null;

    const handleChange = (index, value) => {
        dispatch({ type: 'SET_ACTION_ITEM', payload: { index, field: 'action', value } });
    };

    const addItem = () => {
        dispatch({ type: 'ADD_ACTION_ITEM' });
    };

    const removeItem = (index) => {
        dispatch({ type: 'REMOVE_ACTION_ITEM', payload: { index } });
    };

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
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
                    title="Action Items / Ways Forward"
                    subtitle="List recommended actions. Management responses will be provided by the reviewing officer."
                    theme="blue"
                    appMode={appMode}
                />
            )}

            {appMode === 'full' && (
                <div className="mb-6 flex items-center gap-3 border-b border-slate-200 dark:border-dark-border pb-4">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 border border-blue-100 dark:border-blue-900 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Action Items / Ways Forward</h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Management responses are filled in by the reviewing officer after submission.</p>
                    </div>
                </div>
            )}

            <div className="space-y-4" id="action-items-list">
                <AnimatePresence mode="popLayout">
                    {actionItems.map((item, i) => (
                        <Motion.div
                            key={`action-item-${i}`}
                            layout
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="group relative flex items-start gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-dark-border dark:bg-dark-surface"
                        >
                            {actionItems.length > 1 && (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-bold text-white shadow-sm ring-4 ring-blue-50 dark:ring-blue-900/20">
                                    {i + 1}
                                </div>
                            )}
                            <TextareaAuto
                                className="flex-1 resize-none bg-transparent py-0.5 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-300 focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-600 min-h-[100px]"
                                placeholder="Describe the recommended action or way forward..."
                                value={item.action}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, i)}
                            />
                            {actionItems.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeItem(i)}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/30"
                                    title="Remove"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            )}
                        </Motion.div>
                    ))}
                </AnimatePresence>

                <button
                    type="button"
                    onClick={addItem}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-4 text-sm font-bold text-slate-500 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 dark:border-dark-border dark:bg-dark-surface/50 dark:hover:border-blue-900/50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 transition-colors group-hover:bg-blue-100 dark:bg-slate-800 dark:group-hover:bg-blue-900/40">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </div>
                    Add another action item
                </button>
            </div>
        </div>
    );
});
