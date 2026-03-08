import React from 'react';
import { FormBoxHeader } from '../ui/FormBoxHeader';

export const AIPDocument = ({ 
    year = new Date().getFullYear(),
    pillar,
    depedProgram,
    sipTitle,
    projectCoord,
    objectives,
    indicators,
    annualTarget,
    activities = [],
    phases = ["Planning", "Implementation", "Monitoring and Evaluation"]
}) => {
    const formatCurrency = (val) => {
        if (!val) return "";
        return `₱ ${parseFloat(val).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="aip-printable text-black font-sans print:p-0 print:m-0 print:bg-white min-h-screen">
            {/* Print Header */}
            <FormBoxHeader
                title="Annual Implementation Plan"
                badge={`CY ${year}`}
            />

            {/* Print Section: Profile & Goals */}
            <div className="mb-6 relative rounded-xl p-4 -mx-4 print:p-0 print:mx-0">
                <div className="text-[12px] space-y-1">
                    <div className="flex border-b border-dotted border-black pb-1">
                        <span className="font-bold w-[25%] uppercase tracking-tight">Pillar/Strategic Direction:</span>
                        <span className="w-[75%] font-medium">{pillar || "\u00A0"}</span>
                    </div>
                    <div className="flex border-b border-dotted border-black pb-1">
                        <span className="font-bold w-[25%] uppercase tracking-tight">DepEd Program Aligned:</span>
                        <span className="w-[75%] font-medium">{depedProgram || "\u00A0"}</span>
                    </div>
                    <div className="flex border-b border-dotted border-black pb-1">
                        <span className="font-bold w-[25%] uppercase tracking-tight">SIP Title:</span>
                        <span className="w-[45%] font-medium">{sipTitle || "\u00A0"}</span>
                        <span className="font-bold w-[10%] uppercase tracking-tight">Coord:</span>
                        <span className="w-[20%] font-medium">{projectCoord || "\u00A0"}</span>
                    </div>

                    <div className="pt-2">
                        <div className="flex border-b border-dotted border-black pb-1">
                            <span className="font-bold w-[25%] align-top uppercase tracking-tight">Objective/s:</span>
                            <span className="w-[75%] whitespace-pre-wrap font-medium">{objectives || "\u00A0"}</span>
                        </div>
                        <div className="flex border-b border-dotted border-black pb-1">
                            <span className="font-bold w-[25%] align-top uppercase tracking-tight">Indicators (OVI):</span>
                            <span className="w-[45%] whitespace-pre-wrap font-medium">{indicators || "\u00A0"}</span>
                            <span className="font-bold w-[10%] align-top uppercase tracking-tight">Target:</span>
                            <span className="w-[20%] whitespace-pre-wrap font-medium">{annualTarget || "\u00A0"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Section: Activities */}
            <div className="mb-4 relative rounded-xl p-4 -mx-4 print:p-0 print:mx-0">
                <div className="pb-2 overflow-x-auto">
                    <table className="w-full border-collapse text-[10px] border border-black table-fixed">
                        <thead>
                            <tr className="text-center font-black bg-slate-50 uppercase tracking-tighter print:bg-transparent">
                                <th rowSpan="2" className="border border-black p-2 w-[35%]">Activities to be Conducted</th>
                                <th rowSpan="2" className="border border-black p-2 w-[15%]">Implementation Period</th>
                                <th rowSpan="2" className="border border-black p-2 w-[15%]">Persons Involved</th>
                                <th rowSpan="2" className="border border-black p-2 w-[15%]">Outputs</th>
                                <th colSpan="2" className="border border-black p-1 w-[20%]">Budgetary Requirement</th>
                            </tr>
                            <tr className="text-center font-black bg-slate-50 uppercase tracking-tighter print:bg-transparent">
                                <th className="border border-black p-1">Amount</th>
                                <th className="border border-black p-1">Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            {phases.map((phase, pIdx) => {
                                const phaseActivities = activities.filter(a => a.phase === phase);
                                return (
                                    <React.Fragment key={phase}>
                                        <tr className="bg-slate-100 print:bg-transparent font-black uppercase text-[9px] tracking-widest">
                                            <td colSpan="6" className="border border-black p-1 px-2">{pIdx + 1}. {phase}</td>
                                        </tr>
                                        {phaseActivities.length === 0 ? (
                                            <tr>
                                                <td className="border border-black p-2 italic text-slate-400" colSpan="6">No activities for this phase.</td>
                                            </tr>
                                        ) : phaseActivities.map((act, aIdx) => (
                                            <tr key={act.id}>
                                                <td className="border border-black p-2 align-top break-words font-medium">
                                                    <div className="flex gap-1.5 items-start">
                                                        <span className="font-black shrink-0">{pIdx + 1}.{aIdx + 1}</span>
                                                        <span>{act.name}</span>
                                                    </div>
                                                </td>
                                                <td className="border border-black p-2 align-top text-center font-medium">{act.period}</td>
                                                <td className="border border-black p-2 align-top text-center font-medium">{act.persons}</td>
                                                <td className="border border-black p-2 align-top text-center font-medium">{act.outputs}</td>
                                                <td className="border border-black p-2 align-top text-right font-mono font-bold">{act.budgetAmount ? formatCurrency(act.budgetAmount) : ''}</td>
                                                <td className="border border-black p-2 align-top text-center font-medium">{act.budgetSource}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Print Signatures */}
            <div className="mt-8 mb-4 page-break-inside-avoid">
                <div className="grid grid-cols-2 gap-16 mt-12 px-8">
                    <div className="text-center">
                        <p className="text-xs text-left mb-10 font-black uppercase tracking-widest">Prepared by:</p>
                        <div className="border-b-2 border-black font-black uppercase text-sm pb-1 min-h-[24px]">
                            {projectCoord}
                        </div>
                        <p className="text-[10px] mt-1.5 font-bold uppercase tracking-widest text-slate-600">Project Coordinator</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-left mb-10 font-black uppercase tracking-widest">Noted:</p>
                        <div className="border-b-2 border-black font-black uppercase text-sm pb-1 min-h-[24px]">
                            DR. ENRIQUE Q. RETES, EdD
                        </div>
                        <p className="text-[10px] mt-1.5 font-bold uppercase tracking-widest text-slate-600">Chief Education Supervisor</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
