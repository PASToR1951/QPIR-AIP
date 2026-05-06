import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

import {
  ArrowLeft,
  Tag,
  Calendar,
  Sparkle as Sparkles,
  Bug,
  Lightning as Zap,
  Warning as AlertTriangle,
  FileText,
  Shield,
  GitBranch,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
  Copy,
  CheckCircle as Check,
  BookOpen,
  InfoIcon as Info,
  Funnel,
} from '@phosphor-icons/react';
import { CURRENT_VERSION, getChangelog } from '../version';
import Footer from './ui/Footer';
import { EndOfListCue } from './ui/EndOfListCue.jsx';

const TYPE_CONFIG = {
  feature: {
    label: 'Feature',
    icon: Sparkles,
    bg: 'bg-emerald-100 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-900/50',
    dot: 'bg-emerald-500',
  },
  fix: {
    label: 'Bug Fix',
    icon: Bug,
    bg: 'bg-red-100 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-900/50',
    dot: 'bg-red-500',
  },
  improvement: {
    label: 'Improvement',
    icon: Zap,
    bg: 'bg-blue-100 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-900/50',
    dot: 'bg-blue-500',
  },
  breaking: {
    label: 'Breaking Change',
    icon: AlertTriangle,
    bg: 'bg-amber-100 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-900/50',
    dot: 'bg-amber-500',
  },
  docs: {
    label: 'Documentation',
    icon: FileText,
    bg: 'bg-purple-100 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-900/50',
    dot: 'bg-purple-500',
  },
  security: {
    label: 'Security',
    icon: Shield,
    bg: 'bg-rose-100 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-900/50',
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
      <Icon size={14} weight="bold" />
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="relative group mb-8 last:mb-0"
    >
      {/* Timeline connector */}
      <div className="absolute left-6 top-14 bottom-[-32px] w-px bg-slate-200 dark:bg-dark-border group-last:hidden hidden md:block" />

      <div className="flex gap-6">
        {/* Timeline dot */}
        <div className="hidden md:flex flex-col items-center pt-6 z-10 shrink-0">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-sm transition-all duration-300 ${
              isLatest
                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700/50 text-indigo-600 dark:text-indigo-400 shadow-indigo-100/50'
                : 'bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border text-slate-400 dark:text-slate-500'
            }`}
          >
            {isLatest ? <Tag size={22} weight="duotone" /> : <GitBranch size={22} weight="duotone" />}
          </div>
        </div>

        {/* Release content */}
        <div className="flex-1 min-w-0">
          <div
            className={`bg-white dark:bg-dark-surface rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-md ${
              isLatest ? 'border-indigo-200 dark:border-indigo-900/50 shadow-sm shadow-indigo-50 dark:shadow-indigo-900/10' : 'border-slate-200 dark:border-dark-border shadow-sm'
            }`}
          >
            {/* Release header */}
            <div
              className="px-6 py-5 cursor-pointer flex items-start justify-between gap-4 bg-slate-50/30 dark:bg-dark-surface/50 hover:bg-slate-50 dark:hover:bg-dark-surface transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {release.title || `v${release.version}`}
                  </h3>
                  {isLatest && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-200 dark:border-indigo-800/50">
                      Latest Release
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyVersion();
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-dark-base text-slate-600 dark:text-slate-300 font-mono font-bold text-xs hover:bg-slate-100 dark:hover:bg-dark-border transition-colors border border-slate-200 dark:border-dark-border"
                    title="Copy version"
                  >
                    <GitBranch size={14} weight="bold" />
                    v{release.version}
                    {copiedVersion ? (
                      <Check size={14} weight="bold" className="text-emerald-500" />
                    ) : (
                      <Copy size={14} weight="bold" className="text-slate-400" />
                    )}
                  </button>
                  <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium bg-white dark:bg-dark-base px-2.5 py-1 rounded-lg border border-slate-200 dark:border-dark-border">
                    <Calendar size={14} weight="bold" />
                    {formattedDate}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium bg-white dark:bg-dark-base px-2.5 py-1 rounded-lg border border-slate-200 dark:border-dark-border">
                    {release.changes?.length || 0} changes
                  </span>
                </div>
              </div>
              <button className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-dark-border hover:text-slate-600 dark:hover:text-slate-300 transition-all mt-1 shrink-0 ${isExpanded ? 'bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-slate-300' : ''}`}>
                <ChevronDown size={20} weight="bold" className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Release body */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-slate-100 dark:border-dark-border">
                    {/* Description */}
                    {release.description && (
                      <div className="px-6 py-4 bg-white dark:bg-dark-surface border-b border-slate-100 dark:border-dark-border">
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{release.description}</p>
                      </div>
                    )}

                    {/* Changes grouped by type */}
                    <div className="px-6 py-5 space-y-6 bg-white dark:bg-dark-surface">
                      {sortedTypes.map((type) => {
                        const config = TYPE_CONFIG[type] || TYPE_CONFIG.feature;
                        return (
                          <div key={type}>
                            <div className="flex items-center gap-2 mb-3">
                              <TypeBadge type={type} />
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">({grouped[type].length})</span>
                            </div>
                            <ul className="space-y-3 ml-1">
                              {grouped[type].map((change, idx) => (
                                <li key={idx} className="flex items-start gap-3 group/item">
                                  <div
                                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${config.dot} opacity-60 group-hover/item:opacity-100 transition-opacity`}
                                  />
                                  <span className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{change.text}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Changelog() {
  const changelog = getChangelog();
  const [filterType, setFilterType] = useState('all');
  const containerRef = useRef(null);

  // Collect all unique change types across all releases
  const allTypes = [...new Set(changelog.flatMap((r) => (r.changes || []).map((c) => c.type)))];

  // Filter releases
  const filteredChangelog = filterType !== 'all'
    ? changelog
        .map((r) => ({
          ...r,
          changes: (r.changes || []).filter((c) => c.type === filterType),
        }))
        .filter((r) => r.changes.length > 0)
    : changelog;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animation
      gsap.from('.hero-animate', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      });

      // Abstract Card Animation
      gsap.from('.hero-card-animate', {
        scale: 0.8,
        opacity: 0,
        rotation: 10,
        duration: 1,
        ease: 'back.out(1.7)',
        delay: 0.4,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col font-sans">
      {/* Sticky Header */}
      <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border sticky top-0 z-50 shadow-sm transition-all">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-base text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-dark-surface hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
            >
              <ArrowLeft size={20} weight="bold" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Changelog</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">System Updates & Notes</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-black border border-indigo-200 dark:border-indigo-800/50 shadow-sm">
            <Tag size={14} weight="fill" />
            v{CURRENT_VERSION}
          </span>
        </div>
      </div>

      <div className="flex-1">
        {/* Engaging Hero Section */}
        <div className="relative bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-indigo-50/80 to-transparent dark:from-indigo-900/10 pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-100/50 dark:bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 relative z-10">
            <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
              <div className="max-w-2xl">
                <div className="hero-animate inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-6 tracking-wide uppercase">
                  <BookOpen size={16} weight="fill" />
                  Release History
                </div>
                <h1 className="hero-animate text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
                  What's New in <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">AIP-PIR Portal</span>
                </h1>
                <p className="hero-animate text-slate-600 dark:text-slate-300 text-base md:text-lg leading-relaxed mb-6">
                  Track all major changes, new features, bug fixes, and improvements made to the system. Only significant updates are documented here.
                </p>
                <div className="hero-animate flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-dark-base rounded-md border border-slate-200 dark:border-dark-border">React 19</span>
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-dark-base rounded-md border border-slate-200 dark:border-dark-border">Tailwind v4</span>
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-dark-base rounded-md border border-slate-200 dark:border-dark-border">Deno</span>
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-dark-base rounded-md border border-slate-200 dark:border-dark-border">PostgreSQL</span>
                </div>
              </div>
              
              {/* Abstract decorative card */}
              <div className="hero-card-animate hidden lg:flex flex-shrink-0 w-72 h-72 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl rotate-3 opacity-10 dark:opacity-20 blur-sm"></div>
                <div className="absolute inset-0 bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-3xl -rotate-3 shadow-xl flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#4f46e5 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>
                  <GitBranch size={100} weight="duotone" className="text-indigo-500/80 dark:text-indigo-400/80" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Three-column Layout for Centered Content */}
        <div className="max-w-[100rem] mx-auto px-6 py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 relative">
          
          {/* Left Sidebar - Filters (Sticky) */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="sticky top-28">
              <div className="flex items-center gap-2 mb-6 px-4">
                <Funnel size={16} weight="bold" className="text-slate-400 dark:text-slate-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Filter by Type</h3>
              </div>
              
              <div className="relative pl-1">
                {/* Vertical line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-slate-100 dark:bg-dark-border rounded-full hidden lg:block" />
                
                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
                  {/* "All" Option */}
                  <button
                    onClick={() => setFilterType('all')}
                    className={`relative flex items-center gap-3 px-4 lg:px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors flex-shrink-0 lg:flex-shrink z-10 ${
                      filterType === 'all'
                        ? 'text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {filterType === 'all' && (
                      <motion.div
                        layoutId="activeFilterBg"
                        className="absolute inset-0 bg-white dark:bg-dark-surface border border-indigo-100 dark:border-indigo-900/40 shadow-sm rounded-xl -z-10"
                        initial={false}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                    {filterType === 'all' && (
                      <motion.div
                        layoutId="activeFilterLine"
                        className="absolute left-0 top-1/4 bottom-1/4 w-[4px] bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.5)] hidden lg:block"
                        initial={false}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hidden lg:flex ${filterType === 'all' ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-slate-50 dark:bg-dark-base border border-slate-100 dark:border-dark-border'}`}>
                      <Tag size={16} weight={filterType === 'all' ? "duotone" : "regular"} className={`transition-colors duration-300 ${filterType === 'all' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} />
                    </div>
                    <span className="relative z-10 whitespace-nowrap">All Changes</span>
                  </button>

                  {/* Dynamic Options */}
                  {allTypes.map((type) => {
                    const config = TYPE_CONFIG[type];
                    if (!config) return null;
                    const Icon = config.icon;
                    const isActive = filterType === type;
                    
                    return (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`relative flex items-center gap-3 px-4 lg:px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors flex-shrink-0 lg:flex-shrink z-10 ${
                          isActive
                            ? 'text-indigo-700 dark:text-indigo-300'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeFilterBg"
                            className="absolute inset-0 bg-white dark:bg-dark-surface border border-indigo-100 dark:border-indigo-900/40 shadow-sm rounded-xl -z-10"
                            initial={false}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                          />
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="activeFilterLine"
                            className="absolute left-0 top-1/4 bottom-1/4 w-[4px] bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.5)] hidden lg:block"
                            initial={false}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                          />
                        )}
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hidden lg:flex ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-slate-50 dark:bg-dark-base border border-slate-100 dark:border-dark-border'}`}>
                          <Icon size={16} weight={isActive ? "duotone" : "regular"} className={`transition-colors duration-300 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} />
                        </div>
                        <span className="relative z-10 whitespace-nowrap">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Center Content - Timeline */}
          <div className="flex-1 min-w-0 w-full max-w-5xl mx-auto">
            <motion.div layout className="min-h-[500px]">
              <AnimatePresence mode="popLayout">
                {filteredChangelog.length === 0 ? (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-16 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm"
                  >
                    <div className="w-16 h-16 bg-slate-50 dark:bg-dark-base rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-dark-border">
                      <Funnel size={32} weight="duotone" className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-slate-900 dark:text-slate-100 font-bold mb-1">No releases found</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">No versions match the current filter criteria.</p>
                    <button 
                      onClick={() => setFilterType('all')}
                      className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      Clear Filter
                    </button>
                  </motion.div>
                ) : (
                  filteredChangelog.map((release, idx) => (
                    <ReleaseCard key={release.version} release={release} isLatest={idx === 0 && filterType === 'all'} />
                  ))
                )}
              </AnimatePresence>
            </motion.div>

            <EndOfListCue
              count={filteredChangelog.length}
              message={filterType !== 'all' ? 'End of matching changelog' : 'End of changelog'}
              countLabel="release"
              showCount
              className="mt-12 mb-8"
            />
          </div>
          
          {/* Right Spacer for Centering */}
          <div className="hidden lg:block w-64 shrink-0" />
        </div>
      </div>
      <Footer />
    </div>
  );
}

