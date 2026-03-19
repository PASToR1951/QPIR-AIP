import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

function LockedField({ label, value }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">{label}</label>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span className="text-sm font-semibold text-slate-700 flex-1 truncate">{value}</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">From AIP</span>
            </div>
        </div>
    );
}

export default React.memo(function PIRFinancialsSection({
    appMode,
    currentStep,
    isBudgetFocused, setIsBudgetFocused,
    displayBudget,
    rawBudget, setRawBudget, budgetLocked,
    fundSource, setFundSource, fundSourceLocked
}) {
    if (appMode !== 'wizard' || currentStep !== 2) return null;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
            <SectionHeader
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg>}
                title="Financial Information"
                subtitle="Specify the budget and funding source for the program."
                theme="blue"
                appMode={appMode}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                {budgetLocked
                    ? <LockedField label="Budget" value={displayBudget} />
                    : <Input theme="blue" label="Budget" placeholder="₱ 0.00" inputMode="decimal" value={displayBudget} onFocus={() => setIsBudgetFocused(true)} onBlur={() => setIsBudgetFocused(false)} onChange={(e) => setRawBudget(e.target.value.replace(/[^0-9.]/g, ''))} />
                }
                {fundSourceLocked
                    ? <LockedField label="Fund Source" value={fundSource} />
                    : <Select theme="blue" label="Fund Source" placeholder="Select Source" options={["MOOE", "SARO"]} value={fundSource} onChange={(e) => setFundSource(e.target.value)} />
                }
            </div>
        </div>
    );
})
