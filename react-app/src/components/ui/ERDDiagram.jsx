import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MagnifyingGlassPlus, MagnifyingGlassMinus, ArrowsOut, X } from '@phosphor-icons/react';

// ── Schema data derived from Prisma schema ──────────────────────────────────

const MODELS = [
  {
    name: 'Cluster',
    table: 'clusters',
    color: '#6366f1',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'cluster_number', type: 'Int', unique: true },
      { name: 'name', type: 'String' },
    ],
  },
  {
    name: 'School',
    table: 'schools',
    color: '#0ea5e9',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'name', type: 'String' },
      { name: 'level', type: 'String' },
      { name: 'cluster_id', type: 'Int', fk: true },
    ],
  },
  {
    name: 'Program',
    table: 'programs',
    color: '#8b5cf6',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'title', type: 'String', unique: true },
      { name: 'school_level_requirement', type: 'String' },
    ],
  },
  {
    name: 'User',
    table: 'users',
    color: '#f59e0b',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'email', type: 'String', unique: true },
      { name: 'password', type: 'String' },
      { name: 'role', type: 'String' },
      { name: 'name', type: 'String?' },
      { name: 'first_name', type: 'String?' },
      { name: 'middle_initial', type: 'String?' },
      { name: 'last_name', type: 'String?' },
      { name: 'school_id', type: 'Int?', fk: true, unique: true },
      { name: 'created_at', type: 'DateTime' },
    ],
  },
  {
    name: 'AIP',
    table: 'aips',
    color: '#10b981',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'school_id', type: 'Int?', fk: true },
      { name: 'program_id', type: 'Int', fk: true },
      { name: 'created_by_user_id', type: 'Int?', fk: true },
      { name: 'year', type: 'Int' },
      { name: 'outcome', type: 'String' },
      { name: 'sip_title', type: 'String' },
      { name: 'project_coordinator', type: 'String' },
      { name: 'objectives', type: 'Json' },
      { name: 'indicators', type: 'Json' },
      { name: 'created_at', type: 'DateTime' },
    ],
  },
  {
    name: 'AIPActivity',
    table: 'aip_activities',
    color: '#14b8a6',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'aip_id', type: 'Int', fk: true },
      { name: 'phase', type: 'String' },
      { name: 'activity_name', type: 'String' },
      { name: 'budget_amount', type: 'Decimal' },
      { name: 'budget_source', type: 'String' },
    ],
  },
  {
    name: 'PIR',
    table: 'pirs',
    color: '#ef4444',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'aip_id', type: 'Int', fk: true },
      { name: 'created_by_user_id', type: 'Int?', fk: true },
      { name: 'quarter', type: 'String' },
      { name: 'total_budget', type: 'Decimal' },
      { name: 'created_at', type: 'DateTime' },
    ],
  },
  {
    name: 'PIRActivityReview',
    table: 'pir_activity_reviews',
    color: '#f97316',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'pir_id', type: 'Int', fk: true },
      { name: 'aip_activity_id', type: 'Int', fk: true },
      { name: 'physical_target', type: 'Decimal' },
      { name: 'financial_target', type: 'Decimal' },
      { name: 'physical_accomplished', type: 'Decimal' },
      { name: 'financial_accomplished', type: 'Decimal' },
    ],
  },
  {
    name: 'PIRFactor',
    table: 'pir_factors',
    color: '#ec4899',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'pir_id', type: 'Int', fk: true },
      { name: 'factor_type', type: 'String' },
      { name: 'facilitating_factors', type: 'String' },
      { name: 'hindering_factors', type: 'String' },
    ],
  },
  {
    name: 'Deadline',
    table: 'deadlines',
    color: '#64748b',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'year', type: 'Int' },
      { name: 'quarter', type: 'Int' },
      { name: 'date', type: 'DateTime' },
    ],
  },
];

