import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MagnifyingGlassPlus, MagnifyingGlassMinus, ArrowsOut, X } from '@phosphor-icons/react';
import { DiagramViewport } from './erd/DiagramViewport.jsx';
import { computePositions, computeViewBounds } from './erd/layout.js';
import { buildSchemaSourceText } from './erd/schemaData.js';

// ── Main component ──────────────────────────────────────────────────────────

export default function ERDDiagram() {
  const [view, setView] = useState('diagram');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Pan & zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const positions = computePositions();
  const { maxX, maxY } = computeViewBounds(positions);

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
  }, [view, isFullscreen, maxX, maxY]);

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

  const sourceText = buildSchemaSourceText();

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
        <DiagramViewport
          containerRef={isFullscreen ? null : containerRef}
          isPanning={isPanning}
          transform={transform}
          handleWheel={handleWheel}
          handlePointerDown={handlePointerDown}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
          positions={positions}
          height={560}
        />
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
          <DiagramViewport
            containerRef={containerRef}
            isPanning={isPanning}
            transform={transform}
            handleWheel={handleWheel}
            handlePointerDown={handlePointerDown}
            handlePointerMove={handlePointerMove}
            handlePointerUp={handlePointerUp}
            positions={positions}
            height="100%"
            showEscHint
          />
        </div>
      )}
    </div>
  );
}
