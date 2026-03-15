import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

export default function PIRProfileSection({
    appMode,
    currentStep,
    program,
    isDivisionPersonnel,
    school,
    user,
    quarterString,
    owner, setOwner,
    isBudgetFocused, setIsBudgetFocused,
    displayBudget,
    rawBudget, setRawBudget,
    fundSource, setFundSource
}) {
    return (
        <div className={`${(appMode === 'full' || currentStep === 1) ? 'block' : 'hidden'} ${appMode === 'full' ? 'mb-16' : ''}`}>
            <SectionHeader 
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}
                title="Program Profile"
                subtitle="Define the fundamental details of the program being evaluated."
                theme="blue"
                appMode={appMode}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Program Name</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                        <span className="text-sm font-semibold text-blue-800 truncate">{program || '—'}</span>
                    </div>
                </div>

                {/* School Users: show pre-filled school as a read-only info field */}
                {!isDivisionPersonnel && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">School</label>
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            <span className="text-sm font-semibold text-slate-700 truncate">{school || user?.school_name || '—'}</span>
                        </div>
                    </div>
                )}

                {/* Quarter display — always visible */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Reporting Quarter</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span className="text-sm font-bold text-blue-700">{quarterString}</span>
                    </div>
                </div>

                <Input theme="blue" label="Program Owner" placeholder="Name of owner" value={owner} onChange={(e) => setOwner(e.target.value)} />

                {appMode === 'full' && (
                    <div className="grid grid-cols-2 gap-4">
                        <Input theme="blue" label="Budget" placeholder="₱ 0.00" inputMode="decimal" value={displayBudget} onFocus={() => setIsBudgetFocused(true)} onBlur={() => setIsBudgetFocused(false)} onChange={(e) => setRawBudget(e.target.value.replace(/[^0-9.]/g, ''))} />
                        <Select theme="blue" label="Fund Source" placeholder="Select Source" options={["MOOE", "SARO"]} value={fundSource} onChange={(e) => setFundSource(e.target.value)} />
                    </div>
                )}
            </div>
        </div>
    );
}
