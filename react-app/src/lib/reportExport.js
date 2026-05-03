import React from 'react';
import { createRoot } from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportHeader } from '../components/docs/ReportHeader.jsx';
import { API_BASE_URL } from './apiBase.js';

const API = API_BASE_URL;

export const REPORT_TEMPLATES = {
  compliance: { title: 'AIP Compliance Report', subtitle: 'School Annual Implementation Plan Submission Status' },
  quarterly: { title: 'PIR Quarterly Report', subtitle: 'Program Implementation Review Quarterly Summary' },
  budget: { title: 'Budget Report', subtitle: 'Program Budgetary Requirements Analysis' },
  workload: { title: 'Personnel Workload Report', subtitle: 'Division Personnel Assignment Summary' },
  accomplishment: { title: 'Accomplishment Rates Report', subtitle: 'School Physical and Financial Accomplishment Rates' },
  factors: { title: 'Factors Analysis Report', subtitle: 'Facilitating and Hindering Factors Analysis' },
  sources: { title: 'Budget Sources Report', subtitle: 'Funding Source Analysis by Program' },
  funnel: { title: 'AIP Status Funnel Report', subtitle: 'Annual Implementation Plan Status Distribution' },
  'cluster-pir': { title: 'Cluster PIR Summary', subtitle: 'Cluster Program Implementation Review Summary' },
  consolidation: { title: 'Consolidated PIR Report', subtitle: 'Division Program Implementation Review Consolidation' },
};

/**
 * html2canvas cannot parse CSS oklch() colors (used by Tailwind v4).
 * Returns a converter that replaces every oklch(...) token in a CSS string
 * with its rgb() equivalent, using a 1×1 canvas as the color engine.
 * Results are cached so repeated identical tokens are free.
 */
function makeOklchConverter() {
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = 1;
  const ctx = cvs.getContext('2d');
  const cache = new Map();

  return (text) => {
    if (!text || !text.includes('oklch')) return text;
    return text.replace(/oklch\([^)]*\)/g, (match) => {
      if (cache.has(match)) return cache.get(match);
      try {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = match;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        const result = a < 255
          ? `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`
          : `rgb(${r},${g},${b})`;
        cache.set(match, result);
        return result;
      } catch { return 'rgb(0,0,0)'; }
    });
  };
}

/**
 * Patches all <style> elements and inline style attributes in a document
 * so that oklch() tokens are replaced with plain rgb() equivalents.
 * Called via html2canvas's onclone callback — the only point where we have
 * access to the cloned document's stylesheets before html2canvas parses them.
 */
function patchOklchInClone(clonedDoc, convert) {
  clonedDoc.querySelectorAll('style').forEach(el => {
    if (el.textContent?.includes('oklch'))
      el.textContent = convert(el.textContent);
  });
  clonedDoc.querySelectorAll('[style]').forEach(el => {
    const s = el.getAttribute('style');
    if (s?.includes('oklch'))
      el.setAttribute('style', convert(s));
  });
}

/**
 * Downloads a report as PDF with formal DepEd header.
 */
export async function downloadReportAsPDF(type, year) {
  const el = document.getElementById('report-content');
  if (!el) return;

  const template = REPORT_TEMPLATES[type] || { title: type, subtitle: '' };

  // Create temporary wrapper
  const wrapper = document.createElement('div');
  wrapper.style.background = 'white';
  wrapper.style.padding = '24px';
  wrapper.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = '1000px';

  // Render React header
  const headerRoot = document.createElement('div');
  wrapper.appendChild(headerRoot);
  const root = createRoot(headerRoot);
  root.render(React.createElement(ReportHeader, {
    reportTitle: template.title,
    reportSubtitle: template.subtitle,
    fiscalYear: year,
  }));

  // Clone and append report content
  const clonedContent = el.cloneNode(true);
  clonedContent.style.marginTop = '16px';
  wrapper.appendChild(clonedContent);

  document.body.appendChild(wrapper);

  // Wait for render
  await new Promise(resolve => setTimeout(resolve, 500));

  const convertOklch = makeOklchConverter();
  const canvas = await html2canvas(wrapper, {
    scale: 1.5,
    useCORS: true,
    width: 1000,
    onclone: (clonedDoc) => patchOklchInClone(clonedDoc, convertOklch),
  });

  // Cleanup
  document.body.removeChild(wrapper);
  root.unmount();

  // Generate PDF
  const imgData = canvas.toDataURL('image/jpeg', 0.85);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = 297;
  const pageH = 210;
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;

  if (imgH <= pageH) {
    pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
  } else {
    let position = 0;
    let remaining = imgH;
    while (remaining > 0) {
      pdf.addImage(imgData, 'JPEG', 0, -position, imgW, imgH);
      remaining -= pageH;
      position += pageH;
      if (remaining > 0) pdf.addPage();
    }
  }

  pdf.save(`${type}-report-${year}.pdf`);
}

/**
 * Downloads a report as CSV.
 */
export function downloadCSV(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
}

/**
 * Downloads a report from the server (xlsx, csv, etc).
 */
export async function downloadServerReport(type, format, year) {
  const ext = format === 'xlsx' ? 'xlsx' : format;
  const url = `${API}/api/admin/reports/${type}/export?format=${format}&year=${year}`;
  const blob = await fetch(url, { credentials: 'include' }).then(r => r.blob());
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${type}-report-${year}.${ext}`;
  a.click();
}

/**
 * Main export handler — routes to PDF or server download.
 */
export async function exportReport(type, format, year) {
  if (format === 'pdf') {
    await downloadReportAsPDF(type, year);
  } else {
    await downloadServerReport(type, format, year);
  }
}
