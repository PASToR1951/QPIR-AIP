import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ArrowLeft, BookOpen, Tag } from 'lucide-react';
import { CURRENT_VERSION } from '../version';
import docsContent from '../../../SYSTEM_DOCUMENTATION_THESIS.md?raw';

export default function SystemDocs() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-700 transition-all">
              <ArrowLeft size={18} strokeWidth={2.5} />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">System Documentation</h1>
              <p className="text-xs text-slate-400 font-medium">Technical Thesis & Architecture</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Link to="/changelog" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 text-xs font-bold border border-slate-200 hover:bg-slate-100 transition-colors">
               <Tag size={12} strokeWidth={3} /> Version Control
             </Link>
             <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black border border-blue-200 shadow-sm">
               <BookOpen size={12} strokeWidth={3} /> v{CURRENT_VERSION}
             </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Graphic */}
          <div className="h-40 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 relative flex flex-col justify-end px-8 md:px-12 pb-8">
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
             <div className="absolute top-0 right-32 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
             <div className="relative z-10 flex items-start justify-between w-full">
                <div>
                  <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">QPIR-AIP Portal</h1>
                  <p className="text-slate-300 font-medium tracking-wide">System Architecture & Technical Thesis</p>
                </div>
                <div className="hidden sm:flex w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl items-center justify-center border border-white/20">
                    <BookOpen size={32} className="text-emerald-400" />
                </div>
             </div>
          </div>
          
          <div className="p-8 md:p-12">
            <article className="prose prose-slate prose-img:rounded-3xl prose-img:border prose-a:text-pink-600 hover:prose-a:text-pink-700 prose-headings:font-black prose-h1:text-4xl max-w-none prose-h2:border-b prose-h2:pb-3 prose-h2:mt-12 prose-h3:text-xl prose-h3:mt-8 prose-p:leading-loose prose-p:text-slate-600 prose-li:text-slate-600">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {docsContent}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
