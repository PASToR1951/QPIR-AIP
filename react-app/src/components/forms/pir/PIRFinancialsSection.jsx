import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

export default function PIRFinancialsSection({
    appMode,
    currentStep,
    isBudgetFocused, setIsBudgetFocused,
    displayBudget,
    rawBudget, setRawBudget,
    fundSource, setFundSource
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
                <Input theme="blue" label="Budget" placeholder="₱ 0.00" inputMode="decimal" value={displayBudget} onFocus={() => setIsBudgetFocused(true)} onBlur={() => setIsBudgetFocused(false)} onChange={(e) => setRawBudget(e.target.value.replace(/[^0-9.]/g, ''))} />
                <Select theme="blue" label="Fund Source" placeholder="Select Source" options={["MOOE", "SARO"]} value={fundSource} onChange={(e) => setFundSource(e.target.value)} />
            </div>
        </div>
    );
}
