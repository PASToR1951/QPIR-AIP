import React from 'react';
import { GovDocHeader } from './GovDocHeader';
import { getProjectTerminology } from '../../lib/projectTerminology.js';

const DEFAULT_FACTOR_TYPES = ["Institutional", "Technical", "Infrastructure", "Learning Resources", "Environmental", "Others"];

export const PIRDocument = ({
    quarter = (() => {
        const m = new Date().getMonth();
        const y = new Date().getFullYear();
        if (m <= 2) return `1st Quarter CY ${y}`;
        if (m <= 5) return `2nd Quarter CY ${y}`;
        if (m <= 8) return `3rd Quarter CY ${y}`;
        return `4th Quarter CY ${y}`;
    })(),
    supervisorName = "",
    supervisorTitle = "",
    program,
    school,
    owner,
    budgetFromDivision,
    budgetFromCoPSF,
    functionalDivision = "",
    usesSchoolTerminology = true,
    indicatorTargets = [],
    activities = [],
    factors = {},
    actionItems = [],
    factorTypes = DEFAULT_FACTOR_TYPES,
}) => {
    const formatCurrency = (val) => {
        if (!val && val !== 0) return "\u00A0";
        const num = parseFloat(val);
        if (isNaN(num)) return "\u00A0";
        return `₱ ${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

    const yearMatch = quarter.match(/CY (\d{4})/);
    const year = yearMatch ? yearMatch[1] : new Date().getFullYear();

    const aipActivities = activities.filter(a => !a.isUnplanned);
    const unplannedActivities = activities.filter(a => a.isUnplanned);
    const projectTerminology = getProjectTerminology(usesSchoolTerminology);

    return (
        <div className="pir-printable text-black font-sans print:p-0 print:m-0 print:bg-white min-h-screen">
            {/* Header */}
            <GovDocHeader
                documentTitle="Quarterly Program Implementation Review (AIP-PIR)"
                documentSubtitle="Quarterly Division Monitoring Evaluation and Adjustment"
                badge={quarter}
            />

            {/* Section A: Program Profile */}
            <div className="mb-6 relative rounded-xl p-4 -mx-4 print:p-0 print:mx-0">
                <div className="border-b-2 border-black pb-4">
                    <h2 className="font-black text-sm mb-4 uppercase tracking-widest border-l-4 border-black pl-3">A. Program Profile</h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-[11px]">
                        <div className="flex border-b border-black pb-1">
                            <span className="font-black w-1/3 uppercase tracking-tighter">Program:</span>
                            <span className="w-2/3 font-bold">{program || "\u00A0"}</span>
                        </div>
                        <div className="flex border-b border-black pb-1">
                            <span className="font-black w-1/3 uppercase tracking-tighter">
                                {functionalDivision ? 'Functional Division:' : 'School:'}
                            </span>
                            <span className="w-2/3 font-bold">{functionalDivision || school || "\u00A0"}</span>
                        </div>
                        <div className="flex border-b border-black pb-1">
                            <span className="font-black w-1/3 uppercase tracking-tighter">Owner:</span>
                            <span className="w-2/3 font-bold">{owner || "\u00A0"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex border-b border-black pb-1">
                                <span className="font-black w-1/2 uppercase tracking-tighter">From Division:</span>
                                <span className="w-1/2 font-bold">{formatCurrency(budgetFromDivision)}</span>
                            </div>
                            <div className="flex border-b border-black pb-1">
                                <span className="font-black w-1/2 uppercase tracking-tighter">From CO-PSF:</span>
                                <span className="w-1/2 font-bold">{formatCurrency(budgetFromCoPSF)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section B: Performance Indicators */}
            <div className="mb-6 relative rounded-xl p-4 -mx-4 print:p-0 print:mx-0">
                <h2 className="font-black text-sm mb-4 uppercase tracking-widest border-l-4 border-black pl-3">B. Performance Indicators</h2>
                <table className="w-full border-collapse text-[9px] border border-black">
                    <thead>
                        <tr className="font-black bg-slate-50 uppercase text-center print:bg-transparent">
                            <th className="border border-black p-2 w-[50%]">{`Annual Performance Indicator (refer to the ${projectTerminology.aipReferenceLabel})`}</th>
                            <th className="border border-black p-2 w-[25%]">Annual Target</th>
                            <th className="border border-black p-2 w-[25%]">This Quarter's Target</th>
                        </tr>
                    </thead>
                    <tbody>
                        {indicatorTargets.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="border border-black p-2 text-center italic text-slate-400">No indicators specified.</td>
                            </tr>
                        ) : indicatorTargets.map((ind, i) => (
                            <tr key={i}>
                                <td className="border border-black p-2">{ind.description}</td>
                                <td className="border border-black p-2 text-center">{ind.annual_target ? `${ind.annual_target}%` : '—%'}</td>
                                <td className="border border-black p-2 text-center">{ind.quarterly_target ? `${ind.quarterly_target}%` : '—%'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Section C: Monitoring Evaluation */}
            <div className="mb-6 relative rounded-xl p-4 -mx-4 print:p-0 print:mx-0">
                <div className="pb-2 overflow-x-auto">
                    <h2 className="font-black text-sm mb-4 uppercase tracking-widest border-l-4 border-black pl-3">C. Quarterly Monitoring Evaluation & Adjustment</h2>
                    <table className="w-full border-collapse text-[9px] border border-black table-fixed font-medium">
                        <thead>
                            <tr className="text-center font-black bg-slate-50 uppercase tracking-tighter print:bg-transparent">
                                <th rowSpan={2} className="border border-black p-2 w-[3%]">No</th>
                                <th rowSpan={2} className="border border-black p-2 w-[14%]">Q1 Activity/IES (Based on AIP {year})</th>
                                <th rowSpan={2} className="border border-black p-1 w-[6%] leading-tight"><span className="block">Complied (✓)</span><span className="block">or Not</span><span className="block">Complied (✗)</span></th>
                                <th rowSpan={2} className="border border-black p-2 w-[10%]">Actual Tasks Conducted</th>
                                <th rowSpan={2} className="border border-black p-2 w-[10%]">Contributory Performance Indicators</th>
                                <th rowSpan={2} className="border border-black p-2 w-[10%]">MOVs / Expected Outputs</th>
                                <th colSpan={2} className="border border-black p-1">Quarterly Target</th>
                                <th colSpan={2} className="border border-black p-1">Accomplishment</th>
                                <th colSpan={2} className="border border-black p-1">Gap (%)</th>
                                <th rowSpan={2} className="border border-black p-2 w-[10%]">Actions to be done to address the gap</th>
                                <th rowSpan={2} className="border border-black p-2 w-[8%]">Adjustments</th>
                            </tr>
                            <tr className="text-center font-black bg-slate-50 uppercase tracking-tighter print:bg-transparent">
                                <th className="border border-black p-1 w-[5%]">Physical</th>
                                <th className="border border-black p-1 w-[5%]">Financial</th>
                                <th className="border border-black p-1 w-[5%]">Physical</th>
                                <th className="border border-black p-1 w-[5%]">Financial</th>
                                <th className="border border-black p-1 w-[5%]">Physical</th>
                                <th className="border border-black p-1 w-[5%]">Financial</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.length === 0 ? (
                                <tr>
                                    <td className="border border-black p-2 italic text-slate-400 text-center" colSpan={14}>No activities recorded.</td>
                                </tr>
                            ) : (
                                <>
                                    {aipActivities.map((act, index) => {
                                        const physGap = calculateGap(act.physTarget, act.physAcc);
                                        const finGap = calculateGap(act.finTarget, act.finAcc);
                                        return (
                                            <tr key={act.id ?? index}>
                                                <td className="border border-black p-2 text-center align-top font-bold">{index + 1}</td>
                                                <td className="border border-black p-2 whitespace-pre-wrap align-top font-bold">{act.name}</td>
                                                <td className="border border-black p-2 text-center align-top font-black text-base">
                                                    {act.complied === true ? '✓' : act.complied === false ? '✗' : ''}
                                                </td>
                                                <td className="border border-black p-2 whitespace-pre-wrap align-top">{act.actualTasksConducted}</td>
                                                <td className="border border-black p-2 whitespace-pre-wrap align-top">{act.contributoryIndicators}</td>
                                                <td className="border border-black p-2 whitespace-pre-wrap align-top">{act.movsExpectedOutputs}</td>
                                                <td className="border border-black p-1 text-center align-top font-mono">{act.physTarget}</td>
                                                <td className="border border-black p-1 text-center align-top font-mono">{formatCurrency(act.finTarget)}</td>
                                                <td className="border border-black p-1 text-center align-top font-mono">{act.physAcc}</td>
                                                <td className="border border-black p-1 text-center align-top font-mono">{formatCurrency(act.finAcc)}</td>
                                                <td className="border border-black p-1 text-center font-black align-top font-mono" style={{ color: physGap < 0 ? 'red' : 'inherit' }}>{physGap.toFixed(2)}%</td>
                                                <td className="border border-black p-1 text-center font-black align-top font-mono" style={{ color: finGap < 0 ? 'red' : 'inherit' }}>{finGap.toFixed(2)}%</td>
                                                <td className="border border-black p-2 whitespace-pre-wrap align-top italic text-slate-700">{act.actions}</td>
                                                <td className="border border-black p-2 whitespace-pre-wrap align-top">{act.adjustments}</td>
                                            </tr>
                                        );
                                    })}
                                    {unplannedActivities.length > 0 && (
                                        <>
                                            <tr>
                                                <td colSpan={14} className="font-black text-center bg-slate-100 border border-black p-1.5 text-[8px] uppercase tracking-widest print:bg-transparent">
                                                    Activities Conducted But Not Included in the AIP
                                                </td>
                                            </tr>
                                            {unplannedActivities.map((act, index) => {
                                                const physGap = calculateGap(act.physTarget, act.physAcc);
                                                const finGap = calculateGap(act.finTarget, act.finAcc);
                                                return (
                                                    <tr key={act.id ?? `unplanned-${index}`}>
                                                        <td className="border border-black p-2 text-center align-top font-bold">{index + 1}</td>
                                                        <td className="border border-black p-2 whitespace-pre-wrap align-top font-bold">{act.name}</td>
                                                        <td className="border border-black p-2 text-center align-top"></td>
                                                        <td className="border border-black p-2 whitespace-pre-wrap align-top">{act.actualTasksConducted}</td>
                                                        <td className="border border-black p-2 whitespace-pre-wrap align-top">{act.contributoryIndicators}</td>
                                                        <td className="border border-black p-2 whitespace-pre-wrap align-top">{act.movsExpectedOutputs}</td>
                                                        <td className="border border-black p-1 text-center align-top font-mono">{act.physTarget}</td>
                                                        <td className="border border-black p-1 text-center align-top font-mono">{formatCurrency(act.finTarget)}</td>
                                                        <td className="border border-black p-1 text-center align-top font-mono">{act.physAcc}</td>
                                                        <td className="border border-black p-1 text-center align-top font-mono">{formatCurrency(act.finAcc)}</td>
                                                        <td className="border border-black p-1 text-center font-black align-top font-mono" style={{ color: physGap < 0 ? 'red' : 'inherit' }}>{physGap.toFixed(2)}%</td>
                                                        <td className="border border-black p-1 text-center font-black align-top font-mono" style={{ color: finGap < 0 ? 'red' : 'inherit' }}>{finGap.toFixed(2)}%</td>
                                                        <td className="border border-black p-2 whitespace-pre-wrap align-top italic text-slate-700">{act.actions}</td>
                                                        <td className="border border-black p-2 whitespace-pre-wrap align-top">{act.adjustments}</td>
                                                    </tr>
                                                );
                                            })}
                                        </>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section D: Facilitating and Hindering Factors */}
            <div className="mb-6 page-break-inside-avoid relative rounded-xl p-4 -mx-4 print:p-0 print:mx-0">
                <div>
                    <h2 className="font-black text-sm mb-4 uppercase tracking-widest border-l-4 border-black pl-3">D. Facilitating and Hindering Factors</h2>
                    <div className="border border-black text-[10px]">
                        <div className="grid grid-cols-4 font-black text-center border-b border-black bg-slate-50 uppercase tracking-widest print:bg-transparent">
                            <div className="p-2 border-r border-black col-span-1"></div>
                            <div className="p-2 border-r border-black">Context-Specific Facilitating Factors</div>
                            <div className="p-2 border-r border-black">Context-Specific Hindering Factors</div>
                            <div className="p-2">Recommendations</div>
                        </div>
                        {factorTypes.map((type, idx) => (
                            <div key={type} className={`grid grid-cols-4 ${idx < factorTypes.length - 1 ? 'border-b border-black' : ''}`}>
                                <div className="p-2 border-r border-black font-black text-[8px] uppercase tracking-widest flex items-center">{type}</div>
                                <div className="p-2 border-r border-black whitespace-pre-wrap min-h-[50px]">{factors[type]?.facilitating}</div>
                                <div className="p-2 border-r border-black whitespace-pre-wrap min-h-[50px]">{factors[type]?.hindering}</div>
                                <div className="p-2 whitespace-pre-wrap min-h-[50px]">{factors[type]?.recommendations}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Section E: Action Items */}
            <div className="mb-6 relative rounded-xl p-4 -mx-4 print:p-0 print:mx-0">
                <h2 className="font-black text-sm mb-4 uppercase tracking-widest border-l-4 border-black pl-3">E. Action Items / Ways Forward</h2>
                <table className="w-full border-collapse text-[9px] border border-black">
                    <thead>
                        <tr className="font-black bg-slate-50 uppercase text-center print:bg-transparent">
                            <th className="border border-black p-1 w-[4%]"></th>
                            <th className="border border-black p-2 w-[40%]">
                                Action Items / Ways Forward of Program Owner<br />
                                <span className="font-normal italic normal-case">(to be filled by Focal Person)</span>
                            </th>
                            <th className="border border-black p-2 w-[28%]">Management Response – ASDS / FD Chief</th>
                            <th className="border border-black p-2 w-[28%]">Management Response – SDS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {actionItems.map((item, i) => (
                            <tr key={i} className="min-h-[40px]">
                                <td className="border border-black p-2 text-center font-black">{i + 1}</td>
                                <td className="border border-black p-2 whitespace-pre-wrap">{item.action}</td>
                                <td className="border border-black p-2 whitespace-pre-wrap">{item.response_asds}</td>
                                <td className="border border-black p-2 whitespace-pre-wrap">{item.response_sds}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Signatures */}
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
