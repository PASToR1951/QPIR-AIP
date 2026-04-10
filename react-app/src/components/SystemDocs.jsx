import { useState, useEffect } from 'react';
import { useAppLogo } from '../context/BrandingContext.jsx';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import GithubSlugger from 'github-slugger';
import { ArrowLeft, BookOpen, Tag, List, X, List as Menu } from '@phosphor-icons/react';
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

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsMobileTocOpen(false);
  };

  const renderTocList = () => (
    <nav>
      <ul className="space-y-0.5">
        {headings.map((heading, idx) => {
          const isActive = activeId === heading.id;
          const isH1 = heading.level === 1;
          const isH2 = heading.level === 2;
          const isH3 = heading.level === 3;
          const showDivider = isH1 && idx > 0;

          return (
            <React.Fragment key={idx}>
              {showDivider && (
                <li className="py-2">
                  <div className="h-px bg-slate-100 dark:bg-dark-border" />
                </li>
              )}
              <li>
                <button
                  onClick={() => scrollToHeading(heading.id)}
                  className={`
                    group flex items-start w-full text-left rounded-lg transition-all duration-150
                    ${isH1 ? 'py-1.5 px-3 mb-0.5' : isH2 ? 'py-1.5 pl-3 pr-3' : 'py-1 pl-6 pr-3'}
                    ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-base hover:text-slate-800 dark:hover:text-slate-200'}
                  `}
                >
                  {isH2 && (
                    <span className={`mt-[7px] mr-2.5 w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isActive ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400 dark:group-hover:bg-slate-500'}`} />
                  )}
                  {isH3 && (
                    <span className={`mt-[7px] mr-2 w-1 h-1 rounded-full shrink-0 transition-colors ${isActive ? 'bg-indigo-300' : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-slate-300 dark:group-hover:bg-slate-600'}`} />
                  )}
                  <span className={`
                    leading-snug truncate
                    ${isH1 ? 'text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500' : ''}
                    ${isH2 ? `text-sm ${isActive ? 'font-semibold text-indigo-700' : 'font-medium'}` : ''}
                    ${isH3 ? `text-xs ${isActive ? 'font-medium text-indigo-600' : ''}` : ''}
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
    <div className="min-h-screen bg-slate-100 dark:bg-dark-base font-sans flex flex-col">
      {/* Top Nav */}
      <div className="bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border sticky top-0 z-50 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link to="/" className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-dark-border text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-dark-border hover:text-slate-700 dark:hover:text-slate-200 transition-all shrink-0">
              <ArrowLeft size={19} weight="bold" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none truncate">System Documentation</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden sm:block mt-0.5">Technical Thesis & Architecture</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/changelog" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-dark-base text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-border transition-colors">
              <Tag size={14} /> Version Control
            </Link>
            <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black border border-indigo-200">
              <BookOpen size={14} /> v{CURRENT_VERSION}
            </span>
            <button
              className="lg:hidden w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-all"
              onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
            >
              {isMobileTocOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile ToC Drawer */}
      {isMobileTocOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsMobileTocOpen(false)}>
          <div
            className="absolute right-3 top-[61px] bottom-3 w-80 max-w-[calc(100vw-1.5rem)] rounded-lg bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-2xl overflow-y-auto animate-in slide-in-from-right-full duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3.5 border-b border-slate-100 dark:border-dark-border flex items-center gap-2 sticky top-0 bg-white dark:bg-dark-surface z-10">
              <List size={17} className="text-indigo-500 shrink-0" />
              <span className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight">Contents</span>
            </div>
            <div className="p-3">
              {renderTocList()}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-5 md:py-10 flex-1">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">

          {/* ToC Sidebar */}
          <aside className="hidden lg:flex flex-col w-60 shrink-0 sticky top-[74px] self-start max-h-[calc(100vh-94px)]">
            <div className="bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border shadow-sm overflow-hidden flex flex-col h-full">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-dark-border flex items-center gap-2 shrink-0">
                <List size={16} className="text-indigo-500 shrink-0" />
                <span className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight">Contents</span>
                <span className="ml-auto text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-dark-border px-1.5 py-0.5 rounded-full tabular-nums">{headings.length}</span>
              </div>
              <div className="overflow-y-auto p-2.5 flex-1">
                {renderTocList()}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 w-full min-w-0 bg-white dark:bg-dark-surface rounded-lg sm:rounded-2xl md:rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm overflow-hidden">
            {/* Hero Header */}
            <div className="bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border px-4 sm:px-6 md:px-12 py-6 md:py-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4">
                  <img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-9 sm:h-10 md:h-14 w-auto drop-shadow-sm" />
                  <img src="/DepEd%20NIR%20Logo.webp" alt="DepEd NIR Logo" className="h-9 sm:h-10 md:h-14 w-auto drop-shadow-sm" />
                  <img src="/Division_Logo.webp" alt="SDO Guihulngan City" className="h-9 sm:h-10 md:h-14 w-auto drop-shadow-sm" />
                </div>

                <div className="flex flex-col items-center gap-3 text-center md:flex-1">
                  <img src={appLogo} alt="AIP-PIR Logo" className="h-14 sm:h-16 md:h-20 w-auto" />
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">AIP-PIR Portal</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm mt-1 tracking-wide">System Architecture & Technical Thesis</p>
                  </div>
                </div>

                <div className="hidden md:block w-[168px]" aria-hidden="true" />
              </div>
            </div>

            {/* Document Content */}
            <div className="px-4 py-6 sm:px-6 md:px-14 md:py-14">
              <article className="
                prose prose-sm sm:prose-base prose-slate max-w-none
                prose-headings:font-black prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-headings:scroll-mt-28 prose-headings:tracking-tight
                prose-h1:text-2xl sm:prose-h1:text-3xl md:prose-h1:text-4xl prose-h1:mt-0
                prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-dark-border prose-h2:pb-3 prose-h2:mt-10 md:prose-h2:mt-16
                prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-8 md:prose-h3:mt-10 prose-h3:text-slate-800 dark:prose-h3:text-slate-200
                prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed
                prose-li:text-slate-600 dark:prose-li:text-slate-300
                prose-a:text-indigo-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-4 prose-blockquote:border-indigo-400 prose-blockquote:bg-indigo-50/60 dark:prose-blockquote:bg-indigo-950/20 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:text-slate-700 dark:prose-blockquote:text-slate-300
                prose-code:text-indigo-600 prose-code:bg-indigo-50 dark:prose-code:bg-indigo-950/30 dark:prose-code:text-indigo-400 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[0.85em] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-lg prose-pre:shadow-lg prose-pre:max-w-full prose-pre:overflow-x-auto
                prose-img:rounded-lg prose-img:border prose-img:border-slate-200 dark:prose-img:border-dark-border prose-img:shadow-sm
                prose-strong:text-slate-800 dark:prose-strong:text-slate-100
                prose-table:block prose-table:max-w-full prose-table:overflow-x-auto prose-table:text-xs sm:prose-table:text-sm prose-th:bg-slate-50 dark:prose-th:bg-dark-border prose-th:text-slate-700 dark:prose-th:text-slate-200 prose-td:text-slate-600 dark:prose-td:text-slate-300
                break-words
              ">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSlug]}
                >
                  {docsContent}
                </ReactMarkdown>
              </article>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
