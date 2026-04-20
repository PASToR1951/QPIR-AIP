import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, PencilSimple, Key, Prohibit, Trash, Copy, CheckCircle, SpinnerGap } from '@phosphor-icons/react';
import { StatusBadge } from './StatusBadge.jsx';
import api from '../../lib/api.js';

function displayName(user) {
  if (!user) return '';
  if ((user.role === 'Division Personnel' || user.role === 'School') && user.first_name && user.last_name) {
    const mi = user.middle_initial ? ` ${user.middle_initial}.` : '';
    return `${user.first_name}${mi} ${user.last_name}`;
  }
  return user.name || (user.role === 'School' ? user.school?.name : null) || user.email || '';
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserProfileModal({ open, user, onClose, onEdit, onResetPassword, onToggle, onDelete }) {
  const [resetStep, setResetStep] = useState('idle'); // idle | confirm | loading | done | error
  const [generatedPw, setGeneratedPw] = useState('');
  const [pwCopied, setPwCopied] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Reset internal state when modal closes or user changes
  useEffect(() => {
    if (!open) {
      setResetStep('idle');
      setGeneratedPw('');
      setPwCopied(false);
      setProfile(null);
      setProfileLoading(false);
      setProfileError('');
    }
  }, [open]);

  useEffect(() => {
    if (!open || !user?.id) return undefined;

    let cancelled = false;
    setProfileLoading(true);
    setProfileError('');

    api.get(`/api/admin/users/${user.id}/profile`)
      .then((response) => {
        if (!cancelled) setProfile(response.data ?? null);
      })
      .catch((error) => {
        if (!cancelled) {
          setProfile(null);
          setProfileError(error.friendlyMessage ?? 'Could not load the latest profile details.');
        }
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, user?.id]);

  const activeUser = profile ?? user;

  const name = activeUser ? displayName(activeUser) : '';
  const programs = activeUser?.programs ?? [];
  const isCES = activeUser?.role?.startsWith('CES-');
  const isDivPersonnel = activeUser?.role === 'Division Personnel';
  let functionalDivision = null;
  if (isCES) {
    functionalDivision = activeUser.role.split('-')[1];
  } else if (isDivPersonnel && programs.length > 0) {
    const divs = [...new Set(programs.map(p => p.division).filter(Boolean))];
    if (divs.length > 0) functionalDivision = divs.join(', ');
  }

  const handleGeneratePassword = async () => {
    setResetStep('loading');
    try {
      const pw = await onResetPassword(activeUser.id);
      setGeneratedPw(pw);
      setResetStep('done');
    } catch {
      setResetStep('error');
    }
  };

  const handleCopyPw = () => {
    navigator.clipboard.writeText(generatedPw);
    setPwCopied(true);
    setTimeout(() => setPwCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {open && user && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}
      />
      <motion.div
        key="modal"
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden z-10 max-h-[90vh]"
      >

        {/* Header */}
        <div className="flex items-center gap-4 px-4 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-dark-border">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {initials(name)}
            </span>
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight truncate">{name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{activeUser.email}</p>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <StatusBadge status={activeUser.role} size="xs" />
              {functionalDivision && (
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wide rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                  {functionalDivision}
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${activeUser.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${activeUser.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {activeUser.is_active ? 'Active' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Close */}
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0">
            <XCircle size={32} weight="fill" />
          </button>
        </div>

        {/* Body — two columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-dark-border flex-1 overflow-y-auto min-h-0">

          {/* Left: Profile details */}
          <div className="px-4 sm:px-8 py-6 space-y-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile</p>
            {profileLoading && (
              <div className="flex items-center gap-2 text-sm font-bold text-slate-400 dark:text-slate-500">
                <SpinnerGap size={16} className="animate-spin" />
                Loading latest profile details…
              </div>
            )}
            {!profileLoading && profileError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                {profileError}
              </div>
            )}
            <dl className="space-y-4">
              <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Role</dt>
                <dd className="text-sm font-bold text-slate-800 dark:text-slate-200">{activeUser.role}</dd>
              </div>
              {isCES || isDivPersonnel ? (
                <div>
                  <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Position</dt>
                  <dd className="text-sm font-bold text-slate-800 dark:text-slate-200">{activeUser.position ?? '—'}</dd>
                </div>
              ) : (
                <div>
                  <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">School</dt>
                  <dd className="text-sm font-bold text-slate-800 dark:text-slate-200">{activeUser.school?.name ?? '—'}</dd>
                </div>
              )}
              <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Programs</dt>
                <dd>
                  {programs.length === 0
                    ? <span className="text-sm font-bold text-slate-800 dark:text-slate-200">—</span>
                    : <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {programs.map(p => (
                          <span key={p.id} className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40">
                            {p.title}
                          </span>
                        ))}
                      </div>
                  }
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Joined</dt>
                <dd className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {activeUser.created_at
                    ? new Date(activeUser.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
                    : '—'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Right: Reset Password */}
          <div className="px-4 sm:px-8 py-6 flex flex-col">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Reset Password</p>

            {resetStep === 'idle' && (
              <div className="flex-1 flex flex-col items-start justify-start gap-3">
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Generate a new temporary password for <strong className="text-slate-700 dark:text-slate-300">{name}</strong>. Share it with the user — they should change it after logging in.
                </p>
                <button
                  onClick={() => setResetStep('confirm')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40 transition-colors"
                >
                  <Key size={16} weight="bold" /> Reset Password
                </button>
              </div>
            )}

            {resetStep === 'confirm' && (
              <div className="flex-1 flex flex-col gap-4">
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4">
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">Confirm password reset</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    This will invalidate the current password for <strong>{name}</strong>. A new temporary password will be generated.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setResetStep('idle')}
                    className="flex-1 px-4 py-2 text-sm font-bold rounded-xl text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-dark-border hover:bg-slate-200 dark:hover:bg-dark-border/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGeneratePassword}
                    className="flex-1 px-4 py-2 text-sm font-bold rounded-xl text-white bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>
            )}

            {resetStep === 'loading' && (
              <div className="flex-1 flex items-center justify-center gap-3 text-slate-400">
                <SpinnerGap size={22} className="animate-spin" />
                <span className="text-sm font-bold">Generating…</span>
              </div>
            )}

            {resetStep === 'done' && (
              <div className="flex-1 flex flex-col gap-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  New temporary password generated. Share this with <strong className="text-slate-700 dark:text-slate-300">{name}</strong> — it will not be shown again.
                </p>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl px-4 py-3">
                  <code className="flex-1 font-mono text-base font-black text-slate-900 dark:text-slate-100 tracking-wider select-all">
                    {generatedPw}
                  </code>
                  <button onClick={handleCopyPw} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0">
                    {pwCopied ? <CheckCircle size={20} weight="fill" className="text-emerald-500" /> : <Copy size={20} />}
                  </button>
                </div>
                <button
                  onClick={() => setResetStep('idle')}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-left"
                >
                  Reset again
                </button>
              </div>
            )}

            {resetStep === 'error' && (
              <div className="flex-1 flex flex-col gap-3">
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-xl p-4">
                  <p className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-1">Reset failed</p>
                  <p className="text-xs text-rose-600 dark:text-rose-500">Could not generate a temporary password. Check your connection and try again.</p>
                </div>
                <button
                  onClick={() => setResetStep('idle')}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-left"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center gap-2 px-4 sm:px-8 py-4 border-t border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-base">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 transition-colors"
          >
            <PencilSimple size={16} /> Edit User
          </button>
          <button
                  onClick={onToggle}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-border border border-slate-200 dark:border-dark-border transition-colors"
                >
            <Prohibit size={16} /> {activeUser.is_active ? 'Disable' : 'Enable'} Account
                </button>
          <div className="ml-auto">
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 transition-colors"
            >
              <Trash size={16} /> Delete User
            </button>
          </div>
        </div>

      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}