const RELATIONS = [
  { from: 'Cluster', to: 'School', type: '1:N', label: 'has' },
  { from: 'School', to: 'User', type: '1:1', label: 'account' },
  { from: 'School', to: 'AIP', type: '1:N', label: 'creates' },
  { from: 'Program', to: 'AIP', type: '1:N', label: 'has' },
  { from: 'User', to: 'Program', type: 'M:N', label: 'monitors' },
  { from: 'School', to: 'Program', type: 'M:N', label: 'restricted' },
  { from: 'User', to: 'AIP', type: '1:N', label: 'created by' },
  { from: 'User', to: 'PIR', type: '1:N', label: 'created by' },
  { from: 'AIP', to: 'AIPActivity', type: '1:N', label: 'includes' },
  { from: 'AIP', to: 'PIR', type: '1:N', label: 'reviewed in' },
  { from: 'PIR', to: 'PIRActivityReview', type: '1:N', label: 'contains' },
  { from: 'AIPActivity', to: 'PIRActivityReview', type: '1:N', label: 'reviewed as' },
  { from: 'PIR', to: 'PIRFactor', type: '1:N', label: 'reports' },
];

// ── Layout positions (hand-tuned for readability) ───────────────────────────

const CARD_W = 230;
const HEADER_H = 36;
const ROW_H = 22;
const GAP_X = 80;
const GAP_Y = 70;

function cardHeight(model) {
  return HEADER_H + model.fields.length * ROW_H + 8;
}

// ── Layout: strict 4-column top-down hierarchy ───────────────────────────────
//
//   Col 0      Col 1        Col 2       Col 3
//   ─────────  ───────────  ──────────  ────────
//   Cluster    School       Program
//   User       AIP
//              AIPActivity  PIR         Deadline
//              PIRActRev    PIRFactor
//
// Data flows cleanly downward: organisational tier → plan tier → review tier.
// Relationship lines stay within adjacent columns — no major crossings.
const LAYOUT = {
  Cluster:           { col: 0, row: 0 },
  User:              { col: 0, row: 1 },
  School:            { col: 1, row: 0 },
  AIP:               { col: 1, row: 1 },
  AIPActivity:       { col: 1, row: 2 },
  PIRActivityReview: { col: 1, row: 3 },
  Program:           { col: 2, row: 0 },
  PIR:               { col: 2, row: 2 },
  PIRFactor:         { col: 2, row: 3 },
  Deadline:          { col: 3, row: 2 },
};

function computePositions() {
  // Compute max row heights
  const rowHeights = {};
  for (const model of MODELS) {
    const l = LAYOUT[model.name];
    const h = cardHeight(model);
    rowHeights[l.row] = Math.max(rowHeights[l.row] || 0, h);
  }

  const positions = {};
  for (const model of MODELS) {
    const l = LAYOUT[model.name];
    let y = 20;
    for (let r = 0; r < l.row; r++) {
      y += (rowHeights[r] || 0) + GAP_Y;
    }
    positions[model.name] = {
      x: 20 + l.col * (CARD_W + GAP_X),
      y,
      w: CARD_W,
      h: cardHeight(model),
    };
  }
  return positions;
}

// ── Relationship line helpers ────────────────────────────────────────────────

// Returns the point where a line from rect-centre toward (tx,ty) exits the
// rect boundary, plus which edge it exits from.
function getEdgePoint(rect, tx, ty) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  const hw = rect.w / 2;
  const hh = rect.h / 2;
  if (dx === 0 && dy === 0) return { x: cx, y: cy, edge: 'none' };
  const sx = hw / (Math.abs(dx) || 1);
  const sy = hh / (Math.abs(dy) || 1);
  const edge = sx <= sy
    ? (dx > 0 ? 'right' : 'left')
    : (dy > 0 ? 'bottom' : 'top');
  const s = Math.min(sx, sy);
  return { x: cx + dx * s, y: cy + dy * s, edge };
}

// Bezier control-point delta: extend perpendicular to the card face.
function ctrlDelta(edge, dist) {
  if (edge === 'right')  return [dist, 0];
  if (edge === 'left')   return [-dist, 0];
  if (edge === 'bottom') return [0, dist];
  if (edge === 'top')    return [0, -dist];
  return [0, 0];
}

// Point at parameter t on a cubic bezier.
function bezierAt(t, x0, y0, cx1, cy1, cx2, cy2, x1, y1) {
  const m = 1 - t;
  return {
    x: m*m*m*x0 + 3*m*m*t*cx1 + 3*m*t*t*cx2 + t*t*t*x1,
    y: m*m*m*y0 + 3*m*m*t*cy1 + 3*m*t*t*cy2 + t*t*t*y1,
  };
}

