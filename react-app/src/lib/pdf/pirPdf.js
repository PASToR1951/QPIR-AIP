import { getProjectTerminology } from '../projectTerminology.js';
import {
  BLACK,
  BODY_W,
  DEFAULT_FACTOR_TYPES,
  FONT_SIZES,
  LIGHT_GRAY,
  MARGIN,
  PAGE,
} from './constants.js';
import {
  createLandscapePdf,
  drawGovHeader,
  drawSignatures,
  formatCurrency,
  loadSealImage,
} from './shared.js';

function calculateGap(targetStr, accStr) {
  const target = parseFloat(targetStr) || 0;
  const acc = parseFloat(accStr) || 0;
  if (target > 0) {
    if (acc >= target) return 0;
    return ((acc - target) / target) * 100;
  }
  return 0;
}

export async function generatePIRPdf(data) {
  const {
    quarter = '',
    supervisorName = '',
    supervisorTitle = '',
    program,
    school,
    owner,
    budgetFromDivision,
    budgetFromCoPSF,
    functionalDivision = '',
    usesSchoolTerminology = true,
    indicatorTargets = [],
    activities = [],
    factors = {},
    actionItems = [],
    factorTypes = DEFAULT_FACTOR_TYPES,
  } = data;
  const projectTerminology = getProjectTerminology(usesSchoolTerminology);

  const sealData = await loadSealImage();
  const pdf = createLandscapePdf();

  const yearMatch = quarter.match(/CY (\d{4})/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear();

  const aipActivities = activities.filter((activity) => !activity.isUnplanned);
  const unplannedActivities = activities.filter((activity) => activity.isUnplanned);

  let y = drawGovHeader(pdf, sealData, {
    title: 'Quarterly Program Implementation Review (AIP-PIR)',
    subtitle: 'Quarterly Division Monitoring Evaluation and Adjustment',
    badge: quarter,
  });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(FONT_SIZES.md);
  pdf.text('A. PROGRAM PROFILE', MARGIN.left, y);
  y += 4;

  const halfW = BODY_W / 2;
  const col2X = MARGIN.left + halfW + 5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(FONT_SIZES.xs);
  pdf.text('Program:', MARGIN.left, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(FONT_SIZES.base);
  pdf.text(program || '', MARGIN.left + 22, y);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(FONT_SIZES.xs);
  pdf.text(functionalDivision ? 'Functional Division:' : 'School:', col2X, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(FONT_SIZES.base);
  pdf.text(functionalDivision || school || '', col2X + 32, y);
  y += 4.5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(FONT_SIZES.xs);
  pdf.text('Owner:', MARGIN.left, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(FONT_SIZES.base);
  pdf.text(owner || '', MARGIN.left + 22, y);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(FONT_SIZES.xs);
  pdf.text('From Division:', col2X, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(FONT_SIZES.base);
  pdf.text(formatCurrency(budgetFromDivision), col2X + 25, y);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(FONT_SIZES.xs);
  pdf.text('From CO-PSF:', col2X + halfW * 0.5, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(FONT_SIZES.base);
  pdf.text(formatCurrency(budgetFromCoPSF), col2X + halfW * 0.5 + 24, y);
  y += 3;

  pdf.setLineWidth(0.4);
  pdf.line(MARGIN.left, y, PAGE.w - MARGIN.right, y);
  y += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(FONT_SIZES.md);
  pdf.text('B. PERFORMANCE INDICATORS', MARGIN.left, y);
  y += 3;

  pdf.autoTable({
    startY: y,
    margin: { left: MARGIN.left, right: MARGIN.right },
    styles: {
      fontSize: FONT_SIZES.sm,
      cellPadding: 1.5,
      lineColor: BLACK,
      lineWidth: 0.2,
      textColor: BLACK,
    },
    headStyles: {
      fillColor: LIGHT_GRAY,
      textColor: BLACK,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: FONT_SIZES.xs,
    },
    head: [[`Annual Performance Indicator (refer to the ${projectTerminology.aipReferenceLabel})`, 'Annual Target', "This Quarter's Target"]],
    columnStyles: {
      0: { cellWidth: BODY_W * 0.5 },
      1: { cellWidth: BODY_W * 0.25, halign: 'center' },
      2: { cellWidth: BODY_W * 0.25, halign: 'center' },
    },
    body: indicatorTargets.length === 0
      ? [['No indicators specified.', '', '']]
      : indicatorTargets.map((indicator) => [
          indicator.description || '',
          indicator.annual_target ? `${indicator.annual_target}%` : '-%',
          indicator.quarterly_target ? `${indicator.quarterly_target}%` : '-%',
        ]),
  });
  y = pdf.lastAutoTable.finalY + 5;

  if (y + 20 > PAGE.h - MARGIN.bottom) {
    pdf.addPage();
    y = MARGIN.top;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(FONT_SIZES.md);
  pdf.text('C. QUARTERLY MONITORING EVALUATION & ADJUSTMENT', MARGIN.left, y);
  y += 3;

  const monitoringHead = [
    [
      { content: 'No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: `Q Activity/IES\n(Based on AIP ${year})`, rowSpan: 2, styles: { valign: 'middle' } },
      { content: 'Complied/\nNot Complied', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: 'Actual Tasks\nConducted', rowSpan: 2, styles: { valign: 'middle' } },
      { content: 'Contributory\nPerformance\nIndicators', rowSpan: 2, styles: { valign: 'middle' } },
      { content: 'MOVs /\nExpected\nOutputs', rowSpan: 2, styles: { valign: 'middle' } },
      { content: 'Quarterly Target', colSpan: 2, styles: { halign: 'center' } },
      { content: 'Accomplishment', colSpan: 2, styles: { halign: 'center' } },
      { content: 'Gap (%)', colSpan: 2, styles: { halign: 'center' } },
      { content: 'Actions to\nAddress Gap', rowSpan: 2, styles: { valign: 'middle' } },
      { content: 'Adjustments', rowSpan: 2, styles: { valign: 'middle' } },
    ],
    [
      'Physical', 'Financial',
      'Physical', 'Financial',
      'Physical', 'Financial',
    ],
  ];

  function activityRow(activity, index) {
    const physGap = calculateGap(activity.physTarget, activity.physAcc);
    const finGap = calculateGap(activity.finTarget, activity.finAcc);
    return [
      String(index + 1),
      activity.name || '',
      activity.complied === true ? '\u2713' : activity.complied === false ? '\u2717' : '',
      activity.actualTasksConducted || '',
      activity.contributoryIndicators || '',
      activity.movsExpectedOutputs || '',
      activity.physTarget || '',
      formatCurrency(activity.finTarget),
      activity.physAcc || '',
      formatCurrency(activity.finAcc),
      `${physGap.toFixed(2)}%`,
      `${finGap.toFixed(2)}%`,
      activity.actions || '',
      activity.adjustments || '',
    ];
  }

  const monitoringBody = [];
  if (activities.length === 0) {
    monitoringBody.push([{ content: 'No activities recorded.', colSpan: 14, styles: { halign: 'center', fontStyle: 'italic' } }]);
  } else {
    aipActivities.forEach((activity, index) => monitoringBody.push(activityRow(activity, index)));
    if (unplannedActivities.length > 0) {
      monitoringBody.push([{
        content: 'Activities Conducted But Not Included in the AIP',
        colSpan: 14,
        styles: { halign: 'center', fontStyle: 'bold', fillColor: LIGHT_GRAY, fontSize: FONT_SIZES.xs },
      }]);
      unplannedActivities.forEach((activity, index) => monitoringBody.push(activityRow(activity, index)));
    }
  }

  pdf.autoTable({
    startY: y,
    margin: { left: MARGIN.left, right: MARGIN.right },
    styles: {
      fontSize: FONT_SIZES.xs,
      cellPadding: 1,
      lineColor: BLACK,
      lineWidth: 0.2,
      textColor: BLACK,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: LIGHT_GRAY,
      textColor: BLACK,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 5.5,
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: BODY_W * 0.10 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: BODY_W * 0.10 },
      4: { cellWidth: BODY_W * 0.10 },
      5: { cellWidth: BODY_W * 0.09 },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
      8: { cellWidth: 14, halign: 'center' },
      9: { cellWidth: 18, halign: 'center' },
      10: { cellWidth: 14, halign: 'center' },
      11: { cellWidth: 14, halign: 'center' },
      12: { cellWidth: BODY_W * 0.09 },
      13: { cellWidth: BODY_W * 0.07 },
    },
    head: monitoringHead,
    body: monitoringBody,
  });
  y = pdf.lastAutoTable.finalY + 5;

  if (y + 25 > PAGE.h - MARGIN.bottom) {
    pdf.addPage();
    y = MARGIN.top;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(FONT_SIZES.md);
  pdf.text('D. FACILITATING AND HINDERING FACTORS', MARGIN.left, y);
  y += 3;

  pdf.autoTable({
    startY: y,
    margin: { left: MARGIN.left, right: MARGIN.right },
    styles: {
      fontSize: FONT_SIZES.sm,
      cellPadding: 1.5,
      lineColor: BLACK,
      lineWidth: 0.2,
      textColor: BLACK,
      overflow: 'linebreak',
      minCellHeight: 8,
    },
    headStyles: {
      fillColor: LIGHT_GRAY,
      textColor: BLACK,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: FONT_SIZES.xs,
    },
    head: [['', 'Context-Specific Facilitating Factors', 'Context-Specific Hindering Factors', 'Recommendations']],
    columnStyles: {
      0: { cellWidth: BODY_W * 0.15, fontStyle: 'bold', fontSize: FONT_SIZES.xs },
      1: { cellWidth: BODY_W * 0.28 },
      2: { cellWidth: BODY_W * 0.28 },
      3: { cellWidth: BODY_W * 0.29 },
    },
    body: factorTypes.map((type) => [
      type.toUpperCase(),
      factors[type]?.facilitating || '',
      factors[type]?.hindering || '',
      factors[type]?.recommendations || '',
    ]),
  });
  y = pdf.lastAutoTable.finalY + 5;

  if (y + 20 > PAGE.h - MARGIN.bottom) {
    pdf.addPage();
    y = MARGIN.top;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(FONT_SIZES.md);
  pdf.text('E. ACTION ITEMS / WAYS FORWARD', MARGIN.left, y);
  y += 3;

  pdf.autoTable({
    startY: y,
    margin: { left: MARGIN.left, right: MARGIN.right },
    styles: {
      fontSize: FONT_SIZES.sm,
      cellPadding: 1.5,
      lineColor: BLACK,
      lineWidth: 0.2,
      textColor: BLACK,
      overflow: 'linebreak',
      minCellHeight: 6,
    },
    headStyles: {
      fillColor: LIGHT_GRAY,
      textColor: BLACK,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: FONT_SIZES.xs,
    },
    head: [['', 'Action Items / Ways Forward of Program Owner', 'Management Response – ASDS / FD Chief', 'Management Response – SDS']],
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: BODY_W * 0.38 },
      2: { cellWidth: BODY_W * 0.27 },
      3: { cellWidth: BODY_W * 0.27 },
    },
    body: actionItems.length === 0
      ? [['', 'No action items.', '', '']]
      : actionItems.map((item, index) => [
          String(index + 1),
          item.action || '',
          item.response_asds || '',
          item.response_sds || '',
        ]),
  });
  y = pdf.lastAutoTable.finalY + 4;

  drawSignatures(
    pdf,
    y,
    { label: 'Prepared by:', name: owner, title: 'Program Owner' },
    { label: 'Noted:', name: supervisorName, title: supervisorTitle },
  );

  const safeProgram = program
    ? `_${program.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}`
    : '';
  const safeQuarter = quarter
    ? `_${quarter.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}`
    : '';
  pdf.save(`PIR${safeQuarter}${safeProgram}.pdf`);
}
