import React from 'react';
import { GovDocHeader } from './GovDocHeader';

export const AIPDocument = ({
    year = new Date().getFullYear(),
    outcome,
    targetDescription,
    depedProgram,
    sipTitle,
    projectCoord,
    objectives = [],
    indicators = [],
    activities = [],
    preparedByName,
    preparedByTitle,
    approvedByName,
    approvedByTitle,
}) => {
    const formatCurrency = (val) => {
        if (!val) return "";
        return `₱ ${parseFloat(val).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="aip-printable text-black font-sans print:p-0 print:m-0 print:bg-white">

            {/* ── Header ── */}
            <GovDocHeader documentTitle={`Annual Implementation Plan for ${year}`} />

            {/* ── Profile Section ── */}
            <div className="mb-5 text-[11px]">

                {/* Outcome */}
                <div className="flex py-1 border-b border-dotted border-slate-400">
                    <span className="font-bold w-[30%] uppercase text-[10px] tracking-tight shrink-0">Outcome #:</span>
                    <span className="font-medium flex-1">{outcome || "\u00A0"}</span>
                </div>

                <div className="flex py-1 border-b border-dotted border-slate-400">
                    <span className="font-bold w-[30%] uppercase text-[10px] tracking-tight shrink-0">Outcome Target:</span>
                    <span className="font-medium flex-1">{targetDescription || "\u00A0"}</span>
                </div>

                {/* DepEd Program */}
                <div className="flex py-1 border-b border-dotted border-slate-400">
                    <span className="font-bold w-[30%] uppercase text-[10px] tracking-tight shrink-0">DepEd Program Aligned:</span>
                    <span className="font-medium flex-1">{depedProgram || "\u00A0"}</span>
                </div>

                {/* SIP Title */}
                <div className="flex py-1 border-b border-dotted border-slate-400">
                    <span className="font-bold w-[30%] uppercase text-[10px] tracking-tight shrink-0">School Improvement Project/Title:</span>
                    <span className="font-medium flex-1">{sipTitle || "\u00A0"}</span>
                </div>

                {/* Project Coordinator */}
                <div className="flex py-1 border-b border-dotted border-slate-400">
                    <span className="font-bold w-[30%] uppercase text-[10px] tracking-tight shrink-0">Project Coordinator:</span>
                    <span className="font-medium flex-1">{projectCoord || "\u00A0"}</span>
                </div>

                {/* Objectives */}
                <div className="flex py-1 border-b border-dotted border-slate-400">
                    <span className="font-bold w-[30%] uppercase text-[10px] tracking-tight shrink-0 pt-0.5">Objective/s:</span>
                    <div className="flex-1 font-medium space-y-0.5">
                        {objectives.filter(obj => obj.trim() !== '').length > 0
                            ? objectives.filter(obj => obj.trim() !== '').map((obj, i) => (
                                <div key={i} className="flex gap-1.5 items-start">
                                    <span className="shrink-0">*</span>
                                    <span>{obj}</span>
                                </div>
                            ))
                            : <span>&nbsp;</span>
                        }
                    </div>
                </div>

                {/* Performance Indicators + Annual Target */}
                <div className="flex py-1 border-b border-dotted border-slate-400">
                    <span className="font-bold w-[30%] uppercase text-[10px] tracking-tight shrink-0 pt-0.5">Performance Indicator/s OVI):</span>
                    {(() => {
                        const visibleIndicators = indicators.filter(ind => ind.description.trim() !== '');
                        return <>
                            <div className="w-[47%] font-medium space-y-0.5">
                                {visibleIndicators.length > 0
                                    ? visibleIndicators.map((ind, i) => (
                                        <div key={i} className="flex gap-1.5 items-start">
                                            <span className="shrink-0">*</span>
                                            <span>{ind.description}</span>
                                        </div>
                                    ))
                                    : <span>&nbsp;</span>
                                }
                            </div>
                            {visibleIndicators.length > 0 && (
                                <div className="w-[23%] pl-4">
                                    <div className="font-bold uppercase text-[10px] tracking-tight mb-0.5 text-right">Annual Target:</div>
                                    <div className="space-y-0.5">
                                        {visibleIndicators.map((ind, i) => (
                                            <div key={i} className="font-medium text-right pr-1">
                                                {ind.target ? (String(ind.target).endsWith('%') ? ind.target : `${ind.target}%`) : "\u00A0"}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>;
                    })()}
                </div>
            </div>

            {/* ── Activities Table ── */}
            <div className="mb-6 overflow-x-auto border-b border-black">
                <table className="w-full border-collapse text-[10px] border border-black" style={{ borderBottom: 'none' }}>
                    <thead>
                        <tr className="text-center font-black uppercase text-[9px] tracking-tight bg-slate-50 print:bg-transparent">
                            <th rowSpan="2" className="border border-black p-2 w-[35%] text-left align-middle">Activities to be Conducted</th>
                            <th rowSpan="2" className="border border-black p-2 w-[15%] align-middle">Implementation Period</th>
                            <th rowSpan="2" className="border border-black p-2 w-[15%] align-middle">Persons Involved</th>
                            <th rowSpan="2" className="border border-black p-2 w-[15%] align-middle">Outputs</th>
                            <th colSpan="2" className="border border-black p-1 w-[20%]">Budgetary Requirement</th>
                        </tr>
                        <tr className="text-center font-black uppercase text-[9px] tracking-tight bg-slate-50 print:bg-transparent">
                            <th className="border border-black p-1">Amount</th>
                            <th className="border border-black p-1">Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.length === 0 ? (
                            <tr>
                                <td className="border border-black p-2 italic text-slate-400" colSpan="6">No activities added.</td>
                            </tr>
                        ) : activities.map((act, idx) => (
                            <tr key={act.id ?? idx}>
                                <td className="border border-black p-2 align-top break-words">
                                    <div className="flex gap-2 items-start">
                                        <span className="font-black shrink-0">{idx + 1}</span>
                                        <div>
                                            {act.phase && (
                                                <div className="italic font-semibold mb-0.5">{act.phase}:</div>
                                            )}
                                            <div className="font-medium">{act.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="border border-black p-2 align-top text-center font-medium">{act.period}</td>
                                <td className="border border-black p-2 align-top text-center font-medium">{act.persons}</td>
                                <td className="border border-black p-2 align-top text-center font-medium">{act.outputs}</td>
                                <td className="border border-black p-2 align-top text-center font-mono font-bold">
                                    {act.budgetAmount ? formatCurrency(act.budgetAmount) : ''}
                                </td>
                                <td className="border border-black p-2 align-top text-center font-medium">{act.budgetSource}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Signatures ── */}
            <div className="mt-8 grid grid-cols-2 gap-16 px-8">
                <div>
                    <span className="text-[9px] font-black uppercase tracking-widest">Prepared by:</span>
                    <div className="border-b-2 border-black pb-0.5 mt-1 text-center">
                        <span className="font-black uppercase text-[11px] tracking-tight">{preparedByName || '\u00A0'}</span>
                    </div>
                    <p className="text-[9px] mt-1 text-center font-bold uppercase tracking-wide">{preparedByTitle || '\u00A0'}</p>
                </div>
                <div>
                    <span className="text-[9px] font-black uppercase tracking-widest">Approved:</span>
                    <div className="border-b-2 border-black pb-0.5 mt-1 text-center">
                        <span className="font-black uppercase text-[11px] tracking-tight">{approvedByName || '\u00A0'}</span>
                    </div>
                    <p className="text-[9px] mt-1 text-center font-bold uppercase tracking-wide">{approvedByTitle || '\u00A0'}</p>
                </div>
            </div>
        </div>
    );
};
