import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../../lib/api.js';
import { REVIEW_TIMER_MS } from '../../../constants.js';

export function useSubmissionModal({ isObserver, handleStatusUpdate, fetchSubmissions, setActionError, showToast }) {
  const [viewItem, setViewItem]               = useState(null);
  const [viewData, setViewData]               = useState(null);
  const [viewLoading, setViewLoading]         = useState(false);
  const [editActionLoading, setEditActionLoading] = useState(null); // null | 'approve' | 'deny'
  const [observerNotes, setObserverNotes]     = useState('');
  const [observerNotesSaving, setObserverNotesSaving] = useState(false);
  const [observerNotesSaved, setObserverNotesSaved]   = useState(false);
  const [observerNotesError, setObserverNotesError]   = useState(null);
  const [pdfLoadingId, setPdfLoadingId]       = useState(null);

  const underReviewTimerRef = useRef(null);

  const closeView = () => {
    clearTimeout(underReviewTimerRef.current);
    underReviewTimerRef.current = null;
    setViewItem(null);
    setViewData(null);
    setObserverNotes('');
    setObserverNotesSaved(false);
    setObserverNotesError(null);
  };

  const openView = async (item) => {
    clearTimeout(underReviewTimerRef.current);
    underReviewTimerRef.current = null;
    setViewItem(item);
    setViewLoading(true);
    setObserverNotes('');
    setObserverNotesSaved(false);
    setObserverNotesError(null);
    try {
      const r = await api.get(`/api/admin/submissions/${item.id}?type=${item.type.toLowerCase()}`);
      setViewData(r.data);
      setObserverNotes(r.data.observer_notes ?? r.data.observerNotes ?? '');

      if (!isObserver && item.type === 'PIR' && item.status === 'Submitted') {
        underReviewTimerRef.current = setTimeout(() => {
          handleStatusUpdate(item.id, item.type, 'Under Review');
        }, REVIEW_TIMER_MS);
      }
    } catch (err) {
      setViewData(null);
      showToast('Could not load submission details. Please try again.', 'error');
      console.warn('[submission detail]', err?.response?.status);
    } finally {
      setViewLoading(false);
    }
  };

  // Bug fix: accepts `item` directly instead of reading `viewItem` from state.
  // Previously, calling this via a .then() chain captured a stale viewItem=null
  // from the render at click time, causing the export to always bail out early.
  const handleExportPDF = async (item) => {
    const el = document.getElementById('submission-detail-body');
    if (!el || !item) return;
    const canvas = await html2canvas(el, { scale: 1.5, useCORS: true });
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const imgW  = pageW;
    const imgH  = (canvas.height * imgW) / canvas.width;
    if (imgH <= pageH) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
    } else {
      let position = 0;
      let remaining = imgH;
      while (remaining > 0) {
        pdf.addImage(imgData, 'JPEG', 0, -position, imgW, imgH);
        remaining -= pageH;
        position  += pageH;
        if (remaining > 0) pdf.addPage();
      }
    }
    pdf.save(`${item.type}-${item.id}.pdf`);
  };

  const handleEditAction = async (action) => {
    if (!viewItem || isObserver) return;
    setEditActionLoading(action);
    try {
      await api.patch(`/api/admin/aips/${viewItem.id}/${action}-edit`);
      closeView();
      fetchSubmissions();
    } catch (e) {
      setActionError(e.friendlyMessage ?? `Failed to ${action} edit request. Please try again.`);
    } finally {
      setEditActionLoading(null);
    }
  };

  // Allow external status changes (e.g. auto-Under-Review) to sync into viewData
  const syncViewDataStatus = (status) =>
    setViewData(prev => prev ? { ...prev, status } : prev);

  const handleObserverNotesSave = async () => {
    if (!viewItem || !isObserver) return;
    setObserverNotesSaving(true);
    setObserverNotesError(null);
    setObserverNotesSaved(false);
    try {
      await api.patch(`/api/admin/submissions/${viewItem.id}/observer-notes`, {
        type: viewItem.type.toLowerCase(),
        notes: observerNotes,
      });
      setObserverNotesSaved(true);
      setTimeout(() => setObserverNotesSaved(false), 2500);
    } catch {
      setObserverNotesError('Failed to save. Please try again.');
    } finally {
      setObserverNotesSaving(false);
    }
  };

  return {
    viewItem, viewData, viewLoading,
    openView, closeView, syncViewDataStatus,
    editActionLoading, handleEditAction,
    observerNotes, setObserverNotes,
    observerNotesSaving, observerNotesSaved, observerNotesError,
    handleObserverNotesSave,
    pdfLoadingId, setPdfLoadingId, handleExportPDF,
  };
}
