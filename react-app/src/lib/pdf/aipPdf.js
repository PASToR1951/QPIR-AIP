import { getProjectTerminology } from '../projectTerminology.js';
import { BLACK, BODY_W, FONT_SIZES, LIGHT_GRAY, MARGIN, PAGE } from './constants.js';
import {
  createLandscapePdf,
  drawGovHeader,
  drawProfileRow,
  drawSignatures,
  formatCurrency,
  loadSealImage,
} from './shared.js';

export async function generateAIPPdf(data) {
  const {
    year = new Date().getFullYear(),
    outcome,
    targetDescription,
    depedProgram,
    usesSchoolTerminology = true,
    sipTitle,
    projectCoord,
    objectives = [],
    indicators = [],
    activities = [],
    preparedByName,
    preparedByTitle,
    approvedByName,
    approvedByTitle,
  } = data;
  const projectTerminology = getProjectTerminology(usesSchoolTerminology);

  const sealData = await loadSealImage();
  const pdf = createLandscapePdf();

  let y = drawGovHeader(pdf, sealData, {
    title: `Annual Implementation Plan for ${year}`,
  });

  y = drawProfileRow(pdf, y, 'OUTCOME #:', outcome);
  y = drawProfileRow(pdf, y, 'OUTCOME TARGET:', targetDescription);
  y = drawProfileRow(pdf, y, 'DEPED PROGRAM ALIGNED:', depedProgram);
  y = drawProfileRow(pdf, y, projectTerminology.projectTitlePdfLabel, sipTitle);
  y = drawProfileRow(pdf, y, 'PROJECT COORDINATOR:', projectCoord);

  const visibleObjectives = objectives.filter((objective) => objective && objective.trim() !== '');
  if (visibleObjectives.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_SIZES.sm);
    pdf.text('OBJECTIVE/S:', MARGIN.left, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(FONT_SIZES.base);
    visibleObjectives.forEach((objective, index) => {
      pdf.text(`* ${objective}`, MARGIN.left + 55, y + index * 3.5);
    });
    y += Math.max(4, visibleObjectives.length * 3.5 + 1);
  }

  const visibleIndicators = indicators.filter((indicator) => indicator.description && indicator.description.trim() !== '');
  if (visibleIndicators.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_SIZES.sm);
    pdf.text('PERFORMANCE INDICATOR/S (OVI):', MARGIN.left, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(FONT_SIZES.base);
    visibleIndicators.forEach((indicator, index) => {
      pdf.text(`* ${indicator.description}`, MARGIN.left + 55, y + index * 3.5);
      const targetStr = indicator.target
        ? (String(indicator.target).endsWith('%') ? indicator.target : `${indicator.target}%`)
        : '';
      pdf.text(targetStr, PAGE.w - MARGIN.right - 5, y + index * 3.5, { align: 'right' });
    });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_SIZES.xs);
    pdf.text('ANNUAL TARGET', PAGE.w - MARGIN.right - 5, y - 3, { align: 'right' });
    y += Math.max(4, visibleIndicators.length * 3.5 + 2);
  }

  y += 2;

  pdf.autoTable({
    startY: y,
    margin: { left: MARGIN.left, right: MARGIN.right },
    styles: {
      fontSize: FONT_SIZES.sm,
      cellPadding: 1.5,
      lineColor: BLACK,
      lineWidth: 0.2,
      textColor: BLACK,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: LIGHT_GRAY,
      textColor: BLACK,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: FONT_SIZES.xs,
    },
    head: [[
      'Activities to be Conducted',
      'Implementation\nPeriod',
      'Persons\nInvolved',
      'Outputs',
      'Amount',
      'Source',
    ]],
    columnStyles: {
      0: { cellWidth: BODY_W * 0.35 },
      1: { cellWidth: BODY_W * 0.13, halign: 'center' },
      2: { cellWidth: BODY_W * 0.13, halign: 'center' },
      3: { cellWidth: BODY_W * 0.15, halign: 'center' },
      4: { cellWidth: BODY_W * 0.12, halign: 'center', font: 'courier' },
      5: { cellWidth: BODY_W * 0.12, halign: 'center' },
    },
    body: activities.length === 0
      ? [['No activities added.', '', '', '', '', '']]
      : activities.map((activity, index) => [
          `${index + 1}. ${activity.phase ? `${activity.phase}: ` : ''}${activity.name || ''}`,
          activity.period || '',
          activity.persons || '',
          activity.outputs || '',
          activity.budgetAmount ? formatCurrency(activity.budgetAmount) : '',
          activity.budgetSource || '',
        ]),
  });

  y = pdf.lastAutoTable.finalY + 4;

  drawSignatures(
    pdf,
    y,
    { label: 'Prepared by:', name: preparedByName, title: preparedByTitle },
    { label: 'Approved:', name: approvedByName, title: approvedByTitle },
  );

  const safeSipTitle = sipTitle
    ? `_${sipTitle.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}`
    : '';
  pdf.save(`AIP_${year}${safeSipTitle}.pdf`);
}
