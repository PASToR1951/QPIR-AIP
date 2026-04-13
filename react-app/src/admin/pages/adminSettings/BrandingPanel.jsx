import React from 'react';
import { Palette, UploadSimple, Trash } from '@phosphor-icons/react';
import { SettingsCard } from './SettingsUI.jsx';

export function BrandingPanel({ appLogo, logoFileRef, logoUploading, logoResetting, onUpload, onReset }) {
  return (
    <SettingsCard icon={Palette} iconBg="bg-pink-100 dark:bg-pink-950/50" iconColor="text-pink-600 dark:text-pink-400"
      title="App Branding" description="Upload a custom logo for the application. Changes take effect immediately across all pages.">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 dark:border-dark-border flex items-center justify-center bg-slate-50 dark:bg-dark-base overflow-hidden">
            <img src={appLogo} alt="Current app logo" className="max-h-24 max-w-[6rem] w-auto h-auto object-contain" />
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">Current logo</span>
        </div>
        <div className="flex-1 flex flex-col gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Accepted formats: WebP · PNG · JPEG · GIF<br />Maximum file size: 2 MB</p>
          <div className="flex flex-wrap gap-2">
            <input ref={logoFileRef} type="file" accept="image/webp,image/png,image/jpeg,image/gif" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
            <button onClick={() => logoFileRef.current?.click()} disabled={logoUploading || logoResetting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors">
              {logoUploading ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <UploadSimple size={15} weight="bold" />}
              {logoUploading ? 'Uploading…' : 'Upload Logo'}
            </button>
            <button onClick={onReset} disabled={logoUploading || logoResetting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-dark-base dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-colors">
              {logoResetting ? <span className="w-4 h-4 rounded-full border-2 border-slate-400/40 border-t-slate-500 animate-spin" /> : <Trash size={15} weight="bold" />}
              {logoResetting ? 'Resetting…' : 'Reset to Default'}
            </button>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
