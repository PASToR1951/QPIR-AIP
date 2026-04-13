import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input';
import AutocompleteInput from '../../ui/AutocompleteInput';
import { useFormShellContext } from '../../../forms/shared/formShellContext.jsx';
import { selectAipProfile, selectAipSuggestions, useAipDispatch, useAipSelector } from '../../../forms/aip/aipContext.jsx';
import { getProjectTerminology } from '../../../lib/projectTerminology.js';
import {
    OUTCOME_OPTIONS,
    getTargetOptionsForOutcome,
} from '../../../forms/aip/strategicAlignmentCatalog.js';

export default React.memo(function AIPProfileSection({ usesSchoolTerminology = true }) {
    const { appMode } = useFormShellContext();
    const dispatch = useAipDispatch();
    const profile = useAipSelector(selectAipProfile);
    const suggestions = useAipSelector(selectAipSuggestions);
    const projectTerminology = getProjectTerminology(usesSchoolTerminology);

    const targetOptions = getTargetOptionsForOutcome(profile.outcome);

    return (
        <>
            <SectionHeader
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><circle cx="12" cy="7" r="4"></circle></svg>}
                title="Strategic Alignment"
                subtitle="Define the core strategic direction of the project."
                theme="pink"
                appMode={appMode}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <Select theme="pink" label="Outcome Category" placeholder="Select Outcome..." options={OUTCOME_OPTIONS} value={profile.outcome} onChange={(e) => dispatch({ type: 'SET_OUTCOME', payload: e.target.value })} />
                <Select theme="pink" label="Outcome Target" placeholder="Select a Target..." options={targetOptions} value={profile.selectedTarget} onChange={(e) => dispatch({ type: 'SET_SELECTED_TARGET', payload: e.target.value })} disabled={!profile.outcome} />
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Implementation Year</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500 shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span className="text-sm font-semibold text-pink-800 dark:text-pink-300">{profile.year}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">DepEd Program Aligned</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500 shrink-0"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                        <span className="text-sm font-semibold text-pink-800 dark:text-pink-300 truncate">{profile.depedProgram || '—'}</span>
                    </div>
                </div>
                <Input
                    theme="pink"
                    label={projectTerminology.projectTitleLabel}
                    placeholder={projectTerminology.projectTitlePlaceholder}
                    value={profile.sipTitle}
                    onChange={(e) => dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'sipTitle', value: e.target.value } })}
                />
                <AutocompleteInput theme="pink" label="Project Coordinator" placeholder="Name of Coordinator..." value={profile.projectCoord} onChange={(value) => dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'projectCoord', value } })} suggestions={suggestions.coordinatorSuggestions} />
            </div>
        </>
    );
})