function RelationshipLine({ from, to, type, label, positions }) {
  const fromRect = positions[from];
  const toRect   = positions[to];
  if (!fromRect || !toRect) return null;

  const toCx   = toRect.x   + toRect.w   / 2;
  const toCy   = toRect.y   + toRect.h   / 2;
  const fromCx = fromRect.x + fromRect.w / 2;
  const fromCy = fromRect.y + fromRect.h / 2;

  const start = getEdgePoint(fromRect, toCx,   toCy);
  const end   = getEdgePoint(toRect,   fromCx, fromCy);

  // Control-point reach scales with line length so short lines stay tight.
  const len  = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
  const ctrl = Math.min(90, Math.max(48, len * 0.32));

  const [c1dx, c1dy] = ctrlDelta(start.edge, ctrl);
  const [c2dx, c2dy] = ctrlDelta(end.edge,   ctrl);

  const c1x = start.x + c1dx;
  const c1y = start.y + c1dy;
  const c2x = end.x   + c2dx;
  const c2y = end.y   + c2dy;

  // Label: evaluate the bezier at t=0.2 (near the source card).
  const lp = bezierAt(0.2, start.x, start.y, c1x, c1y, c2x, c2y, end.x, end.y);

  // Tangent at t=0.2 for perpendicular lift.
  const lp2 = bezierAt(0.22, start.x, start.y, c1x, c1y, c2x, c2y, end.x, end.y);
  const tdx = lp2.x - lp.x;
  const tdy = lp2.y - lp.y;
  const tlen = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
  // Perpendicular unit vector — always toward upper/left canvas half.
  let px = -tdy / tlen;
  let py =  tdx / tlen;
  if (py > 0) { px = -px; py = -py; }
  const LIFT = 11;
  const labelX = lp.x + px * LIFT;
  const labelY = lp.y + py * LIFT;

  const pathD = `M ${start.x},${start.y} C ${c1x},${c1y} ${c2x},${c2y} ${end.x},${end.y}`;

  const fromMarker = type === 'M:N' ? 'url(#crow)' : '';
  const toMarker   = type === '1:1' ? 'url(#one)'
                   : (type === '1:N' || type === 'M:N') ? 'url(#crow)' : '';

  return (
    <g>
      {/* Invisible wider hit-area so thin curves are easier to see */}
      <path d={pathD} fill="none" stroke="transparent" strokeWidth={8} />
      <path
        d={pathD} fill="none"
        stroke="#cbd5e1" strokeWidth={1.2}
        markerStart={fromMarker} markerEnd={toMarker}
      />
      {label && (
        <g transform={`translate(${labelX},${labelY})`}>
          <rect
            x={-label.length * 3.1 - 5} y={-8}
            width={label.length * 6.2 + 10} height={15}
            rx={3} fill="rgba(248,250,252,0.96)"
          />
          <text
            textAnchor="middle" dominantBaseline="central"
            fontSize={9} fill="#94a3b8" fontStyle="italic" fontWeight={600}
            fontFamily="system-ui, sans-serif"
          >{label}</text>
        </g>
      )}
    </g>
  );
}

// ── Model card ──────────────────────────────────────────────────────────────

