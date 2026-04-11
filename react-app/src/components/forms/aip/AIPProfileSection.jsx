import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input';
import AutocompleteInput from '../../ui/AutocompleteInput';
import { useFormShellContext } from '../../../forms/shared/formShellContext.jsx';
import { selectAipProfile, selectAipSuggestions, useAipDispatch, useAipSelector } from '../../../forms/aip/aipContext.jsx';

export const OUTCOME_OPTIONS = [
    "Outcome 1: High Performing Teachers",
    "Outcome 2: Learners' Physical and Mental Well-Being Protected",
    "Outcome 3: Efficient and Supportive Governance Structure",
    "Outcome 4: Improved Education Quality through Upgraded Curriculum, Modernized Assessment, and Digitally Enabled Schools",
    "Outcome 5: Empowered Graduates fit for Employment, Entrepreneurship or Higher Education"
];

export const OUTCOME_TARGETS = {
    "Outcome 1: High Performing Teachers": [
        { code: "O.1.1", description: "Percentage of public school teachers who completed training on content and pedagogy" },
        { code: "O.1.2", description: "Number of public school teachers who completed: Certificate Programs" },
        { code: "O.1.3", description: "Number of public school teachers who completed: Scholarship Programs" },
        { code: "O.1.4", description: "Percentage of learners with complete set of textbooks: Elementary" },
        { code: "O.1.5", description: "Percentage of learners with complete set of textbooks: Junior High School" },
        { code: "O.1.6", description: "Percentage of learners with complete set of textbooks: Senior High School" },
        { code: "O.1.7", description: "Percentage of public school teachers provided with a laptop" },
        { code: "O.1.8", description: "Percentage of public schools meeting the minimum standard for teacher to student ratio" },
        { code: "O.1.9", description: "Percentage of public schools with at least one Administrative Officer" },
    ],
    "Outcome 2: Learners' Physical and Mental Well-Being Protected": [
        { code: "O.2.1", description: "Percentage of school-age children in school - Net Enrollment Rate in Kindergarten" },
        { code: "O.2.2", description: "Percentage of school-age children in school - Net Enrollment Rate in Elementary" },
        { code: "O.2.3", description: "Percentage of school-age children in school - Net Enrollment Rate in Junior High School (JHS)" },
        { code: "O.2.4", description: "Percentage of school-age children in school - Net Enrollment Rate in Senior High School (SHS)" },
        { code: "O.2.5", description: "Percentage of learners who completed Grade 6 Completion Rate: Elementary" },
        { code: "O.2.6", description: "Percentage of learners who completed Grade 10 Completion Rate: JHS" },
        { code: "O.2.7", description: "Percentage of learners who completed Grade 12 - Completion Rate: SHS" },
        { code: "O.2.8", description: "Percentage of severely wasted and wasted learners in public elementary schools provided with meals through School-based Feeding Program" },
        { code: "O.2.9", description: "Percentage of resolved bullying incidents" },
        { code: "O.2.10", description: "Percentage of public schools with a functional child protection committee" },
        { code: "O.2.11", description: "Percentage of public schools with a functional school governing council" },
        { code: "O.2.12", description: "Percentage of public schools with a guidance advocate" },
        { code: "O.2.13", description: "Percentage of schools with a guidance office" },
        { code: "O.2.14", description: "Percentage of schools with a health clinic" },
        { code: "O.2.15", description: "Percentage of public schools with ideal classroom to student ratio" },
        { code: "O.2.16", description: "Percentage of public schools with electricity" },
        { code: "O.2.17", description: "Percentage of public schools with libraries" },
        { code: "O.2.18", description: "Percentage of public schools with faculty rooms" },
    ],
    "Outcome 3: Efficient and Supportive Governance Structure": [
        { code: "O.3.1", description: "Percentage of Schools Division Offices conferred with Level 3 PRIME-HRM accreditation" },
        { code: "O.3.2", description: "Number of schools provided with innovation funds" },
        { code: "O.3.3", description: "Number of public schools provided with school grants (innovation funds for schools)" },
        { code: "O.3.4", description: "Percentage of public schools provided with research funds" },
    ],
    "Outcome 4: Improved Education Quality through Upgraded Curriculum, Modernized Assessment, and Digitally Enabled Schools": [
        { code: "O.4.1", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - English increased (Grade 3)" },
        { code: "O.4.2", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - English increased (Grade 6)" },
        { code: "O.4.3", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - English increased (Grade 10)" },
        { code: "O.4.4", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - English increased (Grade 12)" },
        { code: "O.4.5", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - Mathematics increased (Grade 3)" },
        { code: "O.4.6", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - Mathematics increased (Grade 6)" },
        { code: "O.4.7", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - Mathematics increased (Grade 10)" },
        { code: "O.4.8", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - Mathematics increased (Grade 12)" },
    ],
    "Outcome 5: Empowered Graduates fit for Employment, Entrepreneurship or Higher Education": [
        { code: "O.5.1", description: "Percentage of passers in the National Certification (NC) assessments" },
        { code: "O.5.2", description: "Percentage of passers in the Alternative Learning System Accreditation and Equivalency (A & E) Test" },
    ],
};

export default React.memo(function AIPProfileSection() {
    const { appMode } = useFormShellContext();
    const dispatch = useAipDispatch();
    const profile = useAipSelector(selectAipProfile);
    const suggestions = useAipSelector(selectAipSuggestions);

    const targetOptions = (OUTCOME_TARGETS[profile.outcome] ?? []).map(t => ({
        value: t.description,
        label: `${t.code} – ${t.description}`,
    }));

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
                <Input theme="pink" label="School Improvement Project / Title" placeholder="Enter SIP Title..." value={profile.sipTitle} onChange={(e) => dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'sipTitle', value: e.target.value } })} />
                <AutocompleteInput theme="pink" label="Project Coordinator" placeholder="Name of Coordinator..." value={profile.projectCoord} onChange={(value) => dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'projectCoord', value } })} suggestions={suggestions.coordinatorSuggestions} />
            </div>
        </>
    );
})
