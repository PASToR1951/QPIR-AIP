import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { ArrowLeft, BookOpen } from '@phosphor-icons/react';
import Footer from './ui/Footer.jsx';
import guideContent from '../../../docs/wiki/user-guides/Getting-Started.md?raw';

export default function GettingStarted() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-base flex flex-col font-sans">
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-dark-border dark:bg-dark-surface/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:bg-dark-border dark:text-slate-400 dark:hover:text-slate-200"
            >
              <ArrowLeft size={20} weight="bold" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
                Getting Started
              </h1>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                First steps for every AIP-PIR portal role
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700">
            <BookOpen size={14} />
            Guide
          </span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-10">
        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface">
          <div className="border-b border-slate-200 px-6 py-6 dark:border-dark-border md:px-10 md:py-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
              AIP-PIR Portal
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
              Getting Started Guide
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Use this page as the main quick guide for signing in, understanding your role, and finding the next step inside the portal.
            </p>
          </div>

          <div className="px-6 py-6 md:px-10 md:py-10">
            <article
              className="
                prose prose-sm sm:prose-base prose-slate max-w-none
                prose-headings:font-black prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-headings:scroll-mt-28 prose-headings:tracking-tight
                prose-h1:text-3xl prose-h1:mt-0
                prose-h2:text-2xl prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-dark-border prose-h2:pb-3 prose-h2:mt-12
                prose-h3:text-lg prose-h3:mt-8
                prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed
                prose-li:text-slate-600 dark:prose-li:text-slate-300
                prose-a:text-indigo-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-4 prose-blockquote:border-indigo-400 prose-blockquote:bg-indigo-50/60 dark:prose-blockquote:bg-indigo-950/20 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:text-slate-700 dark:prose-blockquote:text-slate-300
                prose-code:text-indigo-600 prose-code:bg-indigo-50 dark:prose-code:bg-indigo-950/30 dark:prose-code:text-indigo-400 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[0.85em] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-lg prose-pre:shadow-lg prose-pre:max-w-full prose-pre:overflow-x-auto
                prose-strong:text-slate-800 dark:prose-strong:text-slate-100
                prose-table:block prose-table:max-w-full prose-table:overflow-x-auto prose-table:text-xs sm:prose-table:text-sm prose-th:bg-slate-50 dark:prose-th:bg-dark-border prose-th:text-slate-700 dark:prose-th:text-slate-200 prose-td:text-slate-600 dark:prose-td:text-slate-300
                break-words
              "
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSlug]}>
                {guideContent}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
