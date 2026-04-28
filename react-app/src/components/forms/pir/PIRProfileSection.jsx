import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { SchoolAvatar } from '../../ui/SchoolAvatar.jsx';
import { useFormShellContext } from '../../../forms/shared/formShellContext.jsx';
import { selectBudget, selectProfile, usePirDispatch, usePirSelector } from '../../../forms/pir/pirContext.jsx';

function formatWithCommas(value) {
    if (!value && value !== 0) return '';
    const str = String(value);
    const [integer, decimal] = str.split('.');
    const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimal !== undefined ? `${formatted}.${decimal}` : formatted;
}

function BudgetInput({ label, value, onChange }) {
    const [focused, setFocused] = React.useState(false);
    return (
        <div className="flex flex-col gap-1.5 w-full group text-left">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest select-none transition-colors group-focus-within:text-blue-600">
                {label}
            </label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 dark:text-slate-500 pointer-events-none select-none">₱</span>
                <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={focused ? value : formatWithCommas(value)}
                    onChange={(e) => onChange(e.target.value.replace(/,/g, '').replace(/[^0-9.]/g, ''))}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="w-full border border-slate-200 dark:border-dark-border focus:ring-2 focus:border-blue-400 focus:ring-blue-500/20 transition-all rounded-xl pl-8 pr-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-dark-surface shadow-sm font-mono"
                />
            </div>
        </div>
    );
}

function LockedField({ label, value }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">{label}</label>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-slate-500 shrink-0"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1 truncate">{value}</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 px-2 py-0.5 rounded-full whitespace-nowrap">From AIP</span>
            </div>
        </div>
    );
}

export default React.memo(function PIRProfileSection({
    isDivisionPersonnel,
    user,
    quarterString,
}) {
    const { appMode, currentStep } = useFormShellContext();
    const dispatch = usePirDispatch();
    const profile = usePirSelector(selectProfile);
    const budget = usePirSelector(selectBudget);

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
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Program Name</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-300 truncate">{profile.program || '—'}</span>
                    </div>
                </div>

                {/* School Users: read-only school field. Division Personnel: Functional Division dropdown. */}
                {isDivisionPersonnel ? (
                    <Select
                        theme="blue"
                        label="Functional Division"
                        placeholder="Select..."
                        options={[
                            { value: "SGOD", label: "SGOD" },
                            { value: "OSDS", label: "OSDS" },
                            { value: "CID", label: "CID" },
                        ]}
                        value={profile.functionalDivision}
                        onChange={(e) => dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'functionalDivision', value: e.target.value } })}
                    />
                ) : (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">School</label>
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl">
                            <SchoolAvatar
                                clusterNumber={user?.cluster_number}
                                schoolLogo={user?.school_logo ?? null}
                                clusterLogo={user?.cluster_logo ?? null}
                                name={profile.school || user?.school_name}
                                size={28}
                                rounded="rounded-full"
                                className="shrink-0"
                            />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{profile.school || user?.school_name || '—'}</span>
                        </div>
                    </div>
                )}

                {/* Quarter display — always visible */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Reporting Quarter</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{quarterString}</span>
                    </div>
                </div>

                <BudgetInput label="Budget — From Division" value={budget.fromDivision} onChange={(v) => dispatch({ type: 'SET_BUDGET_FIELD', payload: { field: 'fromDivision', value: v } })} />

                {profile.ownerLocked
                    ? <LockedField label={isDivisionPersonnel ? "Program Owner" : "Coordinator"} value={profile.owner} />
                    : <Input theme="blue" label={isDivisionPersonnel ? "Program Owner" : "Coordinator"} placeholder={isDivisionPersonnel ? "Name of owner" : "Name of coordinator"} value={profile.owner} onChange={(e) => dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'owner', value: e.target.value } })} />
                }

                <BudgetInput label="Budget — From CO-PSF" value={budget.fromCoPSF} onChange={(v) => dispatch({ type: 'SET_BUDGET_FIELD', payload: { field: 'fromCoPSF', value: v } })} />
            </div>
        </div>
    );
})
