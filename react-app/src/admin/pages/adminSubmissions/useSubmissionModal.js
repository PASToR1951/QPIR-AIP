import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../../lib/api.js';

export function useSubmissionModal({ isObserver, fetchSubmissions, setActionError, showToast }) {
  const [viewItem, setViewItem]               = useState(null);
  const [viewData, setViewData]               = useState(null);
  const [viewLoading, setViewLoading]         = useState(false);
  const [editActionLoading, setEditActionLoading] = useState(null); // null | 'approve' | 'deny'
  const [pdfLoadingId, setPdfLoadingId]       = useState(null);

  const closeView = () => {
    setViewItem(null);
    setViewData(null);
  };

  const openView = async (item) => {
    setViewItem(item);
    setViewLoading(true);
    try {
      const r = await api.get(`/api/admin/submissions/${item.id}?type=${item.type.toLowerCase()}`);
      setViewData(r.data);
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

  // Allow external status changes to sync into the open detail view.
  const syncViewDataStatus = (status) =>
    setViewData(prev => prev ? { ...prev, status } : prev);

  return {
    viewItem, viewData, viewLoading,
    openView, closeView, syncViewDataStatus,
    editActionLoading, handleEditAction,
    pdfLoadingId, setPdfLoadingId, handleExportPDF,
  };
}
