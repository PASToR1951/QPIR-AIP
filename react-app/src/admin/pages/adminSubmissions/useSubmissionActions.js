import { useState } from 'react';
import api from '../../../lib/api.js';

export function useSubmissionActions({ fetchSubmissions, showToast }) {
  const [approveItem, setApproveItem]               = useState(null);
  const [returnItem, setReturnItem]                 = useState(null);
  const [returnFeedback, setReturnFeedback]         = useState('');
  const [returnFeedbackError, setReturnFeedbackError] = useState('');
  const [actionLoading, setActionLoading]           = useState(false);
  const [actionError, setActionError]               = useState(null);

  const canChangeSubmissionStatus = (item) =>
    item?.status !== 'Approved' && item?.status !== 'Returned';

  const canDownloadSubmission = (item) => item?.status !== 'Returned';

  const handleStatusUpdate = async (id, type, status, feedback = '') => {
    if (status === 'Returned' && !feedback.trim()) {
      setReturnFeedbackError('A reason is required before returning a submission.');
      showToast('Please enter a reason before returning the submission.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/api/admin/submissions/${id}/status`, {
        type: type.toLowerCase(), status, feedback: feedback.trim(),
      });
      fetchSubmissions();
      setApproveItem(null);
      setReturnItem(null);
      setReturnFeedback('');
      setReturnFeedbackError('');
    } catch (e) {
      console.error(e);
      setActionError(e.friendlyMessage ?? 'Failed to update status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkApprove = async (submissions, selectedIds, setSelectedIds, isObserver) => {
    if (isObserver || !selectedIds.length) return;
    setActionLoading(true);
    try {
      const toApprove = submissions.filter(
        s => selectedIds.includes(s.id) && canChangeSubmissionStatus(s),
      );
      for (const item of toApprove) {
        await api.patch(`/api/admin/submissions/${item.id}/status`, {
          type: item.type.toLowerCase(), status: 'Approved', feedback: '',
        });
      }
      setSelectedIds([]);
      fetchSubmissions();
    } catch (e) {
      console.error(e);
      setActionError(e.friendlyMessage ?? 'Failed to approve selected submissions. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return {
    approveItem, setApproveItem,
    returnItem, setReturnItem,
    returnFeedback, setReturnFeedback,
    returnFeedbackError, setReturnFeedbackError,
    actionLoading, actionError, setActionError,
    canChangeSubmissionStatus, canDownloadSubmission,
    handleStatusUpdate, handleBulkApprove,
  };
}
