import React from 'react';
import { motion as Motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Buildings,
  ClockCountdown,
  UserCircle,
  Warning,
} from '@phosphor-icons/react';
import { fadeUp } from './chartTheme.js';

export function AdminOverviewHero({ appLogo, navigate, stats, user }) {
  return (
    <Motion.div variants={fadeUp} className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm group dark:border-dark-border dark:bg-dark-surface">
      <div
        className="absolute inset-y-0 -left-4 w-[65%] opacity-30 grayscale pointer-events-none transition-all duration-700 group-hover:opacity-45 group-hover:grayscale-0"
        style={{
          backgroundImage: "url('/SDO_Facade.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 70%',
          maskImage: 'linear-gradient(to right, black 30%, transparent)',
        }}
      />

      <div className="relative z-10 flex flex-col divide-y divide-slate-100 lg:flex-row lg:divide-x lg:divide-y-0 dark:divide-dark-border">
        <div className="relative flex min-h-[240px] flex-1 flex-col justify-center gap-6 overflow-hidden p-6 sm:p-10 md:p-12">
          <img
            src={appLogo}
            alt=""
            className="pointer-events-none absolute right-4 top-1/2 h-52 w-auto -translate-y-1/2 select-none object-contain opacity-[0.05] dark:opacity-[0.04] md:h-64 lg:h-72"
          />
          <div>
            <div className="mb-5 flex items-center gap-3">
              <img src="/DepEd_Seal.webp" alt="DepEd" className="h-10 w-auto object-contain sm:h-12" />
              <img src="/DepEd NIR Logo.webp" alt="DepEd NIR" className="h-10 w-auto object-contain sm:h-12" />
              <img src="/Division_Logo.webp" alt="Division" className="h-10 w-auto object-contain sm:h-12" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Admin Overview</span>
            <h1 className="mt-1.5 mb-3 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl md:text-4xl">
              Welcome back, <span className="text-pink-600">{user?.name || 'Admin'}</span>
            </h1>
            <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
              {stats?.pirSubmittedThisQ != null
                ? `${stats.pirSubmittedThisQ} PIR submission${stats.pirSubmittedThisQ !== 1 ? 's' : ''} this quarter · ${stats.aipCompliancePct ?? 0}% AIP compliance · Q${stats.currentQuarter} deadline ${stats.daysLeft != null && stats.daysLeft >= 0 ? `in ${stats.daysLeft}d` : 'overdue'}.`
                : 'Loading system status…'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/admin/submissions')}
              className="flex items-center gap-2 rounded-2xl bg-pink-600 px-6 py-3 text-sm font-black text-white shadow-md transition-all duration-150 hover:bg-pink-700 hover:shadow-lg active:scale-95"
            >
              View Submissions
              <ArrowRight size={18} weight="bold" />
            </button>
            <button
              onClick={() => navigate('/admin/reports')}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 transition-all duration-150 hover:shadow-md active:scale-95 dark:border-dark-border dark:bg-dark-border dark:text-slate-200"
            >
              Reports
            </button>
          </div>
        </div>

        <div className="hidden flex-col lg:flex lg:w-80 xl:w-96">
          <div className="border-b border-slate-100 px-5 py-3.5 dark:border-dark-border">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">At a Glance</span>
          </div>
          <div className="flex flex-1 flex-col divide-y divide-slate-50 dark:divide-dark-border/60">
            <button
              onClick={() => navigate('/admin/deadlines')}
              className="group flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-dark-base"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                stats?.daysLeft < 0
                  ? 'bg-rose-100 text-rose-500 dark:bg-rose-950/40'
                  : stats?.daysLeft <= 14
                  ? 'bg-amber-100 text-amber-500 dark:bg-amber-950/40'
                  : 'bg-emerald-100 text-emerald-500 dark:bg-emerald-950/40'
              }`}>
                <ClockCountdown size={18} weight="bold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {stats?.daysLeft == null ? '—' : stats.daysLeft < 0 ? 'Deadline Overdue' : stats.daysLeft === 0 ? 'Deadline Today' : `${stats.daysLeft} days left`}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">Q{stats?.currentQuarter} submission deadline</p>
              </div>
              <ArrowRight size={15} className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400" />
            </button>

            <button
              onClick={() => navigate('/admin/submissions')}
              className="group flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-dark-base"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-500 dark:bg-indigo-950/40">
                <BookOpen size={18} weight="bold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {stats?.pirSubmittedThisQ ?? '—'} PIR · {stats?.aipCompliantCount ?? '—'} AIP filed
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">Submissions this quarter</p>
              </div>
              <ArrowRight size={15} className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400" />
            </button>

            <button
              onClick={() => navigate('/admin/schools')}
              className="group flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-dark-base"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                (stats?.totalSchools - stats?.aipCompliantCount) > 0
                  ? 'bg-rose-100 text-rose-500 dark:bg-rose-950/40'
                  : 'bg-emerald-100 text-emerald-500 dark:bg-emerald-950/40'
              }`}>
                <Warning size={18} weight="bold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {stats != null ? `${stats.totalSchools - stats.aipCompliantCount} schools non-compliant` : '—'}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">AIP compliance status</p>
              </div>
              <ArrowRight size={15} className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400" />
            </button>

            <button
              onClick={() => navigate('/admin/schools')}
              className="group flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-dark-base"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <Buildings size={18} weight="bold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">{stats?.totalSchools ?? '—'} schools enrolled</p>
                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">School management</p>
              </div>
              <ArrowRight size={15} className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400" />
            </button>

            <button
              onClick={() => navigate('/admin/users')}
              className="group flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-dark-base"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-500 dark:bg-violet-950/40">
                <UserCircle size={18} weight="bold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">{stats?.totalProgramOwners ?? '—'} program owners</p>
                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{stats?.totalPrograms ?? '—'} programs registered</p>
              </div>
              <ArrowRight size={15} className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </Motion.div>
  );
}
