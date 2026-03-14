import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import GithubSlugger from 'github-slugger';
import { ArrowLeft, BookOpen, Tag, List, ChevronRight, X, Menu } from 'lucide-react';
import { CURRENT_VERSION } from '../version';
import docsContent from '../../../SYSTEM_DOCUMENTATION_THESIS.md?raw';

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
      // Basic stripping for markdown links and HTML tags in headers
      title = title.replace(/<[^>]+>/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      const id = slugger.slug(title);
      headings.push({ id, title, level });
    }
  }
});

export default function SystemDocs() {
  const [activeId, setActiveId] = useState('');
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);

  // Intersection Observer for highlighting the active section in the ToC
  useEffect(() => {
    const handleObserver = (entries) => {
      // Find the first intersecting entry
      const visibleEntry = entries.find(entry => entry.isIntersecting);
      if (visibleEntry) {
        setActiveId(visibleEntry.target.id);
      }
    };

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '-0px 0px -80% 0px'
    });

    const elements = document.querySelectorAll('h1, h2, h3');
    elements.forEach(elem => observer.observe(elem));

    return () => observer.disconnect();
  }, []);

  // Smooth scroll to element
  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      // Offset for sticky header
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsMobileTocOpen(false);
  };

  const renderTocList = () => (
    <ul className="space-y-1.5 text-sm font-medium">
      {headings.map((heading, idx) => {
        const isActive = activeId === heading.id;
        // Indentation logic based on heading level
        const paddingLeft = heading.level === 1 ? 'pl-0 font-bold' : heading.level === 2 ? 'pl-4' : 'pl-8 text-xs';
        
        return (
          <li key={idx}>
            <button
              onClick={() => scrollToHeading(heading.id)}
              className={`block w-full text-left py-1.5 transition-colors group relative ${paddingLeft} ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {isActive && (
                <span className="absolute left-[-24px] top-1/2 -translate-y-1/2 text-indigo-500 animate-in fade-in slide-in-from-left-2 hidden lg:inline-block">
                  <ChevronRight size={16} strokeWidth={3} />
                </span>
              )}
              <span className={`block truncate pr-4 leading-tight ${isActive ? 'font-bold lg:font-medium' : ''}`}>{heading.title}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm print:hidden relative z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-700 transition-all">
              <ArrowLeft size={18} strokeWidth={2.5} />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">System Documentation</h1>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">Technical Thesis & Architecture</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Link to="/changelog" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 text-xs font-bold border border-slate-200 hover:bg-slate-100 transition-colors">
               <Tag size={12} strokeWidth={3} /> Version Control
             </Link>
             <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black border border-blue-200 shadow-sm">
               <BookOpen size={12} strokeWidth={3} /> v{CURRENT_VERSION}
             </span>
             <button
               className="lg:hidden w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-all"
               onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
             >
               {isMobileTocOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
             </button>
          </div>
        </div>
      </div>

      {/* Mobile ToC Drawer */}
      {isMobileTocOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsMobileTocOpen(false)}>
          <div 
            className="absolute right-0 top-[73px] bottom-0 w-80 bg-white border-l border-slate-200 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right-full duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-black text-slate-900 flex items-center gap-2 mb-6 tracking-tight">
              <List size={20} className="text-indigo-500" />
              Table of Contents
            </h3>
            {renderTocList()}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Table of Contents - Left Sidebar */}
          <div className="hidden lg:block w-72 shrink-0 sticky top-28 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm self-start max-h-[calc(100vh-120px)] overflow-y-auto">
            <h3 className="font-black text-slate-900 flex items-center gap-2 mb-6 tracking-tight">
              <List size={20} className="text-indigo-500" />
              Table of Contents
            </h3>
            {renderTocList()}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 w-full lg:w-auto bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
            {/* Header Graphic */}
            <div className="h-48 md:h-56 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 relative flex flex-col justify-end px-8 md:px-12 pb-8">
               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
               <div className="absolute top-0 right-32 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
               <div className="relative z-10 flex flex-col gap-4 w-full">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 mb-2">
                      <BookOpen size={32} strokeWidth={2.5} className="text-emerald-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">AIP-PIR Portal</h1>
                    <p className="text-slate-300 font-medium tracking-wide">System Architecture & Technical Thesis</p>
                  </div>
               </div>
            </div>
            
            <div className="p-8 md:p-12 lg:px-16 lg:py-14">
              <article className="prose prose-slate prose-img:rounded-3xl prose-img:border prose-a:text-pink-600 hover:prose-a:text-pink-700 prose-headings:font-black prose-headings:text-slate-900 prose-headings:scroll-mt-24 max-w-none prose-h1:text-4xl prose-h2:text-3xl prose-h2:border-b prose-h2:pb-4 prose-h2:mt-16 prose-h3:text-2xl prose-h3:mt-10 prose-p:leading-loose prose-p:text-slate-600 prose-li:text-slate-600 prose-pre:border prose-pre:border-slate-800 prose-code:text-indigo-600 prose-strong:text-slate-800 break-words">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSlug]}>
                  {docsContent}
                </ReactMarkdown>
              </article>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
