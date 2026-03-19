import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { TextareaAuto } from '../../ui/TextareaAuto';

export default React.memo(function PIRFactorsSection({
    appMode,
    currentStep,
    FACTOR_TYPES,
    factors,
    handleFactorChange
}) {
    if (appMode !== 'full' && currentStep !== 4) return null;

    return (
        <div className={`${(appMode === 'full' || currentStep === 4) ? 'block animate-in fade-in slide-in-from-bottom-4 duration-200' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
            {appMode === 'wizard' && (
                <>
                    <SectionHeader 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="m17 5-5-3-5 3" /><path d="m17 19-5 3-5-3" /><path d="M2 12h20" /><path d="m5 7-3 5 3 5" /><path d="m19 7 3 5-3 5" /></svg>}
                        title="Implementation Factors"
                        subtitle="Identify Institutional, Technical, Infrastructure, Learning Resources, Environmental, and other factors."
                        theme="blue"
                        appMode={appMode}
                    />

                    <div className="space-y-6">
                        {FACTOR_TYPES.map((type) => (
                            <div key={type} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8">
                                <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <span className="w-8 h-px bg-blue-200"></span>
                                    {type} Factors
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest px-1">Facilitating</label>
                                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                                            <TextareaAuto
                                                className="w-full text-sm font-medium text-slate-700 bg-transparent outline-none min-h-[80px]"
                                                placeholder={`What helped in ${type.toLowerCase()} aspect?`}
                                                value={factors[type].facilitating}
                                                onChange={(e) => handleFactorChange(type, 'facilitating', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-rose-600 uppercase tracking-widest px-1">Hindering</label>
                                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-500 transition-all">
                                            <TextareaAuto
                                                className="w-full text-sm font-medium text-slate-700 bg-transparent outline-none min-h-[80px]"
                                                placeholder={`What were the challenges in ${type.toLowerCase()}?`}
                                                value={factors[type].hindering}
                                                onChange={(e) => handleFactorChange(type, 'hindering', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {appMode === 'full' && (
                <>
                    <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
                        <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" /><path d="m14 7 3 3" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Facilitating & Hindering Factors</h2>
                        </div>
                    </div>

                    <div className="overflow-x-auto pb-2">
                        <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden min-w-[600px]">
                            <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-200 font-bold text-center text-sm uppercase tracking-wider">
                                <div className="p-3 border-r border-slate-200 text-emerald-700">Facilitating Factors</div>
                                <div className="p-3 text-rose-700">Hindering Factors</div>
                            </div>

                            {FACTOR_TYPES.map((type, idx) => (
                                <div key={type} className={`grid grid-cols-2 bg-white ${idx !== FACTOR_TYPES.length - 1 ? 'border-b border-slate-200' : ''}`}>
                                    <div className="p-4 border-r border-slate-200 relative group hover:bg-slate-50/50 transition-colors">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 absolute top-3 left-4">{type}</span>
                                        <TextareaAuto
                                            className="mt-5 w-full text-sm font-medium text-slate-700 bg-transparent p-1 focus:bg-white border border-transparent focus:border-slate-300 rounded min-h-[40px]"
                                            value={factors[type].facilitating}
                                            onChange={(e) => handleFactorChange(type, 'facilitating', e.target.value)}
                                        />
                                    </div>
                                    <div className="p-4 relative group hover:bg-slate-50/50 transition-colors">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 absolute top-3 left-4">{type}</span>
                                        <TextareaAuto
                                            className="mt-5 w-full text-sm font-medium text-slate-700 bg-transparent p-1 focus:bg-white border border-transparent focus:border-slate-300 rounded min-h-[40px]"
                                            value={factors[type].hindering}
                                            onChange={(e) => handleFactorChange(type, 'hindering', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
})
