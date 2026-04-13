import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SchoolAvatar } from '../../../components/ui/SchoolAvatar.jsx';

const MotionDiv = motion.div;

export function ClusterNumberModal({ mode, open, onClose, clusters, clusterForm, setClusterForm, onSave, actionLoading, logoUploading, formError, editCluster }) {
  if (!open) return null;

  const numVal = Number(clusterForm.cluster_number);
  const numTaken = !!clusterForm.cluster_number && clusters.some(c =>
    (mode === 'edit' ? c.id !== editCluster?.id : true) && c.cluster_number === numVal
  );
  const canSave = !!clusterForm.cluster_number && !numTaken;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => { onClose(); }} />
        <MotionDiv
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative z-10 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          <form onSubmit={e => { e.preventDefault(); if (canSave && !actionLoading && !logoUploading) onSave(); }}>
            <div className="px-7 pt-7 pb-2 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {mode === 'edit' ? 'Edit Cluster' : 'New Cluster'}
              </p>
            </div>

            {mode === 'edit' && editCluster && (
              <div className="px-7 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 text-center mb-3">Cluster Logo</p>
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-dark-base border border-slate-200 dark:border-dark-border p-3">
                  <SchoolAvatar
                    clusterNumber={clusterForm.cluster_number || editCluster.cluster_number}
                    clusterLogo={editCluster.logo ?? null}
                    name={`Cluster ${clusterForm.cluster_number || editCluster.cluster_number}`}
                    size={56} rounded="rounded-full" className="shrink-0"
                  />
                  <div className="min-w-0 flex flex-1 flex-col gap-2">
                    <label className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/30 ${logoUploading ? 'pointer-events-none opacity-50' : ''}`}>
                      {logoUploading ? 'Uploading...' : 'Upload Logo'}
                      <input type="file" accept="image/webp,image/png,image/jpeg,image/gif" className="hidden"
                        disabled={logoUploading}
                        onChange={e => { const f = e.currentTarget.files?.[0]; if (f) setClusterForm(cf => ({ ...cf, _pendingLogoFile: f, _pendingLogoInput: e.currentTarget })); }} />
                    </label>
                    {editCluster.logo && (
                      <button type="button" onClick={() => setClusterForm(cf => ({ ...cf, _removeLogo: true }))}
                        disabled={logoUploading}
                        className="text-left text-xs font-bold text-rose-500 hover:underline disabled:opacity-50">
                        Remove and use bundled default
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1.5 text-center text-[11px] text-slate-400 dark:text-slate-500">Max 2 MB - WebP, PNG, JPEG, or GIF</p>
              </div>
            )}

            <div className="flex flex-col items-center px-7 py-6">
              <input
                type="number"
                value={clusterForm.cluster_number}
                onChange={e => setClusterForm(f => ({ ...f, cluster_number: e.target.value }))}
                autoFocus placeholder="—"
                className={`w-40 text-center text-8xl font-black bg-transparent border-b-4 focus:outline-none transition-colors pb-1
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                  ${numTaken ? 'text-rose-500 dark:text-rose-400 border-rose-400'
                    : canSave ? 'text-indigo-600 dark:text-indigo-400 border-indigo-400'
                    : 'text-slate-300 dark:text-slate-600 border-slate-200 dark:border-dark-border'}`}
              />
              <div className="h-6 mt-3 flex items-center justify-center">
                {numTaken
                  ? <p className="text-xs font-bold text-rose-500">Cluster {numVal} already exists.</p>
                  : canSave
                    ? <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400">Cluster {numVal}</p>
                    : <p className="text-xs text-slate-400 dark:text-slate-500">Enter a cluster number</p>}
              </div>
            </div>

            <div className="flex gap-2 px-7 pb-7">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-base hover:bg-slate-200 dark:hover:bg-dark-border rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={!canSave || actionLoading || logoUploading}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {actionLoading ? (mode === 'edit' ? 'Saving…' : 'Creating…') : (mode === 'edit' ? 'Save Cluster' : 'Create Cluster')}
              </button>
            </div>
            {formError && <p className="text-xs text-red-500 font-bold text-center pb-4">{formError}</p>}
          </form>
        </MotionDiv>
      </div>
    </AnimatePresence>
  );
}