function ModelCard({ model, x, y, w, h }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <rect x={2} y={2} width={w} height={h} rx={10} fill="#0f172a" opacity={0.06} />
      {/* Card body */}
      <rect width={w} height={h} rx={10} fill="#fff" stroke="#e2e8f0" />
      {/* Header */}
      <rect width={w} height={HEADER_H} rx={10} fill={model.color} />
      <rect y={HEADER_H - 10} width={w} height={10} fill={model.color} />
      <text x={12} y={23} fontSize={13} fontWeight={700} fill="#fff" fontFamily="system-ui, sans-serif">{model.name}</text>
      {model.table && (
        <text x={w - 8} y={23} fontSize={9} fill="rgba(255,255,255,0.7)" fontFamily="ui-monospace, monospace" textAnchor="end">{model.table}</text>
      )}

      {/* Fields */}
      {model.fields.map((field, i) => {
        const fy = HEADER_H + 4 + i * ROW_H;
        return (
          <g key={field.name} transform={`translate(0, ${fy})`}>
            {i % 2 === 0 && <rect x={1} width={w - 2} height={ROW_H} fill="#f8fafc" />}
            {/* PK/FK badge */}
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

      {/* Bottom border radius cover */}
      <rect y={h - 1} width={w} height={1} rx={0} fill="#e2e8f0" />
    </g>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function ERDDiagram() {
  const [view, setView] = useState('diagram');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Pan & zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const positions = computePositions();

  // Compute SVG viewBox bounds
  let maxX = 0, maxY = 0;
  for (const model of MODELS) {
    const p = positions[model.name];
    maxX = Math.max(maxX, p.x + p.w + 40);
    maxY = Math.max(maxY, p.y + p.h + 40);
  }

  // Fit to container on mount, view change, or fullscreen toggle
  useEffect(() => {
    if (view !== 'diagram') return;
    // rAF lets the DOM settle (especially when the fullscreen modal just mounted)
    const id = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight || 500;
      const s = Math.min(cw / maxX, ch / maxY, 1) * 0.95;
      setTransform({ x: (cw - maxX * s) / 2, y: 10, scale: s });
    });
    return () => cancelAnimationFrame(id);
  }, [view, isFullscreen]);

  // Close fullscreen on Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(t => {
      const newScale = Math.min(Math.max(t.scale * delta, 0.3), 2.5);
      const rect = containerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      return {
        scale: newScale,
        x: mx - (mx - t.x) * (newScale / t.scale),
        y: my - (my - t.y) * (newScale / t.scale),
      };
    });
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [transform]);

  const handlePointerMove = useCallback((e) => {
    if (!isPanning) return;
    setTransform(t => ({
      ...t,
      x: panStart.current.tx + (e.clientX - panStart.current.x),
      y: panStart.current.ty + (e.clientY - panStart.current.y),
    }));
  }, [isPanning]);

  const handlePointerUp = useCallback(() => setIsPanning(false), []);

  const resetView = () => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight || 500;
    const s = Math.min(cw / maxX, ch / maxY, 1) * 0.95;
    setTransform({ x: (cw - maxX * s) / 2, y: 10, scale: s });
  };

  const zoomBy = (factor) => {
    if (!containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const cx = cw / 2;
    const cy = ch / 2;
    setTransform(t => {
      const newScale = Math.min(Math.max(t.scale * factor, 0.3), 2.5);
      return {
        scale: newScale,
        x: cx - (cx - t.x) * (newScale / t.scale),
        y: cy - (cy - t.y) * (newScale / t.scale),
      };
    });
  };

  // Source view text
  const sourceText = MODELS.map(m => {
    const fields = m.fields.map(f => {
      const badges = [f.pk && '@id', f.fk && '@fk', f.unique && '@unique'].filter(Boolean).join(' ');
      return `  ${f.name.padEnd(24)} ${f.type}${badges ? '  ' + badges : ''}`;
    }).join('\n');
    return `model ${m.name} {\n${fields}\n}`;
  }).join('\n\n');

  return (
    <div className="not-prose my-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Entity Relationship Diagram</span>
        <div className="flex items-center gap-2">
          {view === 'diagram' && (
            <div className="flex items-center gap-1">
              <button onClick={() => zoomBy(1.25)} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border transition-all" title="Zoom in">
                <MagnifyingGlassPlus size={15} weight="bold" />
              </button>
              <button onClick={() => zoomBy(0.8)} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border transition-all" title="Zoom out">
                <MagnifyingGlassMinus size={15} weight="bold" />
              </button>
              <button onClick={resetView} className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border transition-all" title="Reset zoom">
                Reset
              </button>
              <button onClick={() => setIsFullscreen(true)} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border transition-all" title="Fullscreen">
                <ArrowsOut size={15} weight="bold" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface p-0.5 shadow-sm">
            <button
              onClick={() => setView('diagram')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                view === 'diagram' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border'
              }`}
            >
              Diagram
            </button>
            <button
              onClick={() => setView('source')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                view === 'source' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border'
              }`}
            >
              Schema
            </button>
          </div>
        </div>
      </div>

      {view === 'diagram' ? (
        <div
          ref={isFullscreen ? null : containerRef}
          className="relative overflow-hidden bg-[#fafbfc] dark:bg-dark-base"
          style={{ height: 560, cursor: isPanning ? 'grabbing' : 'grab', userSelect: 'none', WebkitUserSelect: 'none' }}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.35]" style={{
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />

          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0 }}
          >
            <defs>
              {/* Crow's foot marker */}
              <marker id="crow" viewBox="0 0 12 12" refX={12} refY={6} markerWidth={10} markerHeight={10} orient="auto-start-reverse">
                <path d="M0,6 L12,0 M0,6 L12,12 M0,6 L12,6" stroke="#94a3b8" fill="none" />
              </marker>
              <marker id="one" viewBox="0 0 12 12" refX={12} refY={6} markerWidth={10} markerHeight={10} orient="auto-start-reverse">
                <line x1={10} y1={0} x2={10} y2={12} stroke="#94a3b8" />
              </marker>
            </defs>

            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
              {/* Relations (behind cards) */}
              {RELATIONS.map((rel, i) => (
                <RelationshipLine key={i} {...rel} positions={positions} />
              ))}

              {/* Model cards */}
              {MODELS.map(model => {
                const p = positions[model.name];
                return <ModelCard key={model.name} model={model} x={p.x} y={p.y} w={p.w} h={p.h} />;
              })}
            </g>
          </svg>

          {/* Zoom indicator */}
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-white/80 dark:bg-dark-surface/80 border border-slate-200 dark:border-dark-border text-[10px] font-mono text-slate-400 dark:text-slate-500 backdrop-blur-sm">
            {Math.round(transform.scale * 100)}%
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-dark-surface/80 border border-slate-200 dark:border-dark-border backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-3 rounded bg-[#fef3c7] border border-[#f59e0b]" style={{ fontSize: 0 }} />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">PK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-3 rounded bg-[#dbeafe] border border-[#3b82f6]" style={{ fontSize: 0 }} />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">FK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-3 rounded bg-[#f0fdf4] border border-[#22c55e]" style={{ fontSize: 0 }} />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Unique</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Scroll to zoom &middot; Drag to pan</span>
          </div>
        </div>
      ) : (
        <div className="overflow-auto bg-slate-900 dark:bg-slate-950 p-5 max-h-[560px]">
          <pre className="text-sm font-mono text-slate-200 whitespace-pre leading-relaxed">
            <code>{sourceText}</code>
          </pre>
        </div>
      )}

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-dark-base">
          {/* Fullscreen toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface shrink-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Entity Relationship Diagram</span>
            <div className="flex items-center gap-1">
              <button onClick={() => zoomBy(1.25)} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border transition-all" title="Zoom in">
                <MagnifyingGlassPlus size={15} weight="bold" />
              </button>
              <button onClick={() => zoomBy(0.8)} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border transition-all" title="Zoom out">
                <MagnifyingGlassMinus size={15} weight="bold" />
              </button>
              <button onClick={resetView} className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border transition-all mr-2" title="Reset zoom">
                Reset
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border transition-all"
                title="Exit fullscreen (Esc)"
              >
                <X size={14} weight="bold" /> Exit
              </button>
            </div>
          </div>

          {/* Fullscreen canvas */}
          <div
            ref={containerRef}
            className="relative flex-1 overflow-hidden bg-[#fafbfc] dark:bg-dark-base"
            style={{ cursor: isPanning ? 'grabbing' : 'grab', userSelect: 'none', WebkitUserSelect: 'none' }}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div className="absolute inset-0 opacity-[0.35]" style={{
              backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />
            <svg ref={svgRef} width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
                {RELATIONS.map((rel, i) => (
                  <RelationshipLine key={i} {...rel} positions={positions} />
                ))}
                {MODELS.map(model => {
                  const p = positions[model.name];
                  return <ModelCard key={model.name} model={model} x={p.x} y={p.y} w={p.w} h={p.h} />;
                })}
              </g>
            </svg>

            {/* Zoom indicator */}
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-white/80 dark:bg-dark-surface/80 border border-slate-200 dark:border-dark-border text-[10px] font-mono text-slate-400 dark:text-slate-500 backdrop-blur-sm">
              {Math.round(transform.scale * 100)}%
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-dark-surface/80 border border-slate-200 dark:border-dark-border backdrop-blur-sm">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-3 rounded bg-[#fef3c7] border border-[#f59e0b]" style={{ fontSize: 0 }} />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">PK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-3 rounded bg-[#dbeafe] border border-[#3b82f6]" style={{ fontSize: 0 }} />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">FK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-3 rounded bg-[#f0fdf4] border border-[#22c55e]" style={{ fontSize: 0 }} />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Unique</span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Scroll to zoom &middot; Drag to pan &middot; Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
