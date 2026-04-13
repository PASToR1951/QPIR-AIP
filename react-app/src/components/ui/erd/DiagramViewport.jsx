import React from 'react';
import { ModelCard } from './ModelCard.jsx';
import { RelationshipLine } from './RelationshipLine.jsx';
import { MODELS, RELATIONS } from './schemaData.js';

export function DiagramViewport({
  containerRef,
  isPanning,
  transform,
  handleWheel,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  positions,
  height,
  showEscHint = false,
}) {
  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden bg-[#fafbfc] dark:bg-dark-base"
      style={{ height, cursor: isPanning ? 'grabbing' : 'grab', userSelect: 'none', WebkitUserSelect: 'none' }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <marker id="crow" viewBox="0 0 12 12" refX={12} refY={6} markerWidth={10} markerHeight={10} orient="auto-start-reverse">
            <path d="M0,6 L12,0 M0,6 L12,12 M0,6 L12,6" stroke="#94a3b8" fill="none" />
          </marker>
          <marker id="one" viewBox="0 0 12 12" refX={12} refY={6} markerWidth={10} markerHeight={10} orient="auto-start-reverse">
            <line x1={10} y1={0} x2={10} y2={12} stroke="#94a3b8" />
          </marker>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {RELATIONS.map((relation, index) => (
            <RelationshipLine key={index} {...relation} positions={positions} />
          ))}
          {MODELS.map((model) => {
            const position = positions[model.name];
            return <ModelCard key={model.name} model={model} x={position.x} y={position.y} w={position.w} h={position.h} />;
          })}
        </g>
      </svg>

      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-white/80 dark:bg-dark-surface/80 border border-slate-200 dark:border-dark-border text-[10px] font-mono text-slate-400 dark:text-slate-500 backdrop-blur-sm">
        {Math.round(transform.scale * 100)}%
      </div>

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
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          Scroll to zoom &middot; Drag to pan{showEscHint ? ' &middot; Esc to close' : ''}
        </span>
      </div>
    </div>
  );
}
