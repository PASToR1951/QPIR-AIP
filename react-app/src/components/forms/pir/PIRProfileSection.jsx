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

export default function PIRProfileSection({
    appMode,
    currentStep,
    program,
    isDivisionPersonnel,
    school,
    user,
    quarterString,
    owner, setOwner, ownerLocked,
    isBudgetFocused, setIsBudgetFocused,
    displayBudget,
    rawBudget, setRawBudget, budgetLocked,
    fundSource, setFundSource, fundSourceLocked
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

                {ownerLocked
                    ? <LockedField label={isDivisionPersonnel ? "Program Owner" : "Coordinator"} value={owner} />
                    : <Input theme="blue" label={isDivisionPersonnel ? "Program Owner" : "Coordinator"} placeholder={isDivisionPersonnel ? "Name of owner" : "Name of coordinator"} value={owner} onChange={(e) => setOwner(e.target.value)} />
                }

                {appMode === 'full' && (
                    <div className="grid grid-cols-2 gap-4">
                        {budgetLocked
                            ? <LockedField label="Budget" value={displayBudget} />
                            : <Input theme="blue" label="Budget" placeholder="₱ 0.00" inputMode="decimal" value={displayBudget} onFocus={() => setIsBudgetFocused(true)} onBlur={() => setIsBudgetFocused(false)} onChange={(e) => setRawBudget(e.target.value.replace(/[^0-9.]/g, ''))} />
                        }
                        {fundSourceLocked
                            ? <LockedField label="Fund Source" value={fundSource} />
                            : <Select theme="blue" label="Fund Source" placeholder="Select Source" options={["MOOE", "SARO"]} value={fundSource} onChange={(e) => setFundSource(e.target.value)} />
                        }
                    </div>
                )}
            </div>
        </div>
    );
}
