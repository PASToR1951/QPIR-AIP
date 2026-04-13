import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { BLACK, BODY_W, FONT_SIZES, MARGIN, PAGE } from './constants.js';

let sealCache = null;

export async function loadSealImage() {
  if (sealCache) return sealCache;

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/DepEd_Seal.webp';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);
    sealCache = canvas.toDataURL('image/png');
    return sealCache;
  } catch {
    return null;
  }
}

export function createLandscapePdf() {
  return new jsPDF({ orientation: 'landscape', unit: 'mm', format: [330.2, 215.9] });
}

export function drawGovHeader(pdf, sealData, { title, subtitle, badge }) {
  let y = MARGIN.top;
  const cx = PAGE.w / 2;

  if (sealData) {
    const sealSize = 16;
    pdf.addImage(sealData, 'PNG', cx - sealSize / 2, y, sealSize, sealSize);
    y += sealSize + 1;
  }

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

  pdf.setDrawColor(...BLACK);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN.left + 20, y, PAGE.w - MARGIN.right - 20, y);
  y += 3;

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

  pdf.setLineWidth(0.5);
  pdf.line(MARGIN.left, y, PAGE.w - MARGIN.right, y);
  y += 4;

  return y;
}

export function drawProfileRow(pdf, y, label, value, labelWidth = 55) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(FONT_SIZES.sm);
  pdf.text(label, MARGIN.left, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(FONT_SIZES.base);
  pdf.text(value || '', MARGIN.left + labelWidth, y);
  pdf.setDrawColor(180, 180, 180);
  pdf.setLineWidth(0.15);
  pdf.setLineDashPattern([0.5, 0.8], 0);
  pdf.line(MARGIN.left, y + 1.5, PAGE.w - MARGIN.right, y + 1.5);
  pdf.setLineDashPattern([], 0);
  pdf.setDrawColor(...BLACK);
  return y + 5;
}

export function drawSignatures(pdf, y, left, right) {
  if (y + 30 > PAGE.h - MARGIN.bottom) {
    pdf.addPage();
    y = MARGIN.top;
  }

  y += 8;

  const colW = BODY_W / 2;
  const leftX = MARGIN.left + colW * 0.15;
  const rightX = MARGIN.left + colW + colW * 0.15;
  const lineW = colW * 0.7;

  [{ x: leftX, ...left }, { x: rightX, ...right }].forEach(({ x, label, name, title }) => {
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
    pdf.text((title || '').toUpperCase(), x + lineW / 2, nameY + 4, { align: 'center' });
  });

  return y + 25;
}

export function formatCurrency(value) {
  if (!value && value !== 0) return '';
  const num = parseFloat(value);
  if (Number.isNaN(num)) return '';
  return `\u20B1 ${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
