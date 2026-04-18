import { useRef } from 'react';
import { X, Printer, FilePdf } from '@phosphor-icons/react';
import { ReportHeader } from '../../../components/docs/ReportHeader.jsx';

const FACTOR_TYPES = ['Institutional', 'Technical', 'Infrastructure', 'Learning Resources', 'Environmental', 'Others'];
const GROUP_LABELS = { cluster: 'Cluster', program: 'Program', division: 'Division-Wide' };

function formatCurrency(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return '\u00A0';
  return `\u20B1 ${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNum(n) {
  return typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '\u00A0';
}

export function ConsolidatedPIRDocument({ data, year, quarter, groupBy, onClose }) {
  const docRef = useRef(null);

  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handlePdf = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      const el = docRef.current;
      if (!el) return;

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'legal');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableWidth = pageWidth - margin * 2;
      const imgRatio = canvas.height / canvas.width;
      const imgHeight = usableWidth * imgRatio;

      let yOffset = 0;
      const usableHeight = pageHeight - margin * 2;

      while (yOffset < imgHeight) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, margin - yOffset, usableWidth, imgHeight);
        yOffset += usableHeight;
      }

      pdf.save(`consolidated-pir-Q${quarter}-${year}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    }
  };

  const kpis = data.kpis || {};
  const totalBudget = (kpis.totalBudgetDivision || 0) + (kpis.totalBudgetCoPSF || 0);

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 overflow-y-auto print:static print:bg-white">
      {/* Controls — hidden on print */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border px-6 py-3 flex items-center gap-3 print:hidden">
        <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-dark-surface rounded-xl hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors">
          <X size={14} weight="bold" /> Close
        </button>
        <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-dark-surface rounded-xl hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors">
          <Printer size={14} weight="bold" /> Print
        </button>
        <button onClick={handlePdf} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors">
          <FilePdf size={14} weight="bold" /> Export PDF
        </button>
      </div>

      {/* Document */}
      <div ref={docRef} className="max-w-[1100px] mx-auto px-10 py-8 text-black bg-white print:px-6 print:py-4 print:max-w-none">
        <ReportHeader
          reportTitle="Consolidated Program Implementation Review"
          reportSubtitle={`${data.quarterLabel || `Q${quarter} CY ${year}`} \u2014 ${GROUP_LABELS[groupBy] || 'Consolidated'}`}
          fiscalYear={year}
        />

        {/* Section A: Consolidated Profile */}
        <div className="mb-6">
          <h2 className="font-black text-sm mb-3 uppercase tracking-widest border-l-4 border-black pl-3">
            A. Consolidated Profile
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-[11px]">
            <div className="flex border-b border-black pb-1">
              <span className="font-black w-1/3 uppercase tracking-tighter">Quarter:</span>
              <span className="w-2/3 font-bold">{data.quarterLabel}</span>
            </div>
            <div className="flex border-b border-black pb-1">
              <span className="font-black w-1/3 uppercase tracking-tighter">Grouping:</span>
              <span className="w-2/3 font-bold">{GROUP_LABELS[groupBy]}</span>
            </div>
            <div className="flex border-b border-black pb-1">
              <span className="font-black w-1/3 uppercase tracking-tighter">Total PIRs:</span>
              <span className="w-2/3 font-bold">{kpis.totalPIRs}</span>
            </div>
            <div className="flex border-b border-black pb-1">
              <span className="font-black w-1/3 uppercase tracking-tighter">Total Schools:</span>
              <span className="w-2/3 font-bold">{kpis.totalSchools}</span>
            </div>
            <div className="flex border-b border-black pb-1">
              <span className="font-black w-1/3 uppercase tracking-tighter">Total Programs:</span>
              <span className="w-2/3 font-bold">{kpis.totalPrograms}</span>
            </div>
            <div className="flex border-b border-black pb-1">
              <span className="font-black w-1/3 uppercase tracking-tighter">Statuses:</span>
              <span className="w-2/3 font-bold">{(data.statusesIncluded || []).join(', ')}</span>
            </div>
            <div className="flex border-b border-black pb-1">
              <span className="font-black w-1/3 uppercase tracking-tighter">Budget (Division):</span>
              <span className="w-2/3 font-bold">{formatCurrency(kpis.totalBudgetDivision)}</span>
            </div>
            <div className="flex border-b border-black pb-1">
              <span className="font-black w-1/3 uppercase tracking-tighter">Budget (CO-PSF):</span>
              <span className="w-2/3 font-bold">{formatCurrency(kpis.totalBudgetCoPSF)}</span>
            </div>
            <div className="flex border-b border-black pb-1">
              <span className="font-black w-1/3 uppercase tracking-tighter">Total Budget:</span>
              <span className="w-2/3 font-bold">{formatCurrency(totalBudget)}</span>
            </div>
          </div>
        </div>

        {/* Section B: Performance Indicators */}
        {data.indicators?.length > 0 && (
          <div className="mb-6">
            <h2 className="font-black text-sm mb-3 uppercase tracking-widest border-l-4 border-black pl-3">
              B. Performance Indicators
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-1.5 text-left font-black">Description</th>
                    <th className="border border-black px-2 py-1.5 text-center font-black">Annual Target</th>
                    <th className="border border-black px-2 py-1.5 text-center font-black">Quarterly Target</th>
                  </tr>
                </thead>
                <tbody>
                  {data.indicators.map((ind, i) => (
                    <tr key={i}>
                      <td className="border border-black px-2 py-1">{ind.description}</td>
                      <td className="border border-black px-2 py-1 text-center">{ind.annual_target || '\u00A0'}</td>
                      <td className="border border-black px-2 py-1 text-center">{ind.quarterly_target || '\u00A0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section C: Accomplishment Summary */}
        <div className="mb-6">
          <h2 className="font-black text-sm mb-3 uppercase tracking-widest border-l-4 border-black pl-3">
            C. Accomplishment Summary
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black px-2 py-1.5 text-left font-black uppercase">{GROUP_LABELS[groupBy]}</th>
                  <th className="border border-black px-2 py-1.5 text-center font-black">PIRs</th>
                  <th className="border border-black px-2 py-1.5 text-center font-black">Schools</th>
                  <th className="border border-black px-2 py-1.5 text-center font-black">Programs</th>
                  <th className="border border-black px-2 py-1.5 text-center font-black">Physical %</th>
                  <th className="border border-black px-2 py-1.5 text-center font-black">Financial %</th>
                  <th className="border border-black px-2 py-1.5 text-right font-black">Budget</th>
                </tr>
              </thead>
              <tbody>
                {(data.groups || []).map((g) => (
                  <tr key={g.id}>
                    <td className="border border-black px-2 py-1 font-semibold">{g.name}</td>
                    <td className="border border-black px-2 py-1 text-center">{g.pirCount}</td>
                    <td className="border border-black px-2 py-1 text-center">{g.schoolCount}</td>
                    <td className="border border-black px-2 py-1 text-center">{g.programCount}</td>
                    <td className="border border-black px-2 py-1 text-center font-bold">{g.physicalRate}%</td>
                    <td className="border border-black px-2 py-1 text-center font-bold">{g.financialRate}%</td>
                    <td className="border border-black px-2 py-1 text-right">{formatCurrency((g.budgetDivision || 0) + (g.budgetCoPSF || 0))}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-black">
                  <td className="border border-black px-2 py-1">TOTAL</td>
                  <td className="border border-black px-2 py-1 text-center">{kpis.totalPIRs}</td>
                  <td className="border border-black px-2 py-1 text-center">{kpis.totalSchools}</td>
                  <td className="border border-black px-2 py-1 text-center">{kpis.totalPrograms}</td>
                  <td className="border border-black px-2 py-1 text-center">{kpis.physicalAccomplishmentRate}%</td>
                  <td className="border border-black px-2 py-1 text-center">{kpis.financialAccomplishmentRate}%</td>
                  <td className="border border-black px-2 py-1 text-right">{formatCurrency(totalBudget)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section D: Consolidated M&E Table */}
        <div className="mb-6">
          <h2 className="font-black text-sm mb-3 uppercase tracking-widest border-l-4 border-black pl-3">
            D. Consolidated Monitoring & Evaluation
          </h2>
          {(data.groups || []).map((g) => (
            <div key={g.id} className="mb-4">
              <h3 className="text-[11px] font-black uppercase tracking-wide mb-1 pl-1">
                {g.name}
              </h3>
              {g.activities?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[9px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black px-1.5 py-1 text-left font-black w-8">#</th>
                        <th className="border border-black px-1.5 py-1 text-left font-black">Activity</th>
                        <th className="border border-black px-1.5 py-1 text-center font-black">Complied</th>
                        <th className="border border-black px-1.5 py-1 text-right font-black">Phys. Target</th>
                        <th className="border border-black px-1.5 py-1 text-right font-black">Phys. Accomp.</th>
                        <th className="border border-black px-1.5 py-1 text-right font-black">Fin. Target</th>
                        <th className="border border-black px-1.5 py-1 text-right font-black">Fin. Accomp.</th>
                        <th className="border border-black px-1.5 py-1 text-right font-black">Gap %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.activities.map((a, i) => (
                        <tr key={i}>
                          <td className="border border-black px-1.5 py-0.5 text-center">{i + 1}</td>
                          <td className="border border-black px-1.5 py-0.5">
                            {a.isUnplanned ? <span className="font-bold">[U] </span> : null}
                            {a.activityName}
                          </td>
                          <td className="border border-black px-1.5 py-0.5 text-center">
                            {a.compliedCount}/{a.compliedCount + a.notCompliedCount}
                          </td>
                          <td className="border border-black px-1.5 py-0.5 text-right">{formatNum(a.physicalTarget)}</td>
                          <td className="border border-black px-1.5 py-0.5 text-right">{formatNum(a.physicalAccomplished)}</td>
                          <td className="border border-black px-1.5 py-0.5 text-right">{formatNum(a.financialTarget)}</td>
                          <td className="border border-black px-1.5 py-0.5 text-right">{formatNum(a.financialAccomplished)}</td>
                          <td className="border border-black px-1.5 py-0.5 text-right font-bold">
                            {a.physicalGapPct >= 0 ? '+' : ''}{a.physicalGapPct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[10px] text-gray-500 italic pl-1">No activities recorded.</p>
              )}
            </div>
          ))}
        </div>

        {/* Section E: Factors Matrix */}
        <div className="mb-6">
          <h2 className="font-black text-sm mb-3 uppercase tracking-widest border-l-4 border-black pl-3">
            E. Factors Affecting Implementation
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black px-2 py-1.5 text-left font-black">Factor Type</th>
                  <th className="border border-black px-2 py-1.5 text-left font-black">Facilitating Factors</th>
                  <th className="border border-black px-2 py-1.5 text-left font-black">Hindering Factors</th>
                  <th className="border border-black px-2 py-1.5 text-left font-black">Recommendations</th>
                </tr>
              </thead>
              <tbody>
                {FACTOR_TYPES.map((type) => {
                  const f = data.factors?.[type] || {};
                  return (
                    <tr key={type}>
                      <td className="border border-black px-2 py-1 font-semibold align-top">{type}</td>
                      <td className="border border-black px-2 py-1 align-top whitespace-pre-line">
                        {f.facilitatingEntries?.join(';\n') || '\u00A0'}
                      </td>
                      <td className="border border-black px-2 py-1 align-top whitespace-pre-line">
                        {f.hinderingEntries?.join(';\n') || '\u00A0'}
                      </td>
                      <td className="border border-black px-2 py-1 align-top whitespace-pre-line">
                        {f.recommendationEntries?.join(';\n') || '\u00A0'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section F: Action Items */}
        {data.actionItems?.length > 0 && (
          <div className="mb-6">
            <h2 className="font-black text-sm mb-3 uppercase tracking-widest border-l-4 border-black pl-3">
              F. Action Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-1.5 text-left font-black w-8">#</th>
                    <th className="border border-black px-2 py-1.5 text-left font-black">Action</th>
                    <th className="border border-black px-2 py-1.5 text-left font-black">Response (ASDS)</th>
                    <th className="border border-black px-2 py-1.5 text-left font-black">Response (SDS)</th>
                    <th className="border border-black px-2 py-1.5 text-left font-black">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {data.actionItems.map((ai, i) => (
                    <tr key={i}>
                      <td className="border border-black px-2 py-1 text-center">{i + 1}</td>
                      <td className="border border-black px-2 py-1">{ai.action}</td>
                      <td className="border border-black px-2 py-1">{ai.responseAsds || '\u00A0'}</td>
                      <td className="border border-black px-2 py-1">{ai.responseSds || '\u00A0'}</td>
                      <td className="border border-black px-2 py-1 text-[9px]">{ai.sourceLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-12 grid grid-cols-3 gap-8 text-[10px]">
          <div className="text-center">
            <div className="border-b border-black mb-1 pb-6" />
            <p className="font-black uppercase">Prepared by</p>
          </div>
          <div className="text-center">
            <div className="border-b border-black mb-1 pb-6" />
            <p className="font-black uppercase">Noted by</p>
          </div>
          <div className="text-center">
            <div className="border-b border-black mb-1 pb-6" />
            <p className="font-black uppercase">Approved by</p>
          </div>
        </div>
      </div>
    </div>
  );
}
