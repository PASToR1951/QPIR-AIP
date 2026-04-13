import React from 'react';
import { bezierAt, ctrlDelta, getEdgePoint } from './layout.js';

export function RelationshipLine({ from, to, type, label, positions }) {
  const fromRect = positions[from];
  const toRect = positions[to];
  if (!fromRect || !toRect) return null;

  const toCx = toRect.x + toRect.w / 2;
  const toCy = toRect.y + toRect.h / 2;
  const fromCx = fromRect.x + fromRect.w / 2;
  const fromCy = fromRect.y + fromRect.h / 2;

  const start = getEdgePoint(fromRect, toCx, toCy);
  const end = getEdgePoint(toRect, fromCx, fromCy);

  const length = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
  const ctrl = Math.min(90, Math.max(48, length * 0.32));

  const [c1dx, c1dy] = ctrlDelta(start.edge, ctrl);
  const [c2dx, c2dy] = ctrlDelta(end.edge, ctrl);

  const c1x = start.x + c1dx;
  const c1y = start.y + c1dy;
  const c2x = end.x + c2dx;
  const c2y = end.y + c2dy;

  const labelPoint = bezierAt(0.2, start.x, start.y, c1x, c1y, c2x, c2y, end.x, end.y);
  const labelPoint2 = bezierAt(0.22, start.x, start.y, c1x, c1y, c2x, c2y, end.x, end.y);
  const tdx = labelPoint2.x - labelPoint.x;
  const tdy = labelPoint2.y - labelPoint.y;
  const tangentLength = Math.sqrt(tdx * tdx + tdy * tdy) || 1;

  let px = -tdy / tangentLength;
  let py = tdx / tangentLength;
  if (py > 0) {
    px = -px;
    py = -py;
  }

  const lift = 11;
  const labelX = labelPoint.x + px * lift;
  const labelY = labelPoint.y + py * lift;
  const pathD = `M ${start.x},${start.y} C ${c1x},${c1y} ${c2x},${c2y} ${end.x},${end.y}`;

  const fromMarker = type === 'M:N' ? 'url(#crow)' : '';
  const toMarker = type === '1:1'
    ? 'url(#one)'
    : (type === '1:N' || type === 'M:N') ? 'url(#crow)' : '';

  return (
    <g>
      <path d={pathD} fill="none" stroke="transparent" strokeWidth={8} />
      <path
        d={pathD}
        fill="none"
        stroke="#cbd5e1"
        strokeWidth={1.2}
        markerStart={fromMarker}
        markerEnd={toMarker}
      />
      {label && (
        <g transform={`translate(${labelX},${labelY})`}>
          <rect
            x={-label.length * 3.1 - 5}
            y={-8}
            width={label.length * 6.2 + 10}
            height={15}
            rx={3}
            fill="rgba(248,250,252,0.96)"
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={9}
            fill="#94a3b8"
            fontStyle="italic"
            fontWeight={600}
            fontFamily="system-ui, sans-serif"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}
