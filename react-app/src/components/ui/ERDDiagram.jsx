import React, { useState, useEffect, useRef } from 'react';

const MERMAID_TEXT = `erDiagram
    Cluster ||--o{ School : "has"
    School ||--|| User : "has account"
    School ||--o{ AIP : "creates"
    Program ||--o{ AIP : "has"
    User }|--|{ Program : "monitors (Division)"
    School }|--|{ Program : "restricted programs (e.g. ALS)"
    User ||--o{ AIP : "created by"
    User ||--o{ PIR : "created by"
    User ||--o{ Draft : "owns"
    AIP ||--o{ AIPActivity : "includes"
    AIP ||--o{ PIR : "is reviewed in"
    PIR ||--o{ PIRActivityReview : "contains"
    AIPActivity ||--o{ PIRActivityReview : "reviewed as"
    PIR ||--o{ PIRFactor : "reports"`;

let mermaidReady = false;

function DiagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="1" width="4" height="4" rx="1" fill="currentColor" />
      <rect x="11" y="1" width="4" height="4" rx="1" fill="currentColor" />
      <rect x="6" y="11" width="4" height="4" rx="1" fill="currentColor" />
      <line x1="3" y1="5" x2="3" y2="9" stroke="currentColor" strokeWidth="1.5" />
      <line x1="13" y1="5" x2="13" y2="9" stroke="currentColor" strokeWidth="1.5" />
      <line x1="3" y1="9" x2="8" y2="11" stroke="currentColor" strokeWidth="1.5" />
      <line x1="13" y1="9" x2="8" y2="11" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M5 4L1 8L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 4L15 8L11 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ERDDiagram() {
  const [view, setView] = useState('diagram');
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const containerRef = useRef(null);

  useEffect(() => {
    if (view !== 'diagram') return;
    let cancelled = false;

    setStatus('loading');

    import('mermaid').then(({ default: mermaid }) => {
      if (cancelled) return;

      if (!mermaidReady) {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          er: {
            diagramPadding: 24,
            layoutDirection: 'TB',
            minEntityWidth: 100,
            minEntityHeight: 75,
            entityPadding: 15,
            useMaxWidth: true,
          },
        });
        mermaidReady = true;
      }

      return mermaid.render('erd-diagram-main', MERMAID_TEXT);
    }).then(({ svg }) => {
      if (cancelled || !containerRef.current) return;
      containerRef.current.innerHTML = svg;
      // Make the SVG responsive
      const svgEl = containerRef.current.querySelector('svg');
      if (svgEl) {
        svgEl.style.maxWidth = '100%';
        svgEl.style.height = 'auto';
      }
      setStatus('ready');
    }).catch(() => {
      if (!cancelled) setStatus('error');
    });

    return () => { cancelled = true; };
  }, [view]);

  return (
    <div className="not-prose my-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Entity Relationship Diagram</span>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface p-0.5 shadow-sm">
          <button
            onClick={() => setView('diagram')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === 'diagram' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border'
            }`}
          >
            <DiagramIcon /> Diagram
          </button>
          <button
            onClick={() => setView('source')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === 'source' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border'
            }`}
          >
            <CodeIcon /> Source
          </button>
        </div>
      </div>

      {view === 'diagram' ? (
        <div className="p-6 overflow-auto flex justify-center min-h-[200px] items-center">
          {status === 'loading' && (
            <div className="text-slate-400 dark:text-slate-500 text-sm font-medium animate-pulse">Rendering diagram…</div>
          )}
          {status === 'error' && (
            <div className="text-red-400 text-sm font-medium">Failed to render diagram.</div>
          )}
          <div ref={containerRef} className={status === 'ready' ? 'w-full' : 'hidden'} />
        </div>
      ) : (
        <div className="overflow-auto bg-slate-900 p-5">
          <pre className="text-sm font-mono text-slate-200 whitespace-pre leading-relaxed">
            <code>{MERMAID_TEXT}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
