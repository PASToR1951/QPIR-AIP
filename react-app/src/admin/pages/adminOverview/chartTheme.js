import { useEffect, useState } from 'react';

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.08 },
  }),
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export const CHART_COLORS = ['#E94560', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'];
export const BAR_COLORS = { Submitted: '#3b82f6', Approved: '#10b981', 'Under Review': '#f59e0b', Returned: '#E94560' };
export const PIR_QUARTERLY_KEYS = ['Submitted', 'Approved', 'Under Review', 'Returned'];
export const DIVISION_COLORS = { SGOD: '#6366f1', CID: '#10b981', OSDS: '#f59e0b' };
export const DIVISION_KEYS = ['SGOD', 'CID', 'OSDS'];

export function useIsDark() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export function getNivoTheme(isDark) {
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#413D37' : '#e2e8f0';
  const tooltipBg = isDark ? '#262421' : '#ffffff';
  const tooltipBorder = isDark ? '#413D37' : '#e2e8f0';
  return {
    background: 'transparent',
    text: { fontSize: 11, fontWeight: 700, fill: textColor },
    grid: { line: { stroke: gridColor, strokeWidth: 1 } },
    axis: {
      ticks: {
        line: { stroke: gridColor, strokeWidth: 1 },
        text: { fill: textColor, fontSize: 11, fontWeight: 700 },
      },
      legend: { text: { fill: textColor } },
    },
    legends: { text: { fill: textColor, fontSize: 11, fontWeight: 700 } },
    tooltip: {
      container: {
        background: tooltipBg,
        color: isDark ? '#e2e8f0' : '#1e293b',
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 10,
        border: `1px solid ${tooltipBorder}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        padding: '8px 12px',
      },
    },
  };
}
