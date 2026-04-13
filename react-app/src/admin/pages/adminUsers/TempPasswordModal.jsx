import React, { useState } from 'react';
import { XCircle, Copy, Check } from '@phosphor-icons/react';

export function TempPasswordModal({ password, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl shadow-[0_24px_64px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_64px_-8px_rgba(0,0,0,0.5)] p-6 w-full max-w-sm text-center overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <XCircle size={22} weight="fill" />
        </button>
        <h3 className="font-black text-slate-900 dark:text-slate-100 mb-2">Temporary Password</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Share this with the user. It will not be shown again.</p>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-dark-base rounded-xl px-4 py-3 mb-4">
          <code className="flex-1 font-mono text-lg font-black text-slate-900 dark:text-slate-100 tracking-wider">{password}</code>
          <button onClick={handleCopy} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
          </button>
        </div>
        <button onClick={onClose} className="w-full px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
          Done
        </button>
      </div>
    </div>
  );
}
