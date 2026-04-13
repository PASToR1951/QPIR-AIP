import React from 'react';
import { HEADER_H, ROW_H } from './layout.js';

export function ModelCard({ model, x, y, w, h }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={2} y={2} width={w} height={h} rx={10} fill="#0f172a" opacity={0.06} />
      <rect width={w} height={h} rx={10} fill="#fff" stroke="#e2e8f0" />
      <rect width={w} height={HEADER_H} rx={10} fill={model.color} />
      <rect y={HEADER_H - 10} width={w} height={10} fill={model.color} />
      <text x={12} y={23} fontSize={13} fontWeight={700} fill="#fff" fontFamily="system-ui, sans-serif">{model.name}</text>
      {model.table && (
        <text x={w - 8} y={23} fontSize={9} fill="rgba(255,255,255,0.7)" fontFamily="ui-monospace, monospace" textAnchor="end">{model.table}</text>
      )}

      {model.fields.map((field, index) => {
        const fieldY = HEADER_H + 4 + index * ROW_H;
        return (
          <g key={field.name} transform={`translate(0, ${fieldY})`}>
            {index % 2 === 0 && <rect x={1} width={w - 2} height={ROW_H} fill="#f8fafc" />}
            {field.pk && (
              <g transform="translate(8, 4)">
                <rect width={18} height={14} rx={3} fill="#fef3c7" stroke="#f59e0b" />
                <text x={9} y={10.5} textAnchor="middle" fontSize={8} fontWeight={700} fill="#92400e" fontFamily="ui-monospace, monospace">PK</text>
              </g>
            )}
            {field.fk && !field.pk && (
              <g transform="translate(8, 4)">
                <rect width={18} height={14} rx={3} fill="#dbeafe" stroke="#3b82f6" />
                <text x={9} y={10.5} textAnchor="middle" fontSize={8} fontWeight={700} fill="#1e40af" fontFamily="ui-monospace, monospace">FK</text>
              </g>
            )}
            <text x={field.pk || field.fk ? 32 : 12} y={14} fontSize={11} fill="#1e293b" fontFamily="system-ui, sans-serif" fontWeight={field.pk ? 600 : 400}>{field.name}</text>
            <text x={w - 8} y={14} textAnchor="end" fontSize={10} fill="#94a3b8" fontFamily="ui-monospace, monospace">{field.type}</text>
            {field.unique && !field.pk && (
              <g transform={`translate(${w - 8 - field.type.length * 6 - 28}, 4)`}>
                <rect width={22} height={14} rx={3} fill="#f0fdf4" stroke="#22c55e" />
                <text x={11} y={10.5} textAnchor="middle" fontSize={7} fontWeight={700} fill="#166534" fontFamily="ui-monospace, monospace">UQ</text>
              </g>
            )}
          </g>
        );
      })}

      <rect y={h - 1} width={w} height={1} rx={0} fill="#e2e8f0" />
    </g>
  );
}
