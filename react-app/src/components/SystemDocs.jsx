import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { useAppLogo } from '../context/BrandingContext.jsx';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import GithubSlugger from 'github-slugger';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

import {
  ArrowLeft,
  ArrowsOut,
  BookOpen,
  List,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Tag,
  X,
  List as Menu,
} from '@phosphor-icons/react';
import { CURRENT_VERSION } from '../version';
import docsContent from '../../../docs/SYSTEM_DOCUMENTATION_THESIS.md?raw';
import Footer from './ui/Footer';

// Pre-parse the headings from the Markdown file to display in the Table of Contents
const slugger = new GithubSlugger();
const headings = [];
let isCodeBlock = false;

docsContent.split('\n').forEach(line => {
  if (line.trim().startsWith('```')) isCodeBlock = !isCodeBlock;
  if (!isCodeBlock) {
    const match = line.match(/^(#{1,3})\s+(.*)$/);
    if (match) {
      const level = match[1].length;
      let title = match[2];
      title = title.replace(/<[^>]+>/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      const id = slugger.slug(title);
      headings.push({ id, title, level });
    }
  }
});

export default function SystemDocs() {
  const appLogo = useAppLogo();
  const [activeId, setActiveId] = useState('');
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [imageZoom, setImageZoom] = useState(1);
  const articleRef = useRef(null);
  const containerRef = useRef(null);

  const clampZoom = useCallback((value) => Math.min(Math.max(value, 0.75), 4), []);

  const closeZoomedImage = useCallback(() => {
    setZoomedImage(null);
    setImageZoom(1);
  }, []);

  const zoomImageBy = useCallback((factor) => {
    setImageZoom((current) => clampZoom(Number((current * factor).toFixed(2))));
  }, [clampZoom]);

  const resetImageZoom = useCallback(() => {
    setImageZoom(1);
  }, []);

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

  useEffect(() => {
    const handleObserver = (entries) => {
      const visibleEntry = entries.find(entry => entry.isIntersecting);
      if (visibleEntry) setActiveId(visibleEntry.target.id);
    };

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '-0px 0px -80% 0px'
    });

    const elements = document.querySelectorAll('h1, h2, h3');
    elements.forEach(elem => observer.observe(elem));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return undefined;

    const handleImageClick = (event) => {
      const image = event.target.closest('img');
      if (!image || !article.contains(image)) return;

      const source =
        image.closest('a[href]')?.getAttribute('href') ||
        image.currentSrc ||
        image.getAttribute('src');

      if (!source) return;

      event.preventDefault();
      setZoomedImage({
        alt: image.getAttribute('alt') || 'Documentation image',
        src: source,
      });
      setImageZoom(1);
    };

    article.addEventListener('click', handleImageClick);
    return () => article.removeEventListener('click', handleImageClick);
  }, []);

  useEffect(() => {
    if (!zoomedImage) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeZoomedImage();
      if (event.key === '+' || event.key === '=') zoomImageBy(1.2);
      if (event.key === '-') zoomImageBy(1 / 1.2);
      if (event.key === '0') resetImageZoom();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeZoomedImage, resetImageZoom, zoomImageBy, zoomedImage]);

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsMobileTocOpen(false);
  };

  const renderTocList = () => (
    <nav className="relative pl-1">
      <ul className="space-y-1">
        {headings.map((heading, idx) => {
          const isActive = activeId === heading.id;
          const isH1 = heading.level === 1;
          const isH2 = heading.level === 2;
          const isH3 = heading.level === 3;
          const showDivider = isH1 && idx > 0;

          return (
            <React.Fragment key={idx}>
              {showDivider && (
                <li className="py-3">
                  <div className="h-px bg-slate-100 dark:bg-dark-border" />
                </li>
              )}
              <li>
                <button
                  onClick={() => scrollToHeading(heading.id)}
                  className={`
                    relative group flex items-start w-full text-left rounded-xl transition-colors z-10
                    ${isH1 ? 'py-2.5 px-3 mb-1' : isH2 ? 'py-2 pl-3 pr-3' : 'py-1.5 pl-6 pr-3'}
                    ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeDocsTocBg"
                      className="absolute inset-0 bg-white dark:bg-dark-surface border border-indigo-100 dark:border-indigo-900/40 shadow-sm rounded-xl -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeDocsTocLine"
                      className="absolute left-0 top-1/4 bottom-1/4 w-[4px] bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}

                  {isH2 && (
                    <span className={`mt-[7px] mr-2.5 w-1.5 h-1.5 rounded-full shrink-0 transition-colors relative z-10 ${isActive ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400 dark:group-hover:bg-slate-500'}`} />
                  )}
                  {isH3 && (
                    <span className={`mt-[7px] mr-2 w-1 h-1 rounded-full shrink-0 transition-colors relative z-10 ${isActive ? 'bg-indigo-300' : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-slate-300 dark:group-hover:bg-slate-600'}`} />
                  )}
                  <span className={`
                    leading-snug truncate relative z-10
                    ${isH1 ? 'text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500' : ''}
                    ${isH2 ? `text-sm ${isActive ? 'font-bold' : 'font-semibold'}` : ''}
                    ${isH3 ? `text-xs ${isActive ? 'font-semibold' : 'font-medium'}` : ''}
                  `}>
                    {heading.title}
                  </span>
                </button>
              </li>
            </React.Fragment>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 dark:bg-dark-base font-sans flex flex-col">
      {/* Top Nav */}
      <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border sticky top-0 z-50 shadow-sm print:hidden transition-all">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to="/"
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-base text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-dark-surface hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm shrink-0"
            >
              <ArrowLeft size={20} weight="bold" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none truncate">System Documentation</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden sm:block mt-1">Technical Thesis & Architecture</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/changelog" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-dark-base text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-surface transition-colors shadow-sm">
              <Tag size={14} weight="bold" /> Version Control
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-black border border-indigo-200 dark:border-indigo-800/50 shadow-sm">
              <BookOpen size={14} weight="fill" /> v{CURRENT_VERSION}
            </span>
            <button
              className="lg:hidden w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all border border-indigo-200 dark:border-indigo-800/50 shadow-sm"
              onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
            >
              {isMobileTocOpen ? <X size={20} weight="bold" /> : <Menu size={20} weight="bold" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile ToC Drawer */}
      {isMobileTocOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsMobileTocOpen(false)}>
          <div
            className="absolute right-3 top-[74px] bottom-3 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-2xl overflow-y-auto animate-in slide-in-from-right-full duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-dark-border flex items-center gap-2 sticky top-0 bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm z-10">
              <List size={18} className="text-indigo-500 shrink-0" weight="bold" />
              <span className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight uppercase tracking-widest">Contents</span>
            </div>
            <div className="p-4">
              {renderTocList()}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1">
        {/* Engaging Hero Section */}
        <div className="relative bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-indigo-50/80 to-transparent dark:from-indigo-900/10 pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-100/50 dark:bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-20 relative z-10">
            <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
              <div className="max-w-2xl">
                <div className="hero-animate inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-6 tracking-wide uppercase">
                  <BookOpen size={16} weight="fill" />
                  Technical Thesis & Architecture
                </div>
                <h1 className="hero-animate text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
                  System <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Documentation</span>
                </h1>
                <p className="hero-animate text-slate-600 dark:text-slate-300 text-base md:text-lg leading-relaxed mb-6">
                  Comprehensive technical documentation detailing the architecture, implementation, and features of the AIP-PIR Management Portal.
                </p>
                <div className="hero-animate flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 bg-white dark:bg-dark-base px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border shadow-sm">
                    <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-8 w-auto drop-shadow-sm" />
                    <img src="/DepEd%20NIR%20Logo.webp" alt="DepEd NIR Logo" className="h-8 w-auto drop-shadow-sm" />
                    <img src="/Division_Logo.webp" alt="SDO Guihulngan City" className="h-8 w-auto drop-shadow-sm" />
                    <div className="w-px h-8 bg-slate-200 dark:bg-dark-border mx-2 hidden sm:block"></div>
                    <img src={appLogo} alt="AIP-PIR Logo" className="h-8 sm:h-10 w-auto" />
                  </div>
                </div>
              </div>
              
              {/* Abstract decorative card */}
              <div className="hero-card-animate hidden lg:flex flex-shrink-0 w-72 h-72 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl rotate-3 opacity-10 dark:opacity-20 blur-sm"></div>
                <div className="absolute inset-0 bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-3xl -rotate-3 shadow-xl flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#4f46e5 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>
                  <BookOpen size={100} weight="duotone" className="text-indigo-500/80 dark:text-indigo-400/80" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[100rem] mx-auto px-4 py-8 md:py-12 flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
          {/* ToC Sidebar */}
          <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-[90px] self-start max-h-[calc(100vh-120px)]">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 px-4">Table of Contents</h3>
            <div className="overflow-y-auto pr-2 pb-4 scrollbar-hide">
              {renderTocList()}
            </div>
          </aside>

          {/* Center Content */}
          <div className="flex-1 w-full min-w-0 max-w-6xl mx-auto bg-white dark:bg-dark-surface rounded-2xl md:rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm overflow-hidden">
            {/* Document Content */}
            <div className="px-6 py-8 md:px-12 md:py-14">
              <article
                ref={articleRef}
                className="
                prose prose-sm sm:prose-base prose-slate max-w-none
                prose-headings:font-black prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-headings:scroll-mt-28 prose-headings:tracking-tight
                prose-h1:text-3xl md:prose-h1:text-4xl prose-h1:mt-0 prose-h1:mb-8
                prose-h2:text-2xl prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-dark-border prose-h2:pb-3 prose-h2:mt-12 md:prose-h2:mt-16
                prose-h3:text-xl prose-h3:mt-8 md:prose-h3:mt-10 prose-h3:text-slate-800 dark:prose-h3:text-slate-200
                prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed
                prose-li:text-slate-600 dark:prose-li:text-slate-300
                prose-a:text-indigo-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-4 prose-blockquote:border-indigo-400 prose-blockquote:bg-indigo-50/60 dark:prose-blockquote:bg-indigo-950/20 prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:px-5 prose-blockquote:not-italic prose-blockquote:text-slate-700 dark:prose-blockquote:text-slate-300 prose-blockquote:shadow-sm
                prose-code:text-indigo-600 prose-code:bg-indigo-50 dark:prose-code:bg-indigo-950/30 dark:prose-code:text-indigo-400 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[0.85em] prose-code:font-bold prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:max-w-full prose-pre:overflow-x-auto
                prose-img:rounded-xl prose-img:border prose-img:border-slate-200 dark:prose-img:border-dark-border prose-img:shadow-sm prose-img:cursor-zoom-in
                prose-strong:text-slate-800 dark:prose-strong:text-slate-100
                prose-table:block prose-table:max-w-full prose-table:overflow-x-auto prose-table:text-sm prose-th:bg-slate-50 dark:prose-th:bg-dark-border prose-th:text-slate-700 dark:prose-th:text-slate-200 prose-th:font-bold prose-th:p-3 prose-td:text-slate-600 dark:prose-td:text-slate-300 prose-td:p-3 prose-td:border-t prose-td:border-slate-100 dark:prose-td:border-dark-border
                break-words
              "
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSlug]}
                >
                  {docsContent}
                </ReactMarkdown>
              </article>
            </div>
          </div>
          
          {/* Right Spacer for Centering */}
          <div className="hidden lg:block w-64 shrink-0" />
        </div>
      </div>
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/90 backdrop-blur-sm"
          onClick={closeZoomedImage}
          role="dialog"
          aria-modal="true"
          aria-label={zoomedImage.alt}
        >
          <div
            className="flex h-full flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-sm font-black tracking-tight">{zoomedImage.alt}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">
                  Scroll to inspect, use the controls to zoom, press Esc to close
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => zoomImageBy(1.2)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
                  title="Zoom in"
                >
                  <MagnifyingGlassPlus size={18} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => zoomImageBy(1 / 1.2)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
                  title="Zoom out"
                >
                  <MagnifyingGlassMinus size={18} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={resetImageZoom}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/10"
                  title="Reset zoom"
                >
                  Reset
                </button>
                <a
                  href={zoomedImage.src}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/10 sm:inline-flex"
                  title="Open original"
                >
                  <ArrowsOut size={16} weight="bold" />
                  Original
                </a>
                <button
                  type="button"
                  onClick={closeZoomedImage}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
                  title="Close"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-4 py-4 sm:px-6 sm:py-6">
              <div className="flex min-h-full min-w-full items-start justify-center">
                <img
                  src={zoomedImage.src}
                  alt={zoomedImage.alt}
                  className="max-w-none rounded-2xl border border-white/10 bg-white shadow-2xl"
                  style={{ width: `${imageZoom * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
