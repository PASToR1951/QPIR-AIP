import React from 'react';
import SectionHeader from '../../ui/SectionHeader';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input';

export const OUTCOME_OPTIONS = [
    "Outcome 1: High Performing Teachers",
    "Outcome 2: Learners' Physical and Mental Well-Being Protected",
    "Outcome 3: Efficient and Supportive Governance Structure",
    "Outcome 4: Improved Education Quality through Upgraded Curriculum, Modernized Assessment, and Digitally Enabled Schools",
    "Outcome 5: Empowered Graduates fit for Employment, Entrepreneurship or Higher Education"
];

export default React.memo(function AIPProfileSection({ 
    appMode, 
    outcome, setOutcome, 
    year, setYear, 
    depedProgram, 
    sipTitle, setSipTitle, 
    projectCoord, setProjectCoord 
}) {
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
                <Select theme="pink" label="Outcome Category" placeholder="Select Outcome..." options={OUTCOME_OPTIONS} value={outcome} onChange={(e) => setOutcome(e.target.value)} />
                <Input theme="pink" label="Implementation Year" placeholder="e.g. 2026" value={year} onChange={(e) => setYear(e.target.value)} />
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">DepEd Program Aligned</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-pink-50 border border-pink-200 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500 shrink-0"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                        <span className="text-sm font-semibold text-pink-800 truncate">{depedProgram || '—'}</span>
                    </div>
                </div>
                <Input theme="pink" label="School Improvement Project / Title" placeholder="Enter SIP Title..." value={sipTitle} onChange={(e) => setSipTitle(e.target.value)} />
                <Input theme="pink" label="Project Coordinator" placeholder="Name of Coordinator..." value={projectCoord} onChange={(e) => setProjectCoord(e.target.value)} />
            </div>
        </>
    );
})
