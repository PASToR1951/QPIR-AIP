import jsPDF from 'jspdf';
import 'jspdf-autotable';

/* ─────────────────────────── constants ─────────────────────────── */

const PAGE = { w: 297, h: 210 }; // A4 landscape in mm
const MARGIN = { top: 10, left: 10, right: 10, bottom: 10 };
const BODY_W = PAGE.w - MARGIN.left - MARGIN.right;

const FONT_SIZES = { xs: 6, sm: 7, base: 8, md: 9, lg: 10, xl: 12 };

const BLACK = [0, 0, 0];
const GRAY = [100, 100, 100];
const LIGHT_GRAY = [240, 240, 240];
const WHITE = [255, 255, 255];

/* ─────────────────────── image loader ─────────────────────── */

let _sealCache = null;

/**
 * Loads the DepEd seal as a base64 PNG via an off-screen canvas.
 * WebP isn't supported by jsPDF, so we convert it at runtime.
 */
async function loadSealImage() {
    if (_sealCache) return _sealCache;
    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = '/DepEd_Seal.webp';
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });
        const cvs = document.createElement('canvas');
        cvs.width = img.naturalWidth;
        cvs.height = img.naturalHeight;
        cvs.getContext('2d').drawImage(img, 0, 0);
        _sealCache = cvs.toDataURL('image/png');
        return _sealCache;
    } catch {
        return null;
    }
}

/* ──────────────────── shared PDF helpers ──────────────────── */

function createLandscapePdf() {
    return new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
}

/** Draws the DepEd government header block, returns the Y position after it. */
function drawGovHeader(pdf, sealData, { title, subtitle, badge }) {
    let y = MARGIN.top;
    const cx = PAGE.w / 2;

    // Seal
    if (sealData) {
        const sealSize = 16;
        pdf.addImage(sealData, 'PNG', cx - sealSize / 2, y, sealSize, sealSize);
        y += sealSize + 1;
    }

    // Agency hierarchy
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(FONT_SIZES.sm);
    pdf.text('Republic of the Philippines', cx, y, { align: 'center' });
    y += 3.5;

    pdf.setFont('times', 'bold');
    pdf.setFontSize(FONT_SIZES.xl + 2);
    pdf.text('Department of Education', cx, y, { align: 'center' });
    y += 4;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(FONT_SIZES.sm);
    pdf.text('Negros Island Region', cx, y, { align: 'center' });
    y += 3;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_SIZES.sm);
    pdf.text('DIVISION OF GUIHULNGAN CITY', cx, y, { align: 'center' });
    y += 4;

    // Divider line
    pdf.setDrawColor(...BLACK);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN.left + 20, y, PAGE.w - MARGIN.right - 20, y);
    y += 3;

    // Document title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_SIZES.md);
    pdf.text(title, cx, y, { align: 'center' });
    y += 3;

    if (subtitle) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(FONT_SIZES.xs);
        pdf.text(subtitle, cx, y, { align: 'center' });
        y += 3;
    }

    if (badge) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(FONT_SIZES.xs);
        pdf.text(badge, cx, y, { align: 'center' });
        y += 3;
    }

    // Bottom border
    pdf.setLineWidth(0.5);
    pdf.line(MARGIN.left, y, PAGE.w - MARGIN.right, y);
    y += 4;

    return y;
}

/** Draws a "Label: Value" profile row, returns Y after it. */
function drawProfileRow(pdf, y, label, value, labelWidth = 55) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_SIZES.sm);
    pdf.text(label, MARGIN.left, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(FONT_SIZES.base);
    pdf.text(value || '', MARGIN.left + labelWidth, y);
    // Dotted underline
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.15);
    pdf.setLineDashPattern([0.5, 0.8], 0);
    pdf.line(MARGIN.left, y + 1.5, PAGE.w - MARGIN.right, y + 1.5);
    pdf.setLineDashPattern([], 0); // reset
    pdf.setDrawColor(...BLACK);
    return y + 5;
}

