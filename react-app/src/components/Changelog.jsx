import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Tag,
  Calendar,
  Sparkles,
  Bug,
  Zap,
  AlertTriangle,
  FileText,
  Shield,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  BookOpen,
} from 'lucide-react';
import { CURRENT_VERSION, getChangelog } from '../version';

const TYPE_CONFIG = {
  feature: {
    label: 'Feature',
    icon: Sparkles,
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  fix: {
    label: 'Bug Fix',
    icon: Bug,
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  improvement: {
    label: 'Improvement',
    icon: Zap,
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  breaking: {
    label: 'Breaking Change',
    icon: AlertTriangle,
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  docs: {
    label: 'Documentation',
    icon: FileText,
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  security: {
    label: 'Security',
    icon: Shield,
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
};

const TypeBadge = ({ type }) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.feature;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon size={12} strokeWidth={2.5} />
      {config.label}
    </span>
  );
};

const ReleaseCard = ({ release, isLatest }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedVersion, setCopiedVersion] = useState(false);

  // Group changes by type
  const grouped = {};
  (release.changes || []).forEach((c) => {
    if (!grouped[c.type]) grouped[c.type] = [];
    grouped[c.type].push(c);
  });

  const typeOrder = ['breaking', 'feature', 'improvement', 'fix', 'security', 'docs'];
  const sortedTypes = typeOrder.filter((t) => grouped[t]);

  const handleCopyVersion = () => {
    navigator.clipboard.writeText(release.version);
    setCopiedVersion(true);
    setTimeout(() => setCopiedVersion(false), 2000);
  };

  const formattedDate = new Date(release.date + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative group">
      {/* Timeline connector */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200 group-last:hidden hidden md:block" />

      <div className="flex gap-6">
        {/* Timeline dot */}
        <div className="hidden md:flex flex-col items-center pt-6 z-10 shrink-0">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-sm transition-all duration-300 ${
              isLatest
                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 shadow-emerald-100'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            <Tag size={20} strokeWidth={2.5} />
          </div>
        </div>

        {/* Release content */}
        <div className="flex-1 min-w-0">
          <div
            className={`bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg ${
              isLatest ? 'border-emerald-200 shadow-md shadow-emerald-50' : 'border-slate-200 shadow-sm'
            }`}
          >
            {/* Release header */}
            <div
              className="px-6 py-5 cursor-pointer flex items-start justify-between gap-4"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {release.title || `v${release.version}`}
                  </h3>
                  {isLatest && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                      Latest
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyVersion();
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono font-bold text-xs hover:bg-slate-200 transition-colors border border-slate-200"
                    title="Copy version"
                  >
                    <GitBranch size={12} strokeWidth={2.5} />
                    v{release.version}
                    {copiedVersion ? (
                      <Check size={12} className="text-emerald-500" />
                    ) : (
                      <Copy size={12} className="text-slate-400" />
                    )}
                  </button>
                  <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                    <Calendar size={12} />
                    {formattedDate}
                  </span>
                  <span className="text-slate-300 text-xs">•</span>
                  <span className="text-slate-400 text-xs font-medium">
                    {release.changes?.length || 0} changes
                  </span>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600 transition-colors mt-1 shrink-0">
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            {/* Release body */}
            {isExpanded && (
              <div className="border-t border-slate-100">
                {/* Description */}
                {release.description && (
                  <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{release.description}</p>
                  </div>
                )}

                {/* Changes grouped by type */}
                <div className="px-6 py-5 space-y-6">
                  {sortedTypes.map((type) => {
                    const config = TYPE_CONFIG[type] || TYPE_CONFIG.feature;
                    return (
                      <div key={type}>
                        <div className="flex items-center gap-2 mb-3">
                          <TypeBadge type={type} />
                          <span className="text-xs text-slate-400 font-bold">({grouped[type].length})</span>
                        </div>
                        <ul className="space-y-2 ml-1">
                          {grouped[type].map((change, idx) => (
                            <li key={idx} className="flex items-start gap-3 group/item">
                              <div
                                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${config.dot} opacity-60 group-hover/item:opacity-100 transition-opacity`}
                              />
                              <span className="text-sm text-slate-700 leading-relaxed font-medium">{change.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Changelog = () => {
  const changelog = getChangelog();
  const [filterType, setFilterType] = useState(null);

  // Collect all unique change types across all releases
  const allTypes = [...new Set(changelog.flatMap((r) => (r.changes || []).map((c) => c.type)))];

  // Filter releases: show only releases that contain changes of the selected type
  const filteredChangelog = filterType
    ? changelog
        .map((r) => ({
          ...r,
          changes: (r.changes || []).filter((c) => c.type === filterType),
        }))
        .filter((r) => r.changes.length > 0)
    : changelog;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-700 transition-all"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Changelog</h1>
              <p className="text-xs text-slate-400 font-medium">Release history & version notes</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200">
            <Tag size={12} strokeWidth={3} />
            v{CURRENT_VERSION}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* System info banner */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BookOpen size={20} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">AIP-PIR Portal</h2>
                <p className="text-slate-400 text-xs font-medium">System Documentation & Release Notes</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
              This changelog tracks all major changes, new features, bug fixes, and improvements made to the
              AIP-PIR Management System. Only significant updates are documented here — minor cosmetic adjustments
              are excluded.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400 font-mono">
              <span className="px-2 py-1 bg-white/5 rounded-md border border-white/10">React 19 + Vite</span>
              <span className="px-2 py-1 bg-white/5 rounded-md border border-white/10">Tailwind CSS v4</span>
              <span className="px-2 py-1 bg-white/5 rounded-md border border-white/10">Deno Runtime</span>
              <span className="px-2 py-1 bg-white/5 rounded-md border border-white/10">PostgreSQL + Prisma</span>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
          <button
            onClick={() => setFilterType(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              !filterType
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            All
          </button>
          {allTypes.map((type) => {
            const config = TYPE_CONFIG[type];
            if (!config) return null;
            return (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? null : type)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  filterType === type
                    ? `${config.bg} ${config.text} ${config.border}`
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Releases timeline */}
        <div className="space-y-8">
          {filteredChangelog.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Tag size={28} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold text-sm">No releases match the current filter.</p>
            </div>
          ) : (
            filteredChangelog.map((release, idx) => (
              <ReleaseCard key={release.version} release={release} isLatest={idx === 0} />
            ))
          )}
        </div>

        {/* Footer note */}
        <div className="text-center mt-12 mb-8">
          <p className="text-xs text-slate-400 font-medium">
            End of changelog • {changelog.length} release{changelog.length !== 1 ? 's' : ''} documented
          </p>
        </div>
      </div>
    </div>
  );
};

export default Changelog;
