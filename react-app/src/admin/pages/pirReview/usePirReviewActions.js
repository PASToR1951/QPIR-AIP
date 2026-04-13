import { useCallback, useState } from 'react';
import api from '../../../lib/api.js';

export function usePirReviewActions({ id, isObserver }) {
  const [adminRemarks, setAdminRemarks] = useState('');
  const [remarksSaving, setRemarksSaving] = useState(false);
  const [remarksSaved, setRemarksSaved] = useState(false);
  const [remarksError, setRemarksError] = useState(null);

  const [observerNotes, setObserverNotes] = useState('');
  const [observerNotesSaving, setObserverNotesSaving] = useState(false);
  const [observerNotesSaved, setObserverNotesSaved] = useState(false);
  const [observerNotesError, setObserverNotesError] = useState(null);

  const [presented, setPresented] = useState(false);
  const [presentedSaving, setPresentedSaving] = useState(false);

  const [modal, setModal] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const [done, setDone] = useState(false);
  const [doneAction, setDoneAction] = useState(null);

  const hydrateFromPir = useCallback(({ remarks, observer, isPresented }) => {
    setAdminRemarks(remarks ?? '');
    setObserverNotes(observer ?? '');
    setPresented(Boolean(isPresented));
    setRemarksSaved(false);
    setRemarksError(null);
    setObserverNotesSaved(false);
    setObserverNotesError(null);
  }, []);

  const handleAdminRemarksChange = useCallback((event) => {
    setAdminRemarks(event.target.value);
    setRemarksSaved(false);
    setRemarksError(null);
  }, []);

  const handleObserverNotesChange = useCallback((event) => {
    setObserverNotes(event.target.value);
    setObserverNotesSaved(false);
    setObserverNotesError(null);
  }, []);

  const handleSaveRemarks = useCallback(async () => {
    if (isObserver) return;
    setRemarksSaving(true);
    setRemarksError(null);
    setRemarksSaved(false);
    try {
      await api.patch(`/api/admin/pirs/${id}/remarks`, { remarks: adminRemarks });
      setRemarksSaved(true);
      setTimeout(() => setRemarksSaved(false), 2500);
    } catch {
      setRemarksError('Failed to save. Please try again.');
    } finally {
      setRemarksSaving(false);
    }
  }, [adminRemarks, id, isObserver]);

  const handleTogglePresented = useCallback(async () => {
    if (isObserver) return;
    const optimistic = !presented;
    setPresented(optimistic);
    setPresentedSaving(true);
    try {
      await api.patch(`/api/admin/pirs/${id}/presented`);
    } catch {
      setPresented(!optimistic);
    } finally {
      setPresentedSaving(false);
    }
  }, [id, isObserver, presented]);

  const handleSaveObserverNotes = useCallback(async () => {
    if (!isObserver) return;
    setObserverNotesSaving(true);
    setObserverNotesSaved(false);
    setObserverNotesError(null);
    try {
      const response = await api.patch(`/api/admin/submissions/${id}/observer-notes`, { type: 'pir', notes: observerNotes });
      setObserverNotes(response.data.observer_notes ?? observerNotes);
      setObserverNotesSaved(true);
      setTimeout(() => setObserverNotesSaved(false), 2500);
    } catch {
      setObserverNotesError('Failed to save observer notes. Please try again.');
    } finally {
      setObserverNotesSaving(false);
    }
  }, [id, isObserver, observerNotes]);

  const handleAction = useCallback(async () => {
    if (isObserver) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.patch(`/api/admin/submissions/${id}/status`, {
        type: 'pir',
        status: modal === 'approve' ? 'Approved' : 'Returned',
        feedback,
      });
      setDoneAction(modal === 'approve' ? 'Approved' : 'Returned');
      setModal(null);
      setDone(true);
    } catch (err) {
      setActionError(err.friendlyMessage ?? 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }, [feedback, id, isObserver, modal]);

  return {
    actionError,
    actionLoading,
    adminRemarks,
    done,
    doneAction,
    feedback,
    handleAction,
    handleAdminRemarksChange,
    handleObserverNotesChange,
    handleSaveObserverNotes,
    handleSaveRemarks,
    handleTogglePresented,
    hydrateFromPir,
    modal,
    observerNotes,
    observerNotesError,
    observerNotesSaved,
    observerNotesSaving,
    openApprove: () => { setModal('approve'); setFeedback(''); setActionError(''); },
    openReturn: () => { setModal('return'); setFeedback(''); setActionError(''); },
    presented,
    presentedSaving,
    remarksError,
    remarksSaved,
    remarksSaving,
    setFeedback,
    setModal,
  };
}