/** Draws signature blocks side by side. */
function drawSignatures(pdf, y, left, right) {
    // Ensure enough space for signatures
    if (y + 30 > PAGE.h - MARGIN.bottom) {
        pdf.addPage();
        y = MARGIN.top;
    }

    y += 8;

    const colW = BODY_W / 2;
    const leftX = MARGIN.left + colW * 0.15;
    const rightX = MARGIN.left + colW + colW * 0.15;
    const lineW = colW * 0.7;

    [{ x: leftX, ...left }, { x: rightX, ...right }].forEach(({ x, label, name, title: sigTitle }) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(FONT_SIZES.xs);
        pdf.text(label.toUpperCase(), x, y);

        const nameY = y + 12;
        pdf.setLineWidth(0.4);
        pdf.line(x, nameY + 1, x + lineW, nameY + 1);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(FONT_SIZES.base);
        pdf.text((name || '').toUpperCase(), x + lineW / 2, nameY, { align: 'center' });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(FONT_SIZES.xs);
        pdf.text((sigTitle || '').toUpperCase(), x + lineW / 2, nameY + 4, { align: 'center' });
    });

    return y + 25;
}

function formatCurrency(val) {
    if (!val && val !== 0) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    return `\u20B1 ${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ═══════════════════════════════════════════════════════════════
   AIP PDF TEMPLATE
   ═══════════════════════════════════════════════════════════════ */

export async function generateAIPPdf(data) {
    const {
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
    } = data;

    const sealData = await loadSealImage();
    const pdf = createLandscapePdf();

    /* Header */
    let y = drawGovHeader(pdf, sealData, {
        title: `Annual Implementation Plan for ${year}`,
    });

    /* Profile section */
    y = drawProfileRow(pdf, y, 'OUTCOME #:', outcome);
    y = drawProfileRow(pdf, y, 'OUTCOME TARGET:', targetDescription);
    y = drawProfileRow(pdf, y, 'DEPED PROGRAM ALIGNED:', depedProgram);
    y = drawProfileRow(pdf, y, 'SCHOOL IMPROVEMENT PROJECT/TITLE:', sipTitle);
    y = drawProfileRow(pdf, y, 'PROJECT COORDINATOR:', projectCoord);

    /* Objectives */
    const visibleObjectives = objectives.filter(o => o && o.trim() !== '');
    if (visibleObjectives.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(FONT_SIZES.sm);
        pdf.text('OBJECTIVE/S:', MARGIN.left, y);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(FONT_SIZES.base);
        visibleObjectives.forEach((obj, i) => {
            pdf.text(`* ${obj}`, MARGIN.left + 55, y + i * 3.5);
        });
        y += Math.max(4, visibleObjectives.length * 3.5 + 1);
    }

    /* Performance Indicators */
    const visibleIndicators = indicators.filter(ind => ind.description && ind.description.trim() !== '');
    if (visibleIndicators.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(FONT_SIZES.sm);
        pdf.text('PERFORMANCE INDICATOR/S (OVI):', MARGIN.left, y);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(FONT_SIZES.base);
        visibleIndicators.forEach((ind, i) => {
            pdf.text(`* ${ind.description}`, MARGIN.left + 55, y + i * 3.5);
            const targetStr = ind.target ? (String(ind.target).endsWith('%') ? ind.target : `${ind.target}%`) : '';
            pdf.text(targetStr, PAGE.w - MARGIN.right - 5, y + i * 3.5, { align: 'right' });
        });
        // Annual Target label
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(FONT_SIZES.xs);
        pdf.text('ANNUAL TARGET', PAGE.w - MARGIN.right - 5, y - 3, { align: 'right' });
        y += Math.max(4, visibleIndicators.length * 3.5 + 2);
    }

    y += 2;

    /* Activities table */
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
            : activities.map((act, idx) => [
                `${idx + 1}. ${act.phase ? `${act.phase}: ` : ''}${act.name || ''}`,
                act.period || '',
                act.persons || '',
                act.outputs || '',
                act.budgetAmount ? formatCurrency(act.budgetAmount) : '',
                act.budgetSource || '',
            ]),
    });

    y = pdf.lastAutoTable.finalY + 4;

    /* Signatures */
    drawSignatures(pdf, y,
        { label: 'Prepared by:', name: preparedByName, title: preparedByTitle },
        { label: 'Approved:', name: approvedByName, title: approvedByTitle },
    );

    /* Save */
    const safeSipTitle = sipTitle ? `_${sipTitle.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}` : '';
    pdf.save(`AIP_${year}${safeSipTitle}.pdf`);
}

/* ═══════════════════════════════════════════════════════════════
   PIR PDF TEMPLATE
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_FACTOR_TYPES = ['Institutional', 'Technical', 'Infrastructure', 'Learning Resources', 'Environmental', 'Others'];

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
        indicatorTargets = [],
        activities = [],
        factors = {},
        actionItems = [],
        factorTypes = DEFAULT_FACTOR_TYPES,
    } = data;

    const sealData = await loadSealImage();
    const pdf = createLandscapePdf();

    const yearMatch = quarter.match(/CY (\d{4})/);
    const year = yearMatch ? yearMatch[1] : new Date().getFullYear();

    function calculateGap(targetStr, accStr) {
        const target = parseFloat(targetStr) || 0;
        const acc = parseFloat(accStr) || 0;
        if (target > 0) {
            if (acc >= target) return 0;
            return ((acc - target) / target) * 100;
        }
        return 0;
    }

    const aipActivities = activities.filter(a => !a.isUnplanned);
    const unplannedActivities = activities.filter(a => a.isUnplanned);

    /* Header */
    let y = drawGovHeader(pdf, sealData, {
        title: 'Quarterly Program Implementation Review (QPIR)',
        subtitle: 'Quarterly Division Monitoring Evaluation and Adjustment',
        badge: quarter,
    });

    /* ─── Section A: Program Profile ─── */
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(FONT_SIZES.md);
    pdf.text('A. PROGRAM PROFILE', MARGIN.left, y);
    y += 4;

    const halfW = BODY_W / 2;
    const col2X = MARGIN.left + halfW + 5;

    // Row 1: Program | School/Functional Division
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(FONT_SIZES.xs);
    pdf.text('Program:', MARGIN.left, y);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(FONT_SIZES.base);
    pdf.text(program || '', MARGIN.left + 22, y);

    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(FONT_SIZES.xs);
    pdf.text(functionalDivision ? 'Functional Division:' : 'School:', col2X, y);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(FONT_SIZES.base);
    pdf.text(functionalDivision || school || '', col2X + 32, y);
    y += 4.5;

    // Row 2: Owner | Budget
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(FONT_SIZES.xs);
    pdf.text('Owner:', MARGIN.left, y);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(FONT_SIZES.base);
    pdf.text(owner || '', MARGIN.left + 22, y);

    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(FONT_SIZES.xs);
    pdf.text('From Division:', col2X, y);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(FONT_SIZES.base);
    pdf.text(formatCurrency(budgetFromDivision), col2X + 25, y);

    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(FONT_SIZES.xs);
    pdf.text('From CO-PSF:', col2X + halfW * 0.5, y);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(FONT_SIZES.base);
    pdf.text(formatCurrency(budgetFromCoPSF), col2X + halfW * 0.5 + 24, y);
    y += 3;

    // Divider
    pdf.setLineWidth(0.4);
    pdf.line(MARGIN.left, y, PAGE.w - MARGIN.right, y);
    y += 5;

    /* ─── Section B: Performance Indicators ─── */
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
        head: [['Annual Performance Indicator (refer to the SIP/AIP)', 'Annual Target', "This Quarter's Target"]],
        columnStyles: {
            0: { cellWidth: BODY_W * 0.5 },
            1: { cellWidth: BODY_W * 0.25, halign: 'center' },
            2: { cellWidth: BODY_W * 0.25, halign: 'center' },
        },
        body: indicatorTargets.length === 0
            ? [['No indicators specified.', '', '']]
            : indicatorTargets.map(ind => [
                ind.description || '',
                ind.annual_target ? `${ind.annual_target}%` : '-%',
                ind.quarterly_target ? `${ind.quarterly_target}%` : '-%',
            ]),
    });
    y = pdf.lastAutoTable.finalY + 5;

    /* ─── Section C: Quarterly Monitoring Evaluation ─── */
    // Check if we need a new page
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

    function activityRow(act, index) {
        const physGap = calculateGap(act.physTarget, act.physAcc);
        const finGap = calculateGap(act.finTarget, act.finAcc);
        return [
            String(index + 1),
            act.name || '',
            act.complied === true ? '\u2713' : act.complied === false ? '\u2717' : '',
            act.actualTasksConducted || '',
            act.contributoryIndicators || '',
            act.movsExpectedOutputs || '',
            act.physTarget || '',
            formatCurrency(act.finTarget),
            act.physAcc || '',
            formatCurrency(act.finAcc),
            `${physGap.toFixed(2)}%`,
            `${finGap.toFixed(2)}%`,
            act.actions || '',
            act.adjustments || '',
        ];
    }

    const monitoringBody = [];
    if (activities.length === 0) {
        monitoringBody.push([{ content: 'No activities recorded.', colSpan: 14, styles: { halign: 'center', fontStyle: 'italic' } }]);
    } else {
        aipActivities.forEach((act, i) => monitoringBody.push(activityRow(act, i)));
        if (unplannedActivities.length > 0) {
            monitoringBody.push([{
                content: 'Activities Conducted But Not Included in the AIP',
                colSpan: 14,
                styles: { halign: 'center', fontStyle: 'bold', fillColor: LIGHT_GRAY, fontSize: FONT_SIZES.xs },
            }]);
            unplannedActivities.forEach((act, i) => monitoringBody.push(activityRow(act, i)));
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
            3: { cellWidth: BODY_W * 0.09 },
            4: { cellWidth: BODY_W * 0.09 },
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

    /* ─── Section D: Facilitating and Hindering Factors ─── */
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
        body: factorTypes.map(type => [
            type.toUpperCase(),
            factors[type]?.facilitating || '',
            factors[type]?.hindering || '',
            factors[type]?.recommendations || '',
        ]),
    });
    y = pdf.lastAutoTable.finalY + 5;

    /* ─── Section E: Action Items ─── */
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
        head: [['', 'Action Items / Ways Forward of Program Owner', 'Management Response \u2013 ASDS / FD Chief', 'Management Response \u2013 SDS']],
        columnStyles: {
            0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: BODY_W * 0.38 },
            2: { cellWidth: BODY_W * 0.27 },
            3: { cellWidth: BODY_W * 0.27 },
        },
        body: actionItems.length === 0
            ? [['', 'No action items.', '', '']]
            : actionItems.map((item, i) => [
                String(i + 1),
                item.action || '',
                item.response_asds || '',
                item.response_sds || '',
            ]),
    });
    y = pdf.lastAutoTable.finalY + 4;

    /* Signatures */
    drawSignatures(pdf, y,
        { label: 'Prepared by:', name: owner, title: 'Program Owner' },
        { label: 'Noted:', name: supervisorName, title: supervisorTitle },
    );

    /* Save */
    const safeProgram = program ? `_${program.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}` : '';
    const safeQuarter = quarter ? `_${quarter.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}` : '';
    pdf.save(`PIR${safeQuarter}${safeProgram}.pdf`);
}
