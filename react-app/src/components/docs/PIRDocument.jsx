import React from 'react';
import { FormBoxHeader } from '../ui/FormBoxHeader';
import { FACTOR_TYPES as DEFAULT_FACTOR_TYPES } from '../../constants.js';

export const PIRDocument = ({
    quarter = "1st Trimester SY 2025-2026",
    termNoun = "Trimester",
    supervisorName  = "DR. ENRIQUE Q. RETES, EdD",
    supervisorTitle = "Chief Education Supervisor",
    program,
    school,
    owner,
    budget,
    fundSource,
    activities = [],
    factors = {},
    factorTypes = DEFAULT_FACTOR_TYPES
}) => {
    const formatCurrency = (val) => {
        if (!val) return "";
        return `₱ ${parseFloat(val).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const calculateGap = (targetStr, accStr) => {
        const target = parseFloat(targetStr) || 0;
        const acc = parseFloat(accStr) || 0;
        if (target > 0) {
            if (acc >= target) return 0;
            return ((acc - target) / target) * 100;
        }
        return 0;
    };

    return (
        <div className="pir-printable text-black font-sans print:p-0 print:m-0 print:bg-white min-h-screen">
            {/* Print Header */}
            <FormBoxHeader 
                title={`${termNoun} Performance Review`}
                subtitle="Division Monitoring Evaluation and Adjustment"
                badge={quarter}
            />

            {/* Print Section A: Profile */}
            <div className="mb-6 relative rounded-xl p-4 -mx-4 print:p-0 print:mx-0">
                <div className="border-b-2 border-black pb-4">
                    <h2 className="font-black text-sm mb-4 uppercase tracking-widest border-l-4 border-black pl-3">A. Program Profile</h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-[11px]">
                        <div className="flex border-b border-black pb-1">
                            <span className="font-black w-1/3 uppercase tracking-tighter">Program:</span>
                            <span className="w-2/3 font-bold">{program || "\u00A0"}</span>
                        </div>
                        <div className="flex border-b border-black pb-1">
                            <span className="font-black w-1/3 uppercase tracking-tighter">School:</span>
                            <span className="w-2/3 font-bold">{school || "\u00A0"}</span>
                        </div>
                        <div className="flex border-b border-black pb-1">
                            <span className="font-black w-1/3 uppercase tracking-tighter">Owner:</span>
                            <span className="w-2/3 font-bold">{owner || "\u00A0"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex border-b border-black pb-1">
                                <span className="font-black w-1/2 uppercase tracking-tighter">Budget:</span>
                                <span className="w-1/2 font-bold">{formatCurrency(budget) || "\u00A0"}</span>
                            </div>
                            <div className="flex border-b border-black pb-1">
                                <span className="font-black w-1/2 uppercase tracking-tighter">Source:</span>
                                <span className="w-1/2 font-bold">{fundSource || "\u00A0"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Section C: Monitoring Evaluation */}
            <div className="mb-6 relative rounded-xl p-4 -mx-4 print:p-0 print:mx-0">
                <div className="pb-2 overflow-x-auto">
                    <h2 className="font-black text-sm mb-4 uppercase tracking-widest border-l-4 border-black pl-3">C. Quarterly Monitoring Evaluation & Adjustment</h2>
                    <table className="w-full border-collapse text-[9px] border border-black table-fixed font-medium">
                        <thead>
                            <tr className="text-center font-black bg-slate-50 uppercase tracking-tighter print:bg-transparent">
                                <th rowSpan="2" className="border border-black p-2 w-[20%]">Activity</th>
                                <th rowSpan="2" className="border border-black p-2 w-[12%]">Implementation Period</th>
                                <th colSpan="2" className="border border-black p-1">Target</th>
                                <th colSpan="2" className="border border-black p-1">Accomplished</th>
                                <th colSpan="2" className="border border-black p-1">Gap (%)</th>
                                <th rowSpan="2" className="border border-black p-2 w-[20%]">Actions to Address Gap</th>
                            </tr>
                            <tr className="text-center font-black bg-slate-50 uppercase tracking-tighter print:bg-transparent">
                                <th className="border border-black p-1 w-[7%]">Phys</th>
                                <th className="border border-black p-1 w-[7%]">Fin</th>
                                <th className="border border-black p-1 w-[7%]">Phys</th>
                                <th className="border border-black p-1 w-[7%]">Fin</th>
                                <th className="border border-black p-1 w-[7%]">Phys</th>
                                <th className="border border-black p-1 w-[7%]">Fin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.length === 0 ? (
                                <tr>
                                    <td className="border border-black p-2 italic text-slate-400 text-center" colSpan="9">No activities recorded.</td>
                                </tr>
                            ) : activities.map((act, index) => {
                                const physGap = calculateGap(act.physTarget, act.physAcc);
                                const finGap = calculateGap(act.finTarget, act.finAcc);
                                return (
                                    <tr key={act.id}>
                                        <td className="border border-black p-2 whitespace-pre-wrap align-top font-bold">
                                            <div className="flex gap-1">
                                                <span>{index + 1}.</span>
                                                <span>{act.name}</span>
                                            </div>
                                        </td>
                                        <td className="border border-black p-2 text-center align-top">{act.implementation_period || '\u00A0'}</td>
                                        <td className="border border-black p-1 text-center align-top font-mono">{act.physTarget}</td>
                                        <td className="border border-black p-1 text-center align-top font-mono">{act.finTarget}</td>
                                        <td className="border border-black p-1 text-center align-top font-mono">{act.physAcc}</td>
                                        <td className="border border-black p-1 text-center align-top font-mono">{act.finAcc}</td>
                                        <td className="border border-black p-1 text-center font-black align-top font-mono" style={{ color: physGap < 0 ? 'red' : 'inherit' }}>{physGap.toFixed(2)}%</td>
                                        <td className="border border-black p-1 text-center font-black align-top font-mono" style={{ color: finGap < 0 ? 'red' : 'inherit' }}>{finGap.toFixed(2)}%</td>
                                        <td className="border border-black p-2 whitespace-pre-wrap align-top italic text-slate-700 font-medium">{act.actions}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Print Section D: Factors */}
            <div className="mb-6 page-break-inside-avoid relative rounded-xl p-4 -mx-4 print:p-0 print:mx-0">
                <div>
                    <h2 className="font-black text-sm mb-4 uppercase tracking-widest border-l-4 border-black pl-3">D. Facilitating and Hindering Factors</h2>
                    <div className="border border-black text-[10px]">
                        <div className="grid grid-cols-2 font-black text-center border-b border-black bg-slate-50 uppercase tracking-widest print:bg-transparent">
                            <div className="p-2 border-r border-black">Facilitating Factors</div>
                            <div className="p-2">Hindering Factors</div>
                        </div>
                        {factorTypes.map((type, idx) => (
                            <div key={type} className={`grid grid-cols-2 ${idx !== factorTypes.length - 1 ? 'border-b border-black' : ''}`}>
                                <div className="p-2 border-r border-black relative pt-5 min-h-[50px]">
                                    <span className="text-[8px] font-black uppercase text-slate-400 absolute top-1.5 left-2 tracking-widest print:text-black">{type}</span>
                                    <div className="whitespace-pre-wrap leading-tight font-medium">{factors[type]?.facilitating}</div>
                                </div>
                                <div className="p-2 relative pt-5 min-h-[50px]">
                                    <span className="text-[8px] font-black uppercase text-slate-400 absolute top-1.5 left-2 tracking-widest print:text-black">{type}</span>
                                    <div className="whitespace-pre-wrap leading-tight font-medium">{factors[type]?.hindering}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Print Signatures */}
            <div className="page-break-inside-avoid mt-8 mb-4">
                <div className="grid grid-cols-2 gap-16 mt-12 px-8">
                    <div className="text-center">
                        <p className="text-xs text-left mb-10 font-black uppercase tracking-widest leading-none">Prepared by:</p>
                        <div className="border-b-2 border-black font-black uppercase text-sm pb-1 min-h-[24px]">
                            {owner}
                        </div>
                        <p className="text-[10px] mt-1.5 font-bold uppercase tracking-widest text-slate-500">Program Owner</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-left mb-10 font-black uppercase tracking-widest leading-none">Noted:</p>
                        <div className="border-b-2 border-black font-black uppercase text-sm pb-1 min-h-[24px]">
                            {supervisorName}
                        </div>
                        <p className="text-[10px] mt-1.5 font-bold uppercase tracking-widest text-slate-500">{supervisorTitle}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
